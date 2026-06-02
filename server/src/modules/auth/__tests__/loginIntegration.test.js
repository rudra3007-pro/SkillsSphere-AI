import { afterEach, describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import bcrypt from "bcryptjs";
import { loginUser } from "../service.js";
import User from "../../../database/models/User.js";
import logger from "../../../utils/logger.js";

process.env.JWT_SECRET = "test_secret_for_jwt";

const createMockUser = (overrides = {}) => ({
  _id: { toString: () => overrides.id || "user-123" },
  email: overrides.email || "login@example.com",
  name: overrides.name || "Login Tester",
  password: overrides.password || "hashed-password",
  provider: overrides.provider,
  role: overrides.role || "student",
  isVerified: overrides.isVerified ?? true,
  get(field) {
    return this[field];
  },
});

const setupCredentialLeakGuards = () => ({
  logMock: mock.method(logger, "log", () => {}),
  appendFileSyncMock: mock.method(fs, "appendFileSync", () => {}),
});

const assertPasswordWasNotLogged = (logMock, password) => {
  const loggedOutput = logMock.mock.calls
    .map((call) => call.arguments.map((arg) => JSON.stringify(arg)).join(" "))
    .join("\n");

  assert.equal(
    loggedOutput.includes(password),
    false,
    "Raw login password must never be sent to logger.log",
  );
};

describe("loginUser credential handling", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("successfully logs in with valid credentials without logging or writing the password", async () => {
    const email = "login@example.com";
    const password = "Password123!Secure";
    const user = createMockUser({ email });
    const { logMock, appendFileSyncMock } = setupCredentialLeakGuards();

    mock.method(User, "findOne", async (query) => {
      assert.deepEqual(query, { email });
      return user;
    });
    mock.method(bcrypt, "compare", async (plainPassword, hashedPassword) => {
      assert.equal(plainPassword, password);
      assert.equal(hashedPassword, user.password);
      return true;
    });

    const result = await loginUser(email, password);

    assert.equal(result.user.email, email);
    assert.equal(result.user.role, "student");
    assert.ok(result.token, "Should issue a token upon successful login");
    assertPasswordWasNotLogged(logMock, password);
    assert.equal(
      appendFileSyncMock.mock.calls.length,
      0,
      "Login must not write credential traces to disk",
    );
  });

  it("rejects invalid credentials without logging or writing the raw password", async () => {
    const email = "failed-login@example.com";
    const wrongPassword = "WrongPassword123!";
    const user = createMockUser({ email });
    const { logMock, appendFileSyncMock } = setupCredentialLeakGuards();

    mock.method(User, "findOne", async () => user);
    mock.method(bcrypt, "compare", async () => false);

    await assert.rejects(
      () => loginUser(email, wrongPassword),
      {
        message: "Invalid email or password",
        statusCode: 401,
      },
    );

    assertPasswordWasNotLogged(logMock, wrongPassword);
    assert.equal(
      appendFileSyncMock.mock.calls.length,
      0,
      "Failed login must not write credential traces to disk",
    );
  });
});
