const express = require('express');
const router = express.Router;
const userRouter = require('./user.router');
const zaccountRouter = require('./zlAccount.router');
const friendRouter = require('./friend.router');
const scheduleRouter = require('./schedule.router');
const historyRouter = require('./history.router');
const { authenticate } = require('../common/authentication');

const initRouter = (app) => {
    app.use('/user', userRouter);

    app.use('/zaccount', authenticate, zaccountRouter);

    app.use('/friend', authenticate, friendRouter);

    app.use('/schedule', authenticate, scheduleRouter);

    app.use('/history', authenticate, historyRouter);

    app.get('/', function (req, res) {
        res.redirect('/user/home');
    });

    app.all('*', (req, res) => {
        res.redirect('/user/login');
    });

    return app.use('/', router);
};

module.exports = initRouter;
