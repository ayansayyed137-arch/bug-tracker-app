const express = require('express');
const router = express.Router();
const Bug = require('../models/Bug');
const auth = require('../middleware/auth');

// GET all bugs
router.get('/', auth, async (req, res) => {
  try {
    const bugs = await Bug.find()
      .populate('assignee', 'email name')
      .populate('comments.user', 'email name')
      .populate('activityLogs.user', 'email name')
      .sort({ createdAt: -1 });
    res.json(bugs);
  } catch (err) {
    console.error('GET /api/bugs error:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// POST a new bug
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, severity, projectId, assignee, dueDate, status } = req.body;

    if (!projectId) {
      return res.status(400).json({ message: 'Please select an active project first' });
    }

    const newBug = new Bug({
      title,
      description,
      severity: severity || 'Medium',
      projectId,
      assignee: assignee || null,
      dueDate: dueDate || null,
      status: status || 'To Do',
      user: req.user.id,
      activityLogs: [{ action: 'Created task', user: req.user.id }]
    });

    const savedBug = await newBug.save();
    const populatedBug = await Bug.findById(savedBug._id)
      .populate('assignee', 'email name')
      .populate('comments.user', 'email name')
      .populate('activityLogs.user', 'email name');
      
    res.status(201).json(populatedBug);
  } catch (err) {
    console.error('POST /api/bugs error:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// DELETE a bug by ID
router.delete('/:id', auth, async (req, res) => {
  try {
    const bug = await Bug.findById(req.params.id);

    if (!bug) {
      return res.status(404).json({ message: 'Bug not found' });
    }

    if (bug.user && bug.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    await bug.deleteOne();
    res.json({ message: 'Bug removed successfully' });
  } catch (err) {
    console.error('DELETE /api/bugs error:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// PATCH/UPDATE bug status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    
    const bug = await Bug.findById(req.params.id);
    if (!bug) {
      return res.status(404).json({ message: 'Bug not found' });
    }

    bug.status = status;
    if (!bug.activityLogs) bug.activityLogs = [];
    bug.activityLogs.push({
      action: `Changed status to ${status}`,
      user: req.user.id
    });

    await bug.save();

    const updatedBug = await Bug.findById(req.params.id)
      .populate('assignee', 'email name')
      .populate('comments.user', 'email name')
      .populate('activityLogs.user', 'email name');

    res.json(updatedBug);
  } catch (err) {
    console.error('PATCH /api/bugs/status error:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// POST add a comment to a bug
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const bug = await Bug.findById(req.params.id);
    if (!bug) {
      return res.status(404).json({ message: 'Bug not found' });
    }

    if (!bug.comments) bug.comments = [];
    if (!bug.activityLogs) bug.activityLogs = [];

    bug.comments.push({
      user: req.user.id,
      text
    });

    bug.activityLogs.push({
      action: 'Added a comment',
      user: req.user.id
    });

    await bug.save();

    const updatedBug = await Bug.findById(req.params.id)
      .populate('assignee', 'email name')
      .populate('comments.user', 'email name')
      .populate('activityLogs.user', 'email name');

    res.json(updatedBug);
  } catch (err) {
    console.error('POST /api/bugs/:id/comments error:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

module.exports = router;