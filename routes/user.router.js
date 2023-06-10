const express = require('express');
const userController = require('../controllers/user.controller');
const router = express.Router();
const asyncMiddleware = require('../middlewares/async.middleware');
const { authenticate } = require('../common/authentication');

/*
@route   POST /user/login
@desc    login your account
@access  Public
*/
router.post('/login', asyncMiddleware(userController.login));

/*
@route   POST /user/register
@desc    register new account
@access  Public
*/
router.post('/register', asyncMiddleware(userController.register));

/*
@route   POST /user/change-password
@desc    change the password for an account
@access  Public
*/
router.post(
    '/change-password',
    authenticate,
    asyncMiddleware(userController.changePassword),
);

/*
@route   PATCH /user/block
@desc    block your account
@access  Public
*/
router.patch('/block', authenticate, asyncMiddleware(userController.block));

/*
@route   GET /user/block
@desc    block your account
@access  Public
*/
router.get('/login', asyncMiddleware(userController.loginView));

/*
@route   GET /user/home
@desc    block your account
@access  Public
*/
router.get('/home', authenticate, asyncMiddleware(userController.home));

/*
@route   GET /user/logout
@desc    logout your account
@access  Public
*/
router.get('/logout', authenticate, asyncMiddleware(userController.logout));

module.exports = router;
