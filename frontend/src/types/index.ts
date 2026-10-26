export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  employmentType: "Full-time" | "Internship" | "Contract";
  workMode: "Remote" | "Hybrid" | "On-site";
  experience: string;
  salaryMin?: number;
  salaryMax?: number;
  skills: string[];
  description: string;
  postedAt: string;
};

export type ApplicationStatus =
  | "Applied"
  | "Shortlisted"
  | "Interview"
  | "Offer"
  | "Rejected";

export type JobApplication = {
  id: string;
  jobId: string;
  status: ApplicationStatus;
  appliedAt: string;
  notes: string;
};

export type ResumeMatch = {
  jobId: string;
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
};