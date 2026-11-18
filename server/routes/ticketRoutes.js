const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware'); // Apne auth middleware ka path dekh lena
const {
  createTicket,
  getTicketsByProject,
  updateTicket,
  deleteTicket,
  assignTicket
} = require('../controllers/ticketController');

router.use(authMiddleware);

router.post('/', createTicket);
router.get('/project/:projectId', getTicketsByProject);
router.put('/:id', updateTicket);
router.delete('/:id', deleteTicket);
router.patch('/:id/assign', assignTicket);

module.exports = router;