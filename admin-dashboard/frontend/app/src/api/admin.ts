const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002").replace(/\/$/, "");

type Stat = {
  label: string;
  value: string | number;
  meta: string;
  accent: string;
  icon: string;
};

type Activity = {
  initials: string;
  title: string;
  subtitle: string;
  time: string;
};

type ModerationRow = {
  item: string;
  owner: string;
  type: string;
  status: string;
};

type AdminLoginResponse = {
  message: string;
  admin: {
    id: number;
    email: string;
    full_name: string;
    role: string;
  };
};

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, init);

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Admin API ${res.status} for ${path}: ${body}`);
  }

  return res.json();
}

export async function loginAdmin(email: string, password: string) {
  return fetchJson<AdminLoginResponse>("/admin/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
}

export async function signupAdmin(fullName: string, email: string, password: string) {
  return fetchJson<AdminLoginResponse>("/admin/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      full_name: fullName,
      email,
      password,
    }),
  });
}

export async function getStats() {
  return fetchJson<Stat[]>("/admin/stats");
}

export async function getModerationQueue() {
  return fetchJson<ModerationRow[]>("/admin/moderation-queue");
}

export async function getActivities() {
  return fetchJson<Activity[]>("/admin/activities");
}

export async function approveModerationCase(id: string) {
  return fetchJson(`/admin/moderation/${id}?status=approved`, {
    method: "POST",
  });
}
