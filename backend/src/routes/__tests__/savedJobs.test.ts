
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
import { signAccessToken } from "../../middleware/auth.js";
import { SavedJob } from "../../models/SavedJob.js";
import { Job } from "../../models/Job.js";

vi.mock("../../models/SavedJob.js", () => ({
  SavedJob: {
    find: vi.fn(),
    create: vi.fn(),
    findOneAndDelete: vi.fn(),
  },
}));

vi.mock("../../models/Job.js", () => ({
  Job: {
    exists: vi.fn(),
  },
}));

const TEST_USER_ID = "507f1f77bcf86cd799439011";
const JOB_ID = "507f1f77bcf86cd799439013";

function authenticatedRequest(
  method: "get" | "post" | "delete",
  path: string,
) {
  const token = signAccessToken(TEST_USER_ID);

  return request(app)
    [method](path)
    .set("Cookie", [`access_token=${token}`]);
}

beforeAll(() => {
  process.env.JWT_SECRET =
    "hireflow-vitest-only-secret-at-least-32-characters";
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Saved Jobs API", () => {
  it("rejects unauthenticated requests", async () => {
    const response = await request(app).get("/api/saved-jobs");

    expect(response.status).toBe(401);
  });

  it("returns the current user's saved jobs", async () => {
    const savedJobs = [
      { userId: TEST_USER_ID, jobId: JOB_ID },
    ];

    const query = {
      populate: vi.fn(),
      sort: vi.fn(),
      lean: vi.fn(),
    };

    query.populate.mockReturnValue(query);
    query.sort.mockReturnValue(query);
    query.lean.mockResolvedValue(savedJobs);

    vi.mocked(SavedJob.find).mockReturnValue(query as never);

    const response = await authenticatedRequest(
      "get",
      "/api/saved-jobs",
    );

    expect(response.status).toBe(200);
    expect(response.body.items).toEqual(savedJobs);
    expect(SavedJob.find).toHaveBeenCalledWith({
      userId: TEST_USER_ID,
    });
  });

  it("rejects an invalid job ID when saving", async () => {
    const response = await authenticatedRequest(
      "post",
      "/api/saved-jobs",
    ).send({ jobId: "invalid-id" });

    expect(response.status).toBe(400);
    expect(Job.exists).not.toHaveBeenCalled();
  });

  it("returns 404 when the job does not exist", async () => {
    vi.mocked(Job.exists).mockResolvedValue(null as never);

    const response = await authenticatedRequest(
      "post",
      "/api/saved-jobs",
    ).send({ jobId: JOB_ID });

    expect(response.status).toBe(404);
    expect(SavedJob.create).not.toHaveBeenCalled();
  });

  it("saves an existing job for the authenticated user", async () => {
    const savedJob = {
      _id: "507f1f77bcf86cd799439014",
      userId: TEST_USER_ID,
      jobId: JOB_ID,
    };

    vi.mocked(Job.exists).mockResolvedValue(
      { _id: JOB_ID } as never,
    );
    vi.mocked(SavedJob.create).mockResolvedValue(
      savedJob as never,
    );

    const response = await authenticatedRequest(
      "post",
      "/api/saved-jobs",
    ).send({ jobId: JOB_ID });

    expect(response.status).toBe(201);
    expect(response.body.savedJob).toEqual(savedJob);
    expect(SavedJob.create).toHaveBeenCalledWith({
      userId: TEST_USER_ID,
      jobId: JOB_ID,
    });
  });

  it("returns 409 when the job is already saved", async () => {
    vi.mocked(Job.exists).mockResolvedValue(
      { _id: JOB_ID } as never,
    );
    vi.mocked(SavedJob.create).mockRejectedValue({
      code: 11000,
    });

    const response = await authenticatedRequest(
      "post",
      "/api/saved-jobs",
    ).send({ jobId: JOB_ID });

    expect(response.status).toBe(409);
  });

  it("rejects an invalid job ID when deleting", async () => {
    const response = await authenticatedRequest(
      "delete",
      "/api/saved-jobs/invalid-id",
    );

    expect(response.status).toBe(400);
    expect(SavedJob.findOneAndDelete).not.toHaveBeenCalled();
  });

  it("deletes a saved job belonging to the current user", async () => {
    vi.mocked(SavedJob.findOneAndDelete).mockResolvedValue({
      userId: TEST_USER_ID,
      jobId: JOB_ID,
    } as never);

    const response = await authenticatedRequest(
      "delete",
      `/api/saved-jobs/${JOB_ID}`,
    );

    expect(response.status).toBe(204);
    expect(SavedJob.findOneAndDelete).toHaveBeenCalledWith({
      userId: TEST_USER_ID,
      jobId: JOB_ID,
    });
  });

  it("returns 404 when the job is not in the user's saved list", async () => {
    vi.mocked(SavedJob.findOneAndDelete).mockResolvedValue(
      null as never,
    );

    const response = await authenticatedRequest(
      "delete",
      `/api/saved-jobs/${JOB_ID}`,
    );

    expect(response.status).toBe(404);
    expect(SavedJob.findOneAndDelete).toHaveBeenCalledWith({
      userId: TEST_USER_ID,
      jobId: JOB_ID,
    });
  });
});
