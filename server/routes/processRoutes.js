const express = require('express');
const router = express.Router();
const { getProcesses, createProcess, updateProcess, deleteProcess } = require('../controllers/processController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/', getProcesses);
router.post('/', createProcess);
router.put('/:id', updateProcess);
router.delete('/:id', deleteProcess);

module.exports = router;
