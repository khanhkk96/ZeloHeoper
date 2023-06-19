const AppRequestReturn = require('../common/app-request-return');
const fs = require('fs');
const { loginAccount, getLinuxChromePath } = require('../utils/helper.utils');
const { ActionType, ActionResult, Enviroment } = require('../common/constants');
const History = require('../models/history.collection');
const ZAccount = require('../models/zl_account.collection');
const { default: puppeteer } = require('puppeteer');
const REGEX = require('../utils/regex.utils');
const jwt = require('jsonwebtoken');

module.exports = {
    addFriend: async (file, { phone }, user, account) => {
        if (!file && !phone) {
            return new AppRequestReturn(422, 'Vui lòng nhập thông tin.');
        }

        if (!account) {
            return new AppRequestReturn(
                422,
                'Chưa chọn tài khoản thực hiện hành động.',
            );
        }

        console.log(account._id);
        const zaccount = await ZAccount.findById(account._id);
        console.log(zaccount);
        if (!zaccount || zaccount.isUsing) {
            return new AppRequestReturn(
                422,
                'Tài khoản thực hiện thao tác đang được dụng.',
            );
        }
        //lock zaccount
        zaccount.isUsing = true;
        await zaccount.save();

        let phoneList = [];
        if (phone) {
            phoneList.push(phone);
        }

        if (file) {
            const data = fs.readFileSync(file.path, { encoding: 'utf8' });
            phoneList = data.split('\r\n');
        }

        console.log('phone list: ', phoneList);
        if (!phoneList.length) {
            //open zaccount
            zaccount.isUsing = false;
            await zaccount.save();
            return new AppRequestReturn(422, 'Nhập danh sách số điện thoại.');
        }

        if (phoneList.length > 50) {
            //open zaccount
            zaccount.isUsing = false;
            await zaccount.save();
            return new AppRequestReturn(
                422,
                'Số lượng người muốn kết bạn vượt quá số lượng cho phép.',
            );
        }

        let browser;
        let page;
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

            page = (await browser.pages())[0];
            const jwtData = jwt.verify(
                account.password,
                process.env.SECRET_OR_KEY,
            );
            await loginAccount(page, jwtData, account.cookies);

            await page.waitForNavigation();

            const currentUrl = page.url();
            if (currentUrl == 'https://chat.zalo.me/') {
                console.log('logged in...');
            }
        } catch (ex) {
            console.log('Error login account: ', ex);
            //open account
            zaccount.isUsing = false;
            await zaccount.save();
            return new AppRequestReturn(
                400,
                'Không thể đăng nhập vào tài khoản đã đăng ký.',
            );
        }

        const histories = [];
        for (let phoneNo of phoneList) {
            const invitationHistory = new History({
                user: user.userId,
                account: account._id,
                actionType: ActionType.INVITATION,
                phone: phoneNo,
                result: ActionResult.FAILURE,
            });
            if (!phoneNo) {
                continue;
            }

            console.log('Input phone', phoneNo);
            phoneNo = phoneNo.replace(/\s/g, '').replace(/^\+/, '');
            console.log('Search phone', phoneNo);
            const validPhone = REGEX.PHONE.test(phoneNo);
            if (!validPhone) {
                invitationHistory.note = `Số điện thoại [${phoneNo}] không hợp lệ.`;
                histories.push(invitationHistory);
                continue;
            }

            try {
                await page.reload({ waitUntil: 'domcontentloaded' });
                //open search friend popup
                const openAddFrModal = await page.waitForSelector(
                    'div[data-id="btn_Main_AddFrd"]',
                );
                await openAddFrModal.click();

                await page.waitForTimeout(500);

                //input phone number
                await page.type('.phone-i-input', phoneNo);

                //click seach button
                const searchFrBtn = await page.waitForSelector(
                    'div[data-translate-inner="STR_SEARCH"]',
                );
                await searchFrBtn.click({});

                await page.waitForTimeout(1000);

                // await page.waitForSelector(
                //     'div[data-id="btn_UserProfile_SendMsg"]',
                //     { visible: true, timeout: 1000 },
                // );

                const sendMsgBtn = await page.$(
                    'div[data-id="btn_UserProfile_SendMsg"]',
                );
                if (!sendMsgBtn) {
                    invitationHistory.note = `Tài khoản [${phoneNo}] không tồn tại.`;
                    histories.push(invitationHistory);
                    continue;
                }

                const cancelFrBtn = await page.$(
                    'div[data-id="btn_UserProfile_CXLFrdReq"]',
                );
                if (cancelFrBtn) {
                    invitationHistory.note = `Đã gửi lời kết bạn - [${phoneNo}] trước đó.`;
                    histories.push(invitationHistory);
                    continue;
                }

                //confirm specified friend
                const confirmFrBtn = await page.$(
                    'div[data-id="btn_UserProfile_AddFrd"]',
                );
                if (!confirmFrBtn) {
                    invitationHistory.note = `Số điện thoại [${phoneNo}] đã có trong danh sách bạn bè.`;
                    histories.push(invitationHistory);
                    continue;
                }
                await confirmFrBtn.click();

                //send an invite
                const addFrBtn = await page.waitForSelector(
                    'div[data-id="btn_AddFrd_Add"]',
                );
                await addFrBtn.click();

                invitationHistory.result = ActionResult.SUCCESS;
                histories.push(invitationHistory);
            } catch (ex) {
                console.log(
                    `Error invitation ${user.name}[${user.phone}] -> ${phoneNo}: `,
                    ex,
                );
                invitationHistory.note =
                    'Gửi lời mời kết bạn không thành công.';
                histories.push(invitationHistory);
            }
        }
        await History.bulkSave(histories);
        //close browser
        await browser.close();
        //open zaccount
        zaccount.isUsing = false;
        await zaccount.save();
        console.log('***Ending invite friends');

        return new AppRequestReturn(
            200,
            'Đã hoàn thành việc gửi lời mời kết bạn.',
        );
    },

    listNotAccept: () => {},
};
