const express = require('express')
const { miningSessionController } = require('../controllers/miningControllers')

const router = express.Router()

//routes
router.post('/mining/start',miningSessionController);

module.exports = router;
