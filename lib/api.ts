const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

export const API_URL = configuredApiUrl || "";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type RequestOptions = RequestInit & {
  token?: string | null;
};

async function parseResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

export async function apiRequest<T>(
  path: string,
  { token, headers, ...init }: RequestOptions = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {})
    }
  });

  const body = await parseResponse(response);

  if (!response.ok) {
    const message =
      typeof body === "object" && body && "error" in body
        ? String(body.error)
        : response.statusText;
    throw new ApiError(message, response.status);
  }

  return body as T;
}

export interface SessionUser {
  id: number;
  email: string;
  fullName?: string | null;
  accountType?: string | null;
  professionalRole?: string | null;
  role?: string | null;
  brandVoice?: string | null;
  website?: string | null;
  industry?: string | null;
}

export interface AuthProviders {
  emailPassword: boolean;
  google: boolean;
  linkedin: boolean;
}

export async function registerUser(payload: {
  email: string;
  password: string;
  full_name?: string;
}) {
  return apiRequest<{ user: SessionUser; token: string }>("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export async function loginUser(payload: { email: string; password: string }) {
  return apiRequest<{ user: SessionUser; token: string }>("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export async function fetchCurrentUser(token: string) {
  return apiRequest<{ user: SessionUser }>("/api/auth/me", { token });
}

export async function fetchAuthProviders() {
  return apiRequest<{ providers: AuthProviders }>("/api/auth/providers");
}

export async function saveOnboarding(
  token: string,
  payload: Record<string, unknown>
) {
  return apiRequest<{ message: string; nextStep: string }>("/api/auth/onboarding", {
    method: "POST",
    token,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export async function fetchProjects(token: string) {
  return apiRequest<{ projects: any[] }>("/api/projects", { token });
}

export async function fetchProjectDetail(token: string, projectId: string) {
  return apiRequest<{ project: any; drafts: any[]; analysis: any | null; buildStatus?: any | null }>(
    `/api/projects/${projectId}`,
    { token }
  );
}

export async function createProject(token: string, payload: any) {
  return apiRequest<{ project: any; portfolioDraft: any; analysis?: any | null; buildStatus?: any | null }>(
    "/api/projects",
    {
      method: "POST",
      token,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }
  );
}

export async function fetchProjectBuildStatus(token: string, projectId: string) {
  return apiRequest<{ project: any; buildStatus: any }>(`/api/projects/${projectId}/build-status`, {
    token
  });
}

export async function savePortfolio(
  token: string,
  projectId: string,
  payload: { contentJson: unknown; isPublished?: boolean }
) {
  return apiRequest<{ portfolio: any }>(`/api/projects/${projectId}/portfolio`, {
    method: "PUT",
    token,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export async function analyzeProject(
  token: string,
  projectId: string,
  payload: { objective: string; tone: string }
) {
  return apiRequest<any>(`/api/amplify/${projectId}/analyze`, {
    method: "POST",
    token,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export async function generateContent(
  token: string,
  payload: {
    projectId: string;
    platform: string;
    tone: string;
    objective: string;
    contentType?: string;
  }
) {
  return apiRequest<any>("/api/amplify/generate-content", {
    method: "POST",
    token,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export async function updateGeneratedDraft(
  token: string,
  draftId: string,
  payload: {
    draftData?: {
      headline?: string;
      body?: string;
      cta?: string;
      tags?: string[];
    };
    tone?: string;
    objective?: string;
    contentType?: string;
  }
) {
  return apiRequest<{ draft: any }>(`/api/amplify/drafts/${draftId}`, {
    method: "PUT",
    token,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export async function scheduleGeneratedDraft(
  token: string,
  draftId: string,
  scheduledFor: string
) {
  return apiRequest<{ message: string; draft: any }>(`/api/amplify/drafts/${draftId}/schedule`, {
    method: "POST",
    token,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ scheduledFor })
  });
}

export async function exportGeneratedDraft(token: string, draftId: string) {
  return apiRequest<{ mode: string; draft: any; exportPayload: any }>(
    `/api/amplify/drafts/${draftId}/export`,
    {
      method: "POST",
      token
    }
  );
}

export async function publishGeneratedDraft(token: string, draftId: string) {
  return apiRequest<{
    mode: string;
    message: string;
    draft: any;
    exportPayload?: any;
    externalPostId?: string | null;
  }>(`/api/amplify/drafts/${draftId}/publish`, {
    method: "POST",
    token
  });
}

export async function fetchReviews(token: string) {
  return apiRequest<{ summary: any; reviews: any[] }>("/api/orm", { token });
}

export async function generateReviewDraft(
  token: string,
  reviewId: string,
  tone: string
) {
  return apiRequest<{ draft: string }>(`/api/orm/${reviewId}/respond`, {
    method: "POST",
    token,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ tone })
  });
}

export async function approveReviewDraft(
  token: string,
  reviewId: string,
  responseDraft: string
) {
  return apiRequest<{ message: string; responseDraft: string }>(
    `/api/orm/${reviewId}/approve`,
    {
      method: "POST",
      token,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ responseDraft })
    }
  );
}

export async function fetchChannelStatus(token: string) {
  return apiRequest<{ channels: any[] }>("/api/channels/status", { token });
}

export async function fetchConnectUrl(
  token: string,
  platform: "linkedin" | "dribbble" | "googlemybusiness",
  returnTo?: string
) {
  const params = new URLSearchParams();

  if (returnTo) {
    params.set("returnTo", returnTo);
  }

  return apiRequest<{ url: string }>(
    `/api/channels/${platform}/connect-url${params.toString() ? `?${params.toString()}` : ""}`,
    { token }
  );
}

export async function fetchBehanceExportTemplate(token: string, projectId?: string) {
  const params = new URLSearchParams();
  if (projectId) {
    params.append('projectId', projectId);
  }
  const queryString = params.toString() ? `?${params.toString()}` : '';
  return apiRequest<any>(`/api/channels/behance/export-template${queryString}`, { token });
}

export async function generateSocialContent(
  token: string,
  payload: {
    projectId: string;
    platform: string;
    tone?: string;
  }
) {
  return apiRequest<{ content: string }>("/api/amplify/generate-social-content", {
    method: "POST",
    token,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export async function generateImagePrompt(
  token: string,
  payload: {
    projectId: string;
    style?: string;
  }
) {
  return apiRequest<{ prompt: string }>("/api/amplify/generate-image-prompt", {
    method: "POST",
    token,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export async function generateText(
  token: string,
  payload: {
    systemPrompt: string;
    userPrompt: string;
    options?: {
      temperature?: number;
      maxTokens?: number;
    };
  }
) {
  return apiRequest<{ text: string }>("/api/amplify/generate-text", {
    method: "POST",
    token,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}
