import express from 'express';
import nodemailer from 'nodemailer';
import Member from '../models/Member';
import Organization from '../models/Organization';

const router = express.Router();

// POST /api/invite/accept/:token
router.post('/accept/:token', async (req, res) => {
  try {
    const member = await Member.findOne({ inviteToken: req.params.token });
    if (!member) return res.status(404).json({ message: 'Invalid or expired token' });

    // Already accepted — return success without re-sending email
    if (member.status === 'accepted') {
      return res.json({ message: 'Invitation already accepted', memberEmail: member.email });
    }

    member.status = 'accepted';
    member.inviteToken = undefined;
    await member.save();

    const org = await Organization.findById(member.organizationId).lean();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // Send welcome email with member login link
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
      });

      await transporter.sendMail({
        from: `"Agle Platform" <${process.env.EMAIL_USER}>`,
        to: member.email,
        subject: `Welcome to ${(org as any)?.organizationName || 'Agle'} — You're all set! 🎉`,
        html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Welcome</title></head>
<body style="margin:0;padding:0;background:#05070f;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#05070f;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#059669,#0d9488);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
          <div style="font-size:36px;margin-bottom:12px;">🎉</div>
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">You're in!</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Your invitation has been accepted</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#0b0f1e;border:1px solid rgba(255,255,255,0.08);border-top:none;border-radius:0 0 16px 16px;padding:36px 40px;">

          <p style="margin:0 0 8px;color:#94a3b8;font-size:13px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Hi, ${member.name}</p>
          <p style="margin:0 0 24px;color:#f1f5f9;font-size:16px;line-height:1.6;">
            Welcome to <strong style="color:#34d399;">${(org as any)?.organizationName || 'Agle'}</strong>! Your account is now active and ready to use. You can sign in anytime using just your email — no password required.
          </p>

          <!-- Info row -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr>
              <td style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.2);border-radius:10px;padding:16px 20px;vertical-align:top;width:50%;">
                <p style="margin:0 0 4px;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;font-weight:700;">Login Email</p>
                <p style="margin:0;color:#34d399;font-size:14px;font-weight:700;word-break:break-all;">${member.email}</p>
              </td>
              <td style="width:12px;"></td>
              <td style="background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.2);border-radius:10px;padding:16px 20px;vertical-align:top;width:50%;">
                <p style="margin:0 0 4px;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;font-weight:700;">Your Role</p>
                <p style="margin:0;color:#818cf8;font-size:14px;font-weight:700;">${member.role}</p>
              </td>
            </tr>
          </table>

          <!-- How to login note -->
          <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:16px 20px;margin-bottom:28px;">
            <p style="margin:0 0 6px;color:#94a3b8;font-size:13px;font-weight:700;">How to sign in:</p>
            <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">
              1. Click the button below to go to your login page.<br>
              2. Enter your email address.<br>
              3. We'll send you a one-time code — enter it to access your dashboard.
            </p>
          </div>

          <!-- CTA Button -->
          <div style="text-align:center;margin-bottom:28px;">
            <a href="${frontendUrl}/member/login" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#7c3aed);color:#fff;text-decoration:none;padding:14px 40px;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:0.2px;box-shadow:0 4px 20px rgba(99,102,241,0.4);">
              Go to Member Login →
            </a>
          </div>

          <div style="border-top:1px solid rgba(255,255,255,0.07);padding-top:20px;">
            <p style="margin:0;color:#475569;font-size:12px;line-height:1.6;">
              If you have any issues accessing your account, contact your organization admin. Do not share your one-time login codes with anyone.
            </p>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 40px;text-align:center;">
          <p style="margin:0;color:#334155;font-size:12px;">Sent by <strong style="color:#475569;">Agle Platform</strong> · Agile Project Management</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
      });
    } catch (emailErr) {
      console.error('Welcome email failed:', emailErr);
    }

    res.json({ message: 'Invitation accepted', memberEmail: member.email });
  } catch (error) {
    res.status(500).json({ message: 'Error accepting invitation' });
  }
});

export default router;
