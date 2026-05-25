const { chromium } = require('playwright');
(async () => {
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    // Go to the lobby
    await page.goto('http://localhost:5174/mock-interview');
    await page.waitForTimeout(2000);
    
    // Take a screenshot of the lobby
    await page.screenshot({ path: 'lobby-screenshot.png' });
    
    // Try to start a session to see the sentiment indicator
    try {
      await page.click('text=Start');
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'session-screenshot.png' });
    } catch (e) {
      console.log("Could not start session, maybe button text is different.");
    }
    
    await browser.close();
    console.log("Screenshots saved successfully.");
  } catch (err) {
    console.error(err);
  }
})();
