from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List
from enum import Enum


# ─── ENUMS ───────────────────────────────────────────────────────────────────

class UserRole(str, Enum):
    trainer = "trainer"
    student = "student"

class FitnessLevel(str, Enum):
    principiante = "principiante"
    intermedio   = "intermedio"
    avanzado     = "avanzado"

class MembershipType(str, Enum):
    monthly = "monthly"
    bono    = "bono"
    single  = "single"

class BookingStatus(str, Enum):
    confirmed = "confirmed"
    cancelled = "cancelled"
    waitlist  = "waitlist"

class ClassStatus(str, Enum):
    active    = "active"
    cancelled = "cancelled"
    finished  = "finished"


# ─── AUTH ────────────────────────────────────────────────────────────────────

class Token(BaseModel):
    access_token: str
    token_type: str
    user: "UserOut"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ─── USUARIO ─────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    name:     str
    email:    EmailStr
    password: str
    role:     UserRole = UserRole.student

class UserOut(BaseModel):
    id:            int
    name:          str
    email:         str
    role:          UserRole
    age:           Optional[int]          = None
    fitness_level: Optional[FitnessLevel] = None
    notes:         Optional[str]          = None
    is_active:     bool
    created_at:    datetime

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name:          Optional[str]          = None
    age:           Optional[int]          = None
    fitness_level: Optional[FitnessLevel] = None
    notes:         Optional[str]          = None
    is_active:     Optional[bool]         = None


# ─── CLASE ───────────────────────────────────────────────────────────────────

class ClassCreate(BaseModel):
    starts_at: datetime
    ends_at:   Optional[datetime] = None
    location:  str
    max_spots: int = 10
    type:      str = "Funcional"
    notes:     Optional[str] = None

class ClassUpdate(BaseModel):
    starts_at: Optional[datetime] = None
    ends_at:   Optional[datetime] = None
    location:  Optional[str]      = None
    max_spots: Optional[int]      = None
    type:      Optional[str]      = None
    notes:     Optional[str]      = None
    status:    Optional[ClassStatus] = None

class ClassOut(BaseModel):
    id:               int
    trainer_id:       int
    starts_at:        datetime
    ends_at:          Optional[datetime]
    location:         str
    max_spots:        int
    type:             str
    notes:            Optional[str]
    status:           ClassStatus
    confirmed_spots:  int
    available_spots:  int
    is_full:          bool
    created_at:       datetime

    class Config:
        from_attributes = True

class ClassDetail(ClassOut):
    """Detalle de clase con lista de alumnos (solo para el entrenador)."""
    bookings: List["BookingWithStudent"] = []


# ─── RESERVA ─────────────────────────────────────────────────────────────────

class BookingCreate(BaseModel):
    class_id: int

class BookingOut(BaseModel):
    id:         int
    class_id:   int
    student_id: int
    status:     BookingStatus
    created_at: datetime
    class_:     Optional[ClassOut] = None

    class Config:
        from_attributes = True

class BookingWithStudent(BaseModel):
    id:         int
    student_id: int
    status:     BookingStatus
    student:    UserOut
    membership_summary: Optional[str] = None  # ej: "Bono · 3 restantes"

    class Config:
        from_attributes = True


# ─── MEMBRESÍA ───────────────────────────────────────────────────────────────

class MembershipCreate(BaseModel):
    student_id:    int
    type:          MembershipType
    total_classes: Optional[int]      = None  # solo para bono
    is_paid:       Optional[bool]     = False
    valid_from:    Optional[datetime] = None
    valid_to:      Optional[datetime] = None
    notes:         Optional[str]      = None

class MembershipUpdate(BaseModel):
    total_classes: Optional[int]  = None
    used_classes:  Optional[int]  = None
    is_paid:       Optional[bool] = None
    valid_to:      Optional[datetime] = None
    notes:         Optional[str]  = None

class MembershipOut(BaseModel):
    id:               int
    student_id:       int
    type:             MembershipType
    total_classes:    Optional[int]
    used_classes:     int
    remaining_classes: Optional[int]
    valid_from:       datetime
    valid_to:         Optional[datetime]
    is_paid:          bool
    is_low:           bool
    notes:            Optional[str]
    created_at:       datetime

    class Config:
        from_attributes = True


# ─── INVITE ──────────────────────────────────────────────────────────────────

class InviteRegister(BaseModel):
    """Para que un alumno se registre via enlace/QR con token de invitación."""
    token:         str
    name:          str
    email:         EmailStr
    password:      str
    age:           Optional[int]          = None
    fitness_level: Optional[FitnessLevel] = None


# Resolver referencias forward
Token.model_rebuild()
ClassDetail.model_rebuild()
BookingOut.model_rebuild()
