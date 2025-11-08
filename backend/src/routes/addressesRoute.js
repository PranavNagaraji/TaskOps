const express = require('express');
const router = express.Router();
const { addAddress, getAddressesByUser } = require('../controllers/addressController');

router.post('/', addAddress);
router.get('/:userId', getAddressesByUser);

module.exports = router;
