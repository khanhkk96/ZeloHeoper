module.exports = {
    loginAccount: async (page, password, cookies) => {
        await page.goto(
            'https://id.zalo.me/account?continue=https://chat.zalo.me/',
            {
                waitUntil: 'domcontentloaded',
                referer: 'https://chat.zalo.me/',
                referrerPolicy: 'strict-origin-when-cross-origin',
            },
        );

        await page.setCookie(...cookies);
        await page.reload();

        //choose manual login option
        const chooseManual = await page.waitForSelector(
            'div.tabs ul li:nth-child(2) a',
        );
        if (!chooseManual) {
            throw new Error('Not found login option');
        }
        await chooseManual.click();

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
};
