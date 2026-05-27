# Functional Tribe 🔥

App de gestión de clases de entrenamiento funcional para grupos de 8-10 personas.

---

## Arrancar en local

### 1. Instalar dependencias del backend

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
# Edita .env con tus datos (email, claves, etc.)
```

### 3. Arrancar el backend

```bash
cd backend
uvicorn main:app --reload --port 8000
```

La API estará en: http://localhost:8000  
Documentación interactiva: http://localhost:8000/docs

### 4. Arrancar el frontend

```bash
cd frontend
python -m http.server 8080
```

La app estará en: http://localhost:8080

---

## Primera configuración

### Crear la cuenta del entrenador

```bash
curl -X POST http://localhost:8000/auth/create-trainer \
  -H "Content-Type: application/json" \
  -d '{"name": "Oliver", "email": "tu@email.com", "password": "tu-contraseña", "role": "trainer"}'
```

### Generar enlace de invitación para alumnos

```bash
# 1. Hacer login como entrenador
curl -X POST http://localhost:8000/auth/login \
  -d "username=tu@email.com&password=tu-contraseña"

# 2. Generar el enlace (usa el token devuelto en el login)
curl -X POST http://localhost:8000/invite/generate \
  -H "Authorization: Bearer TU_TOKEN"
```

Comparte el enlace generado con tus alumnos via WhatsApp, QR o email.

---

## Estructura del proyecto

```
functional-tribe/
├── backend/
│   ├── main.py           ← API principal (endpoints)
│   ├── models.py         ← Modelos de base de datos
│   ├── schemas.py        ← Esquemas de validación (Pydantic)
│   ├── database.py       ← Conexión a SQLite
│   ├── auth.py           ← Autenticación JWT
│   ├── email_service.py  ← Emails automáticos
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   └── (próximamente)
└── README.md
```

---

## Endpoints principales

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/auth/login` | Login entrenador / alumno |
| POST | `/auth/register` | Registro alumno via invite |
| POST | `/auth/create-trainer` | Crear cuenta entrenador (1 vez) |
| GET | `/classes` | Ver clases (próximos 7 días) |
| POST | `/classes` | Crear clase (entrenador) |
| GET | `/classes/{id}` | Detalle + lista de alumnos |
| DELETE | `/classes/{id}` | Cancelar clase + avisar alumnos |
| POST | `/bookings` | Reservar clase (alumno) |
| DELETE | `/bookings/{id}` | Cancelar reserva |
| GET | `/bookings/my` | Mis reservas (alumno) |
| GET | `/students` | Lista de alumnos (entrenador) |
| POST | `/memberships` | Asignar membresía (entrenador) |
| PUT | `/memberships/{id}/paid` | Marcar como pagado |

Documentación completa: http://localhost:8000/docs

---

## Reglas de negocio implementadas

- ✅ Máximo 10 plazas por clase (configurable por clase)
- ✅ Lista de espera automática cuando la clase está llena
- ✅ Cancelación libre hasta 24h antes → devuelve clase al bono
- ✅ Cancelación tardía → consume clase igualmente
- ✅ Promoción automática de lista de espera al cancelar
- ✅ Aviso automático cuando quedan ≤2 clases en el bono
- ✅ Emails automáticos: confirmación, recordatorio, cancelación, pago pendiente
- ✅ Tres tipos de membresía: mensualidad, bono de clases, clase suelta
