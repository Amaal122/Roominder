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

let ws: WebSocket | null = null;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let isManualDisconnect = false;
let onNotificationCallback: ((notification: AppNotification) => void) | null = null;

export const connectWebSocket = async (onNotification: (notification: AppNotification) => void) => {
  onNotificationCallback = onNotification;
  isManualDisconnect = false;

  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return;
  }

  const token = await getAuthToken();
  if (!token) return;

  const wsUrl = `ws://127.0.0.1:8001/ws/notifications?token=${encodeURIComponent(token)}`;
  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log("WebSocket connected for notifications");
  };

  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      if (message.type === "notification") {
        onNotificationCallback?.(message.data);
      }
    } catch (error) {
      console.error("Failed to parse WebSocket message:", error);
    }
  };

  ws.onclose = () => {
    console.log("WebSocket disconnected");
    ws = null;

    if (isManualDisconnect || !onNotificationCallback) {
      return;
    }

    reconnectTimeout = setTimeout(() => {
      if (onNotificationCallback) {
        void connectWebSocket(onNotificationCallback);
      }
    }, 5000);
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
  };
};

export const disconnectWebSocket = () => {
  isManualDisconnect = true;

  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  if (ws) {
    ws.close();
    ws = null;
  }
  onNotificationCallback = null;
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

export const respondToRentalApplication = async (
  rentalApplicationId: number,
  status: "accepted" | "rejected",
) => {
  const headers = await getHeaders();
  const response = await fetch(
    `${API_BASE}/rental-applications/${rentalApplicationId}/status?status=${encodeURIComponent(status)}`,
    {
      method: "PUT",
      headers,
    },
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to update rental application");
  }

  return data;
};

export default function NotificationsState() {
  return null;
}
