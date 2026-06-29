import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted'], default: 'pending' },
  inviteToken: { type: String },
  otp: { type: String },
  otpExpiry: { type: Date }
}, { timestamps: true });

export default mongoose.model('Member', memberSchema);
