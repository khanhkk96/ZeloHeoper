const scheduleService = require('../services/schedule.service');

module.exports = {
    createSchedule: async (req, res) => {
        res.json(
            await scheduleService.createSchedule(
                req.file,
                req.body,
                req.user,
                req.activeAccount,
            ),
        );
    },
};
