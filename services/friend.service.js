const AppRequestReturn = require('../common/app-request-return');
const fs = require('fs');
const { loginAccount } = require('../utils/helper.utils');
const { ActionType, ActionResult } = require('../common/constants');
const History = require('../models/history.collection');
const { default: puppeteer } = require('puppeteer');
const REGEX = require('../utils/regex.utils');

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
            return new AppRequestReturn(422, 'Nhập danh sách số điện thoại.');
        }

        if (phoneList.length > 50) {
            return new AppRequestReturn(
                422,
                'Số lượng người muốn kết bạn vượt quá số lượng cho phép.',
            );
        }

        let browser;
        let page;
        try {
            browser = await puppeteer.launch({
                // headless: false,
                // defaultViewport: false,
                // executablePath:
                //     'C:/Program Files/Google/Chrome/Application/chrome.exe',
            });

            page = (await browser.pages())[0];
            await loginAccount(page, account.password, account.cookies);

            await page.waitForNavigation();

            const currentUrl = page.url();
            if (currentUrl == 'https://chat.zalo.me/') {
                console.log('logged in...');
            }
        } catch (ex) {
            console.log('Error login account: ', ex);
            return new AppRequestReturn(
                400,
                'Không thể đăng nhập vào tài khoản đã đăng ký.',
            );
        }

        const histories = [];
        for (let phoneNo of phoneList) {
            await page.reload();
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
                    invitationHistory.note = `Đã gửi lời kết bạn - [${phoneNo}].`;
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
                await page.waitForTimeout(500);
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
        console.log('***Ending invite friends');

        return new AppRequestReturn(
            200,
            'Đã hoàn thành việc gửi lời mời kết bạn.',
        );
    },

    listNotAccept: () => {},
};
