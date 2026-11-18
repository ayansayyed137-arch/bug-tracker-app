const express = require('express');
const router = express.Router();
const { 
  getProjects, 
  createProject, 
  deleteProject, 
  addMember, 
  removeMember 
} = require('../controllers/projectController');
const verifyToken = require('../middleware/auth');

router.get('/', verifyToken, getProjects);
router.post('/', verifyToken, createProject);
router.delete('/:id', verifyToken, deleteProject);

// Team Members Routes
router.post('/:id/members', verifyToken, addMember);
router.delete('/:id/members/:memberId', verifyToken, removeMember);

module.exports = router;