import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../config/database.js";
import { Job } from "../models/Job.js";

const jobs = [
  {
    title: "Associate Frontend Developer",
    company: "Nova Digital",
    location: "Mumbai, India",
    employmentType: "Full-time",
    workMode: "Hybrid",
    experience: "0–2 years",
    salaryMin: 600000,
    salaryMax: 900000,
    skills: ["JavaScript", "React", "TypeScript", "HTML", "CSS"],
    description: "Build responsive web interfaces and reusable components."
  },
  {
    title: "React Developer",
    company: "PixelWorks",
    location: "Bengaluru, India",
    employmentType: "Full-time",
    workMode: "Remote",
    experience: "0–2 years",
    salaryMin: 500000,
    salaryMax: 800000,
    skills: ["React", "JavaScript", "REST APIs", "CSS"],
    description: "Build interactive interfaces and integrate REST APIs."
  },
  {
    title: "Frontend Engineering Intern",
    company: "BrightStack",
    location: "Noida, India",
    employmentType: "Internship",
    workMode: "On-site",
    experience: "Entry-level",
    skills: ["HTML", "CSS", "JavaScript", "Git"],
    description: "Contribute to frontend development and UI testing."
  },
  {
    title: "Junior UI Engineer",
    company: "CloudCanvas",
    location: "Pune, India",
    employmentType: "Full-time",
    workMode: "Hybrid",
    experience: "0–1 years",
    salaryMin: 400000,
    salaryMax: 700000,
    skills: ["TypeScript", "React", "Accessibility", "Testing"],
    description: "Develop maintainable UI components and automated tests."
  }
];

async function seed() {
  await connectDatabase();

  for (const job of jobs) {
    await Job.updateOne(
      { title: job.title, company: job.company },
      { $set: job },
      { upsert: true, runValidators: true }
    );
  }

  console.log(`${jobs.length} demo jobs inserted or updated`);
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });