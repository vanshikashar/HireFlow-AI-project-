import { Router } from "express";
import mongoose from "mongoose";
import { Job } from "../models/Job.js";
import { jobQuerySchema } from "../schemas/index.js";
import { ApiError } from "../middleware/errors.js";

const router = Router();

router.get("/", async (req, res) => {
  const query = jobQuerySchema.parse(req.query);
  const filter: Record<string, unknown> = {};

  if (query.location) {
    filter.location = {
      $regex: query.location.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      $options: "i"
    };
  }

  if (query.workMode) filter.workMode = query.workMode;
  if (query.employmentType) filter.employmentType = query.employmentType;

  if (query.search) {
    filter.$text = { $search: query.search };
  }

  const sort: Record<string, 1 | -1> =
    query.sort === "salaryAsc"
      ? { salaryMin: 1 }
      : query.sort === "salaryDesc"
        ? { salaryMax: -1 }
        : { postedAt: -1 };

  const skip = (query.page - 1) * query.limit;

  const [items, total] = await Promise.all([
    Job.find(filter)
      .select("-__v")
      .sort(sort)
      .skip(skip)
      .limit(query.limit)
      .lean(),
    Job.countDocuments(filter)
  ]);

  res.json({
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit)
    }
  });
});

router.get("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, "Invalid job ID");
  }

  const job = await Job.findById(req.params.id).select("-__v").lean();

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  res.json({ job });
});

export default router;