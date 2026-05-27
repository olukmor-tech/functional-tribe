import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

# ─── CONFIG ──────────────────────────────────────────────────────────────────

SMTP_HOST  = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT  = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER  = os.getenv("SMTP_USER", "")
SMTP_PASS  = os.getenv("SMTP_PASS", "")
FROM_NAME  = "Functional Tribe"
FROM_EMAIL = os.getenv("SMTP_USER", "no-reply@functionaltribe.com")


# ─── UTILIDADES ──────────────────────────────────────────────────────────────

def _send(to_email: str, subject: str, html_body: str):
    """Envía un email. Si no hay config SMTP, imprime en consola (modo dev)."""
    if not SMTP_USER or not SMTP_PASS:
        print(f"\n📧 [EMAIL MODO DEV]\nPara: {to_email}\nAsunto: {subject}\n")
        return

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = f"{FROM_NAME} <{FROM_EMAIL}>"
        msg["To"]      = to_email
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(FROM_EMAIL, to_email, msg.as_string())
    except Exception as e:
        print(f"⚠️ Error enviando email a {to_email}: {e}")


def _base_template(content: str) -> str:
    return f"""
    <div style="font-family:'Helvetica Neue',sans-serif;max-width:480px;margin:0 auto;background:#0A0A0A;border-radius:16px;overflow:hidden;">
      <div style="background:#111;padding:28px 32px;border-bottom:1px solid #222;">
        <span style="font-family:Georgia,serif;font-style:italic;font-weight:900;font-size:22px;color:#FF4500;">T</span>
        <span style="font-family:Georgia,serif;font-weight:900;font-size:22px;color:#F5F2EE;">RIBE</span>
      </div>
      <div style="padding:28px 32px;color:#F5F2EE;">
        {content}
      </div>
      <div style="padding:16px 32px;border-top:1px solid #222;font-size:11px;color:#444;text-align:center;">
        Functional Tribe · Est. 2026
      </div>
    </div>
    """


# ─── EMAILS AUTOMÁTICOS ──────────────────────────────────────────────────────

def send_booking_confirmation(student_name: str, to_email: str,
                               class_time: datetime, location: str):
    subject = "✅ Reserva confirmada — Functional Tribe"
    content = f"""
        <p style="color:#888;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Reserva confirmada</p>
        <h2 style="font-size:28px;margin:8px 0;color:#F5F2EE;">Hola, {student_name} 👋</h2>
        <p style="color:#aaa;line-height:1.6;">Tu plaza está reservada. Te esperamos:</p>
        <div style="background:#1A1A1A;border-radius:12px;padding:20px;margin:20px 0;border-left:3px solid #FF4500;">
          <p style="font-size:24px;font-weight:900;color:#FF4500;margin:0;">{class_time.strftime('%H:%M')}</p>
          <p style="color:#F5F2EE;margin:4px 0;">{class_time.strftime('%A, %d de %B de %Y').capitalize()}</p>
          <p style="color:#888;font-size:13px;margin:0;">📍 {location}</p>
        </div>
        <p style="color:#666;font-size:12px;">¿No puedes venir? Cancela con más de 24h de antelación desde la app.</p>
    """
    _send(to_email, subject, _base_template(content))


def send_booking_reminder(student_name: str, to_email: str,
                           class_time: datetime, location: str):
    subject = "⏰ Tu clase es mañana — Functional Tribe"
    content = f"""
        <p style="color:#888;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Recordatorio</p>
        <h2 style="font-size:28px;margin:8px 0;color:#F5F2EE;">¡Mañana toca entrenar, {student_name}! 🔥</h2>
        <div style="background:#1A1A1A;border-radius:12px;padding:20px;margin:20px 0;border-left:3px solid #FF4500;">
          <p style="font-size:24px;font-weight:900;color:#FF4500;margin:0;">{class_time.strftime('%H:%M')}</p>
          <p style="color:#F5F2EE;margin:4px 0;">{class_time.strftime('%A, %d de %B').capitalize()}</p>
          <p style="color:#888;font-size:13px;margin:0;">📍 {location}</p>
        </div>
        <p style="color:#666;font-size:12px;">Recuerda traer agua y ropa cómoda. ¡Nos vemos!</p>
    """
    _send(to_email, subject, _base_template(content))


def send_class_cancelled(student_name: str, to_email: str,
                          class_time: datetime, reason: str = ""):
    subject = "❌ Clase cancelada — Functional Tribe"
    content = f"""
        <p style="color:#888;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Clase cancelada</p>
        <h2 style="font-size:24px;margin:8px 0;color:#F5F2EE;">Hola, {student_name}</h2>
        <p style="color:#aaa;line-height:1.6;">
          La clase del <strong style="color:#F5F2EE;">{class_time.strftime('%A %d de %B a las %H:%M').capitalize()}</strong> ha sido cancelada por el entrenador.
        </p>
        {f'<p style="color:#888;">{reason}</p>' if reason else ''}
        <p style="color:#666;font-size:12px;margin-top:16px;">Tu clase ha sido devuelta a tu bono/plan automáticamente.</p>
    """
    _send(to_email, subject, _base_template(content))


def send_payment_reminder(student_name: str, to_email: str, plan_type: str):
    subject = "💳 Pago pendiente — Functional Tribe"
    content = f"""
        <p style="color:#888;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Recordatorio de pago</p>
        <h2 style="font-size:24px;margin:8px 0;color:#F5F2EE;">Hola, {student_name}</h2>
        <p style="color:#aaa;line-height:1.6;">
          Tienes un pago pendiente por tu plan <strong style="color:#FF4500;">{plan_type}</strong>.
        </p>
        <p style="color:#aaa;">Por favor, realiza el pago por Bizum o transferencia para mantener tu acceso a las clases.</p>
        <p style="color:#666;font-size:12px;margin-top:16px;">¿Ya has pagado? Avisa a tu entrenador para que lo confirme.</p>
    """
    _send(to_email, subject, _base_template(content))


def send_bono_low_warning(student_name: str, to_email: str, remaining: int):
    subject = f"⚠️ Te quedan {remaining} clases en tu bono — Functional Tribe"
    content = f"""
        <p style="color:#888;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Bono casi agotado</p>
        <h2 style="font-size:24px;margin:8px 0;color:#F5F2EE;">Hola, {student_name}</h2>
        <p style="color:#aaa;line-height:1.6;">
          Tu bono de clases está a punto de agotarse. Solo te quedan
          <strong style="color:#FF4500;font-size:20px;"> {remaining} clases</strong>.
        </p>
        <p style="color:#aaa;">Habla con tu entrenador para renovar tu bono y no perder tu plaza.</p>
    """
    _send(to_email, subject, _base_template(content))


def send_invite_link(to_email: str, invite_url: str):
    subject = "🏋️ Te han invitado a Functional Tribe"
    content = f"""
        <h2 style="font-size:24px;margin:8px 0;color:#F5F2EE;">¡Bienvenido/a a la tribu! 🔥</h2>
        <p style="color:#aaa;line-height:1.6;">Tu entrenador te ha invitado a unirte a Functional Tribe.</p>
        <div style="text-align:center;margin:28px 0;">
          <a href="{invite_url}" style="background:#FF4500;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:1px;">
            Crear mi cuenta →
          </a>
        </div>
        <p style="color:#666;font-size:12px;text-align:center;">El enlace caduca en 7 días.</p>
    """
    _send(to_email, subject, _base_template(content))
