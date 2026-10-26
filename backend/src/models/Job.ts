import mongoose, { Schema } from "mongoose";

const jobSchema = new Schema({
  title: { type: String, required: true, trim: true },
  company: { type: String, required: true, trim: true },
  location: { type: String, required: true },
  employmentType: {
    type: String,
    enum: ["Full-time", "Internship", "Contract"],
    required: true
  },
  workMode: {
    type: String,
    enum: ["Remote", "Hybrid", "On-site"],
    required: true
  },
  experience: { type: String, required: true },
  salaryMin: Number,
  salaryMax: Number,
  skills: { type: [String], default: [] },
  description: { type: String, required: true },
  postedAt: { type: Date, default: Date.now }
}, { timestamps: true });

jobSchema.index({
  title: "text",
  company: "text",
  description: "text",
  skills: "text"
});

export const Job = mongoose.model("Job", jobSchema);