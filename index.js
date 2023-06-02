const puppeteer = require('puppeteer')
const multer = require('multer')
const express = require('express')
const slugify = require('slugify')
const path = require('path')
// const bodyParser = require('body-parser')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads')
    },
    filename: function (req, file, cb) {
        file.originalname = Buffer.from(file.originalname, 'latin1').toString(
            'utf8',
        )
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e2)
        const ext = path.extname(file.originalname)
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
        )
    },
})

const upload = multer({
    dest: './uploads/',
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: function (req, file, callback) {
        console.log(file)
        var ext = path.extname(file.originalname)

        if (ext !== '.xlsx') {
            return callback(new Error('File upload must be .xlsx file'), false)
        }

        callback(null, true)
    },
})

var app = express()

app.get('/', function (req, res) {
    res.render('index')
})

app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'))

app.use(express.static('public'))

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.listen(8000)
console.log('Server is running....')

app.post('/send', async (req, res) => {
    console.log('start time: ', new Date())
    const { phone, message } = req.body
    console.log(phone)
    console.log('end time: ', new Date())

    return res.json({
        message: 'Gửi tin nhắn thành công',
        code: 200,
    })
})

app.post('/add-friend', async (req, res) => {
    console.log('start time: ', new Date())

    const { phone } = req.body
    console.log('phone: ', phone)

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: false,
        executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    })
    const page = (await browser.pages())[0]
    await page.goto(
        'https://id.zalo.me/account?continue=https%3A%2F%2Fchat.zalo.me%2F',
    )

    await page.waitForNavigation()
    console.log('logged in...')

    //open search friend popup
    const openAddFrModal = await page.waitForSelector(
        'div[data-id="btn_Main_AddFrd"]',
    )
    if (!openAddFrModal) {
        return res.json({
            message: 'Error',
            code: 400,
        })
    }
    await openAddFrModal.click()

    //input phone number
    await page.type('.phone-i-input', phone)

    //click seach button
    const searchFr = await page.waitForSelector(
        'div[data-translate-inner="STR_SEARCH"]',
    )
    if (!searchFr) {
        return res.json({
            message: 'Error',
            code: 400,
        })
    }
    await searchFr.click()

    //confirm specified friend
    const confirmFr = await page.waitForSelector(
        'div[data-id="btn_UserProfile_AddFrd"]',
    )
    if (!confirmFr) {
        return res.json({
            message: 'Error',
            code: 400,
        })
    }
    await confirmFr.click()

    //send an invite
    const addFr = await page.waitForSelector('div[data-id="btn_AddFrd_Add"]')
    if (!addFr) {
        return res.json({
            message: 'Error',
            code: 400,
        })
    }
    await addFr.click()

    return res.json({
        message: 'Gửi lời mời kết bạn thành công',
        code: 200,
    })
})

// (async () => {
//   const browser = await puppeteer.launch({
//     headless: false,
//     defaultViewport: false,
//     executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
//   });
//   const page = (await browser.pages())[0];
//   await page.goto(
//     "https://id.zalo.me/account?continue=https%3A%2F%2Fchat.zalo.me%2F"
//   );

//   await page.waitForNavigation();
//   console.log("logged in...");

//   //open search friend popup
//   const openAddFrModal = await page.waitForSelector(
//     'div[data-id="btn_Main_AddFrd"]'
//   );
//   if (!openAddFrModal) {
//     return;
//   }
//   await openAddFrModal.click();

//   //input phone number
//   await page.type(".phone-i-input", "0348442632");

//   //click seach button
//   const searchFr = await page.waitForSelector(
//     'div[data-translate-inner="STR_SEARCH"]'
//   );
//   if (!searchFr) {
//     return;
//   }
//   await searchFr.click();

//   //confirm specified friend
//   const confirmFr = await page.waitForSelector(
//     'div[data-id="btn_UserProfile_AddFrd"]'
//   );
//   if (!confirmFr) {
//     return;
//   }
//   await confirmFr.click();

//   //send an invite
//   const addFr = await page.waitForSelector('div[data-id="btn_AddFrd_Add"]');
//   if (!addFr) {
//     return;
//   }
//   await addFr.click();
// })();
