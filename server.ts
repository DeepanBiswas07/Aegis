import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth';
import organizationRoutes from './routes/organization';
import inviteRoutes from './routes/invite';
import projectRoutes from './routes/project';
import memberRoutes from './routes/member';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || '';

mongoose.connect(MONGODB_URI, { dbName: 'agle' })
  .then(() => console.log('Connected to MongoDB (agle database)'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api', authRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/invite', inviteRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/member', memberRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
