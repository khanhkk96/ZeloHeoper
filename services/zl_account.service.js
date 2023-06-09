const { default: mongoose } = require('mongoose');
const AppRequestReturn = require('../common/app-request-return');
const ZlAccount = require('../models/zl_account.collection');
const REGEX = require('../utils/regex.utils');

module.exports = {
    add: async ({ phone, password, cookies }, { userId }) => {
        if (!userId || !phone || !password || !cookies) {
            return new AppRequestReturn(422, 'Vui lòng nhập đầy đủ thông tin.');
        }

        if (!REGEX.PHONE.test(phone)) {
            return new AppRequestReturn(422, 'Số điện thoại không hợp lệ.');
        }

        try {
            const cookieArray = JSON.parse(cookies);
            if (!Array.isArray(cookieArray)) {
                return new AppRequestReturn(422, 'Cookies không hợp lệ.');
            }

            await ZlAccount.create({
                user: userId,
                phone,
                password,
                cookies,
            });
        } catch (ex) {
            console.log(ex);
            return new AppRequestReturn(
                400,
                'Thêm tài khoản không thành công.',
            );
        }

        return new AppRequestReturn(200, 'Thêm tài khoản thành công.');
    },

    edit: async ({ id }, { phone, password, cookies }, { userId }) => {
        if (!id || !userId || !phone) {
            return new AppRequestReturn(422, 'Vui lòng nhập đầy đủ thông tin.');
        }

        if (!REGEX.PHONE.test(phone)) {
            return new AppRequestReturn(422, 'Số điện thoại không hợp lệ.');
        }

        try {
            const zlAccount = await ZlAccount.findById(id);
            if (!zlAccount) {
                return new AppRequestReturn(
                    404,
                    'Không tìm thấy thông tin tài khoản.',
                );
            }

            zlAccount.phone = phone;
            if (password) {
                zlAccount.password = password;
            }
            if (cookies) {
                const cookieArray = JSON.parse(cookies);
                if (!Array.isArray(cookieArray)) {
                    return new AppRequestReturn(422, 'Cookies không hợp lệ.');
                }
                zlAccount.cookies = cookies;
            }
            await zlAccount.save();
        } catch (ex) {
            console.log(ex);
            return new AppRequestReturn(
                400,
                'Cập nhật tài khoản không thành công.',
            );
        }

        return new AppRequestReturn(200, 'Cập nhật tài khoản thành công.');
    },

    delete: async ({ id }, { userId }) => {
        if (!id) {
            return new AppRequestReturn(422, 'Vui lòng nhập đầy đủ thông tin.');
        }

        try {
            const zlAccount = await ZlAccount.findById(id);
            if (!zlAccount) {
                return new AppRequestReturn(
                    404,
                    'Không tìm thấy thông tin tài khoản.',
                );
            }

            await ZlAccount.softDelete(mongoose.Types.ObjectId(id));
        } catch (ex) {
            console.log(ex);
            return new AppRequestReturn(400, 'Xóa tài khoản không thành công.');
        }

        return new AppRequestReturn(200, 'Xóa tài khoản thành công.');
    },

    list: async ({ userId }, { key, page = 1, size = 20 }) => {
        const condition = { user: userId };
        if (key) {
            condition['phone'] = { $regex: new RegExp(key, 'i') };
        }

        const zlAccounts = await ZlAccount.find(condition)
            .select({ inUse: 1, phone: 1, createdAt: 1 })
            .sort({ createdAt: -1 })
            .skip((page - 1) * size)
            .limit(size);

        return new AppRequestReturn(
            200,
            'Lấy danh sách tài khoản thành công.',
            zlAccounts,
        );
    },

    get: async ({ id }) => {
        const zlAccount = await ZlAccount.findById(id).select({ phone: 1 });

        return new AppRequestReturn(
            200,
            'Lấy thông tin tài khoản thành công.',
            zlAccount,
        );
    },

    choose: async ({ id }, { userId }) => {
        if (!id || !userId) {
            return new AppRequestReturn(422, 'Vui lòng nhập đầy đủ thông tin.');
        }

        try {
            const zlAccount = await ZlAccount.findOne({
                user: userId,
                inUse: true,
            });
            if (zlAccount) {
                if (zlAccount.id == id) {
                    return new AppRequestReturn(200, 'Tài khoản đã kích hoạt.');
                }
                zlAccount.inUse = false;
                await zlAccount.save();
            }

            const activedAccount = await ZlAccount.findById(id);
            if (!activedAccount) {
                return new AppRequestReturn(
                    404,
                    'Không tìm thấy thông tin tài khoản.',
                );
            }

            activedAccount.inUse = true;
            await activedAccount.save();
        } catch (ex) {
            console.log(ex);
            return new AppRequestReturn(
                400,
                'Kích hoạt tài khoản không thành công.',
            );
        }

        return new AppRequestReturn(
            200,
            'Kích hoạt tài khoản thành công.',
            activedAccount,
        );
    },

    getActiveAccount: async (userId) => {
        return await ZlAccount.findOne({
            user: userId,
            inUse: true,
        });
    },
};
