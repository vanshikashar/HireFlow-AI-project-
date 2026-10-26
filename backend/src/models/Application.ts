import mongoose, { Schema } from "mongoose";

const applicationSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  jobId: {
    type: Schema.Types.ObjectId,
    ref: "Job",
    required: true
  },
  status: {
    type: String,
    enum: ["Applied", "Shortlisted", "Interview", "Offer", "Rejected"],
    default: "Applied"
  },
  appliedAt: { type: Date, default: Date.now },
  notes: { type: String, maxlength: 2000, default: "" }
}, { timestamps: true });

applicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });

export const Application = mongoose.model("Application", applicationSchema);