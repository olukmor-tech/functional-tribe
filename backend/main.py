from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from datetime import datetime, date, timedelta
from typing import List, Optional
import os

from database import engine, get_db, Base
import models, schemas, auth, email_service

# ─── INIT ────────────────────────────────────────────────────────────────────

# Crea todas las tablas al arrancar (si no existen)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Functional Tribe API",
    description="Backend para la app de gestión de clases de entrenamiento funcional.",
    version="1.0.0"
)

# CORS: permite que el frontend (en cualquier origen) llame a la API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

APP_URL = os.getenv("APP_URL", "http://localhost:8000")

# Servir el frontend como archivos estáticos
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend")
if os.path.exists(FRONTEND_DIR):
    app.mount("/app", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")


# ─── HELPERS ─────────────────────────────────────────────────────────────────

def membership_summary(student: models.User, db: Session) -> str:
    """Devuelve un texto corto sobre la membresía activa del alumno."""
    mem = (
        db.query(models.Membership)
        .filter(models.Membership.student_id == student.id)
        .order_by(models.Membership.created_at.desc())
        .first()
    )
    if not mem:
        return "Sin membresía"
    names = {"monthly": "Mensualidad", "bono": "Bono", "single": "Clase suelta"}
    name = names.get(mem.type, mem.type)
    paid = "al día" if mem.is_paid else "pendiente pago"
    if mem.type == models.MembershipType.bono:
        return f"{name} {mem.total_classes} · {mem.remaining_classes} restantes"
    return f"{name} · {paid}"


# ─── AUTH ────────────────────────────────────────────────────────────────────

@app.post("/auth/login", response_model=schemas.Token, tags=["Auth"])
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form.username).first()
    if not user or not auth.verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Email o contraseña incorrectos")
    token = auth.create_token(user.id)
    return {"access_token": token, "token_type": "bearer", "user": user}


@app.post("/auth/register", response_model=schemas.UserOut, tags=["Auth"])
def register_via_invite(data: schemas.InviteRegister, db: Session = Depends(get_db)):
    """Registro de alumno mediante enlace/QR con token de invitación."""
    if not auth.verify_invite_token(data.token):
        raise HTTPException(status_code=400, detail="Enlace de invitación inválido o caducado")
    if db.query(models.User).filter(models.User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Ya existe una cuenta con ese email")
    user = models.User(
        name=data.name,
        email=data.email,
        password_hash=auth.hash_password(data.password),
        role=models.UserRole.student,
        age=data.age,
        fitness_level=data.fitness_level,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.post("/auth/create-trainer", response_model=schemas.UserOut, tags=["Auth"])
def create_trainer(data: schemas.UserCreate, db: Session = Depends(get_db)):
    """Crea la cuenta del entrenador (solo una vez, al configurar la app)."""
    if db.query(models.User).filter(models.User.role == models.UserRole.trainer).first():
        raise HTTPException(status_code=400, detail="Ya existe un entrenador")
    user = models.User(
        name=data.name,
        email=data.email,
        password_hash=auth.hash_password(data.password),
        role=models.UserRole.trainer,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.get("/auth/me", response_model=schemas.UserOut, tags=["Auth"])
def me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


# ─── INVITACIONES ────────────────────────────────────────────────────────────

@app.post("/invite/generate", tags=["Invite"])
def generate_invite(
    to_email: Optional[str] = None,
    trainer: models.User = Depends(auth.require_trainer)
):
    """Genera un enlace/token de invitación. Si se pasa email, envía el correo."""
    token      = auth.create_invite_token()
    invite_url  = f"{APP_URL}/app?token={token}"
    landing_url = f"{APP_URL}/app/landing.html"
    if to_email:
        email_service.send_invite_link(to_email, invite_url)
    return {"invite_url": invite_url, "landing_url": landing_url, "token": token}


# ─── CLASES ──────────────────────────────────────────────────────────────────

@app.get("/classes", response_model=List[schemas.ClassOut], tags=["Clases"])
def list_classes(
    from_date: Optional[date] = Query(default=None, description="Fecha inicio (YYYY-MM-DD)"),
    to_date:   Optional[date] = Query(default=None, description="Fecha fin (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Lista de clases. Por defecto devuelve los próximos 7 días."""
    q = db.query(models.Class).filter(models.Class.status == models.ClassStatus.active)
    start = datetime.combine(from_date or date.today(), datetime.min.time())
    end   = datetime.combine(to_date or (date.today() + timedelta(days=7)), datetime.max.time())
    q = q.filter(models.Class.starts_at >= start, models.Class.starts_at <= end)
    return q.order_by(models.Class.starts_at).all()


@app.post("/classes", response_model=schemas.ClassOut, tags=["Clases"])
def create_class(
    data: schemas.ClassCreate,
    db: Session = Depends(get_db),
    trainer: models.User = Depends(auth.require_trainer)
):
    cls = models.Class(**data.model_dump(), trainer_id=trainer.id)
    db.add(cls)
    db.commit()
    db.refresh(cls)
    return cls


@app.get("/classes/{class_id}", response_model=schemas.ClassDetail, tags=["Clases"])
def get_class(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    cls = db.query(models.Class).options(
        joinedload(models.Class.bookings).joinedload(models.Booking.student)
    ).filter(models.Class.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Clase no encontrada")

    # Enriquecer bookings con resumen de membresía
    result = schemas.ClassDetail.model_validate(cls)
    result.bookings = []
    for b in cls.bookings:
        if b.status == models.BookingStatus.confirmed:
            bw = schemas.BookingWithStudent(
                id=b.id,
                student_id=b.student_id,
                status=b.status,
                student=b.student,
                membership_summary=membership_summary(b.student, db)
            )
            result.bookings.append(bw)
    return result


@app.put("/classes/{class_id}", response_model=schemas.ClassOut, tags=["Clases"])
def update_class(
    class_id: int,
    data: schemas.ClassUpdate,
    db: Session = Depends(get_db),
    trainer: models.User = Depends(auth.require_trainer)
):
    cls = db.query(models.Class).filter(models.Class.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Clase no encontrada")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(cls, field, value)
    db.commit()
    db.refresh(cls)
    return cls


@app.delete("/classes/{class_id}", tags=["Clases"])
def cancel_class(
    class_id: int,
    reason: str = "",
    db: Session = Depends(get_db),
    trainer: models.User = Depends(auth.require_trainer)
):
    """Cancela una clase y notifica a todos los alumnos apuntados."""
    cls = db.query(models.Class).filter(models.Class.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Clase no encontrada")

    cls.status = models.ClassStatus.cancelled
    # Notificar a alumnos y devolver clases de bono
    for booking in cls.bookings:
        if booking.status == models.BookingStatus.confirmed:
            booking.status = models.BookingStatus.cancelled
            # Devolver clase al bono si tenía
            _return_class_to_membership(booking.student_id, db)
            # Enviar email
            email_service.send_class_cancelled(
                booking.student.name, booking.student.email,
                cls.starts_at, reason
            )
    db.commit()
    return {"detail": "Clase cancelada y alumnos notificados"}


# ─── RESERVAS ────────────────────────────────────────────────────────────────

@app.post("/bookings", response_model=schemas.BookingOut, tags=["Reservas"])
def create_booking(
    data: schemas.BookingCreate,
    db: Session = Depends(get_db),
    student: models.User = Depends(auth.require_student)
):
    cls = db.query(models.Class).filter(models.Class.id == data.class_id).first()
    if not cls or cls.status != models.ClassStatus.active:
        raise HTTPException(status_code=404, detail="Clase no disponible")

    # Comprobar si ya tiene reserva
    existing = db.query(models.Booking).filter(
        models.Booking.class_id == data.class_id,
        models.Booking.student_id == student.id,
        models.Booking.status == models.BookingStatus.confirmed
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya tienes una reserva en esta clase")

    # Determinar estado: confirmado o lista de espera
    booking_status = models.BookingStatus.waitlist if cls.is_full else models.BookingStatus.confirmed

    booking = models.Booking(
        class_id=data.class_id,
        student_id=student.id,
        status=booking_status
    )
    db.add(booking)

    # Descontar clase del bono/membresía si es confirmada
    if booking_status == models.BookingStatus.confirmed:
        _consume_class(student.id, db)
        email_service.send_booking_confirmation(
            student.name, student.email, cls.starts_at, cls.location
        )

    db.commit()
    db.refresh(booking)
    return booking


@app.delete("/bookings/{booking_id}", tags=["Reservas"])
def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    student: models.User = Depends(auth.require_student)
):
    booking = db.query(models.Booking).filter(
        models.Booking.id == booking_id,
        models.Booking.student_id == student.id
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")

    cls = booking.class_
    now = datetime.utcnow()
    hours_until = (cls.starts_at - now).total_seconds() / 3600

    was_confirmed = booking.status == models.BookingStatus.confirmed
    booking.status = models.BookingStatus.cancelled
    booking.cancelled_at = now

    # Si cancela con más de 24h, devolver clase al bono
    if was_confirmed and hours_until > 24:
        _return_class_to_membership(student.id, db)

    # Promover al primero de la lista de espera
    if was_confirmed:
        waitlisted = db.query(models.Booking).filter(
            models.Booking.class_id == cls.id,
            models.Booking.status == models.BookingStatus.waitlist
        ).order_by(models.Booking.created_at).first()
        if waitlisted:
            waitlisted.status = models.BookingStatus.confirmed
            _consume_class(waitlisted.student_id, db)
            email_service.send_booking_confirmation(
                waitlisted.student.name, waitlisted.student.email,
                cls.starts_at, cls.location
            )

    db.commit()
    return {"detail": "Reserva cancelada"}


@app.get("/bookings/my", response_model=List[schemas.BookingOut], tags=["Reservas"])
def my_bookings(
    db: Session = Depends(get_db),
    student: models.User = Depends(auth.require_student)
):
    return (
        db.query(models.Booking)
        .options(joinedload(models.Booking.class_))
        .filter(
            models.Booking.student_id == student.id,
            models.Booking.status == models.BookingStatus.confirmed
        )
        .order_by(models.Booking.created_at.desc())
        .all()
    )


# ─── ALUMNOS (entrenador) ────────────────────────────────────────────────────

@app.get("/students", response_model=List[schemas.UserOut], tags=["Alumnos"])
def list_students(
    db: Session = Depends(get_db),
    trainer: models.User = Depends(auth.require_trainer)
):
    return db.query(models.User).filter(models.User.role == models.UserRole.student).all()


@app.get("/students/{student_id}", response_model=schemas.UserOut, tags=["Alumnos"])
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    trainer: models.User = Depends(auth.require_trainer)
):
    student = db.query(models.User).filter(models.User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")
    return student


@app.put("/students/{student_id}", response_model=schemas.UserOut, tags=["Alumnos"])
def update_student(
    student_id: int,
    data: schemas.UserUpdate,
    db: Session = Depends(get_db),
    trainer: models.User = Depends(auth.require_trainer)
):
    """El entrenador puede editar datos del alumno: nivel, edad, notas."""
    student = db.query(models.User).filter(models.User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(student, field, value)
    db.commit()
    db.refresh(student)
    return student


@app.put("/students/me", response_model=schemas.UserOut, tags=["Alumnos"])
def update_my_profile(
    data: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """El alumno puede actualizar su propia edad y nivel."""
    for field, value in data.model_dump(exclude_none=True).items():
        if field not in ("is_active", "notes"):  # solo el entrenador puede cambiar estos
            setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


# ─── MEMBRESÍAS ──────────────────────────────────────────────────────────────

@app.get("/memberships/my", response_model=schemas.MembershipOut, tags=["Membresías"])
def my_membership(
    db: Session = Depends(get_db),
    student: models.User = Depends(auth.require_student)
):
    mem = (
        db.query(models.Membership)
        .filter(models.Membership.student_id == student.id)
        .order_by(models.Membership.created_at.desc())
        .first()
    )
    if not mem:
        raise HTTPException(status_code=404, detail="Sin membresía activa")
    return mem


@app.get("/memberships", response_model=List[schemas.MembershipOut], tags=["Membresías"])
def list_memberships(
    db: Session = Depends(get_db),
    trainer: models.User = Depends(auth.require_trainer)
):
    return db.query(models.Membership).order_by(models.Membership.created_at.desc()).all()


@app.post("/memberships", response_model=schemas.MembershipOut, tags=["Membresías"])
def create_membership(
    data: schemas.MembershipCreate,
    db: Session = Depends(get_db),
    trainer: models.User = Depends(auth.require_trainer)
):
    mem_data = data.model_dump()
    is_paid = mem_data.pop('is_paid', False)
    mem = models.Membership(**mem_data)
    if is_paid:
        mem.is_paid = True
    db.add(mem)
    db.commit()
    db.refresh(mem)
    return mem


@app.put("/memberships/{mem_id}", response_model=schemas.MembershipOut, tags=["Membresías"])
def update_membership(
    mem_id: int,
    data: schemas.MembershipUpdate,
    db: Session = Depends(get_db),
    trainer: models.User = Depends(auth.require_trainer)
):
    mem = db.query(models.Membership).filter(models.Membership.id == mem_id).first()
    if not mem:
        raise HTTPException(status_code=404, detail="Membresía no encontrada")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(mem, field, value)
    db.commit()
    db.refresh(mem)
    return mem


@app.post("/memberships/{mem_id}/paid", response_model=schemas.MembershipOut, tags=["Membresías"])
def mark_as_paid(
    mem_id: int,
    db: Session = Depends(get_db),
    trainer: models.User = Depends(auth.require_trainer)
):
    """Marcar una membresía como pagada."""
    mem = db.query(models.Membership).filter(models.Membership.id == mem_id).first()
    if not mem:
        raise HTTPException(status_code=404, detail="Membresía no encontrada")
    mem.is_paid = True
    db.commit()
    db.refresh(mem)
    return mem


# ─── NOTIFICACIONES ──────────────────────────────────────────────────────────

@app.post("/notify/payment/{student_id}", tags=["Notificaciones"])
def notify_payment(
    student_id: int,
    db: Session = Depends(get_db),
    trainer: models.User = Depends(auth.require_trainer)
):
    """El entrenador envía recordatorio de pago a un alumno."""
    student = db.query(models.User).filter(models.User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")
    mem = db.query(models.Membership).filter(
        models.Membership.student_id == student_id
    ).order_by(models.Membership.created_at.desc()).first()
    plan = mem.type if mem else "tu plan"
    email_service.send_payment_reminder(student.name, student.email, plan)
    return {"detail": f"Recordatorio enviado a {student.email}"}


# ─── UTILIDADES INTERNAS ─────────────────────────────────────────────────────

def _consume_class(student_id: int, db: Session):
    """Descuenta una clase del bono activo del alumno (si aplica)."""
    mem = db.query(models.Membership).filter(
        models.Membership.student_id == student_id,
        models.Membership.type == models.MembershipType.bono
    ).order_by(models.Membership.created_at.desc()).first()
    if mem and mem.remaining_classes and mem.remaining_classes > 0:
        mem.used_classes += 1
        # Avisar si quedan 2 o menos
        if mem.remaining_classes <= 2:
            student = db.query(models.User).filter(models.User.id == student_id).first()
            if student:
                email_service.send_bono_low_warning(
                    student.name, student.email, mem.remaining_classes
                )


def _return_class_to_membership(student_id: int, db: Session):
    """Devuelve una clase al bono del alumno (cuando cancela con tiempo)."""
    mem = db.query(models.Membership).filter(
        models.Membership.student_id == student_id,
        models.Membership.type == models.MembershipType.bono
    ).order_by(models.Membership.created_at.desc()).first()
    if mem and mem.used_classes > 0:
        mem.used_classes -= 1


# ─── SOLICITUDES DE INTERÉS (landing page) ───────────────────

class InterestRequest(BaseModel):
    name:          str
    contact:       str          # email o teléfono
    fitness_level: Optional[str] = None

interest_list: list = []       # en memoria (simple para empezar)

@app.post("/interest", tags=["Landing"])
def submit_interest(data: InterestRequest):
    """Recibe solicitudes de personas interesadas desde la landing page."""
    entry = {
        "name":          data.name,
        "contact":       data.contact,
        "fitness_level": data.fitness_level,
        "received_at":   datetime.utcnow().isoformat(),
    }
    interest_list.append(entry)
    # Notificar al entrenador por email si está configurado
    try:
        email_service._send(
            os.getenv("TRAINER_EMAIL", ""),
            f"🔥 Nueva solicitud de plaza — {data.name}",
            email_service._base_template(f"""
                <p style="color:#888;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Nueva solicitud</p>
                <h2 style="font-size:24px;margin:8px 0;color:#F5F2EE;">{data.name}</h2>
                <p style="color:#aaa;">Contacto: <strong style="color:#F5F2EE;">{data.contact}</strong></p>
                <p style="color:#aaa;">Nivel: <strong style="color:#FF4500;">{data.fitness_level or 'No indicado'}</strong></p>
            """)
        )
    except:
        pass
    return {"detail": "Solicitud recibida"}

@app.get("/interest", tags=["Landing"])
def get_interests(trainer: models.User = Depends(auth.require_trainer)):
    """El entrenador ve las solicitudes recibidas desde la landing."""
    return interest_list


# ─── HEALTH CHECK ────────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "app": "Functional Tribe API", "version": "1.0.0"}
