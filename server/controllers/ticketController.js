const Ticket = require('../models/Ticket'); // ya Bug model jo bhi import ho raha ho

// Create Ticket / Bug
const createTicket = async (req, res) => {
  try {
    const { title, description, priority, status, assignee, projectId } = req.body;
    const newTicket = new Ticket({
      title,
      description,
      priority: priority || 'Medium',
      status: status || 'Open',
      assignee: assignee || null,
      projectId
    });
    const savedTicket = await newTicket.save();
    res.status(201).json(savedTicket);
  } catch (err) {
    res.status(500).json({ message: 'Server error while creating ticket' });
  }
};

// Assign Ticket to a User
const assignTicket = async (req, res) => {
  try {
    const { assigneeId } = req.body;
    const updatedTicket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { assignee: assigneeId || null },
      { new: true }
    ).populate('assignee', 'email');
    
    if (!updatedTicket) return res.status(404).json({ message: 'Ticket not found' });
    res.json(updatedTicket);
  } catch (err) {
    res.status(500).json({ message: 'Server error while assigning ticket' });
  }
};

// Baaki functions (jaise getTicketsByProject, updateTicket, deleteTicket) bhi isi file mein rakh lena