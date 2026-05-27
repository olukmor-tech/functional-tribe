from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from database import Base


# ─── ENUMS ───────────────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    trainer = "trainer"
    student = "student"


class FitnessLevel(str, enum.Enum):
    principiante = "principiante"
    intermedio   = "intermedio"
    avanzado     = "avanzado"


class MembershipType(str, enum.Enum):
    monthly   = "monthly"    # mensualidad
    bono      = "bono"       # bono de X clases
    single    = "single"     # clase suelta


class BookingStatus(str, enum.Enum):
    confirmed = "confirmed"  # reserva confirmada
    cancelled = "cancelled"  # cancelada por el alumno
    waitlist  = "waitlist"   # en lista de espera


class ClassStatus(str, enum.Enum):
    active    = "active"     # clase activa
    cancelled = "cancelled"  # clase cancelada por el entrenador
    finished  = "finished"   # clase ya impartida


# ─── MODELOS ─────────────────────────────────────────────────────────────────

class User(Base):
    """Usuario — puede ser entrenador o alumno."""
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String, nullable=False)
    email         = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role          = Column(Enum(UserRole), default=UserRole.student, nullable=False)
    age           = Column(Integer, nullable=True)
    fitness_level = Column(Enum(FitnessLevel), nullable=True)
    notes         = Column(Text, nullable=True)   # notas del entrenador sobre el alumno
    is_active     = Column(Boolean, default=True)
    created_at    = Column(DateTime, default=datetime.utcnow)

    # Relaciones
    bookings       = relationship("Booking",    back_populates="student", foreign_keys="Booking.student_id")
    memberships    = relationship("Membership", back_populates="student")
    classes_taught = relationship("Class",      back_populates="trainer")


class Class(Base):
    """Clase de entrenamiento funcional."""
    __tablename__ = "classes"

    id         = Column(Integer, primary_key=True, index=True)
    trainer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    starts_at  = Column(DateTime, nullable=False)          # fecha y hora de inicio
    ends_at    = Column(DateTime, nullable=True)           # hora de fin (opcional)
    location   = Column(String, nullable=False)            # dónde se da la clase
    max_spots  = Column(Integer, default=10)               # plazas máximas
    type       = Column(String, default="Funcional")       # tipo de entrenamiento
    notes      = Column(Text, nullable=True)               # notas del entrenador
    status     = Column(Enum(ClassStatus), default=ClassStatus.active)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relaciones
    trainer  = relationship("User",    back_populates="classes_taught")
    bookings = relationship("Booking", back_populates="class_", cascade="all, delete-orphan")

    @property
    def confirmed_spots(self):
        return sum(1 for b in self.bookings if b.status == BookingStatus.confirmed)

    @property
    def available_spots(self):
        return self.max_spots - self.confirmed_spots

    @property
    def is_full(self):
        return self.available_spots <= 0


class Booking(Base):
    """Reserva de un alumno a una clase."""
    __tablename__ = "bookings"

    id         = Column(Integer, primary_key=True, index=True)
    class_id   = Column(Integer, ForeignKey("classes.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"),   nullable=False)
    status     = Column(Enum(BookingStatus), default=BookingStatus.confirmed)
    created_at = Column(DateTime, default=datetime.utcnow)
    cancelled_at = Column(DateTime, nullable=True)

    # Relaciones
    class_   = relationship("Class", back_populates="bookings")
    student  = relationship("User",  back_populates="bookings", foreign_keys=[student_id])


class Membership(Base):
    """Membresía / plan de un alumno."""
    __tablename__ = "memberships"

    id              = Column(Integer, primary_key=True, index=True)
    student_id      = Column(Integer, ForeignKey("users.id"), nullable=False)
    type            = Column(Enum(MembershipType), nullable=False)
    total_classes   = Column(Integer, nullable=True)   # solo para bonos (ej: 10)
    used_classes    = Column(Integer, default=0)       # clases consumidas
    valid_from      = Column(DateTime, default=datetime.utcnow)
    valid_to        = Column(DateTime, nullable=True)  # fin de mensualidad
    is_paid         = Column(Boolean, default=False)   # marcado manualmente por el entrenador
    notes           = Column(Text, nullable=True)
    created_at      = Column(DateTime, default=datetime.utcnow)

    # Relaciones
    student = relationship("User", back_populates="memberships")

    @property
    def remaining_classes(self):
        if self.type == MembershipType.monthly:
            return None  # ilimitado
        return max(0, (self.total_classes or 0) - self.used_classes)

    @property
    def is_low(self):
        """True si quedan 2 clases o menos en un bono."""
        if self.type == MembershipType.bono:
            return self.remaining_classes is not None and self.remaining_classes <= 2
        return False
