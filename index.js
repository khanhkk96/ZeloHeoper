const puppeteer = require('puppeteer');
const express = require('express');
const path = require('path');
const morgan = require('morgan');
const fs = require('fs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const initRouter = require('./routes');
const session = require('express-session');
// const http = require('http');
// const signale = require('signale');

var app = express();

//load enviroment variables
const result = dotenv.config();
if (result.error) {
    throw result.error;
}
console.log(process.env.DB_URI);

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set('trust proxy', 1); // trust first proxy
app.use(
    session({
        secret: 'zakakaza',
        resave: false,
        saveUninitialized: true,
        // cookie: { secure: true },
    }),
);

app.use(morgan('combined'));

//connect MongoDB
mongoose.connect(
    process.env.DB_URI,
    {
        // useNewUrlParser: true,
        // useUnifiedTopology: true,
        autoCreate: true,
    },
    function (err) {
        if (err) {
            console.log(`Mongo connected error ${err}`);
        } else {
            console.log('Mongo connected');
        }
    },
);

//init router
initRouter(app);

app.listen(process.env.PORT);
console.log(`Server is running in port ${process.env.PORT}....`);

// const server = http.createServer(app);
// //start server
// server.listen(process.env.PORT || 3030, () => {
//     signale.success(`Listening port ${process.env.PORT || 3030}`);
// });

const getCookies = (cookieString) => {
    let cookies = [];
    if (cookieString) {
        cookieString = cookieString.split('|')[0];
        cookies = JSON.parse(cookieString);
    }
    return cookies;
};

let AVAILABLE_COOKIES = [];
const loginAccount = async (page) => {
    if (!AVAILABLE_COOKIES.length) {
        const cookiesData = fs.readFileSync('cookies.json');
        AVAILABLE_COOKIES = getCookies(cookiesData.toString());
    }

    if (!AVAILABLE_COOKIES.length) {
        throw new Error('Invalid cookies');
    }

    await page.goto(
        'https://id.zalo.me/account?continue=https://chat.zalo.me/',
        {
            waitUntil: 'domcontentloaded',
            referer: 'https://chat.zalo.me/',
            referrerPolicy: 'strict-origin-when-cross-origin',
        },
    );

    await page.setCookie(...AVAILABLE_COOKIES);
    await page.reload();

    //choose manual login option
    const chooseManual = await page.waitForSelector(
        'div.tabs ul li:nth-child(2) a',
    );
    if (!chooseManual) {
        throw new Error('Not found login option');
    }
    await chooseManual.click();

    //input phone
    //await page.type('#input-phone', '0354908152', { delay: 200 });

    //input password
    await page.type(
        '.form-signin .line-form input[type="password"]',
        'Kaymouse.28',
        //{ delay: 200 },
    );

    //login into account
    const loginBtn = await page.waitForSelector(
        '.form-signin .has-2btn a.first',
    );
    if (!loginBtn) {
        throw new Error('Cannot login into your account');
    }
    await loginBtn.click();
};

app.post('/add-cookies', async function (req, res) {
    const { cookies } = req.body;
    if (cookies) {
        const checkLineChar = cookies.indexOf('|');
        let cookiesData = cookies;
        if (checkLineChar >= 0) {
            cookiesData = cookies.split('|')[0];
        }
        try {
            const cookieList = JSON.parse(cookiesData);
            console.log(cookieList);
            if (!Array.isArray(cookieList)) {
                throw new Error('Cookies không hợp lệ');
            }
        } catch (ex) {
            return res.json({
                message: 'Cookies không hợp lệ.',
                code: 400,
            });
        }
        fs.writeFileSync('cookies.json', cookiesData);
        return res.json({
            message: 'Lưu cookie thành công',
            code: 200,
        });
    }
    return res.json({
        message: 'Cookies không hợp lệ.',
        code: 400,
    });
});

app.get('/login', async function (req, res) {
    let browser;
    try {
        browser = await puppeteer.launch({
            //headless: false,
            defaultViewport: false,
            executablePath:
                'C:/Program Files/Google/Chrome/Application/chrome.exe',
        });

        const page = (await browser.pages())[0];

        await loginAccount(page);
    } catch (ex) {
        console.log('Error: ', ex);
        return res.json({
            message: 'Error',
            code: 400,
        });
    }

    return res.json({
        message: 'Đăng nhập thành công',
        code: 200,
    });
});

app.post('/send', async (req, res) => {
    console.log('start time: ', new Date());
    let { phone, message } = req.body;
    console.log('phone: ', phone);
    console.log('message: ', message);

    if (!phone) {
        return res.json({
            message: 'Chưa nhập số điện thoại',
            code: 400,
        });
    }

    if (!message) {
        return res.json({
            message: 'Chưa nhập nội dung tin nhắn',
            code: 400,
        });
    }

    phone = phone.replace(/\s/g, '').replace(/^\+/, '');
    // if (!PHONE_REGEX.test(phone)) {
    //     return res.json({
    //         message: 'Số điện thoại không hợp lệ',
    //         code: 400,
    //     });
    // }

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: false,
            defaultViewport: false,
            executablePath:
                'C:/Program Files/Google/Chrome/Application/chrome.exe',
        });

        const page = (await browser.pages())[0];
        await loginAccount(page);

        await page.waitForNavigation();
        console.log('logged in...');

        //enable input phone
        const enableInputPhone = await page.waitForSelector(
            '#contact-search-input',
        );
        await enableInputPhone.click();

        //input phone to search
        await page.type(
            '#contact-search-input',
            phone,
            //{ delay: 300 }
        );

        await page.waitForTimeout(1000);

        //choose a friend to send message
        const chooseFriend = await page.$(
            '#searchResultList #searchResultList .ReactVirtualized__Grid__innerScrollContainer div:nth-child(2) .conv-item__avatar',
        );
        if (!chooseFriend) {
            return res.json({
                message: 'Không tìm thấy tài khoản nhận tin nhắn',
                code: 400,
            });
        }
        await chooseFriend.click();

        //waiting page load done
        await page.waitForSelector('#richInput', { timeout: 2000 });

        //input message
        await page.type(
            '#richInput',
            message,
            //{ delay: 200 }
        );

        //send message
        const sendMessageBtn = await page.waitForSelector(
            'div[data-translate-inner="STR_SEND"]',
        );
        await sendMessageBtn.click();
    } catch (ex) {
        console.log('Error: ', ex);
        return res.json({
            message: 'Lỗi gửi tin nhắn',
            code: 400,
        });
    } finally {
        await browser.close();
    }

    console.log('end time: ', new Date());

    return res.json({
        message: 'Gửi tin nhắn thành công',
        code: 200,
    });
});

app.post('/add-friend', async (req, res) => {
    console.log('start time: ', new Date());

    let { phone } = req.body;
    console.log('phone: ', phone);

    if (!phone) {
        return res.json({
            message: 'Chưa nhập số điện thoại',
            code: 400,
        });
    }

    phone = phone.replace(/\s/g, '').replace(/^\+/, '');
    // if (!PHONE_REGEX.test(phone)) {
    //     return res.json({
    //         message: 'Số điện thoại không hợp lệ',
    //         code: 400,
    //     });
    // }

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: false,
            defaultViewport: false,
            executablePath:
                'C:/Program Files/Google/Chrome/Application/chrome.exe',
        });

        const page = (await browser.pages())[0];
        await loginAccount(page);

        console.log('start waiting: ', new Date());
        await page.waitForNavigation();

        const currentUrl = page.url();
        if (currentUrl == 'https://chat.zalo.me/') {
            console.log('logged in...');
        }
        console.log('end waiting: ', new Date());

        //open search friend popup
        const openAddFrModal = await page.waitForSelector(
            'div[data-id="btn_Main_AddFrd"]',
        );
        await openAddFrModal.click();

        //input phone number
        await page.type(
            '.phone-i-input',
            phone,
            //{ delay: 300 }
        );

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
            return res.json({
                message: 'Tài khoản không tồn tại.',
                code: 400,
            });
        }

        const cancelFrBtn = await page.$(
            'div[data-id="btn_UserProfile_CXLFrdReq"]',
        );
        if (cancelFrBtn) {
            return res.json({
                message: 'Đã gửi lời kết bạn.',
                code: 400,
            });
        }

        //confirm specified friend
        const confirmFrBtn = await page.$(
            'div[data-id="btn_UserProfile_AddFrd"]',
        );
        if (!confirmFrBtn) {
            return res.json({
                message: 'Số điện thoại đã có trong danh sách bạn bè.',
                code: 400,
            });
        }
        await confirmFrBtn.click();

        //send an invite
        const addFrBtn = await page.waitForSelector(
            'div[data-id="btn_AddFrd_Add"]',
        );
        await addFrBtn.click();
    } catch (ex) {
        console.log('Error: ', ex);
        return res.json({
            message: 'Lỗi gửi lời mời kết bạn',
            code: 400,
        });
    } finally {
        //close browser
        await browser.close();
    }

    return res.json({
        message: 'Gửi lời mời kết bạn thành công',
        code: 200,
    });
});
