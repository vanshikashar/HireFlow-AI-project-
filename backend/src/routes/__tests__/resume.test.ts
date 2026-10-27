
import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../../app.js";
import { signAccessToken } from "../../middleware/auth.js";

const TEST_USER_ID = "507f1f77bcf86cd799439011";

beforeAll(() => {
  process.env.JWT_SECRET =
    "hireflow-vitest-only-secret-at-least-32-characters";
});

describe("Resume analysis API", () => {
  it("rejects unauthenticated requests", async () => {
    const response = await request(app)
      .post("/api/resume/analyze")
      .field(
        "jobDescription",
        "Frontend developer with React and TypeScript experience."
      );

    expect(response.status).toBe(401);
  });

  it("rejects a request without a resume file", async () => {
    const token = signAccessToken(TEST_USER_ID);

    const response = await request(app)
      .post("/api/resume/analyze")
      .set("Cookie", [`access_token=${token}`])
      .field(
        "jobDescription",
        "Frontend developer with React and TypeScript experience."
      );

    expect(response.status).toBe(400);
  });

  it("rejects an invalid PDF signature", async () => {
    const token = signAccessToken(TEST_USER_ID);

    const response = await request(app)
      .post("/api/resume/analyze")
      .set("Cookie", [`access_token=${token}`])
      .field(
        "jobDescription",
        "Frontend developer with React and TypeScript experience."
      )
      .attach("resume", Buffer.from("This is not a PDF"), {
        filename: "resume.pdf",
        contentType: "application/pdf",
      });

    expect(response.status).toBe(415);
  });

  it("rejects a job description that is too short", async () => {
    const token = signAccessToken(TEST_USER_ID);

    const response = await request(app)
      .post("/api/resume/analyze")
      .set("Cookie", [`access_token=${token}`])
      .field("jobDescription", "Developer");

    expect(response.status).toBe(400);
  });
});
