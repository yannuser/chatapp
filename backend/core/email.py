import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from core.config import settings

logger = logging.getLogger(__name__)


def send_password_reset_email(to_email: str, reset_link: str):
    subject = "Reset your password"
    body_text = (
        f"You requested a password reset.\n\n"
        f"Click the link below to choose a new password (valid for "
        f"{settings.PASSWORD_RESET_EXPIRE_MINUTES} minutes):\n\n"
        f"{reset_link}\n\n"
        f"If you did not request this, you can ignore this email."
    )

    if not settings.SMTP_ENABLED:
        logger.info("SMTP disabled. Password reset link for %s: %s", to_email, reset_link)
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
    msg["To"] = to_email
    msg.attach(MIMEText(body_text, "plain"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())
    except Exception:
        logger.exception("Failed to send password reset email to %s", to_email)
        raise
