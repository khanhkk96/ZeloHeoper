function authenticate(req, res, next) {
    if (req.session.user === undefined) {
        req.session.returnTo = req.originalUrl;
        console.log('You need to sign in');
        return res.status(301).redirect('/user/login');
    }

    req.user = req.session.user;
    next();
}

module.exports = {
    authenticate,
};
