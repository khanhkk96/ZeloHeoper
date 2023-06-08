const zlAccountService = require('../services/zl_account.service');

module.exports = {
    //create new account
    create: async (req, res) => {
        res.json(await zlAccountService.add(req.body, req.user));
    },

    //update an account
    update: async (req, res) => {
        res.json(await zlAccountService.edit(req.params, req.body, req.user));
    },

    //delete an account
    delete: async (req, res) => {
        res.json(await zlAccountService.delete(req.params, req.user));
    },

    //list of accounts
    list: async (req, res) => {
        res.json(await zlAccountService.list(req.user, req.query));
    },

    //get the account detail
    get: async (req, res) => {
        res.json(await zlAccountService.get(req.params));
    },

    //select account to take action
    pick: async (req, res) => {
        res.json(await zlAccountService.choose(req.params, req.user));
    },
};
