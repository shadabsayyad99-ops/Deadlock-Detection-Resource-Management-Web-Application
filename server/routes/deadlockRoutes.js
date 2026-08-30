const express = require('express');
const router = express.Router();
const { runDetection, runBankers, runCycleDetection, runRecovery } = require('../controllers/deadlockController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.post('/detect', runDetection);
router.post('/bankers', runBankers);
router.post('/cycles', runCycleDetection);
router.post('/recover', runRecovery);

module.exports = router;
