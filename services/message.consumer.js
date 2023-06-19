const { default: mongoose } = require('mongoose');
const CronJob = require('cron').CronJob;
const Schedule = require('../models/schedule.collection');
const {
    ScheduleStatus,
    ActionType,
    ActionResult,
    Enviroment,
} = require('../common/constants');
const History = require('../models/history.collection');
const ZAccount = require('../models/zl_account.collection');
const { loginAccount, getLinuxChromePath } = require('../utils/helper.utils');
const fs = require('fs');
const path = require('path');
const { default: puppeteer } = require('puppeteer');
const REGEX = require('../utils/regex.utils');
const jwt = require('jsonwebtoken');

const runJob = async function () {
    let browser;
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
            cronTime: '*/3 * * * *',
            // eslint-disable-next-line consistent-return
            onTick: async () => {
                console.log('Start scan a schedule to run....');
                console.log('Start job: ', new Date());
                const schedules = await Schedule.find({
                    time: { $lte: new Date() },
                    status: ScheduleStatus.PENDING,
                })
                    .populate('user')
                    .populate('account')
                    .sort({ sentTo: 1 })
                    .limit(3);

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

                for (const schedule of schedules) {
                    console.log('Start send by a schedule: ', new Date());
                    console.log('Schedule info: ', schedule);
                    if (schedule.account.isUsing) {
                        console.log(
                            'Tài khoản thực hiện thao tác đang được sử dụng.',
                        );
                        continue;
                    }
                    const zaccount = await ZAccount.findOne(
                        schedule.account._id,
                    );
                    //lock zaccount
                    zaccount.isUsing = true;
                    await zaccount.save();
                    //lock schedule
                    schedule.isProcessing = true;
                    await schedule.save();

                    let phoneList = [];
                    if (schedule.phoneNumber) {
                        phoneList.push(schedule.phoneNumber);
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

                    if (!phoneList.length) {
                        console.log('Danh sách số điện thoại trống.');
                        //open zaccount
                        zaccount.isUsing = false;
                        await zaccount.save();
                        //open schedule
                        schedule.isProcessing = false;
                        await schedule.save();

                        continue;
                    }

                    const handleList = phoneList.slice(
                        schedule.sentTo,
                        schedule.sentTo + schedule.partVolume,
                    );
                    console.log(handleList);

                    let page;
                    try {
                        page = await browser.newPage();
                        const jwtData = jwt.verify(
                            schedule.account.password,
                            process.env.SECRET_OR_KEY,
                        );
                        await loginAccount(
                            page,
                            jwtData,
                            schedule.account.cookies,
                        );

                        await page.waitForNavigation();

                        const currentUrl = page.url();
                        if (currentUrl == 'https://chat.zalo.me/') {
                            console.log('logged in...');
                        }
                    } catch (ex) {
                        console.log('Error login account: ', ex);
                        console.log(
                            'Không thể đăng nhập vào tài khoản đã đăng ký.',
                        );
                        //open zaccount
                        zaccount.isUsing = false;
                        await zaccount.save();
                        //open schedule
                        schedule.isProcessing = false;
                        await schedule.save();

                        await page.close();
                        continue;
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
                            message: schedule.message,
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
                            await page.reload({
                                waitUntil: 'domcontentloaded',
                            });
                            //enable input phone
                            const enableInputPhone = await page.waitForSelector(
                                '#contact-search-input',
                            );
                            await enableInputPhone.click();

                            await page.waitForTimeout(500);

                            //input phone to search
                            await page.type('#contact-search-input', phone);

                            await page.waitForTimeout(1000);

                            // await page.waitForSelector(
                            //     '#searchResultList #searchResultList .ReactVirtualized__Grid__innerScrollContainer',
                            //     { visible: true, timeout: 1000 },
                            // );

                            //choose a friend to send message
                            const chooseFriend = await page.$(
                                '#searchResultList #searchResultList .ReactVirtualized__Grid__innerScrollContainer div:nth-child(2) .conv-item__avatar',
                            );
                            if (!chooseFriend) {
                                sendingHistory.note = `Không tìm thấy tài khoản [${phone}] nhận tin nhắn.`;
                                histories.push(sendingHistory);
                                continue;
                            }
                            await chooseFriend.click();

                            //waiting page load done
                            await page.waitForSelector('#richInput', {
                                timeout: 3000,
                                visible: true,
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

                    schedule.sentTo += handleList.length;
                    if (schedule.sentTo == phoneList.length) {
                        schedule.status = ScheduleStatus.SENT;
                    }
                    //open schedule
                    schedule.isProcessing = false;
                    await schedule.save();

                    //open zaccount
                    zaccount.isUsing = false;
                    await zaccount.save();
                    await page.close();

                    console.log('***End schedule ', schedule._id);
                    console.log('Finish the schedule: ', new Date());
                }

                console.log('End job: ', new Date());
                await browser.close();
            },
        });

        cronJob.start();
        return true;
    } catch (ex) {
        console.log('Error: ', ex);
        if (browser) {
            await browser.close();
        }
        process.exit();
    }
};

module.exports = runJob;
