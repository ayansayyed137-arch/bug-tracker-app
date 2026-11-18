const Project = require('../models/Project');
const User = require('../models/User');

// Get all projects for logged-in user
const getProjects = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id || req.user?.userId;
    const projects = await Project.find({
      $or: [{ createdBy: userId }, { user: userId }, { teamMembers: userId }]
    }).populate('teamMembers', 'email');
    res.json(projects);
  } catch (err) {
    console.error("Error fetching projects:", err);
    res.status(500).json({ message: 'Server error while fetching projects' });
  }
};

// Create a new project
const createProject = async (req, res) => {
  try {
    const { title, description } = req.body;
    
    // Safely extract user id
    const userId = req.user?._id || req.user?.id || req.user?.userId;

    if (!title) {
      return res.status(400).json({ message: 'Project title is required' });
    }

    const projectData = {
      title,
      description,
      createdBy: userId,
      user: userId, // Dono handle karne ke liye taaki schema error na aaye
      teamMembers: []
    };

    const project = new Project(projectData);
    const savedProject = await project.save();
    res.status(201).json(savedProject);
  } catch (err) {
    console.error("EXACT ERROR IN CREATE PROJECT:", err);
    res.status(500).json({ message: err.message || 'Server error while creating project' });
  }
};

// Delete project
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const userId = req.user?._id || req.user?.id || req.user?.userId;
    const ownerId = project.createdBy || project.user;

    if (!ownerId || ownerId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this project' });
    }

    await project.deleteOne();
    res.json({ message: 'Project removed successfully' });
  } catch (err) {
    console.error("Error deleting project:", err);
    res.status(500).json({ message: 'Server error while deleting project' });
  }
};

// Add member to project by email
const addMember = async (req, res) => {
  try {
    const { email } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User with this email not found' });
    }

    if (project.teamMembers.includes(user._id)) {
      return res.status(400).json({ message: 'User is already a team member' });
    }

    project.teamMembers.push(user._id);
    await project.save();

    const updatedProject = await Project.findById(project._id).populate('teamMembers', 'email');
    res.json(updatedProject);
  } catch (err) {
    console.error("Error adding member:", err);
    res.status(500).json({ message: 'Server error while adding member' });
  }
};

// Remove member from project
const removeMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    project.teamMembers = project.teamMembers.filter(
      (id) => id.toString() !== memberId
    );
    await project.save();

    const updatedProject = await Project.findById(project._id).populate('teamMembers', 'email');
    res.json(updatedProject);
  } catch (err) {
    console.error("Error removing member:", err);
    res.status(500).json({ message: 'Server error while removing member' });
  }
};

module.exports = {
  getProjects,
  createProject,
  deleteProject,
  addMember,
  removeMember,
};