import type { ResumeMatch } from "../../types";

export function matchSkills(
  jobId: string,
  resumeText: string,
  requiredSkills: string[]
): ResumeMatch {
  const normalizedResume = resumeText.toLowerCase();

  const matchedSkills = requiredSkills.filter((skill) =>
    normalizedResume.includes(skill.toLowerCase())
  );

  const missingSkills = requiredSkills.filter(
    (skill) => !matchedSkills.includes(skill)
  );

  const score = requiredSkills.length === 0
    ? 0
    : Math.round((matchedSkills.length / requiredSkills.length) * 100);

  return {
    jobId,
    score,
    matchedSkills,
    missingSkills
  };
}