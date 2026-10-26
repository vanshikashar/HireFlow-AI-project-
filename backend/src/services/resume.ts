const SKILL_ALIASES: Record<string, string[]> = {
  javascript: ["javascript", "js", "ecmascript"],
  typescript: ["typescript", "ts"],
  react: ["react", "react.js", "reactjs"],
  nodejs: ["node.js", "nodejs", "node js"],
  mongodb: ["mongodb", "mongo db"],
  html: ["html", "html5"],
  css: ["css", "css3"]
};

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function containsSkill(text: string, phrase: string): boolean {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(^|[^a-z0-9+#.])${escaped}(?=$|[^a-z0-9+#.])`, "i");

  return pattern.test(text);
}

export function analyzeResume(
  resumeText: string,
  requiredSkills: string[]
) {
  const normalizedText = normalize(resumeText);

  const skills = [...new Set(
    requiredSkills.map((skill) => skill.trim()).filter(Boolean)
  )];

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const skill of skills) {
    const key = skill.toLowerCase();
    const aliases = SKILL_ALIASES[key] ?? [key];

    const matched = aliases.some((alias) =>
      containsSkill(normalizedText, normalize(alias))
    );

    if (matched) matchedSkills.push(skill);
    else missingSkills.push(skill);
  }

  const score = skills.length === 0
    ? 0
    : Math.round((matchedSkills.length / skills.length) * 100);

  return {
    score,
    matchedSkills,
    missingSkills,
    totalRequired: skills.length,
    method: "normalized-keyword-match-v1"
  };
}