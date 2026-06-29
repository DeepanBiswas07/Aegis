import express from 'express';
import Project from '../models/Project';
import Task from '../models/Task';
import Sprint from '../models/Sprint';
import Member from '../models/Member';

const router = express.Router();

// ─── PROJECT ─────────────────────────────────────────────────────────────────

router.get('/:projectId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId).lean();
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const tasks    = await Task.find({ projectId: project._id });
    const sprints  = await Sprint.find({ projectId: project._id });
    const orgMembers = await Member.find({ organizationId: project.organizationId });
    res.json({ ...project, tasks, sprints, orgMembers });
  } catch {
    res.status(500).json({ message: 'Error fetching project details' });
  }
});

router.put('/:projectId', async (req, res) => {
  try {
    const updated = await Project.findByIdAndUpdate(req.params.projectId, req.body, { returnDocument: 'after' });
    res.json(updated);
  } catch {
    res.status(500).json({ message: 'Error updating project' });
  }
});

// ─── TASKS ────────────────────────────────────────────────────────────────────

router.post('/:projectId/tasks', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.sprintId === '' || data.sprintId === 'null') delete data.sprintId;
    if (data.epicId === '' || data.epicId === 'null') delete data.epicId;
    if (data.dueDate === '') delete data.dueDate;
    const task = new Task({ ...data, projectId: req.params.projectId });
    await task.save();
    res.json(task);
  } catch (err) {
    console.error('Backend error creating task:', err);
    res.status(500).json({ message: 'Error creating task' });
  }
});

router.put('/:projectId/tasks/:taskId', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.sprintId === '' || data.sprintId === 'null') data.sprintId = null;
    if (data.epicId === '' || data.epicId === 'null') data.epicId = null;
    if (data.dueDate === '') data.dueDate = null;
    const task = await Task.findByIdAndUpdate(req.params.taskId, data, { returnDocument: 'after' });
    res.json(task);
  } catch (err) {
    console.error('Backend error updating task:', err);
    res.status(500).json({ message: 'Error updating task' });
  }
});

router.delete('/:projectId/tasks/:taskId', async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.taskId);
    res.json({ message: 'Task deleted' });
  } catch {
    res.status(500).json({ message: 'Error deleting task' });
  }
});

// ─── TASK COMMENTS ────────────────────────────────────────────────────────────

router.post('/:projectId/tasks/:taskId/comments', async (req, res) => {
  try {
    const { author, authorId, text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Comment text required' });
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    (task.comments as any[]).push({ author, authorId, text });
    await task.save();
    res.json(task);
  } catch {
    res.status(500).json({ message: 'Error posting comment' });
  }
});

router.delete('/:projectId/tasks/:taskId/comments/:commentId', async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    task.comments = (task.comments as any[]).filter(
      (c: any) => c._id.toString() !== req.params.commentId
    ) as any;
    await task.save();
    res.json(task);
  } catch {
    res.status(500).json({ message: 'Error deleting comment' });
  }
});

// ─── SPRINTS ──────────────────────────────────────────────────────────────────

router.post('/:projectId/sprints', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.startDate === '') delete data.startDate;
    if (data.endDate === '') delete data.endDate;
    const sprint = new Sprint({ ...data, projectId: req.params.projectId });
    await sprint.save();
    res.json(sprint);
  } catch (err) {
    console.error('Backend error creating sprint:', err);
    res.status(500).json({ message: 'Error creating sprint' });
  }
});

router.put('/:projectId/sprints/:sprintId', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.startDate === '') data.startDate = null;
    if (data.endDate === '') data.endDate = null;
    const sprint = await Sprint.findByIdAndUpdate(req.params.sprintId, data, { returnDocument: 'after' });
    res.json(sprint);
  } catch (err) {
    console.error('Backend error updating sprint:', err);
    res.status(500).json({ message: 'Error updating sprint' });
  }
});

router.delete('/:projectId/sprints/:sprintId', async (req, res) => {
  try {
    await Sprint.findByIdAndDelete(req.params.sprintId);
    res.json({ message: 'Sprint deleted' });
  } catch {
    res.status(500).json({ message: 'Error deleting sprint' });
  }
});

export default router;
