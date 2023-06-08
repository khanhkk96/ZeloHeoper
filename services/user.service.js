const AppRequestReturn = require('../common/app-request-return');
const REGEX = require('../utils/regex.utils');
const User = require('../models/user.collection');

module.exports = {
    async login({ phone, password }) {
        if (!phone || !password) {
            return new AppRequestReturn(400, 'Vui lòng nhập đầy đủ thông tin.');
        }

        phone = phone.replace('+84', '').replace(/^[0|84]/, '');

        //not found user
        const user = await User.findOne({ phone, isBlocked: false });
        if (!user) {
            console.log('Không tìm thấy tài khoản ', phone);
            return new AppRequestReturn(
                401,
                'Tài khoản hoặc mật khẩu không chính xác.',
            );
        }

        //invalid password
        const isValidPw = await user.comparePassword(password);
        if (!isValidPw) {
            console.log('Mật khẩu không đúng - ', phone);
            return new AppRequestReturn(
                401,
                'Tài khoản hoặc mật khẩu không chính xác.',
            );
        }

        //login success
        return new AppRequestReturn(200, 'Đăng nhâp tài khoản thành công.', {
            id: user.id,
            name: user.name,
            phone: user.phone,
        });
    },

    async register({ phone, password, name, email }) {
        if (!phone || !password || !name) {
            return new AppRequestReturn(400, 'Vui lòng nhập đầy đủ thông tin.');
        }

        if (!REGEX.PHONE.test(phone)) {
            return new AppRequestReturn(422, 'Số điện thoại không hợp lệ.');
        }

        if (!REGEX.PASSSWORD.test(password)) {
            return new AppRequestReturn(422, 'Mật khẩu không hợp lệ.');
        }

        if (email && !REGEX.EMAIL.test(email)) {
            return new AppRequestReturn(422, 'Email không hợp lệ.');
        }

        const newUser = new User({
            phone: phone.replace('+84', '').replace(/^[0|84]/, ''),
            password,
            email,
            name,
        });

        try {
            await newUser.save();
        } catch (ex) {
            console.log(ex);
            return new AppRequestReturn(
                400,
                'Tạo tài khoản hệ thống mới không thành công.',
            );
        }

        return new AppRequestReturn(
            200,
            'Tạo tài khoản hệ thống mới thành công.',
        );
    },

    async changePassword({ phone, currentPassword, newPassword }) {
        if (!phone || !currentPassword || !newPassword) {
            return new AppRequestReturn(400, 'Vui lòng nhập đầy đủ thông tin.');
        }

        if (!REGEX.PASSSWORD.test(newPassword)) {
            return new AppRequestReturn(422, 'Mật khẩu không hợp lệ.');
        }

        phone = phone.replace('+84', '').replace(/^[0|84]/, '');

        //not found user
        const user = await User.findOne({ phone, isBlocked: false });
        if (!user) {
            console.log('Không tìm thấy tài khoản ', phone);
            return new AppRequestReturn(
                401,
                'Không tìm thấy thông tin tài khoản.',
            );
        }

        //invalid password
        const isValidPw = user.comparePassword(currentPassword);
        if (!isValidPw) {
            console.log('Mật khẩu không đúng - ', phone);
            return new AppRequestReturn(
                401,
                'Mật khẩu không chính xác. Thử lại nhiều lần sẽ bị khóa tài khoản.',
            );
        }

        user.password = newPassword;
        try {
            await user.save();
        } catch (ex) {
            console.log(ex);
            return new AppRequestReturn(400, 'Đổi mật khẩu không thành công.');
        }

        //change password successfully
        return new AppRequestReturn(200, 'Đổi mật khẩu thành công.');
    },

    async block({ phone }) {
        if (!phone) {
            return new AppRequestReturn(400, 'Vui lòng nhập đầy đủ thông tin.');
        }

        phone = phone.replace('+84', '').replace(/^[0|84]/, '');

        //not found user
        const user = await User.findOne({ phone, isBlocked: false });
        if (!user) {
            console.log('Không tìm thấy tài khoản ', phone);
            return new AppRequestReturn(
                401,
                'Không tìm thấy thông tin tài khoản.',
            );
        }

        user.isBlocked = true;
        try {
            await user.save();
        } catch (ex) {
            console.log(ex);
            return new AppRequestReturn(
                400,
                'Khóa tài khoản không thành công.',
            );
        }
        //change password successfully
        return new AppRequestReturn(200, 'Khóa tài khoản thành công.');
    },
};
