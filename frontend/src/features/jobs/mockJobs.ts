import type { Job } from "../../types";

export const mockJobs: Job[] = [
  {
    id: "job-001",
    title: "Associate Frontend Developer",
    company: "Nova Digital",
    location: "Mumbai, India",
    employmentType: "Full-time",
    workMode: "Hybrid",
    experience: "0–2 years",
    salaryMin: 600000,
    salaryMax: 900000,
    skills: ["JavaScript", "React", "TypeScript", "HTML", "CSS"],
    description:
      "Build accessible, responsive web applications and reusable UI components.",
    postedAt: "2026-10-20"
  },
  {
    id: "job-002",
    title: "React Developer",
    company: "PixelWorks",
    location: "Bengaluru, India",
    employmentType: "Full-time",
    workMode: "Remote",
    experience: "0–2 years",
    salaryMin: 500000,
    salaryMax: 800000,
    skills: ["React", "JavaScript", "REST APIs", "CSS"],
    description:
      "Develop interactive interfaces and integrate frontend applications with APIs.",
    postedAt: "2026-10-22"
  },
  {
    id: "job-003",
    title: "Frontend Engineering Intern",
    company: "BrightStack",
    location: "Noida, India",
    employmentType: "Internship",
    workMode: "On-site",
    experience: "Entry-level",
    skills: ["HTML", "CSS", "JavaScript", "Git"],
    description:
      "Assist with UI implementation, browser testing and responsive design.",
    postedAt: "2026-10-24"
  },
  {
    id: "job-004",
    title: "Junior UI Engineer",
    company: "CloudCanvas",
    location: "Pune, India",
    employmentType: "Full-time",
    workMode: "Hybrid",
    experience: "0–1 years",
    salaryMin: 400000,
    salaryMax: 700000,
    skills: ["TypeScript", "React", "Accessibility", "Testing"],
    description:
      "Create maintainable UI components and test user interactions.",
    postedAt: "2026-10-25"
  }
];