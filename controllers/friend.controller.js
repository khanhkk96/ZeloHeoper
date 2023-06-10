const friendService = require('../services/friend.service');
const fs = require('fs');

module.exports = {
    inviteAddingFriend: async (req, res) => {
        console.log('File: ', req.file);
        const result = await friendService.addFriend(
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
