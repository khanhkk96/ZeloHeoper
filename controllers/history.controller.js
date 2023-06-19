const historyService = require('../services/history.service');

module.exports = {
    list: async (req, res) => {
        res.json(await historyService.list(req.query, req.body, req.user));
    },
};
