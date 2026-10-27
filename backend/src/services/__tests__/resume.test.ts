
import { describe, expect, it } from "vitest";
import { analyzeResume } from "../resume.js";

describe("analyzeResume", () => {
  const jobDescription =
    "We need a developer with JavaScript, TypeScript, React, Node.js, " +
    "MongoDB, REST APIs, Git, AWS, and Docker experience. " +
    "The candidate should build applications and write tests.";

  it("returns the expected report structure", () => {
    const resumeText = `
      SUMMARY
      Software developer with JavaScript and React experience.

      TECHNICAL SKILLS
      JavaScript, React, Node.js, Git.

      PROJECTS
      Built and developed a web application.

      EDUCATION
      Bachelor of Technology.
      
      CONTACT
      developer@example.com
    `;

    const report = analyzeResume(resumeText, jobDescription);

    expect(report.matchScore).toBeGreaterThanOrEqual(0);
    expect(report.matchScore).toBeLessThanOrEqual(100);
    expect(report.scoreBreakdown).toBeDefined();
    expect(report.matchedSkills).toContain("JavaScript");
    expect(report.matchedSkills).toContain("React");
    expect(report.missingSkills).toContain("Docker");
    expect(report.sectionChecks).toBeDefined();
    expect(report.suggestions.length).toBeGreaterThan(0);
    expect(report.disclaimer).toBeTruthy();
  });

  it("detects common resume sections", () => {
    const resumeText = `
      developer@example.com

      PROFESSIONAL SUMMARY
      Software developer.

      TECHNICAL SKILLS
      JavaScript, React.

      WORK EXPERIENCE
      Developed applications.

      PROJECTS
      Built a portfolio.

      EDUCATION
      Bachelor of Technology.
    `;

    const report = analyzeResume(resumeText, jobDescription);
    const statusByKey = Object.fromEntries(
      report.sectionChecks.map((section) => [
        section.key,
        section.status,
      ]),
    );

    expect(statusByKey.contact).toBe("found");
    expect(statusByKey.summary).toBe("found");
    expect(statusByKey.skills).toBe("found");
    expect(statusByKey.experience).toBe("found");
    expect(statusByKey.projects).toBe("found");
    expect(statusByKey.education).toBe("found");
    expect(statusByKey.certifications).toBe("optional");
  });

  it("reports missing skills without inventing resume content", () => {
    const resumeText = `
      SKILLS
      HTML and CSS.

      PROJECTS
      Built a static webpage.
    `;

    const report = analyzeResume(resumeText, jobDescription);

    expect(report.missingSkills).toContain("Docker");
    expect(report.missingSkills).toContain("AWS");
    expect(report.matchedSkills).not.toContain("Docker");
  });

  it("returns a valid score when no recognized skills are present", () => {
    const report = analyzeResume(
      "A candidate who enjoys learning and solving problems.",
      "The successful applicant will collaborate with colleagues and contribute to business outcomes.",
    );

    expect(report.matchScore).toBeGreaterThanOrEqual(0);
    expect(report.matchScore).toBeLessThanOrEqual(100);
    expect(report.scoreBreakdown.skillScore).toBeNull();
  });

  it("marks missing resume sections as not detected", () => {
    const report = analyzeResume(
      "A short profile with some general information.",
      jobDescription,
    );

    const projects = report.sectionChecks.find(
      (section) => section.key === "projects",
    );

    expect(projects?.status).toBe("not-detected");
  });
});
