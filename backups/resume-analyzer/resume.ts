
const SKILL_ALIASES: Record<string, string[]> = {
  javascript: ["javascript", "js", "ecmascript"],
  typescript: ["typescript", "ts"],
  react: ["react", "react.js", "reactjs"],
  nodejs: ["node.js", "nodejs", "node js"],
  express: ["express.js", "express"],
  python: ["python", "python3"],
  java: ["java"],
  cpp: ["c++", "cpp"],
  sql: ["sql", "mysql", "postgresql", "postgres"],
  mongodb: ["mongodb", "mongo db"],
  html: ["html", "html5"],
  css: ["css", "css3"],
  git: ["git", "github", "gitlab"],
  aws: ["aws", "amazon web services"],
  docker: ["docker"],
  kubernetes: ["kubernetes", "k8s"],
  terraform: ["terraform"],
  jenkins: ["jenkins"],
  linux: ["linux"],
  rest: ["rest api", "restful api", "restful services"],
  graphql: ["graphql"],
  testing: ["unit testing", "integration testing", "software testing"],
  agile: ["agile", "scrum"],
  communication: ["communication", "communication skills"],
  leadership: ["leadership", "team leadership"],
  machinelearning: ["machine learning", "ml"],
  tensorflow: ["tensorflow"],
  pytorch: ["pytorch"],
  pandas: ["pandas"],
  numpy: ["numpy"],
  dataanalysis: ["data analysis", "data analytics"],
  powerbi: ["power bi"],
  tableau: ["tableau"],
  figma: ["figma"],
};

const STOP_WORDS = new Set([
  "about", "after", "also", "and", "are", "all", "any", "our",
  "you", "your", "the", "for", "from", "with", "will", "work",
  "working", "role", "job", "team", "this", "that", "have",
  "has", "had", "who", "what", "when", "where", "how", "can",
  "may", "must", "should", "their", "they", "them", "into",
  "using", "used", "use", "able", "ability", "years", "year",
  "experience", "skills", "skill", "knowledge", "strong",
  "required", "requirements", "preferred", "responsibilities",
  "responsibility", "candidate", "candidates", "including",
  "such", "other", "etc", "per", "each", "both", "across",
  "within", "through", "more", "than", "not", "but", "while",
  "build", "develop", "maintain", "support", "ensure",
]);

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function containsPhrase(text: string, phrase: string): boolean {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `(^|[^a-z0-9+#.])${escaped}(?=$|[^a-z0-9+#.])`,
    "i",
  );

  return pattern.test(text);
}

function getRequiredSkills(jobDescription: string): string[] {
  const description = normalize(jobDescription);

  return Object.entries(SKILL_ALIASES)
    .filter(([, aliases]) =>
      aliases.some((alias) => containsPhrase(description, alias)),
    )
    .map(([skill]) => skill);
}

function getImportantKeywords(jobDescription: string): string[] {
  const tokens = normalize(jobDescription)
    .replace(/[^a-z0-9+#.]/g, " ")
    .split(/\s+/)
    .filter((word) =>
      word.length >= 3 &&
      !STOP_WORDS.has(word) &&
      !/^\d+$/.test(word),
    );

  const frequency = new Map<string, number>();

  for (const token of tokens) {
    frequency.set(token, (frequency.get(token) ?? 0) + 1);
  }

  return [...frequency.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 15)
    .map(([word]) => word);
}

export function analyzeResume(
  resumeText: string,
  jobDescription: string,
) {
  const resume = normalize(resumeText);
  const requiredSkills = getRequiredSkills(jobDescription);

  const matchedSkills = requiredSkills.filter((skill) =>
    SKILL_ALIASES[skill].some((alias) => containsPhrase(resume, alias)),
  );

  const missingSkills = requiredSkills.filter(
    (skill) => !matchedSkills.includes(skill),
  );

  const keywords = getImportantKeywords(jobDescription);

  const matchedKeywords = keywords.filter((keyword) =>
    containsPhrase(resume, keyword),
  );

  const missingKeywords = keywords.filter(
    (keyword) => !matchedKeywords.includes(keyword),
  );

  const skillScore =
    requiredSkills.length === 0
      ? null
      : Math.round((matchedSkills.length / requiredSkills.length) * 100);

  const keywordScore =
    keywords.length === 0
      ? null
      : Math.round((matchedKeywords.length / keywords.length) * 100);

  // Weight skills at 70% and keywords at 30%.
  // If the description has no recognized skills, use keyword coverage alone.
  let matchScore = 0;

  if (skillScore !== null && keywordScore !== null) {
    matchScore = Math.round(skillScore * 0.7 + keywordScore * 0.3);
  } else if (skillScore !== null) {
    matchScore = skillScore;
  } else if (keywordScore !== null) {
    matchScore = keywordScore;
  }

  const suggestions: string[] = [];

  if (missingSkills.length > 0) {
    suggestions.push(
      `If you genuinely have these skills, demonstrate them with relevant projects or experience: ${missingSkills.join(", ")}.`,
    );
  }

  if (missingKeywords.length > 0) {
    suggestions.push(
      `Review the job description for relevant terms missing from your resume: ${missingKeywords.slice(0, 8).join(", ")}.`,
    );
  }

  if (!/\b(project|projects)\b/i.test(resumeText)) {
    suggestions.push(
      "Consider adding a Projects section with your contributions, technologies, and measurable outcomes.",
    );
  }

  if (!/\b(achieved|improved|reduced|increased|built|developed|implemented|delivered)\b/i.test(resumeText)) {
    suggestions.push(
      "Use specific action verbs and measurable results to describe your work where accurate.",
    );
  }

  if (suggestions.length === 0) {
    suggestions.push(
      "Review the resume for clarity, relevant evidence, and measurable achievements before applying.",
    );
  }

  return {
    matchScore,
    scoreBreakdown: {
      skillScore,
      keywordScore,
      skillWeight: skillScore === null ? 0 : 70,
      keywordWeight: keywordScore === null ? 0 : 30,
    },
    matchedSkills,
    missingSkills,
    matchedKeywords,
    missingKeywords,
    totalRequiredSkills: requiredSkills.length,
    totalKeywords: keywords.length,
    suggestions,
    method: "weighted-keyword-match-v2",
    disclaimer:
      "This rule-based estimate compares text and recognized keywords. It is not a validated ATS score, a measure of candidate quality, or a prediction of hiring outcomes. Keyword frequency and wording can affect results.",
  };
}
