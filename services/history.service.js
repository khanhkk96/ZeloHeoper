const AppRequestReturn = require('../common/app-request-return');
const { ActionType } = require('../common/constants');
const History = require('../models/history.collection');

module.exports = {
    list: async (
        { page = 1, size = 10 },
        { search, message, status, from, to, account, action },
        { userId },
    ) => {
        if (!action) {
            return new AppRequestReturn(
                422,
                'Chưa chọn loại hoạt động thực hiện.',
            );
        }

        if (action != ActionType.INVITATION && action != ActionType.SENDING) {
            return new AppRequestReturn(422, 'Loại hoạt động không hợp lệ.');
        }

        const condition = { user: userId, actionType: action };
        if (search) {
            condition['phone'] = { $regex: new RegExp(search, 'i') };
        }

        if (from) {
            condition['createdAt'] = { $gte: new Date(from) };
        }

        if (to) {
            condition['createdAt'] = { $lte: new Date(to) };
        }

        if (account) {
            condition['account'] = account;
        }

        if (message) {
            condition['message'] = { $regex: new RegExp(message, 'i') };
        }

        if (status) {
            condition['result'] = status;
        }

        const histories = await History.find(condition)
            .populate('account')
            .sort({ createdAt: -1 })
            .skip((page - 1) * size)
            .limit(size);

        const total = await History.countDocuments(condition);

        return new AppRequestReturn(
            200,
            'Lấy danh sách tài khoản thành công.',
            histories,
            total,
        );
    },
};
