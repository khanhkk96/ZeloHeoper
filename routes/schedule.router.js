const express = require('express');
const scheduleController = require('../controllers/schedule.controller');
const router = express.Router();
const asyncMiddleware = require('../middlewares/async.middleware');
const { authenticate } = require('../common/authentication');
const { uploadOnlyTxt } = require('../utils/multer.utils');

/*
@route   POST /schedule/create
@desc    invite
@access  Public
*/
router.post(
    '/create',
    authenticate,
    uploadOnlyTxt,
    asyncMiddleware(scheduleController.createSchedule),
);

module.exports = router;
