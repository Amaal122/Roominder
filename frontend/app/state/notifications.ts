import { getAuthToken } from "./auth";

const API_BASE = "http://127.0.0.1:8001";

export type AppNotification = {
  id: number;
  user_id: number;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
  visit_id?: number | null;
  visit_status?: string | null;
  can_act: boolean;
};

const getHeaders = async () => {
  const token = await getAuthToken();
  if (!token) {
    throw new Error("Missing auth token");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const fetchNotifications = async (): Promise<AppNotification[]> => {
  const headers = await getHeaders();
  const response = await fetch(`${API_BASE}/notifications/`, { headers });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to fetch notifications");
  }

  return data as AppNotification[];
};

export const markNotificationRead = async (notificationId: number) => {
  const headers = await getHeaders();
  const response = await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
    method: "PUT",
    headers,
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to mark notification as read");
  }

  return data as AppNotification;
};

export const markAllNotificationsRead = async () => {
  const headers = await getHeaders();
  const response = await fetch(`${API_BASE}/notifications/read-all`, {
    method: "PUT",
    headers,
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to mark all notifications as read");
  }

  return data as { updated: number };
};

export const respondToVisitRequest = async (
  visitId: number,
  status: "confirmed" | "cancelled",
) => {
  const headers = await getHeaders();
  const response = await fetch(`${API_BASE}/visits/${visitId}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ status }),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to update visit request");
  }

  return data;
};

export default function NotificationsState() {
  return null;
}
