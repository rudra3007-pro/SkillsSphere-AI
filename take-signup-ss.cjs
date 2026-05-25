const { chromium } = require('playwright');
(async () => {
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    // Go to the signup/register page
    await page.goto('http://localhost:5174/register');
    await page.waitForTimeout(2000);
    
    // Take a screenshot
    await page.screenshot({ path: 'signup-screenshot.png' });
    
    await browser.close();
    console.log("Signup screenshot saved successfully.");
  } catch (err) {
    console.error(err);
  }
})();
