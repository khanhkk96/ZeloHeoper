const { default: mongoose } = require('mongoose');
const CronJob = require('cron').CronJob;
const Schedule = require('../models/schedule.collection');
const {
    ScheduleStatus,
    ActionType,
    ActionResult,
} = require('../common/constants');
const History = require('../models/history.collection');
const { loginAccount } = require('../utils/helper.utils');
const fs = require('fs');
const path = require('path');
const { default: puppeteer } = require('puppeteer');
const REGEX = require('../utils/regex.utils');

const runJob = async function () {
    try {
        const mongodb = await mongoose.connect(process.env.DB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
            useCreateIndex: true,
        });
        if (!mongodb) {
            signale.error(`Cannot connect to database`);
            return process.exit();
        }

        // run job every 5 minutes
        const cronJob = new CronJob({
            cronTime: '*/1 * * * *',
            // eslint-disable-next-line consistent-return
            onTick: async () => {
                console.log('Start scan a schedule to run....');
                const schedule = await Schedule.findOne({
                    time: { $lte: new Date() },
                    status: ScheduleStatus.PENDING,
                })
                    .populate('user')
                    .populate('account');

                console.log('Schedule info: ', schedule);
                if (schedule) {
                    let phoneList = [];
                    if (schedule.phone) {
                        phoneList.push(schedule.phone);
                    }

                    if (schedule.file) {
                        const data = fs.readFileSync(
                            path.resolve(__dirname, '..', schedule.file),
                            {
                                encoding: 'utf8',
                            },
                        );
                        phoneList = data.split('\r\n');
                    }

                    console.log(phoneList);
                    console.log(schedule.sentTo);
                    console.log(schedule.partVolume);
                    const handleList = phoneList.slice(
                        schedule.sentTo,
                        schedule.sentTo + schedule.partVolume,
                    );

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
                        await loginAccount(
                            page,
                            schedule.account.password,
                            schedule.account.cookies,
                        );

                        await page.waitForNavigation();

                        const currentUrl = page.url();
                        if (currentUrl == 'https://chat.zalo.me/') {
                            console.log('logged in...');
                        }
                    } catch (ex) {
                        console.log('Error login account: ', ex);
                        // return new AppRequestReturn(
                        //     400,
                        //     'Không thể đăng nhập vào tài khoản đã đăng ký.',
                        // );
                        console.log(
                            'Không thể đăng nhập vào tài khoản đã đăng ký.',
                        );
                        await browser.close();
                        process.exit();
                    }

                    const histories = [];
                    const user = schedule.user;
                    const account = schedule.account;
                    console.log('phone list: ', handleList);
                    for (let phone of handleList) {
                        const sendingHistory = new History({
                            user: user._id,
                            account: account._id,
                            actionType: ActionType.SENDING,
                            phone,
                            result: ActionResult.FAILURE,
                        });
                        if (!phone) {
                            continue;
                        }

                        console.log('phone: ', phone);
                        phone = phone.replace(/\s/g, '').replace(/^\+/, '');
                        console.log('phone 2: ', phone);
                        const validPhone = REGEX.PHONE.test(phone);
                        console.log('validation: ', validPhone);
                        if (!validPhone) {
                            sendingHistory.note = `Số điện thoại [${phone}] không hợp lệ.`;
                            histories.push(sendingHistory);
                            continue;
                        }

                        try {
                            //enable input phone
                            const enableInputPhone = await page.waitForSelector(
                                '#contact-search-input',
                            );
                            await enableInputPhone.click();

                            await page.waitForTimeout(500);

                            //input phone to search
                            await page.type('#contact-search-input', phone);

                            await page.waitForTimeout(1000);

                            //choose a friend to send message
                            const chooseFriend = await page.$(
                                '#searchResultList #searchResultList .ReactVirtualized__Grid__innerScrollContainer div:nth-child(2) .conv-item__avatar',
                            );
                            if (!chooseFriend) {
                                // return res.json({
                                //     message:
                                //         'Không tìm thấy tài khoản nhận tin nhắn',
                                //     code: 400,
                                // });
                                sendingHistory.note = `Không tìm thấy tài khoản [${phone}] nhận tin nhắn.`;
                                histories.push(sendingHistory);
                                continue;
                            }
                            await chooseFriend.click();

                            //waiting page load done
                            await page.waitForSelector('#richInput', {
                                timeout: 2000,
                            });

                            //input message
                            await page.type('#richInput', schedule.message);

                            //send message
                            const sendMessageBtn = await page.waitForSelector(
                                'div[data-translate-inner="STR_SEND"]',
                            );
                            await sendMessageBtn.click();

                            sendingHistory.result = ActionResult.SUCCESS;
                            histories.push(sendingHistory);
                            await page.waitForTimeout(500);
                        } catch (ex) {
                            console.log(
                                `Error sending ${user.name}[${user.phone}] -> ${phone}: `,
                                ex,
                            );
                            sendingHistory.note =
                                'Gửi tin nhắn không thành công.';
                            histories.push(sendingHistory);
                        }
                    }

                    await History.bulkSave(histories);
                    //close browser
                    await browser.close();

                    schedule.sentTo += handleList.length;
                    console.log('have sent: ', schedule.sentTo);
                    console.log('phoneList: ', phoneList.length);
                    if (schedule.sentTo == phoneList.length) {
                        schedule.status = ScheduleStatus.SENT;
                    }
                    await schedule.save();
                    console.log('***End schedule ', schedule._id);
                }
            },
        });

        cronJob.start();
        return true;
    } catch (ex) {
        console.log('Error: ', ex);
        process.exit();
    }
};

module.exports = runJob;
