"""
WealthWise AI - Email Service Abstraction and SMTP Implementation
"""

import asyncio
from abc import ABC, abstractmethod
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import smtplib

from app.core.config import Settings
from app.core.logger import logger


class EmailService(ABC):

    @abstractmethod
    async def send_password_reset_email(self, email: str, token: str) -> None:
        """Send password reset email to user asynchronously."""
        pass


class SMTPEmailService(EmailService):

    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def _send_email_sync(self, to_email: str, subject: str, html_content: str) -> None:
        """Synchronously construct and send the email over SMTP."""
        try:
            msg = MIMEMultipart()
            msg["From"] = f"{self.settings.SMTP_FROM_NAME} <{self.settings.SMTP_FROM_EMAIL}>"
            msg["To"] = to_email
            msg["Subject"] = subject

            msg.attach(MIMEText(html_content, "html"))

            # Choose SMTP or SMTP_SSL connection
            if self.settings.SMTP_SSL:
                server = smtplib.SMTP_SSL(
                    self.settings.SMTP_HOST,
                    self.settings.SMTP_PORT,
                    timeout=10
                )
            else:
                server = smtplib.SMTP(
                    self.settings.SMTP_HOST,
                    self.settings.SMTP_PORT,
                    timeout=10
                )
                if self.settings.SMTP_TLS:
                    server.starttls()

            if self.settings.SMTP_USER and self.settings.SMTP_PASSWORD:
                server.login(self.settings.SMTP_USER, self.settings.SMTP_PASSWORD)

            server.send_message(msg)
            server.quit()
            logger.info(f"Email sent successfully to {to_email}")
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")

    async def send_password_reset_email(self, email: str, token: str) -> None:
        """Offload the synchronous send_message to a separate worker thread."""
        reset_link = f"{self.settings.FRONTEND_URL}/reset-password?token={token}"
        subject = "Reset Your Password - WealthWise AI"
        html_content = f"""
        <p>Hello,</p>
        <p>You requested a password reset. Please click the link below to reset your password:</p>
        <p><a href="{reset_link}">{reset_link}</a></p>
        <p>This link will expire in 15 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
        """
        # Execute blocking SMTP operation in a separate thread
        await asyncio.to_thread(self._send_email_sync, email, subject, html_content)
