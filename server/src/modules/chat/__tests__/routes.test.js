import { afterEach, describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import express from "express";
import jwt from "jsonwebtoken";
import createChatRouter from "../routes.js";
import User from "../../../database/models/User.js";
import globalErrorHandler from "../../../middleware/errorMiddleware.js";

process.env.JWT_SECRET = "test_secret_for_chat_route";

const createMockUser = () => ({
  _id: { toString: () => "user-123" },
  email: "chat-user@example.com",
  name: "Chat User",
  role: "student",
});

const createTestServer = ({ geminiModel }) => {
  const app = express();

  app.use(express.json());
  app.use("/api/chat", createChatRouter({ getGeminiModel: () => geminiModel }));
  app.use(globalErrorHandler);

  const server = http.createServer(app);

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({
        baseUrl: `http://127.0.0.1:${port}`,
        close: () => new Promise((done) => server.close(done)),
      });
    });
  });
};

const postChat = async ({ baseUrl, token, body }) => {
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
};

describe("chat route authentication", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("rejects unauthenticated users before calling Gemini", async () => {
    const generateContent = mock.fn();
    const server = await createTestServer({
      geminiModel: { generateContent },
    });

    try {
      const response = await postChat({
        baseUrl: server.baseUrl,
        body: { message: "Help me prepare for an interview" },
      });
      const data = await response.json();

      assert.equal(response.status, 401);
      assert.equal(data.success, false);
      assert.match(data.message, /not logged in/i);
      assert.equal(generateContent.mock.calls.length, 0);
    } finally {
      await server.close();
    }
  });

  it("allows authenticated users to call Gemini", async () => {
    const user = createMockUser();
    const token = jwt.sign(
      { userId: user._id.toString(), role: user.role },
      process.env.JWT_SECRET,
    );
    const generateContent = mock.fn(async (prompt) => ({
      response: {
        text: () => `reply for: ${prompt.includes("mock interviews")}`,
      },
    }));
    const server = await createTestServer({
      geminiModel: { generateContent },
    });

    mock.method(User, "findById", () => ({
      select: async (projection) => {
        assert.equal(projection, "-password");
        return user;
      },
    }));

    try {
      const response = await postChat({
        baseUrl: server.baseUrl,
        token,
        body: { message: "Tell me about mock interviews" },
      });
      const data = await response.json();

      assert.equal(response.status, 200);
      assert.equal(data.reply, "reply for: true");
      assert.equal(generateContent.mock.calls.length, 1);
    } finally {
      await server.close();
    }
  });

  it("rejects invalid payload shapes before calling Gemini", async () => {
    const user = createMockUser();
    const token = jwt.sign(
      { userId: user._id.toString(), role: user.role },
      process.env.JWT_SECRET,
    );
    const generateContent = mock.fn();
    const server = await createTestServer({
      geminiModel: { generateContent },
    });

    mock.method(User, "findById", () => ({
      select: async () => user,
    }));

    try {
      const response = await postChat({
        baseUrl: server.baseUrl,
        token,
        body: { message: "valid text", unexpected: true },
      });
      const data = await response.json();

      assert.equal(response.status, 400);
      assert.equal(data.success, false);
      assert.match(data.message, /only a message field/i);
      assert.equal(generateContent.mock.calls.length, 0);
    } finally {
      await server.close();
    }
  });
});
