const puppeteer = require('puppeteer');
const multer = require('multer');
const express = require('express');
const slugify = require('slugify');
const path = require('path');
var morgan = require('morgan');

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

const PHONE_REGEX = /([\+84|84|0]+(3|5|7|8|9|1[2|6|8|9]))+([0-9]{8})\b/g;

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

    phone = phone.replace(/\s/g, '');
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
        await page.goto(
            'https://id.zalo.me/account?continue=https%3A%2F%2Fchat.zalo.me%2F',
            { waitUntil: 'domcontentloaded' },
        );

        //waiting page load done
        await new Promise((resolve, reject) => {
            setTimeout(resolve, 3000);
        });

        await page.waitForNavigation();
        console.log('logged in...');

        //enable input phone
        const enableInputPhone = await page.waitForSelector(
            '#contact-search-input',
        );
        if (!enableInputPhone) {
            return res.json({
                message: 'Error',
                code: 400,
            });
        }
        await enableInputPhone.click();

        //input phone to search
        await page.type('#contact-search-input', phone, { delay: 300 });

        //choose a friend to send message
        const chooseFriend = await page.waitForSelector(
            '#global_search_list .ReactVirtualized__Grid__innerScrollContainer div:nth-child(2)',
            { visible: true },
        );
        if (!chooseFriend) {
            return res.json({
                message: 'Error',
                code: 400,
            });
        }
        await chooseFriend.click();

        //input message
        await page.type('#richInput', message, { delay: 200 });

        //send message
        const sendMessageBtn = await page.waitForSelector(
            'div[data-translate-inner="STR_SEND"]',
        );
        if (!sendMessageBtn) {
            return res.json({
                message: 'Error',
                code: 400,
            });
        }
        await sendMessageBtn.click();
    } catch (ex) {
        console.log('Error: ', ex);
        return res.json({
            message: 'Error',
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

    phone = phone.replace(/\s/g, '');
    if (!PHONE_REGEX.test(phone)) {
        return res.json({
            message: 'Số điện thoại không hợp lệ',
            code: 400,
        });
    }

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: false,
            defaultViewport: false,
            executablePath:
                'C:/Program Files/Google/Chrome/Application/chrome.exe',
        });
        const page = (await browser.pages())[0];
        //const page = await browser.newPage();

        await page.goto(
            'https://id.zalo.me/account?continue=https://chat.zalo.me',
            { waitUntil: 'domcontentloaded' },
        );

        //waiting page load done
        await new Promise((resolve, reject) => {
            setTimeout(resolve, 3000);
        });

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
        if (!openAddFrModal) {
            return res.json({
                message: 'Error',
                code: 400,
            });
        }
        await openAddFrModal.click();

        //input phone number
        await page.type('.phone-i-input', phone, { delay: 300 });

        //click seach button
        const searchFrBtn = await page.waitForSelector(
            'div[data-translate-inner="STR_SEARCH"]',
        );
        if (!searchFrBtn) {
            return res.json({
                message: 'Error',
                code: 400,
            });
        }
        await searchFrBtn.click();

        //confirm specified friend
        const confirmFrBtn = await page.waitForSelector(
            'div[data-id="btn_UserProfile_AddFrd"]',
            { timeout: 3000 },
        );
        if (!confirmFrBtn) {
            return res.json({
                message: 'Error',
                code: 400,
            });
        }
        await confirmFrBtn.click();

        //send an invite
        const addFrBtn = await page.waitForSelector(
            'div[data-id="btn_AddFrd_Add"]',
        );
        if (!addFrBtn) {
            return res.json({
                message: 'Error',
                code: 400,
            });
        }
        await addFrBtn.click();
    } catch (ex) {
        console.log('Error: ', ex);
        return res.json({
            message: 'Error',
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

// (async () => {
//     const browser = await puppeteer.launch({
//         headless: false,
//         defaultViewport: false,
//         executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
//     });
//     const page = (await browser.pages())[0];
//     await page.goto(
//         'https://id.zalo.me/account?continue=https%3A%2F%2Fchat.zalo.me%2F',
//     );

//     await page.waitForNavigation();
//     console.log('logged in...');

//     //open search friend popup
//     const openAddFrModal = await page.waitForSelector(
//         'div[data-id="btn_Main_AddFrd"]',
//     );
//     if (!openAddFrModal) {
//         return;
//     }
//     await openAddFrModal.click();

//     //input phone number
//     await page.type('.phone-i-input', '0938148976');

//     //click seach button
//     const searchFr = await page.waitForSelector(
//         'div[data-translate-inner="STR_SEARCH"]',
//     );
//     if (!searchFr) {
//         return;
//     }
//     await searchFr.click();

//     //confirm specified friend
//     const confirmFr = await page.waitForSelector(
//         'div[data-id="btn_UserProfile_AddFrd"]',
//     );
//     if (!confirmFr) {
//         return;
//     }
//     await confirmFr.click();

//     //send an invite
//     const addFr = await page.waitForSelector('div[data-id="btn_AddFrd_Add"]');
//     if (!addFr) {
//         return;
//     }
//     await addFr.click();
// })();
