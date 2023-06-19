const express = require('express');
const historyController = require('../controllers/history.controller');
const router = express.Router();
const asyncMiddleware = require('../middlewares/async.middleware');

/*
@route   POST /history/list
@desc    invite
@access  Public
*/
router.post('/list', asyncMiddleware(historyController.list));

module.exports = router;
