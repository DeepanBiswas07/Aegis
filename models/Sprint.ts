import mongoose from 'mongoose';

const sprintSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  name: { type: String, required: true },
  goal: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },
  status: { type: String, enum: ['Planned', 'Active', 'Completed'], default: 'Planned' }
}, { timestamps: true });

export default mongoose.model('Sprint', sprintSchema);
