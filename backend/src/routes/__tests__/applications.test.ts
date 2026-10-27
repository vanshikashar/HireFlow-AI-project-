
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
import { Application } from "../../models/Application.js";
import { Job } from "../../models/Job.js";

vi.mock("../../models/Application.js", () => ({
  Application: {
    find: vi.fn(),
    create: vi.fn(),
    findOneAndUpdate: vi.fn(),
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
const APPLICATION_ID = "507f1f77bcf86cd799439014";

function authenticatedRequest(
  method: "get" | "post" | "patch" | "delete",
  path: string,
) {
  const token = signAccessToken(TEST_USER_ID);

  return request(app)
    [method](path)
    .set("Cookie", [`access_token=${token}`]);
}

function createQueryChain(result: unknown) {
  const chain = {
    populate: vi.fn(),
    sort: vi.fn(),
    lean: vi.fn(),
  };

  chain.populate.mockReturnValue(chain);
  chain.sort.mockReturnValue(chain);
  chain.lean.mockResolvedValue(result);

  return chain;
}

beforeAll(() => {
  process.env.JWT_SECRET =
    "hireflow-vitest-only-secret-at-least-32-characters";
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Applications API", () => {
  it("rejects unauthenticated requests", async () => {
    const response = await request(app).get("/api/applications");

    expect(response.status).toBe(401);
  });

  it("returns the authenticated user's applications", async () => {
    const applications = [
      { _id: APPLICATION_ID, userId: TEST_USER_ID, jobId: JOB_ID },
    ];

    vi.mocked(Application.find).mockReturnValue(
      createQueryChain(applications) as never,
    );

    const response = await authenticatedRequest(
      "get",
      "/api/applications",
    );

    expect(response.status).toBe(200);
    expect(response.body.items).toEqual(applications);
    expect(Application.find).toHaveBeenCalledWith({
      userId: TEST_USER_ID,
    });
  });

  it("rejects an application when the job does not exist", async () => {
    vi.mocked(Job.exists).mockResolvedValue(null as never);

    const response = await authenticatedRequest(
      "post",
      "/api/applications",
    ).send({ jobId: JOB_ID, notes: "Interested in this role" });

    expect(response.status).toBe(404);
    expect(Application.create).not.toHaveBeenCalled();
  });

  it("creates an application for an existing job", async () => {
    const application = {
      _id: APPLICATION_ID,
      userId: TEST_USER_ID,
      jobId: JOB_ID,
      notes: "Interested in this role",
      status: "Applied",
    };

    vi.mocked(Job.exists).mockResolvedValue(
      { _id: JOB_ID } as never,
    );
    vi.mocked(Application.create).mockResolvedValue(
      application as never,
    );

    const response = await authenticatedRequest(
      "post",
      "/api/applications",
    ).send({ jobId: JOB_ID, notes: "Interested in this role" });

    expect(response.status).toBe(201);
    expect(response.body.application).toEqual(application);
    expect(Application.create).toHaveBeenCalledWith({
      userId: TEST_USER_ID,
      jobId: JOB_ID,
      notes: "Interested in this role",
      status: "Applied",
    });
  });

  it("rejects an invalid application ID when updating", async () => {
    const response = await authenticatedRequest(
      "patch",
      "/api/applications/invalid-id",
    ).send({ notes: "Updated notes" });

    expect(response.status).toBe(400);
    expect(Application.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("returns 404 when the application is not owned by the user", async () => {
    vi.mocked(Application.findOneAndUpdate).mockReturnValue({
      populate: vi.fn().mockResolvedValue(null),
    } as never);

    const response = await authenticatedRequest(
      "patch",
      `/api/applications/${APPLICATION_ID}`,
    ).send({ notes: "Updated notes" });

    expect(response.status).toBe(404);
    expect(Application.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: APPLICATION_ID,
        userId: TEST_USER_ID,
      },
      { $set: { notes: "Updated notes" } },
      { new: true, runValidators: true },
    );
  });

  it("rejects an invalid application ID when deleting", async () => {
    const response = await authenticatedRequest(
      "delete",
      "/api/applications/invalid-id",
    );

    expect(response.status).toBe(400);
    expect(Application.findOneAndDelete).not.toHaveBeenCalled();
  });

  it("returns 404 when the application cannot be deleted", async () => {
    vi.mocked(Application.findOneAndDelete).mockResolvedValue(
      null as never,
    );

    const response = await authenticatedRequest(
      "delete",
      `/api/applications/${APPLICATION_ID}`,
    );

    expect(response.status).toBe(404);
    expect(Application.findOneAndDelete).toHaveBeenCalledWith({
      _id: APPLICATION_ID,
      userId: TEST_USER_ID,
    });
  });

  it("deletes an application belonging to the authenticated user", async () => {
    vi.mocked(Application.findOneAndDelete).mockResolvedValue({
      _id: APPLICATION_ID,
      userId: TEST_USER_ID,
      jobId: JOB_ID,
    } as never);

    const response = await authenticatedRequest(
      "delete",
      `/api/applications/${APPLICATION_ID}`,
    );

    expect(response.status).toBe(204);
    expect(Application.findOneAndDelete).toHaveBeenCalledWith({
      _id: APPLICATION_ID,
      userId: TEST_USER_ID,
    });
  });
});
