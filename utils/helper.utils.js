const path = require('path');
const { glob } = require('glob');

module.exports = {
    loginAccount: async (page, password, cookies) => {
        const cookiesData = getCookies(cookies);
        if (!cookiesData.length) {
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

        await page.setCookie(...cookiesData);
        await page.reload();

        //choose manual login option
        const chooseManual = await page.waitForSelector(
            'div.tabs ul li:nth-child(2) a',
        );
        if (!chooseManual) {
            throw new Error('Not found login option');
        }
        await chooseManual.click();

        //await page.waitForTimeout(200);
        await page.waitForSelector(
            '.form-signin .line-form input[type="password"]',
            { visible: true },
        );

        //input password
        await page.type(
            '.form-signin .line-form input[type="password"]',
            password,
        );

        //login into account
        const loginBtn = await page.waitForSelector(
            '.form-signin .has-2btn a.first',
        );
        if (!loginBtn) {
            throw new Error('Cannot login into your account');
        }
        await loginBtn.click();
    },

    getLinuxChromePath: async () => {
        const url = path.resolve(
            __dirname,
            path.join('../node_modules/puppeteer/.local-chromium'),
        );
        console.log(url);
        const chromeFiles = await glob('**/chrome-linux/chrome', {
            cwd: url,
        });
        console.log(chromeFiles);
        return path.join(url, chromeFiles[0]);
    },
};

const getCookies = (cookieString) => {
    let cookies = [];
    if (cookieString) {
        cookieString = cookieString.split('|')[0];
        cookies = JSON.parse(cookieString);
    }
    return cookies;
};
