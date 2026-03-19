import { useEffect, useState } from "react";

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

const seed: Property[] = [
  {
    id: "1",
    title: "Modern Loft in Marais",
    location: "Le Marais, Paris",
    price: "€1200",
    tenants: "2 tenants",
    status: "Occupied",
    beds: 2,
    baths: 1,
    size: 65,
    views: 247,
    applications: 2,
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "2",
    title: "Bright Flat near Canal",
    location: "Canal Saint-Martin, Paris",
    price: "€980",
    tenants: "Available",
    status: "Available",
    beds: 1,
    baths: 1,
    size: 48,
    views: 180,
    applications: 1,
    image:
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "3",
    title: "Cozy Studio in Bastille",
    location: "Bastille, Paris",
    price: "€850",
    tenants: "1 tenant",
    status: "Occupied",
    beds: 1,
    baths: 1,
    size: 32,
    views: 132,
    applications: 0,
    image:
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=80",
  },
];

let properties: Property[] = [...seed];
const listeners = new Set<() => void>();

export const getProperties = () => properties;

export const addProperty = (property: Property) => {
  properties = [property, ...properties];
  listeners.forEach((l) => l());
};

export const removeProperty = (id: string) => {
  properties = properties.filter((p) => p.id !== id);
  listeners.forEach((l) => l());
};

export const updateProperty = (id: string, patch: Partial<Property>) => {
  properties = properties.map((p) => (p.id === id ? { ...p, ...patch } : p));
  listeners.forEach((l) => l());
};

export const getPropertyById = (id: string) =>
  properties.find((p) => p.id === id);

export const subscribeProperties = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useProperties = () => {
  const [list, setList] = useState(getProperties());

  useEffect(() => {
    return subscribeProperties(() => setList(getProperties()));
  }, []);

  return list;
};

export default function PropertiesState() {
  return null;
}
