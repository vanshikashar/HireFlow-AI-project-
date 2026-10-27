
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

const SKILL_LABELS: Record<string, string> = {
  nodejs: "Node.js",
  cpp: "C++",
  rest: "REST APIs",
  machinelearning: "Machine Learning",
  dataanalysis: "Data Analysis",
  powerbi: "Power BI",
  mongodb: "MongoDB",
  graphql: "GraphQL",
  javascript: "JavaScript",
  typescript: "TypeScript",
  aws: "AWS",
  html: "HTML",
  css: "CSS",
  sql: "SQL",
  git: "Git",
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

export interface ResumeSectionCheck {
  key: string;
  label: string;
  status: "found" | "not-detected" | "optional";
  detail: string;
}

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


function hasHeading(text: string, headings: string[]): boolean {
  return headings.some((heading) => {
    const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Accept headings on their own line, including headings followed
    // by a colon or a vertical separator.
    const pattern = new RegExp(
      `(?:^|\\n)\\s*${escaped}\\s*(?::|\\||\\n|$)`,
      "im",
    );

    return pattern.test(text);
  });
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
    .filter(
      (word) =>
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

function getResumeSections(resumeText: string): ResumeSectionCheck[] {
  // Preserve line breaks so headings can be detected at line boundaries.
  const text = resumeText.toLowerCase().replace(/\r\n?/g, "\n");
  const hasContact =
    /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(resumeText) ||
    /(?:\+?\d[\d\s().-]{7,}\d)/.test(resumeText);

  const checks: ResumeSectionCheck[] = [
    {
      key: "contact",
      label: "Contact information",
      status: hasContact ? "found" : "not-detected",
      detail: hasContact
        ? "An email address or phone-like number was detected."
        : "No recognizable email address or phone number was detected.",
    },
    {
      key: "summary",
      label: "Professional summary",
      status: hasHeading(text, [
        "professional summary",
        "summary",
        "profile",
        "career objective",
        "objective",
        "about me",
      ])
        ? "found"
        : "not-detected",
      detail: "Look for a brief introduction tailored to the target role.",
    },
    {
      key: "skills",
      label: "Skills",
      status: hasHeading(text, [
        "technical skills",
        "skills",
        "core competencies",
        "key skills",
        "technologies",
      ])
        ? "found"
        : "not-detected",
      detail: "Group relevant technical and professional skills clearly.",
    },
    {
      key: "experience",
      label: "Experience or internships",
      status: hasHeading(text, [
        "work experience",
        "professional experience",
        "experience",
        "employment history",
        "internships",
        "internship experience",
      ])
        ? "found"
        : "not-detected",
      detail: "Include roles, responsibilities, and achievements where applicable.",
    },
    {
      key: "projects",
      label: "Projects",
      status: hasHeading(text, [
        "projects",
        "academic projects",
        "personal projects",
        "key projects",
      ])
        ? "found"
        : "not-detected",
      detail: "Describe your contribution, technologies, and outcomes.",
    },
    {
      key: "education",
      label: "Education",
      status: hasHeading(text, [
        "education",
        "academic background",
        "educational qualifications",
      ])
        ? "found"
        : "not-detected",
      detail: "Include your degree, institution, and dates as appropriate.",
    },
    {
      key: "certifications",
      label: "Certifications",
      status: hasHeading(text, [
        "certifications",
        "certificates",
        "licenses",
        "certifications and licenses",
      ])
        ? "found"
        : "optional",
      detail: "Optional. Add relevant certifications if you have them.",
    },
  ];

  return checks;
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

  const displaySkills = (skills: string[]) =>
    skills.map(
      (skill) =>
        SKILL_LABELS[skill] ??
        skill.charAt(0).toUpperCase() + skill.slice(1),
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

  let matchScore = 0;

  if (skillScore !== null && keywordScore !== null) {
    matchScore = Math.round(skillScore * 0.7 + keywordScore * 0.3);
  } else if (skillScore !== null) {
    matchScore = skillScore;
  } else if (keywordScore !== null) {
    matchScore = keywordScore;
  }

  const sectionChecks = getResumeSections(resumeText);
  const suggestions: string[] = [];

  if (missingSkills.length > 0) {
    suggestions.push(
      `Review these job-related skills: ${displaySkills(missingSkills).join(", ")}. Include them only if you genuinely have the skills, and demonstrate them with relevant projects or experience.`,
    );
  }

  if (missingKeywords.length > 0) {
    suggestions.push(
      `Review these terms from the job description: ${missingKeywords.slice(0, 8).join(", ")}. Add relevant terms naturally where they accurately describe your experience.`,
    );
  }

  for (const section of sectionChecks) {
    if (section.status === "not-detected") {
      suggestions.push(
        `Review your ${section.label.toLowerCase()} section. ${section.detail}`,
      );
    }
  }

  if (
    !/\b(achieved|improved|reduced|increased|built|developed|implemented|delivered|automated|optimized)\b/i.test(
      resumeText,
    )
  ) {
    suggestions.push(
      "Where accurate, describe your contributions with specific action verbs and measurable outcomes.",
    );
  }

  if (suggestions.length === 0) {
    suggestions.push(
      "Review the resume for clarity, role relevance, consistent formatting, and evidence of your achievements.",
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
    matchedSkills: displaySkills(matchedSkills),
    missingSkills: displaySkills(missingSkills),
    matchedKeywords,
    missingKeywords,
    totalRequiredSkills: requiredSkills.length,
    totalKeywords: keywords.length,
    sectionChecks,
    suggestions,
    method: "weighted-keyword-match-v3",
    disclaimer:
      "This rule-based estimate compares resume text with recognized skills and keywords. It is not a validated ATS score, a measure of candidate quality, or a prediction of hiring outcomes. Section detection relies on recognizable headings, so a section may be present but not detected.",
  };
}
