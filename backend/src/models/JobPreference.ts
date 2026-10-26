
import mongoose, { Schema } from "mongoose";

const jobPreferenceSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    preferredLocations: {
      type: [String],
      default: [],
    },
    preferredWorkModes: {
      type: [String],
      enum: ["Remote", "Hybrid", "On-site"],
      default: [],
    },
    preferredEmploymentTypes: {
      type: [String],
      enum: ["Full-time", "Internship", "Contract"],
      default: [],
    },
    experienceLevel: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100,
    },
  },
  { timestamps: true }
);

export const JobPreference = mongoose.model(
  "JobPreference",
  jobPreferenceSchema
);
