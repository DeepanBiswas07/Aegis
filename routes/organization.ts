import express from 'express';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import Organization from '../models/Organization';
import Member from '../models/Member';
import Project from '../models/Project';

const router = express.Router();

router.get('/:id', async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id).lean();
    if (!org) return res.status(404).json({ message: 'Organization not found' });
    
    const members = await Member.find({ organizationId: org._id });
    const projects = await Project.find({ organizationId: org._id });
    
    res.json({ ...org, members, projects });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching org' });
  }
});

router.post('/:id/members', async (req, res) => {
  try {
    const { name, email, role } = req.body;
    
    // Ensure email is globally unique (a member can only belong to ONE organization)
    const existingMember = await Member.findOne({ email: email.toLowerCase() });
    if (existingMember) {
      return res.status(400).json({ message: 'This email is already associated with an organization.' });
    }

    const inviteToken = crypto.randomBytes(20).toString('hex');
    
    const newMember = new Member({ 
      organizationId: req.params.id, 
      name, 
      email: email.toLowerCase(), 
      role,
      status: 'pending',
      inviteToken
    });
    await newMember.save();

    const org = await Organization.findById(req.params.id);

    try {
      const inviteLink = `${process.env.FRONTEND_URL}/invite/${inviteToken}`;
      const mailOptions = {
        from: `"Agle Platform" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `You're invited to join ${org?.organizationName} on Agle`,
        html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Invitation</title></head>
<body style="margin:0;padding:0;background:#05070f;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#05070f;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Header gradient bar -->
        <tr><td style="background:linear-gradient(135deg,#6366f1,#a78bfa);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
          <div style="display:inline-block;width:48px;height:48px;background:rgba(255,255,255,0.2);border-radius:12px;line-height:48px;font-size:22px;margin-bottom:12px;">⚡</div>
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">You've been invited!</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Join your team on Agle</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#0b0f1e;border:1px solid rgba(255,255,255,0.08);border-top:none;border-radius:0 0 16px 16px;padding:36px 40px;">
          <p style="margin:0 0 8px;color:#94a3b8;font-size:13px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Hello, ${name}</p>
          <p style="margin:0 0 24px;color:#f1f5f9;font-size:16px;line-height:1.6;">
            <strong style="color:#818cf8;">${org?.organizationName}</strong> has invited you to collaborate on their projects using the Agle project management platform.
          </p>

          <!-- Role badge -->
          <div style="background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.25);border-radius:8px;padding:14px 18px;margin-bottom:28px;display:inline-block;">
            <span style="color:#94a3b8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;">Your Role &nbsp;·&nbsp; </span>
            <span style="color:#818cf8;font-size:14px;font-weight:700;">${role}</span>
          </div>

          <!-- CTA Button -->
          <div style="text-align:center;margin:8px 0 28px;">
            <a href="${inviteLink}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#7c3aed);color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:0.2px;box-shadow:0 4px 20px rgba(99,102,241,0.4);">
              Accept Invitation →
            </a>
          </div>

          <!-- Divider -->
          <div style="border-top:1px solid rgba(255,255,255,0.08);margin:24px 0;"></div>

          <p style="margin:0 0 6px;color:#475569;font-size:12px;">Or copy this link into your browser:</p>
          <p style="margin:0;background:#05070f;border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:10px 14px;font-size:12px;color:#64748b;word-break:break-all;">${inviteLink}</p>

          <p style="margin:24px 0 0;color:#475569;font-size:12px;line-height:1.6;">
            This invitation link will expire in <strong style="color:#64748b;">7 days</strong>. If you did not expect this invitation, you can safely ignore this email.
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
      };
      
      const transporter = nodemailer.createTransport({ 
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      await transporter.sendMail(mailOptions);
      console.log(`Invite email sent to ${email}. Link: ${inviteLink}`);
    } catch (emailErr) {
      console.error('Failed to send email. Ensure EMAIL_USER and EMAIL_PASS are set in your .env file.', emailErr);
    }

    res.json(newMember);
  } catch (error) {
    res.status(500).json({ message: 'Error adding member' });
  }
});

router.post('/:id/projects', async (req, res) => {
  try {
    const { name, description, startDate, targetEndDate, status, assignedMembers } = req.body;
    const newProject = new Project({ 
      organizationId: req.params.id, 
      name, 
      description,
      startDate: startDate === '' ? null : startDate,
      targetEndDate: targetEndDate === '' ? null : targetEndDate,
      status: status || 'Active',
      assignedMembers 
    });
    await newProject.save();
    res.json(newProject);
  } catch (error) {
    console.error('Backend error adding project:', error);
    res.status(500).json({ message: 'Error adding project' });
  }
});

router.put('/:id/projects/:projectId', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.startDate === '') data.startDate = null;
    if (data.targetEndDate === '') data.targetEndDate = null;
    const updatedProject = await Project.findByIdAndUpdate(req.params.projectId, data, { returnDocument: 'after' });
    res.json(updatedProject);
  } catch (error) {
    console.error('Backend error updating project:', error);
    res.status(500).json({ message: 'Error updating project' });
  }
});

router.delete('/:id/projects/:projectId', async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.projectId);
    res.json({ message: 'Project removed' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing project' });
  }
});

router.delete('/:id/members/:memberId', async (req, res) => {
  try {
    await Member.findByIdAndDelete(req.params.memberId);
    res.json({ message: 'Member removed' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing member' });
  }
});

export default router;
