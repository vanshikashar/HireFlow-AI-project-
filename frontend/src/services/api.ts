
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  employmentType: string;
  workMode: string;
  experience: string;
  description: string;
  skills: string[];
  salaryMin?: number;
  salaryMax?: number;
  postedAt?: string;
}

export interface JobsResponse {
  items: Job[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getJobs(search = ""): Promise<JobsResponse> {
  const params = new URLSearchParams();

  if (search.trim()) {
    params.set("search", search.trim());
  }

  const query = params.toString();
  const response = await fetch(
    `${API_BASE_URL}/api/jobs${query ? `?${query}` : ""}`,
    { headers: { Accept: "application/json" } },
  );

  if (!response.ok) {
    throw new Error(`Failed to load jobs (${response.status})`);
  }

  return response.json() as Promise<JobsResponse>;
}


export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

async function authRequest<T>(
  path: string,
  body?: Record<string, string>,
): Promise<T> {
  const response = await fetch(`${API_BASE}/api/auth${path}`, {
    method: body ? "POST" : "GET",
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || `Request failed (${response.status})`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}) {
  return authRequest<{ user: AuthUser }>("/register", input);
}

export async function loginUser(input: {
  email: string;
  password: string;
}) {
  return authRequest<{ user: AuthUser }>("/login", input);
}

export async function getCurrentUser() {
  return authRequest<{ user: AuthUser }>("/me");
}

export async function logoutUser() {
  return authRequest<void>("/logout", {});
}


export type ApplicationStatus =
  | "Applied"
  | "Shortlisted"
  | "Interview"
  | "Offer"
  | "Rejected";

export interface TrackedApplication {
  _id: string;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt?: string;
  notes: string;
  jobId: Job | string;
}

export interface ApplicationsResponse {
  items: TrackedApplication[];
}

async function applicationRequest<T>(
  path: string,
  method = "GET",
  body?: Record<string, string>,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/api/applications${path}`, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || `Request failed (${response.status})`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function getApplications() {
  return applicationRequest<ApplicationsResponse>("/");
}

export function createApplication(jobId: string) {
  return applicationRequest<{ application: TrackedApplication }>(
    "/",
    "POST",
    { jobId },
  );
}

export function updateApplication(
  id: string,
  changes: { status?: ApplicationStatus; notes?: string },
) {
  return applicationRequest<{ application: TrackedApplication }>(
    `/${encodeURIComponent(id)}`,
    "PATCH",
    changes as Record<string, string>,
  );
}

export function deleteApplication(id: string) {
  return applicationRequest<void>(`/${encodeURIComponent(id)}`, "DELETE");
}


export interface SavedJob {
  _id: string;
  createdAt: string;
  jobId: Job | string;
}

export interface SavedJobsResponse {
  items: SavedJob[];
}

async function savedJobsRequest<T>(
  path: string,
  method = "GET",
  body?: { jobId: string },
): Promise<T> {
  const response = await fetch(
    `${API_BASE_URL}/api/saved-jobs${path}`,
    {
      method,
      credentials: "include",
      headers: body
        ? { "Content-Type": "application/json" }
        : undefined,
      body: body ? JSON.stringify(body) : undefined,
    },
  );

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(
      data?.message || `Saved-jobs request failed (${response.status})`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function getSavedJobs() {
  return savedJobsRequest<SavedJobsResponse>("/");
}

export function saveJob(jobId: string) {
  return savedJobsRequest<{ savedJob: SavedJob }>(
    "/",
    "POST",
    { jobId },
  );
}

export function removeSavedJob(jobId: string) {
  return savedJobsRequest<void>(
    `/${encodeURIComponent(jobId)}`,
    "DELETE",
  );
}


export interface JobPreferences {
  skills: string[];
  preferredLocations: string[];
  preferredWorkModes: ("Remote" | "Hybrid" | "On-site")[];
  preferredEmploymentTypes: ("Full-time" | "Internship" | "Contract")[];
  experienceLevel: string;
}

export interface RecommendedJob extends Job {
  matchScore: number;
  matchedSkills: string[];
}

export interface RecommendedJobsResponse {
  items: RecommendedJob[];
  message?: string;
}

async function recommendationsRequest<T>(
  path: string,
  method = "GET",
  body?: JobPreferences,
): Promise<T> {
  const response = await fetch(
    `${API_BASE_URL}/api/recommendations${path}`,
    {
      method,
      credentials: "include",
      headers: body
        ? { "Content-Type": "application/json" }
        : undefined,
      body: body ? JSON.stringify(body) : undefined,
    },
  );

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(
      data?.message || `Recommendation request failed (${response.status})`,
    );
  }

  return response.json() as Promise<T>;
}

export function getJobPreferences() {
  return recommendationsRequest<{ preferences: JobPreferences }>(
    "/preferences",
  );
}

export function saveJobPreferences(preferences: JobPreferences) {
  return recommendationsRequest<{ preferences: JobPreferences }>(
    "/preferences",
    "PUT",
    preferences,
  );
}

export function getRecommendedJobs() {
  return recommendationsRequest<RecommendedJobsResponse>("/");
}
