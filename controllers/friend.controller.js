const friendService = require('../services/friend.service');

module.exports = {
    inviteAddmingFriend: async (req, res) => {
        console.log('File: ', req.file);
        res.json(
            await friendService.addFriend(
                req.file,
                req.body,
                req.user,
                req.activeAccount,
            ),
        );
    },
};
