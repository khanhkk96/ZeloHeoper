const scheduleService = require('../services/schedule.service');
const fs = require('fs');

module.exports = {
    createSchedule: async (req, res) => {
        const result = await scheduleService.createSchedule(
            req.file,
            req.body,
            req.user,
            req.activeAccount,
        );
        if (req.file && result.statusCode != 200) {
            fs.unlinkSync(req.file.path);
        }
        res.json(result);
    },
};
