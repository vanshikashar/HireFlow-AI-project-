
import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import mongoose from "mongoose";

import app from "../../app.js";
import { signAccessToken } from "../../middleware/auth.js";

const validJobDescription =
  "We need a software developer with React, Node.js, MongoDB, " +
  "REST API development, testing, Git, and problem-solving skills.";

const testUserId = "507f1f77bcf86cd799439011";

let authCookie: string;

beforeAll(() => {
  // Use a dedicated test secret, never a production secret.
  process.env.JWT_SECRET =
    "hireflow-vitest-only-secret-at-least-32-characters";

  const token = signAccessToken(testUserId);
  authCookie = `access_token=${token}`;
});

describe("POST /api/resume/analyze", () => {
  it("rejects unauthenticated requests", async () => {
    const response = await request(app)
      .post("/api/resume/analyze")
      .field("jobDescription", validJobDescription);

    expect(response.status).toBe(401);
  });

  it("rejects a missing PDF", async () => {
    const response = await request(app)
      .post("/api/resume/analyze")
      .set("Cookie", authCookie)
      .field("jobDescription", validJobDescription);

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/PDF/i);
  });

  it("rejects a file with an invalid PDF signature", async () => {
    const response = await request(app)
      .post("/api/resume/analyze")
      .set("Cookie", authCookie)
      .field("jobDescription", validJobDescription)
      .attach(
        "resume",
        Buffer.from("THIS IS NOT A PDF FILE"),
        {
          filename: "resume.pdf",
          contentType: "application/pdf",
        },
      );

    expect(response.status).toBe(415);
  });

  it("rejects a short job description", async () => {
    const response = await request(app)
      .post("/api/resume/analyze")
      .set("Cookie", authCookie)
      .field("jobDescription", "Too short")
      .attach(
        "resume",
        Buffer.from("NOT A PDF"),
        {
          filename: "resume.pdf",
          contentType: "application/pdf",
        },
      );

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid job description.");
  });

  it("rejects PDF uploads larger than 5 MB", async () => {
    const oversizedPdf = Buffer.alloc(5 * 1024 * 1024 + 1, 65);
    oversizedPdf.write("%PDF-", 0, "ascii");

    const response = await request(app)
      .post("/api/resume/analyze")
      .set("Cookie", authCookie)
      .field("jobDescription", validJobDescription)
      .attach("resume", oversizedPdf, {
        filename: "large-resume.pdf",
        contentType: "application/pdf",
      });

    expect(response.status).toBe(413);
  });
});
