const express = require('express');
const friendController = require('../controllers/friend.controller');
const router = express.Router();
const asyncMiddleware = require('../middlewares/async.middleware');
const { authenticate } = require('../common/authentication');
const { uploadOnlyTxt } = require('../utils/multer.utils');

/*
@route   POST /friend/invite
@desc    invite
@access  Public
*/
router.post(
    '/invite',
    authenticate,
    uploadOnlyTxt,
    asyncMiddleware(friendController.inviteAddingFriend),
);

module.exports = router;
