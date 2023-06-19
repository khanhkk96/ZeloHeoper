const { default: mongoose } = require('mongoose');
const AppRequestReturn = require('../common/app-request-return');
const ZlAccount = require('../models/zl_account.collection');
const REGEX = require('../utils/regex.utils');
const jwt = require('jsonwebtoken');
const { loginAccount } = require('../utils/helper.utils');
const { Enviroment } = require('../common/constants');
const puppeteer = require('puppeteer');

module.exports = {
    add: async ({ phone, password, cookies }, { userId }) => {
        if (!userId || !phone || !password || !cookies) {
            return new AppRequestReturn(422, 'Vui lòng nhập đầy đủ thông tin.');
        }

        const validPhone = REGEX.PHONE.test(phone);
        if (!validPhone) {
            return new AppRequestReturn(422, 'Số điện thoại không hợp lệ.');
        }

        try {
            const cookieArray = JSON.parse(cookies);
            if (!Array.isArray(cookieArray)) {
                return new AppRequestReturn(422, 'Cookies không hợp lệ.');
            }

            const checkAccount = await ZlAccount.findOne({
                phone,
                isDeleted: false,
            });
            console.log(checkAccount);
            if (checkAccount) {
                return new AppRequestReturn(
                    422,
                    'Đã tồn tại tài khoản với số điện thoại này.',
                );
            }

            const validAccount = await checkZaccount(cookies, password);
            if (!validAccount) {
                return new AppRequestReturn(
                    422,
                    'Thông tin tài khoản không đúng. Vui lòng kiểm tra lại.',
                );
            }

            await ZlAccount.create({
                user: userId,
                phone,
                password: jwt.sign(password, process.env.SECRET_OR_KEY),
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

        const validPhone = REGEX.PHONE.test(phone);
        if (!validPhone) {
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
            const checkAccount = await ZlAccount.findOne({
                phone,
                _id: { $ne: mongoose.Types.ObjectId(id) },
                isDeleted: false,
            });
            if (checkAccount) {
                return new AppRequestReturn(
                    422,
                    'Đã tồn tại tài khoản với số điện thoại này.',
                );
            }

            zlAccount.phone = phone;
            if (password) {
                zlAccount.password = jwt.sign(
                    password,
                    process.env.SECRET_OR_KEY,
                );
            }
            if (cookies) {
                const cookieArray = JSON.parse(cookies);
                if (!Array.isArray(cookieArray)) {
                    return new AppRequestReturn(422, 'Cookies không hợp lệ.');
                }
                zlAccount.cookies = cookies;
            }

            const jwtData = jwt.verify(
                zlAccount.password,
                process.env.SECRET_OR_KEY,
            );
            const validAccount = await checkZaccount(
                zlAccount.cookies,
                jwtData,
            );
            if (!validAccount) {
                return new AppRequestReturn(
                    422,
                    'Thông tin tài khoản không đúng. Vui lòng kiểm tra lại.',
                );
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

            if (zlAccount.isUsing) {
                return new AppRequestReturn(
                    400,
                    'Tài khoản đang được sử dụng.',
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
            .select({ isActive: 1, phone: 1, createdAt: 1 })
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

        let activedAccount = null;
        try {
            const zlAccount = await ZlAccount.findOne({
                user: userId,
                isActive: true,
                isDeleted: false,
            });
            if (zlAccount) {
                if (zlAccount.id == id) {
                    return new AppRequestReturn(200, 'Tài khoản đã kích hoạt.');
                }
                zlAccount.isActive = false;
                await zlAccount.save();
            }

            activedAccount = await ZlAccount.findById(id);
            if (!activedAccount) {
                return new AppRequestReturn(
                    404,
                    'Không tìm thấy thông tin tài khoản.',
                );
            }

            activedAccount.isActive = true;
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
            isActive: true,
            isDeleted: false,
        });
    },
};

const checkZaccount = async (cookies, password) => {
    let browser;
    try {
        const config = {
            // headless: false,
            // defaultViewport: false,
            // executablePath:
            //     'C:/Program Files/Google/Chrome/Application/chrome.exe',
        };
        if (process.env.NODE_ENV === Enviroment.TEST) {
            console.log('server is launching chromium-browser');
            config.executablePath = await getLinuxChromePath();
            config.headless = true;
            config.args = ['--no-sandbox'];
        }
        browser = await puppeteer.launch(config);

        const page = (await browser.pages())[0];
        await loginAccount(page, password, cookies);

        await page.waitForNavigation();

        const currentUrl = page.url();
        if (currentUrl == 'https://chat.zalo.me/') {
            console.log('logged in...');
        }
        await browser.close();
    } catch (ex) {
        console.log('Error login account: ', ex);
        await browser.close();
        return false;
    }

    return true;
};
