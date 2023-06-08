function authenticate(req, res, next) {
    console.log(req.session);
    if (req.session.user === undefined) {
        req.session.returnTo = req.originalUrl;
        console.log('You need to sign in');
        return res.status(301).redirect('/user/login');
    }
    next();
}

module.exports = {
    authenticate,
};
