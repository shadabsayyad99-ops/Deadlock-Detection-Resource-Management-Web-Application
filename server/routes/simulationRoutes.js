const express = require('express');
const router = express.Router();
const { getSimulations, getSimulationById, createSimulation, deleteSimulation } = require('../controllers/simulationController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/', getSimulations);
router.get('/:id', getSimulationById);
router.post('/', createSimulation);
router.delete('/:id', deleteSimulation);

module.exports = router;
