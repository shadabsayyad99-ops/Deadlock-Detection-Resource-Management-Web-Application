const express = require('express');
const router = express.Router();
const { getResources, createResource, updateResource, deleteResource } = require('../controllers/resourceController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/', getResources);
router.post('/', createResource);
router.put('/:id', updateResource);
router.delete('/:id', deleteResource);

module.exports = router;
