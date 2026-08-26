import { Resend } from 'resend';
import { logger } from './logger';

const resend = new Resend(process.env.RESEND_API_KEY);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://sushantghadge.com';
const EMAIL_FROM = process.env.EMAIL_FROM || 'Support <support@sushantghadge.com>';

/**
 * Send a password reset email with a professional, branded HTML template.
 * Never throws — returns { success, error } so callers can handle safely.
 */
export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
  expiresInMinutes = 30,
}: {
  to: string;
  name: string;
  resetUrl: string;
  expiresInMinutes?: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your Password</title>
</head>
<body style="margin:0;padding:0;background-color:#0B0514;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0B0514;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:linear-gradient(145deg,rgba(255,255,255,0.06) 0%,rgba(255,255,255,0.02) 100%);border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:40px 32px;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <div style="display:inline-block;width:48px;height:48px;line-height:48px;text-align:center;border-radius:14px;background:linear-gradient(135deg,#A855F7,#7C3AED);color:#fff;font-weight:900;font-size:22px;box-shadow:0 4px 20px rgba(168,85,247,0.4);">S</div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:8px;">
              <h1 style="margin:0;font-size:22px;font-weight:800;color:#eef0f6;letter-spacing:-0.02em;">Reset Your Password</h1>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <p style="margin:0;font-size:14px;color:#a89ec8;line-height:1.6;">
                Hi${name ? ` ${name}` : ''},<br/>
                We received a request to reset the password for your Sushant Ghadge account.
              </p>
            </td>
          </tr>
          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <a href="${resetUrl}" target="_blank" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#A855F7,#7C3AED);color:#fff;font-weight:700;font-size:15px;text-decoration:none;border-radius:12px;box-shadow:0 4px 20px rgba(168,85,247,0.35);">
                Reset Password
              </a>
            </td>
          </tr>
          <!-- Expiry notice -->
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <p style="margin:0;font-size:12px;color:#6b5e88;line-height:1.6;">
                This link expires in <strong style="color:#D8B4FE;">${expiresInMinutes} minutes</strong>.<br/>
                If you can't click the button, copy and paste this URL into your browser:
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <p style="margin:0;font-size:11px;color:#6b5e88;word-break:break-all;line-height:1.6;background:rgba(255,255,255,0.03);padding:12px 16px;border-radius:8px;border:1px solid rgba(255,255,255,0.06);">
                ${resetUrl}
              </p>
            </td>
          </tr>
          <!-- Security notice -->
          <tr>
            <td style="border-top:1px solid rgba(255,255,255,0.06);padding-top:20px;">
              <p style="margin:0;font-size:12px;color:#6b5e88;line-height:1.6;">
                🔒 If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0;font-size:11px;color:#4a4464;">
                © ${new Date().getFullYear()} Sushant Ghadge · <a href="${APP_URL}" style="color:#7C3AED;text-decoration:none;">sushantghadge.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: 'Reset your Sushant Ghadge account password',
      html,
    });

    if (error) {
      logger.error('Password reset email send failed', { emailTo: to });
      return { success: false, error: 'Email delivery failed' };
    }

    logger.info('Password reset email sent', { emailTo: to });
    return { success: true };
  } catch (err) {
    logger.error('Password reset email exception', { emailTo: to });
    return { success: false, error: 'Email delivery failed' };
  }
}
