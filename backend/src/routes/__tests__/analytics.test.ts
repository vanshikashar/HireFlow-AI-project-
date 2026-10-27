import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import app from "../../app.js";
import { signAccessToken } from "../../middleware/auth.js";
import { Application } from "../../models/Application.js";

vi.mock("../../models/Application.js", () => ({
  Application: {
    countDocuments: vi.fn(),
    aggregate: vi.fn(),
    find: vi.fn(),
  },
}));

const TEST_USER_ID = "507f1f77bcf86cd799439011";

function authenticatedRequest() {
  const token = signAccessToken(TEST_USER_ID);

  return request(app)
    .get("/api/analytics/summary")
    .set("Cookie", [`access_token=${token}`]);
}

function mockRecentApplications(items: unknown[] = []) {
  const query = {
    populate: vi.fn(),
    sort: vi.fn(),
    limit: vi.fn(),
    lean: vi.fn(),
  };

  query.populate.mockReturnValue(query);
  query.sort.mockReturnValue(query);
  query.limit.mockReturnValue(query);
  query.lean.mockResolvedValue(items);

  vi.mocked(Application.find).mockReturnValue(query as never);
}

describe("Analytics API", () => {
  beforeEach(() => {
    process.env.JWT_SECRET =
      "test-secret-that-is-at-least-32-characters-long";

    vi.clearAllMocks();
  });

  it("rejects unauthenticated requests", async () => {
    const response = await request(app)
      .get("/api/analytics/summary");

    expect(response.status).toBe(401);
  });

  it("returns application statistics and recent applications", async () => {
    vi.mocked(Application.countDocuments).mockResolvedValue(5 as never);

    vi.mocked(Application.aggregate).mockResolvedValue([
      { _id: "Applied", count: 2 },
      { _id: "Interview", count: 2 },
      { _id: "Offer", count: 1 },
    ] as never);

    const recentApplications = [
      {
        _id: "application-1",
        status: "Interview",
        jobId: { title: "Frontend Developer", company: "Example Co" },
      },
    ];

    mockRecentApplications(recentApplications);

    const response = await authenticatedRequest();

    expect(response.status).toBe(200);
    expect(response.body.totalApplications).toBe(5);
    expect(response.body.interviews).toBe(2);
    expect(response.body.offers).toBe(1);
    expect(response.body.byStatus).toEqual({
      Applied: 2,
      Shortlisted: 0,
      Interview: 2,
      Offer: 1,
      Rejected: 0,
    });
    expect(response.body.recentApplications).toEqual(recentApplications);

    expect(Application.countDocuments).toHaveBeenCalledWith({
      userId: TEST_USER_ID,
    });

    expect(Application.aggregate).toHaveBeenCalledWith([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(TEST_USER_ID),
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    expect(Application.find).toHaveBeenCalledWith({
      userId: TEST_USER_ID,
    });
  });

  it("returns zero statistics when the user has no applications", async () => {
    vi.mocked(Application.countDocuments).mockResolvedValue(0 as never);
    vi.mocked(Application.aggregate).mockResolvedValue([] as never);

    mockRecentApplications([]);

    const response = await authenticatedRequest();

    expect(response.status).toBe(200);
    expect(response.body.totalApplications).toBe(0);
    expect(response.body.interviews).toBe(0);
    expect(response.body.offers).toBe(0);
    expect(response.body.byStatus).toEqual({
      Applied: 0,
      Shortlisted: 0,
      Interview: 0,
      Offer: 0,
      Rejected: 0,
    });
    expect(response.body.recentApplications).toEqual([]);
  });
});