const express = require('express');
const router = express.Router();
const { getAllUsers, deleteUser, getAllSimulationsAdmin } = require('../controllers/adminController');
const { auth, adminOnly } = require('../middleware/auth');

router.use(auth, adminOnly);

router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.get('/simulations', getAllSimulationsAdmin);

module.exports = router;
