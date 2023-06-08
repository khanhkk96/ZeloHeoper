const express = require('express');
const zaccountController = require('../controllers/zlAccount.controller');
const router = express.Router();
const asyncMiddleware = require('../middlewares/async.middleware');

/*
@route   POST /zaccount/create
@desc    create new account
@access  Public
*/
router.post('/create', asyncMiddleware(zaccountController.create));

/*
@route   PUT /zaccount/update/:id
@desc    update an account information
@access  Public
*/
router.put('/update/:id', asyncMiddleware(zaccountController.update));

/*
@route   DELETE /zaccount/delete/:id
@desc    change the password for an account
@access  Public
*/
router.delete('/delete/:id', asyncMiddleware(zaccountController.delete));

/*
@route   PATCH /zaccount/block/:id
@desc    pick an account to take action
@access  Public
*/
router.patch('/pick/:id', asyncMiddleware(zaccountController.pick));

/*
@route   GET /zaccount/list
@desc    logout your account
@access  Public
*/
router.get('/list', asyncMiddleware(zaccountController.list));

/*
@route   GET /zaccount/:id
@desc    view detail
@access  Public
*/
router.get('/:id', asyncMiddleware(zaccountController.get));

module.exports = router;
