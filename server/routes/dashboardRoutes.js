const express = require('express');
const router = express.Router();
const { getDashboardStats, getRecentActivity } = require('../controllers/dashboardController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/stats', getDashboardStats);
router.get('/activity', getRecentActivity);

module.exports = router;
