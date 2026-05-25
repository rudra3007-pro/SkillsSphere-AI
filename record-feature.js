import { chromium } from 'playwright';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: './server/.env' });

async function recordFeature() {
  console.log('Connecting to DB to create test user...');
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/skillssphere');
  
  // Define simple User schema to bypass full backend logic just for setting isVerified
  const userSchema = new mongoose.Schema({}, { strict: false });
  const User = mongoose.models.User || mongoose.model('User', userSchema, 'users');

  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'password123';
  const hashedPassword = await bcrypt.hash(testPassword, 10);
  
  // Create user directly in DB so it is auto-verified
  await User.create({
    name: 'Test User',
    email: testEmail,
    password: hashedPassword,
    role: 'student',
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log(`Created test user: ${testEmail}`);
  await mongoose.disconnect();

  console.log('Launching browser to record video...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: {
      dir: 'feature-videos/',
      size: { width: 1280, height: 720 }
    }
  });
  
  const page = await context.newPage();

  console.log('Logging in...');
  await page.goto('http://localhost:5174/login');
  await page.fill('input[type="email"]', testEmail);
  await page.fill('input[type="password"]', testPassword);
  await page.click('button[type="submit"]');

  // Wait for login to complete and navigate
  await page.waitForTimeout(3000);

  console.log('Navigating to Mock Interview...');
  await page.goto('http://localhost:5174/mock-interview');
  await page.waitForTimeout(2000);

  console.log('Taking Lobby Screenshot...');
  await page.screenshot({ path: 'lobby-screenshot-real.png' });

  console.log('Starting Interview Session...');
  try {
    await page.click('text=Start');
    await page.waitForTimeout(3000);
    
    console.log('Taking Session Screenshot...');
    await page.screenshot({ path: 'session-screenshot-real.png' });

    // Simulate some time in the session for the video
    await page.waitForTimeout(5000);
    
    // Maybe try to find and click "End Session" or just wait
    console.log('Finished recording session.');
  } catch (err) {
    console.log('Could not click Start button, maybe text is different:', err.message);
  }

  await context.close();
  await browser.close();
  
  console.log('Done! Check the "feature-videos" folder and the screenshot files.');
}

recordFeature().catch(console.error);
