const express = require('express');
const scheduleController = require('../controllers/schedule.controller');
const router = express.Router();
const asyncMiddleware = require('../middlewares/async.middleware');
const { uploadOnlyTxt } = require('../utils/multer.utils');

/*
@route   POST /schedule/create
@desc    invite
@access  Public
*/
router.post(
    '/create',
    uploadOnlyTxt,
    asyncMiddleware(scheduleController.createSchedule),
);

/*
@route   GET /schedule/list
@desc    logout your account
@access  Public
*/
router.get('/list', asyncMiddleware(scheduleController.list));

/*
@route   DELETE /schedule/delete/:id
@desc    change the password for an account
@access  Public
*/
router.delete('/delete/:id', asyncMiddleware(scheduleController.delete));

module.exports = router;
