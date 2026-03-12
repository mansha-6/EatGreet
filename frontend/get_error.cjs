const { chromium } = require('playwright');
(async () => {
    try {
        const browser = await chromium.launch();
        const page = await browser.newPage();
        
        // Listen to console events to get React errors
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log(`PAGE LOG ERROR: ${msg.text()}`);
            }
        });

        await page.goto('http://localhost:5173/admin/orders', { waitUntil: 'load', timeout: 10000 });
        
        // Get text content of the page
        const text = await page.evaluate(() => document.body.innerText);
        console.log('PAGE TEXT:', text);
        
        await browser.close();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
