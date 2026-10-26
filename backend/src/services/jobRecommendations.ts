
import type { Types } from "mongoose";
import type { Job } from "../models/Job.js";

type PreferenceInput = {
  skills: string[];
  preferredLocations: string[];
  preferredWorkModes: string[];
  preferredEmploymentTypes: string[];
  experienceLevel: string;
};

type JobDocument = {
  _id: Types.ObjectId;
  title: string;
  company: string;
  location: string;
  workMode: string;
  employmentType: string;
  experience: string;
  skills: string[];
  description: string;
  salaryMin?: number | null;
salaryMax?: number | null;
  postedAt?: Date;
};

export function recommendJobs(
  jobs: JobDocument[],
  preferences: PreferenceInput
) {
  const normalize = (value: string) => value.trim().toLowerCase();

  const userSkills = new Set(
    preferences.skills.map(normalize).filter(Boolean)
  );

  return jobs
    .map((job) => {
      const jobSkills = job.skills.map(normalize).filter(Boolean);
      const matchedSkills = jobSkills.filter((skill) =>
        userSkills.has(skill)
      );

      const skillScore =
        jobSkills.length === 0
          ? 0
          : (matchedSkills.length / jobSkills.length) * 50;

      const preferredLocations =
        preferences.preferredLocations.map(normalize);

      const locationScore =
        preferredLocations.length === 0
          ? 0
          : preferredLocations.some(
                (location) =>
                  normalize(job.location).includes(location) ||
                  location.includes(normalize(job.location))
              )
            ? 15
            : 0;

      const preferredModes =
        preferences.preferredWorkModes.map(normalize);

      const workModeScore =
        preferredModes.length === 0
          ? 0
          : preferredModes.includes(normalize(job.workMode))
            ? 15
            : 0;

      const preferredTypes =
        preferences.preferredEmploymentTypes.map(normalize);

      const employmentScore =
        preferredTypes.length === 0
          ? 0
          : preferredTypes.includes(normalize(job.employmentType))
            ? 10
            : 0;

      const experienceScore =
        preferences.experienceLevel.trim() &&
        normalize(job.experience).includes(
          normalize(preferences.experienceLevel)
        )
          ? 10
          : 0;

      const hasExperiencePreference =
        preferences.experienceLevel.trim().length > 0;

      // Rebalance the score when a preference category is not configured.
      const availableWeight =
        (userSkills.size > 0 ? 50 : 0) +
        (preferredLocations.length > 0 ? 15 : 0) +
        (preferredModes.length > 0 ? 15 : 0) +
        (preferredTypes.length > 0 ? 10 : 0) +
        (hasExperiencePreference ? 10 : 0);

      const rawScore =
        skillScore +
        locationScore +
        workModeScore +
        employmentScore +
        experienceScore;

      const matchScore =
        availableWeight > 0
          ? Math.round((rawScore / availableWeight) * 100)
          : 0;

      return {
        ...job,
        matchScore,
        matchedSkills,
      };
    })
    .sort(
      (a, b) =>
        b.matchScore - a.matchScore ||
        new Date(b.postedAt ?? 0).getTime() -
          new Date(a.postedAt ?? 0).getTime()
    );
}
