import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  author:    { type: String, required: true },
  authorId:  { type: String },
  text:      { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const taskSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  type: { type: String, enum: ['Epic', 'Story', 'Task', 'Bug'], required: true },
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['Backlog', 'To Do', 'In Progress', 'Review', 'Testing', 'Done'], default: 'To Do' },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  assignee: { type: String },
  reporter: { type: String },
  dueDate: { type: Date },
  storyPoints: { type: Number },
  sprintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sprint' },
  epicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  labels: [{ type: String }],
  color: { type: String },
  acceptanceCriteria: { type: String },
  comments: [commentSchema]
}, { timestamps: true });

export default mongoose.model('Task', taskSchema);
