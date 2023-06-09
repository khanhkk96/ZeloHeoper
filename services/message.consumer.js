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
            cronTime: '*/3 * * * *',
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
                        const data = fs.readFileSync(schedule.file.path, {
                            encoding: 'utf8',
                        });
                        phoneList = data.split('\r\n');
                    }

                    const handleList = phoneList.splice(
                        schedule.sentTo - 1,
                        schedule.partVolume,
                    );

                    let browser;
                    try {
                        browser = await puppeteer.launch({
                            headless: false,
                            defaultViewport: false,
                            executablePath:
                                'C:/Program Files/Google/Chrome/Application/chrome.exe',
                        });

                        const page = (await browser.pages())[0];
                        await loginAccount(page, schedule.account.cookies);
                    } catch (ex) {
                        console.log('Error login account: ', ex);
                        return new AppRequestReturn(
                            400,
                            'Không thể đăng nhập vào tài khoản đã đăng ký.',
                        );
                    }

                    const histories = [];
                    const user = schedule.user;
                    const account = schedule.account;
                    for (let phone of handleList) {
                        const sendingHistory = {
                            user: user.id,
                            account: account.id,
                            actionType: ActionType.SENDING,
                            phone,
                            result: ActionResult.FAILURE,
                        };
                        if (!phone) {
                            continue;
                        }

                        phone = phone.replace(/\s/g, '').replace(/^\+/, '');
                        if (!PHONE_REGEX.test(phone)) {
                            sendingHistory.note = `Số điện thoại [${phone}] không hợp lệ.`;
                            histories.push(invitationHistory);
                            continue;
                        }

                        try {
                            await page.waitForNavigation();

                            const currentUrl = page.url();
                            if (currentUrl == 'https://chat.zalo.me/') {
                                console.log('logged in...');
                            }

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
                                invitationHistory.note = `Không tìm thấy tài khoản [${phone}] nhận tin nhắn.`;
                                histories.push(invitationHistory);
                                continue;
                            }
                            await chooseFriend.click();

                            //waiting page load done
                            await page.waitForSelector('#richInput', {
                                timeout: 2000,
                            });

                            //input message
                            await page.type('#richInput', message);

                            //send message
                            const sendMessageBtn = await page.waitForSelector(
                                'div[data-translate-inner="STR_SEND"]',
                            );
                            await sendMessageBtn.click();

                            invitationHistory.result = ActionResult.SUCCESS;
                            histories.push(invitationHistory);
                        } catch (ex) {
                            console.log(
                                `Error sending ${user.name}[${user.phone}] -> ${phone}: `,
                                ex,
                            );
                            invitationHistory.note =
                                'Gửi tin nhắn không thành công.';
                            invitationHistory.note =
                                histories.push(invitationHistory);
                        }
                    }

                    await History.bulkSave(histories);
                    //close browser
                    await browser.close();
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
