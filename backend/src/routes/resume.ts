
import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const resumeSchema = z.object({
  resumeText: z.string().trim().min(50, "Resume text must be at least 50 characters."),
  jobDescription: z
    .string()
    .trim()
    .min(50, "Job description must be at least 50 characters."),
});

const skillAliases: Record<string, string[]> = {
  javascript: ["javascript", "js"],
  typescript: ["typescript", "ts"],
  react: ["react", "react.js"],
  nodejs: ["node.js", "nodejs", "node js"],
  python: ["python"],
  sql: ["sql", "mysql", "postgresql", "postgres"],
  mongodb: ["mongodb", "mongo db"],
  aws: ["aws", "amazon web services"],
  docker: ["docker"],
  kubernetes: ["kubernetes", "k8s"],
  html: ["html", "html5"],
  css: ["css", "css3"],
  git: ["git", "github"],
};

router.post("/analyze", requireAuth, (req, res) => {
  const parsed = resumeSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid resume analysis input.",
      errors: parsed.error.flatten(),
    });
  }

  const { resumeText, jobDescription } = parsed.data;
  const resume = resumeText.toLowerCase();
  const description = jobDescription.toLowerCase();

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const [skill, aliases] of Object.entries(skillAliases)) {
    const required = aliases.some((alias) => description.includes(alias));
    if (!required) continue;

    const found = aliases.some((alias) => resume.includes(alias));

    if (found) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  const totalRequired = matchedSkills.length + missingSkills.length;
  const matchScore =
    totalRequired === 0
      ? 0
      : Math.round((matchedSkills.length / totalRequired) * 100);

  return res.json({
    matchScore,
    matchedSkills,
    missingSkills,
    disclaimer:
      "This is a basic keyword-based estimate, not a validated ATS score or prediction of hiring outcomes.",
  });
});

export default router;
