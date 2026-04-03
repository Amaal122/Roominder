import { useEffect, useState } from "react";

import { getAuthToken } from "./auth";

const API_BASE = "http://127.0.0.1:8001";

let pendingCount = 0;
const pendingListeners = new Set<() => void>();

export const getPendingCount = () => pendingCount;

export const setPendingCount = (value: number) => {
  pendingCount = value;
  pendingListeners.forEach((listener) => listener());
};

export const incrementPending = () => {
  pendingCount += 1;
  pendingListeners.forEach((listener) => listener());
};

export const subscribePending = (listener: () => void) => {
  pendingListeners.add(listener);
  return () => {
    pendingListeners.delete(listener);
  };
};

export const usePendingCount = () => {
  const [count, setCount] = useState(getPendingCount());

  useEffect(() => subscribePending(() => setCount(getPendingCount())), []);

  return count;
};

export type OwnerStats = {
  monthly_revenue: number;
  occupancy_percent: number;
  pending_count: number;
  total_properties: number;
  currency: string;
};

let stats: OwnerStats = {
  monthly_revenue: 0,
  occupancy_percent: 0,
  pending_count: 0,
  total_properties: 0,
  currency: "DT",
};

const statsListeners = new Set<() => void>();

export const getStats = () => stats;

export const setStats = (value: OwnerStats) => {
  stats = value;
  setPendingCount(value.pending_count);
  statsListeners.forEach((listener) => listener());
};

export const subscribeStats = (listener: () => void) => {
  statsListeners.add(listener);
  return () => {
    statsListeners.delete(listener);
  };
};

export const useStats = () => {
  const [data, setData] = useState(getStats());

  useEffect(() => subscribeStats(() => setData(getStats())), []);

  return data;
};

export const loadStats = async () => {
  try {
    const token = await getAuthToken();
    if (!token) {
      return;
    }

    const response = await fetch(`${API_BASE}/stats/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return;
    }

    const data = (await response.json()) as Partial<OwnerStats>;
    setStats({
      monthly_revenue: Number(data.monthly_revenue ?? 0),
      occupancy_percent: Number(data.occupancy_percent ?? 0),
      pending_count: Number(data.pending_count ?? 0),
      total_properties: Number(data.total_properties ?? 0),
      currency:
        typeof data.currency === "string" && data.currency.trim().length > 0
          ? data.currency
          : "DT",
    });
  } catch (error) {
    console.error("Erreur chargement stats:", error);
  }
};

export default function OwnerDashboardState() {
  return null;
}
