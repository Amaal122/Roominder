import { useEffect, useState } from "react";
import { getAuthToken } from "./auth";

export type Property = {
  id: string;
  title: string;
  location: string;
  price: string;
  tenants: string;
  status: "Occupied" | "Available";
  image: string;
  beds: number;
  baths: number;
  size: number;
  views?: number;
  applications?: number;
};

const API_BASE = "http://127.0.0.1:8000";

type BackendProperty = {
  id: number;
  owner_id: number;
  title: string;
  address: string;
  city: string;
  price: number;
  rooms: number;
  description?: string | null;
  status: string;
  image_url?: string | null;
  created_at: string;
};

let properties: Property[] = [];
const listeners = new Set<() => void>();

export const getProperties = () => properties;

const notify = () => listeners.forEach((l) => l());

const toUiProperty = (p: BackendProperty): Property => {
  const status =
    p.status?.toLowerCase() === "occupied" ? "Occupied" : "Available";
  return {
    id: String(p.id),
    title: p.title,
    location: `${p.address}${p.city ? `, ${p.city}` : ""}`,
    price: `€${p.price}`,
    tenants: status === "Available" ? "Available" : "Occupied",
    status,
    beds: p.rooms ?? 1,
    baths: 1,
    size: 0,
    views: 0,
    applications: 0,
    image:
      p.image_url ||
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80",
  };
};

export const loadMyProperties = async () => {
  const token = getAuthToken();
  if (!token) return;
  const response = await fetch(`${API_BASE}/properties/mine`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    return;
  }
  const data: BackendProperty[] = await response.json();
  properties = data.map(toUiProperty);
  notify();
};

export const getPropertyById = (id: string) =>
  properties.find((p) => p.id === id);

export const addProperty = async (payload: {
  title: string;
  address: string;
  city: string;
  price: number;
  rooms: number;
  description?: string;
  image_url?: string;
}) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Not authenticated");
  }
  const response = await fetch(`${API_BASE}/properties`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Failed to create property");
  }
  const created = toUiProperty(data as BackendProperty);
  properties = [created, ...properties];
  notify();
  return created;
};

export const updateProperty = async (
  id: string,
  patch: Partial<Property> & {
    title?: string;
    address?: string;
    city?: string;
    price?: number;
    rooms?: number;
    description?: string;
    status?: string;
    image_url?: string;
  },
) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Not authenticated");
  }
  const response = await fetch(`${API_BASE}/properties/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(patch),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Failed to update property");
  }
  const updated = toUiProperty(data as BackendProperty);
  properties = properties.map((p) => (p.id === id ? updated : p));
  notify();
  return updated;
};

export const subscribeProperties = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useProperties = () => {
  const [list, setList] = useState(getProperties());

  useEffect(() => {
    loadMyProperties();
    return subscribeProperties(() => setList(getProperties()));
  }, []);

  return list;
};

export default function PropertiesState() {
  return null;
}
