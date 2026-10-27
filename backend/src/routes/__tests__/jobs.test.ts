
import { beforeAll, describe, expect, it, vi } from "vitest";
import request from "supertest";
import app from "../../app.js";
import { Job } from "../../models/Job.js";

vi.mock("../../models/Job.js", () => ({
  Job: {
    find: vi.fn(),
    countDocuments: vi.fn(),
    findById: vi.fn(),
  },
}));

function createQueryChain(result: unknown) {
  const chain = {
    select: vi.fn(),
    sort: vi.fn(),
    skip: vi.fn(),
    limit: vi.fn(),
    lean: vi.fn(),
  };

  chain.select.mockReturnValue(chain);
  chain.sort.mockReturnValue(chain);
  chain.skip.mockReturnValue(chain);
  chain.limit.mockReturnValue(chain);
  chain.lean.mockResolvedValue(result);

  return chain;
}

beforeAll(() => {
  vi.clearAllMocks();
});

describe("Jobs API", () => {
  it("returns paginated job listings", async () => {
    const jobs = [
      {
        _id: "507f1f77bcf86cd799439011",
        title: "Frontend Developer",
        company: "Example Company",
        location: "Noida",
      },
    ];

    vi.mocked(Job.find).mockReturnValue(
      createQueryChain(jobs) as never
    );
    vi.mocked(Job.countDocuments).mockResolvedValue(1 as never);

    const response = await request(app).get("/api/jobs");

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.pagination.total).toBe(1);
    expect(response.body.pagination.totalPages).toBe(1);
  });

  it("returns an empty list when no jobs match", async () => {
    vi.mocked(Job.find).mockReturnValue(
      createQueryChain([]) as never
    );
    vi.mocked(Job.countDocuments).mockResolvedValue(0 as never);

    const response = await request(app).get("/api/jobs");

    expect(response.status).toBe(200);
    expect(response.body.items).toEqual([]);
    expect(response.body.pagination.total).toBe(0);
    expect(response.body.pagination.totalPages).toBe(0);
  });

  it("rejects an invalid job ID", async () => {
    const response = await request(app).get("/api/jobs/invalid-id");

    expect(response.status).toBe(400);
    expect(response.body).toBeDefined();
  });
});
