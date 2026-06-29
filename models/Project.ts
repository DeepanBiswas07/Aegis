import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true },
  description: { type: String },
  startDate: { type: Date },
  targetEndDate: { type: Date },
  status: { type: String, enum: ['Active', 'Completed', 'Archived'], default: 'Active' },
  progress: { type: Number, default: 0 },
  assignedMembers: [{ type: String }]
}, { timestamps: true });

export default mongoose.model('Project', projectSchema);
