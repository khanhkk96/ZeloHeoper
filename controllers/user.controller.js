const userService = require('../services/user.service');
const accountService = require('../services/zl_account.service');

module.exports = {
    async login(req, res) {
        const loginResult = await userService.login(req.body);
        if (loginResult.statusCode == 200) {
            req.session.user = {
                name: loginResult.data.name,
                phone: loginResult.data.phone,
                email: loginResult.data.email,
                level: loginResult.data.level,
                userId: loginResult.data.id,
            };
        }
        const account = await accountService.getActiveAccount(
            loginResult.data.id,
        );
        if (account) {
            req.session.activeAccount = account;
        }

        return res.json(loginResult);
    },

    async register(req, res) {
        const registerResult = await userService.register(req.body);
        return res.json(registerResult);
    },

    async changePassword(req, res) {
        const registerResult = await userService.changePassword(req.body);
        return res.json(registerResult);
    },

    async block(req, res) {
        const blockResult = await userService.block(req.body);
        return res.json(blockResult);
    },

    loginView(req, res) {
        return res.render('auth/login');
    },

    home(req, res) {
        return res.render('home/index');
    },

    logout(req, res) {
        req.session.destroy(() => {
            res.redirect('/');
        });
    },
};
