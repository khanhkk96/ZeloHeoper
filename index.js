const puppeteer = require('puppeteer');
const multer = require('multer');
const express = require('express');
const slugify = require('slugify');
const path = require('path');
const morgan = require('morgan');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads');
    },
    filename: function (req, file, cb) {
        file.originalname = Buffer.from(file.originalname, 'latin1').toString(
            'utf8',
        );
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e2);
        const ext = path.extname(file.originalname);
        cb(
            null,
            slugify(path.parse(file.originalname).name, {
                replacement: '-', // replace spaces with replacement character, defaults to `-`
                remove: undefined, // remove characters that match regex, defaults to `undefined`
                lower: false, // convert to lower case, defaults to `false`
                strict: false, // strip special characters except replacement, defaults to `false`
                locale: 'vi', // language code of the locale to use
                trim: true,
            }) +
                '-' +
                uniqueSuffix +
                ext,
        );
    },
});

const upload = multer({
    dest: './uploads/',
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: function (req, file, callback) {
        console.log(file);
        var ext = path.extname(file.originalname);

        if (ext !== '.xlsx') {
            return callback(new Error('File upload must be .xlsx file'), false);
        }

        callback(null, true);
    },
});

var app = express();

app.get('/', function (req, res) {
    res.render('index');
});

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static('public'));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(morgan('combined'));

app.listen(8000);
console.log('Server is running....');

const PHONE_REGEX = /([84|0]+(3|5|7|8|9){1})+([0-9]{8})\b/g;

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

        await page.waitForTimeout(800);

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
            // headless: false,
            // defaultViewport: false,
            // executablePath:
            //     'C:/Program Files/Google/Chrome/Application/chrome.exe',
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

        await page.waitForTimeout(800);

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
