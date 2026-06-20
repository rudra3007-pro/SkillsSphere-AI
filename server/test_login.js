/* eslint-disable no-console */
import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./src/database/db.js";
import { registerUserAndIssueToken, loginUser } from "./src/modules/auth/service.js";
import User from "./src/database/models/User.js";

dotenv.config({ path: '.env' });

// --- Helpers ---
let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (!condition) { console.error(`[FAIL] ${label}`); failed++; }
  else { console.log(`[PASS] ${label}`); passed++; }
}

function assertThrows(fn, label) {
  try { fn(); assert(false, label); }
  catch { assert(true, label); }
}

const TEST_EMAIL = "test_login_bug@example.com";
const TEST_PASSWORD = "Password123!";

async function cleanup() {
  await User.deleteMany({ email: TEST_EMAIL });
  console.log("[cleanup] test user removed");
}

async function run() {
  await connectDB();
  await cleanup();

  // --- 1. Register ---
  let registerResult;
  try {
    registerResult = await registerUserAndIssueToken({
      name: "Test User",
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      role: "student",
    });
    assert(!!registerResult, "register returns result");
    assert(!!registerResult.token || !!registerResult.user, "register returns token or user");
    console.log("[register] success — token present:", !!registerResult.token);
  } catch (e) {
    assert(false, `register should not throw: ${e.message}`);
  }

  // --- 2. Duplicate register throws ---
  try {
    await registerUserAndIssueToken({
      name: "Test User",
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      role: "student",
    });
    assert(false, "duplicate register should throw");
  } catch {
    assert(true, "duplicate register throws correctly");
  }

  // --- 3. Login exact email ---
  try {
    const result = await loginUser(TEST_EMAIL, TEST_PASSWORD);
    assert(!!result, "login returns result");
    assert(!!result.token || !!result.user, "login returns token or user");
    assert(result.password === undefined, "login result does not expose password");
    console.log("[login] exact email success");
  } catch (e) {
    assert(false, `login exact email should not throw: ${e.message}`);
  }

  // --- 4. Login with whitespace + case variant ---
  try {
    const result = await loginUser(" Test_Login_Bug@example.com ", TEST_PASSWORD);
    assert(!!result, "login with whitespace/case returns result");
    console.log("[login] whitespace+case variant success");
  } catch (e) {
    assert(false, `login whitespace/case should not throw: ${e.message}`);
  }

  // --- 5. Login uppercase email ---
  try {
    const result = await loginUser(TEST_EMAIL.toUpperCase(), TEST_PASSWORD);
    assert(!!result, "login uppercase email returns result");
    console.log("[login] uppercase email success");
  } catch (e) {
    assert(false, `login uppercase should not throw: ${e.message}`);
  }

  // --- 6. Wrong password throws ---
  try {
    await loginUser(TEST_EMAIL, "WrongPassword999!");
    assert(false, "wrong password should throw");
  } catch {
    assert(true, "wrong password throws correctly");
  }

  // --- 7. Wrong email throws ---
  try {
    await loginUser("nonexistent@example.com", TEST_PASSWORD);
    assert(false, "wrong email should throw");
  } catch {
    assert(true, "wrong email throws correctly");
  }

  // --- 8. Empty email throws ---
  try {
    await loginUser("", TEST_PASSWORD);
    assert(false, "empty email should throw");
  } catch {
    assert(true, "empty email throws correctly");
  }

  // --- 9. Empty password throws ---
  try {
    await loginUser(TEST_EMAIL, "");
    assert(false, "empty password should throw");
  } catch {
    assert(true, "empty password throws correctly");
  }

  // --- 10. Null email throws ---
  try {
    await loginUser(null, TEST_PASSWORD);
    assert(false, "null email should throw");
  } catch {
    assert(true, "null email throws correctly");
  }

  // --- 11. User exists in DB after register ---
  const dbUser = await User.findOne({ email: TEST_EMAIL });
  assert(dbUser !== null, "user exists in DB after register");
  assert(dbUser.password !== TEST_PASSWORD, "password stored as hash not plaintext");
  assert(dbUser.password.length >= 60, "password hash length >= 60 (bcrypt)");
  assert(dbUser.role === "student", "role stored correctly");
  assert(typeof dbUser.isVerified === "boolean" || dbUser.isVerified == null, "isVerified is boolean or null");

  // --- 12. Cleanup and verify removal ---
  await cleanup();
  const afterCleanup = await User.findOne({ email: TEST_EMAIL });
  assert(afterCleanup === null, "user removed after cleanup");

  await mongoose.disconnect();
  console.log(`\n[done] ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
  process.exit(0);
}

run().catch((err) => {
  console.error("[error]", err.message);
  process.exit(1);
});