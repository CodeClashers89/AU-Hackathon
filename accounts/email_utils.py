from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from .models import OTP
import random
import os
from datetime import timedelta
from django.utils import timezone
from email.mime.image import MIMEImage

def generate_otp(user, purpose):
    """Generate a 6-digit OTP and save it to the database"""
    otp_code = f"{random.randint(100000, 999999)}"
    expires_at = timezone.now() + timedelta(minutes=10)
    
    # Deactivate old OTPs for this purpose
    OTP.objects.filter(user=user, purpose=purpose, is_verified=False).delete()
    
    otp = OTP.objects.create(
        user=user,
        otp_code=otp_code,
        purpose=purpose,
        expires_at=expires_at
    )
    return otp_code

def send_html_email(subject, recipient_email, template_name, context):
    """Helper to send professional HTML emails with logo embedding"""
    # Base HTML template for all emails
    logo_path = os.path.join(settings.BASE_DIR, 'mobile_app', 'assets', 'images', 'logo.png')
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }}
            .container {{ max-width: 600px; margin: 20px auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; }}
            .header {{ background-color: #0B4F87; padding: 30px; text-align: center; color: white; }}
            .logo {{ width: 80px; height: auto; margin-bottom: 10px; }}
            .app-name {{ font-size: 24px; font-weight: bold; letter-spacing: 1px; margin: 0; }}
            .content {{ padding: 30px; background-color: #ffffff; }}
            .footer {{ background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #777; }}
            .otp-box {{ background-color: #f0f7ff; border: 2px dashed #0B4F87; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }}
            .otp-code {{ font-size: 32px; font-weight: 800; color: #0B4F87; letter-spacing: 5px; }}
            .btn {{ display: inline-block; padding: 12px 25px; background-color: #1e8449; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 20px; }}
            .status-badge {{ display: inline-block; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }}
            .status-approved {{ background-color: #dcfce7; color: #166534; }}
            .status-pending {{ background-color: #fef9c3; color: #854d0e; }}
            .status-rejected {{ background-color: #fee2e2; color: #991b1b; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="cid:logo" class="logo" alt="Seva Setu Logo">
                <h1 class="app-name">SEVA SETU</h1>
                <p style="margin: 5px 0 0 0; opacity: 0.8; font-size: 14px;">National Digital Public Infrastructure</p>
            </div>
            <div class="content">
                {context['body_html']}
            </div>
            <div class="footer">
                &copy; {{timezone.now().year}} Seva Setu - Government of India. All rights reserved.<br>
                This is an automated security notification. Please do not reply.
            </div>
        </div>
    </body>
    </html>
    """
    
    text_content = strip_tags(html_content)
    
    msg = EmailMultiAlternatives(
        subject,
        text_content,
        settings.DEFAULT_FROM_EMAIL,
        [recipient_email]
    )
    msg.attach_alternative(html_content, "text/html")
    
    # Attach logo as CID
    if os.path.exists(logo_path):
        with open(logo_path, 'rb') as f:
            logo = MIMEImage(f.read())
            logo.add_header('Content-ID', '<logo>')
            msg.attach(logo)
            
    try:
        msg.send()
        return True
    except Exception as e:
        print(f"Error sending rich email: {e}")
        return False

def send_otp_email(user, otp_code, purpose):
    """Send branded OTP email"""
    if purpose == 'registration':
        subject = "Seva Setu - Verify Your Registration"
        body_html = f"""
            <h2>Welcome to Seva Setu, {user.first_name}!</h2>
            <p>Thank you for establishing your digital identity on the national stage. To complete your registration request, please use the following verification code:</p>
            <div class="otp-box">
                <div class="otp-code">{otp_code}</div>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">This code will expire in 10 minutes.</p>
            </div>
            <p>If you did not initiate this request, please disregard this email or contact support immediately.</p>
        """
    else:
        subject = "Seva Setu - Password Reset Request"
        body_html = f"""
            <h2>Hello {user.username},</h2>
            <p>We received a request to reset your security credentials. Use the following code to authorize the change:</p>
            <div class="otp-box">
                <div class="otp-code">{otp_code}</div>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">This code will expire in 10 minutes.</p>
            </div>
            <p><strong>Warning:</strong> If you did not request a password reset, your account security may be at risk. Update your password immediately.</p>
        """
    
    return send_html_email(subject, user.email, None, {'body_html': body_html})

def send_admin_notification_email(user):
    """Notify user that their request reached admin"""
    subject = "Seva Setu - Account Request Under Review"
    body_html = f"""
        <h2>Request Transmission Success</h2>
        <p>Hello {user.first_name},</p>
        <p>Your application for the role of <strong>{user.get_role_display()}</strong> has been successfully transmitted to the National Administration clearinghouse.</p>
        <div style="background-color: #f8fafc; border-left: 4px solid #0B4F87; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Current Status:</strong> <span class="status-badge status-pending">In Review</span></p>
        </div>
        <p>Our administrators are currently validating your biometric and professional credentials. You will receive an automated status update once clearance is granted.</p>
    """
    return send_html_email(subject, user.email, None, {'body_html': body_html})

def send_approval_status_email(user, status, notes=""):
    """Notify user of approval/rejection status"""
    if status == 'approved':
        subject = "Seva Setu - Account Clearance Granted"
        body_html = f"""
            <h2>Congratulations, {user.first_name}!</h2>
            <p>We are pleased to inform you that your Seva Setu account has been <strong>Approved</strong> and successfully synchronized with the national grid.</p>
            <div style="background-color: #f0fdf4; border-left: 4px solid #1e8449; padding: 15px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Final Status:</strong> <span class="status-badge status-approved">Approved</span></p>
            </div>
            <p>You can now access your specialized dashboard using your registered credentials. Welcome to the future of Digital Public Infrastructure.</p>
            <a href="{settings.ALLOWED_HOSTS[0] if settings.ALLOWED_HOSTS else '#'}/login/" class="btn">Access Portal</a>
        """
    else:
        subject = "Seva Setu - Account Request Update"
        body_html = f"""
            <h2>Service Notification</h2>
            <p>Hello {user.first_name},</p>
            <p>Your recent account request for the Seva Setu platform has been reviewed by the administration.</p>
            <div style="background-color: #fef2f2; border-left: 4px solid #991b1b; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #991b1b;"><strong>Status:</strong> <span class="status-badge status-rejected">Rejected</span></p>
                <p style="margin: 10px 0 0 0; font-size: 14px;"><strong>Admin Notes:</strong> {notes if notes else 'No additional details provided.'}</p>
            </div>
            <p>If you believe this decision was made in error, please review your registration data and re-submit your application.</p>
        """
    return send_html_email(subject, user.email, None, {'body_html': body_html})
