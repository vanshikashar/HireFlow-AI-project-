import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { Application } from "../models/Application.js";

const router = Router();

router.use(requireAuth);

router.get("/summary", async (req, res) => {
  const userId = req.userId;

  const [totalApplications, grouped, recentApplications] =
    await Promise.all([
      Application.countDocuments({ userId }),

      Application.aggregate([
        { $match: { userId: new (await import("mongoose")).default.Types.ObjectId(userId) } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 }
          }
        }
      ]),

      Application.find({ userId })
        .populate("jobId", "title company")
        .sort({ updatedAt: -1 })
        .limit(5)
        .lean()
    ]);

  const byStatus: Record<string, number> = {
    Applied: 0,
    Shortlisted: 0,
    Interview: 0,
    Offer: 0,
    Rejected: 0
  };

  for (const item of grouped) {
    byStatus[item._id] = item.count;
  }

  res.json({
    totalApplications,
    interviews: byStatus.Interview,
    offers: byStatus.Offer,
    byStatus,
    recentApplications
  });
});

export default router;