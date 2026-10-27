
import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import request from "supertest";
import app from "../../app.js";
import { Job } from "../../models/Job.js";
import { JobPreference } from "../../models/JobPreference.js";
import { recommendJobs } from "../../services/jobRecommendations.js";
import { signAccessToken } from "../../middleware/auth.js";

vi.mock("../../models/Job.js", () => ({
  Job: {
    find: vi.fn(),
  },
}));

vi.mock("../../models/JobPreference.js", () => ({
  JobPreference: {
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
  },
}));

vi.mock("../../services/jobRecommendations.js", () => ({
  recommendJobs: vi.fn(),
}));

const TEST_USER_ID = "507f1f77bcf86cd799439011";

function authenticatedRequest(
  method: "get" | "put",
  path: string,
) {
  const token = signAccessToken(TEST_USER_ID);

  return request(app)[method](path).set("Cookie", [
    `access_token=${token}`,
  ]);
}

beforeAll(() => {
  process.env.JWT_SECRET =
    "hireflow-vitest-only-secret-at-least-32-characters";
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Recommendations API", () => {
  it("rejects unauthenticated requests", async () => {
    const response = await request(app).get("/api/recommendations");

    expect(response.status).toBe(401);
  });

  it("returns default preferences when none are saved", async () => {
    vi.mocked(JobPreference.findOne).mockReturnValue({
      lean: vi.fn().mockResolvedValue(null),
    } as never);

    const response = await authenticatedRequest(
      "get",
      "/api/recommendations/preferences",
    );

    expect(response.status).toBe(200);
    expect(response.body.preferences).toEqual({
      skills: [],
      preferredLocations: [],
      preferredWorkModes: [],
      preferredEmploymentTypes: [],
      experienceLevel: "",
    });
  });

  it("returns an empty list when the user has no preferences", async () => {
    vi.mocked(JobPreference.findOne).mockReturnValue({
      lean: vi.fn().mockResolvedValue(null),
    } as never);

    const response = await authenticatedRequest(
      "get",
      "/api/recommendations",
    );

    expect(response.status).toBe(200);
    expect(response.body.items).toEqual([]);
    expect(response.body.message).toContain("Save your job preferences");
    expect(Job.find).not.toHaveBeenCalled();
  });

  it("saves validated job preferences", async () => {
    const preferences = {
      userId: TEST_USER_ID,
      skills: ["React", "TypeScript"],
      preferredLocations: ["Noida"],
      preferredWorkModes: ["Hybrid"],
      preferredEmploymentTypes: ["Full-time"],
      experienceLevel: "Entry-level",
    };

    const query = {
      lean: vi.fn().mockResolvedValue(preferences),
    };

    vi.mocked(JobPreference.findOneAndUpdate).mockReturnValue(
      query as never,
    );

    const response = await authenticatedRequest(
      "put",
      "/api/recommendations/preferences",
    ).send({
      skills: ["React", "TypeScript", "React"],
      preferredLocations: ["Noida"],
      preferredWorkModes: ["Hybrid"],
      preferredEmploymentTypes: ["Full-time"],
      experienceLevel: "Entry-level",
    });

    expect(response.status).toBe(200);
    expect(response.body.preferences).toEqual(preferences);

    expect(JobPreference.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: TEST_USER_ID },
      {
        $set: {
          skills: ["React", "TypeScript"],
          preferredLocations: ["Noida"],
          preferredWorkModes: ["Hybrid"],
          preferredEmploymentTypes: ["Full-time"],
          experienceLevel: "Entry-level",
        },
      },
      expect.objectContaining({
        new: true,
        upsert: true,
        runValidators: true,
      }),
    );
  });

  it("rejects invalid work modes", async () => {
    const response = await authenticatedRequest(
      "put",
      "/api/recommendations/preferences",
    ).send({
      preferredWorkModes: ["Anywhere"],
    });

    expect(response.status).toBe(400);
    expect(JobPreference.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("returns personalized recommendations using saved preferences", async () => {
    const preferences = {
      skills: ["React"],
      preferredLocations: ["Noida"],
      preferredWorkModes: ["Hybrid"],
      preferredEmploymentTypes: ["Full-time"],
      experienceLevel: "Entry-level",
    };

    const jobs = [
      {
        _id: "507f1f77bcf86cd799439013",
        title: "Frontend Developer",
        location: "Noida",
      },
    ];

    const jobQuery = {
      select: vi.fn(),
      sort: vi.fn(),
      limit: vi.fn(),
      lean: vi.fn(),
    };

    jobQuery.select.mockReturnValue(jobQuery);
    jobQuery.sort.mockReturnValue(jobQuery);
    jobQuery.limit.mockReturnValue(jobQuery);
    jobQuery.lean.mockResolvedValue(jobs);

    vi.mocked(JobPreference.findOne).mockReturnValue({
      lean: vi.fn().mockResolvedValue(preferences),
    } as never);

    vi.mocked(Job.find).mockReturnValue(jobQuery as never);

    const recommendations = [
      { ...jobs[0], matchScore: 90 },
    ];

    vi.mocked(recommendJobs).mockReturnValue(
      recommendations as never,
    );

    const response = await authenticatedRequest(
      "get",
      "/api/recommendations",
    );

    expect(response.status).toBe(200);
    expect(response.body.items).toEqual(recommendations);

    expect(recommendJobs).toHaveBeenCalledWith(
      jobs,
      expect.objectContaining({
        skills: ["React"],
        preferredLocations: ["Noida"],
        preferredWorkModes: ["Hybrid"],
        preferredEmploymentTypes: ["Full-time"],
        experienceLevel: "Entry-level",
      }),
    );
  });
});
