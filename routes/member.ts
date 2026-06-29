import express from 'express';
import nodemailer from 'nodemailer';
import Member from '../models/Member';
import Organization from '../models/Organization';

const router = express.Router();

// POST /api/member/login/send-otp
router.post('/login/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    // Check member exists with any status first
    const anyMember = await Member.findOne({ email });
    if (!anyMember) {
      return res.status(404).json({ message: 'No member account found with this email. Check with your admin.' });
    }
    if (anyMember.status === 'pending') {
      return res.status(403).json({ message: 'Your invitation is still pending. Please accept the invite email first.' });
    }

    const member = anyMember; // status === 'accepted'

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    member.otp = otp;
    member.otpExpiry = otpExpiry;
    await member.save();

    const org = await Organization.findById(member.organizationId);

    // Always log OTP to console as fallback for testing
    console.log(`\n🔐 OTP for ${email}: ${otp} (expires in 10 min)\n`);

    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
      });

      await transporter.sendMail({
        from: `"Agle Platform" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `${otp} is your Agle login code`,
        html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Login Code</title></head>
<body style="margin:0;padding:0;background:#05070f;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#05070f;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#6366f1,#7c3aed);border-radius:16px 16px 0 0;padding:28px 40px;text-align:center;">
          <div style="display:inline-block;width:44px;height:44px;background:rgba(255,255,255,0.2);border-radius:11px;line-height:44px;font-size:20px;margin-bottom:10px;">⚡</div>
          <h1 style="margin:0;color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.3px;">Your Login Code</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">${org?.organizationName || 'Agle'} · Agle Platform</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#0b0f1e;border:1px solid rgba(255,255,255,0.08);border-top:none;border-radius:0 0 16px 16px;padding:36px 40px;">

          <p style="margin:0 0 20px;color:#f1f5f9;font-size:15px;line-height:1.6;">
            Use the code below to sign in to <strong style="color:#818cf8;">${org?.organizationName || 'Agle'}</strong>. This code is valid for <strong>10 minutes</strong>.
          </p>

          <!-- OTP Block -->
          <div style="background:linear-gradient(135deg,rgba(99,102,241,0.15),rgba(124,58,237,0.1));border:1px solid rgba(99,102,241,0.3);border-radius:14px;padding:32px 20px;text-align:center;margin-bottom:28px;">
            <p style="margin:0 0 10px;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:2px;font-weight:700;">One-Time Passcode</p>
            <div style="font-size:44px;font-weight:900;letter-spacing:16px;color:#818cf8;font-variant-numeric:tabular-nums;line-height:1;padding-left:16px;">${otp}</div>
          </div>

          <!-- Security note -->
          <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:10px;padding:14px 18px;margin-bottom:20px;display:flex;align-items:flex-start;gap:10px;">
            <span style="font-size:16px;">⚠️</span>
            <p style="margin:0;color:#92400e;font-size:13px;line-height:1.5;">
              <strong style="color:#fbbf24;">Never share this code.</strong> Agle will never ask for your code via phone, chat, or email. If you didn't request this, ignore this message.
            </p>
          </div>

          <p style="margin:0;color:#475569;font-size:12px;line-height:1.6;">
            This code expires in <strong style="color:#64748b;">10 minutes</strong>. If it has expired, simply request a new one from the login page.
          </p>
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
      console.log(`✅ OTP email sent to ${email}`);
    } catch (emailErr) {
      console.error('⚠️  Email sending failed (OTP logged above for testing):', emailErr);
      // Still succeed — OTP is saved, user can get it from admin/console for now
    }

    res.json({ message: `OTP sent to ${email}` });
  } catch (error) {
    console.error('send-otp error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// POST /api/member/login/verify-otp
router.post('/login/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const member = await Member.findOne({ email, status: 'accepted' });

    if (!member) return res.status(404).json({ message: 'Member not found' });
    if (!member.otp || !member.otpExpiry) return res.status(400).json({ message: 'No OTP requested' });
    if (new Date() > member.otpExpiry) return res.status(400).json({ message: 'OTP has expired' });
    if (member.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });

    // Clear OTP after successful verification
    member.otp = undefined;
    member.otpExpiry = undefined;
    await member.save();

    const org = await Organization.findById(member.organizationId).lean();

    res.json({
      member: {
        id: member._id,
        name: member.name,
        email: member.email,
        role: member.role,
        organizationId: member.organizationId,
        organizationName: (org as any)?.organizationName || ''
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying OTP' });
  }
});

// GET /api/member/me/:memberId
router.get('/me/:memberId', async (req, res) => {
  try {
    const member = await Member.findById(req.params.memberId).lean();
    if (!member) return res.status(404).json({ message: 'Member not found' });
    const org = await Organization.findById(member.organizationId).lean();
    res.json({ ...member, organizationName: (org as any)?.organizationName || '' });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching member data' });
  }
});

// GET /api/member/dashboard/:memberId — full member workspace data
router.get('/dashboard/:memberId', async (req, res) => {
  try {
    const Member2 = (await import('../models/Member')).default;
    const Project = (await import('../models/Project')).default;
    const Task    = (await import('../models/Task')).default;
    const Sprint  = (await import('../models/Sprint')).default;

    const member = await Member2.findById(req.params.memberId).lean() as any;
    if (!member) return res.status(404).json({ message: 'Member not found' });

    const org = await Organization.findById(member.organizationId).lean() as any;

    // All projects in this org where member is assigned
    const allProjects = await Project.find({ organizationId: member.organizationId }).lean() as any[];
    const projects = allProjects.filter((p: any) =>
      p.assignedMembers?.includes(member.name)
    );

    const projectIds = projects.map((p: any) => p._id);

    // All tasks assigned to this member across their projects
    const allTasks = await Task.find({
      projectId: { $in: projectIds },
      assignee: member.name
    }).lean() as any[];

    // Active sprints across their projects
    const sprints = await Sprint.find({
      projectId: { $in: projectIds },
      status: { $ne: 'Completed' }
    }).lean() as any[];

    // Attach project name to tasks
    const projectMap: Record<string, string> = {};
    projects.forEach((p: any) => { projectMap[p._id.toString()] = p.name; });

    const tasks = allTasks.map((t: any) => ({
      ...t,
      projectName: projectMap[t.projectId?.toString()] || 'Unknown'
    }));

    res.json({
      member: { ...member, organizationName: org?.organizationName || '' },
      projects,
      tasks,
      sprints
    });
  } catch (error) {
    console.error('dashboard error:', error);
    res.status(500).json({ message: 'Error fetching dashboard data' });
  }
});

export default router;
