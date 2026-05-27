from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import os

# Fix de compatibilidad passlib 1.7.4 + bcrypt 4.x
import bcrypt as _bcrypt
if not hasattr(_bcrypt, '__about__'):
    _bcrypt.__about__ = type('about', (), {'__version__': _bcrypt.__version__})()

from database import get_db
import models

# ─── CONFIG ──────────────────────────────────────────────────────────────────

SECRET_KEY  = os.getenv("SECRET_KEY", "cambia-esto-en-produccion-por-algo-seguro")
ALGORITHM   = "HS256"
TOKEN_EXPIRE_DAYS = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ─── CONTRASEÑAS ─────────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ─── JWT ─────────────────────────────────────────────────────────────────────

def create_token(user_id: int) -> str:
    expire = datetime.utcnow() + timedelta(days=TOKEN_EXPIRE_DAYS)
    return jwt.encode({"sub": str(user_id), "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> Optional[int]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return int(payload["sub"])
    except JWTError:
        return None


# ─── DEPENDENCIAS ────────────────────────────────────────────────────────────

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> models.User:
    user_id = decode_token(token)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no encontrado")
    return user

def require_trainer(current_user: models.User = Depends(get_current_user)) -> models.User:
    if current_user.role != models.UserRole.trainer:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo el entrenador puede hacer esto")
    return current_user

def require_student(current_user: models.User = Depends(get_current_user)) -> models.User:
    if current_user.role != models.UserRole.student:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo los alumnos pueden hacer esto")
    return current_user


# ─── TOKEN DE INVITACIÓN ──────────────────────────────────────────────────────

INVITE_SECRET = os.getenv("INVITE_SECRET", "invite-secret-cambia-esto")

def create_invite_token() -> str:
    """Genera un token de invitación válido por 7 días."""
    expire = datetime.utcnow() + timedelta(days=7)
    return jwt.encode({"purpose": "invite", "exp": expire}, INVITE_SECRET, algorithm=ALGORITHM)

def verify_invite_token(token: str) -> bool:
    try:
        payload = jwt.decode(token, INVITE_SECRET, algorithms=[ALGORITHM])
        return payload.get("purpose") == "invite"
    except JWTError:
        return False
