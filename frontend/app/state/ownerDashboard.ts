import { useEffect, useState } from "react";

let pendingCount = 0;
const listeners = new Set<() => void>();

export const getPendingCount = () => pendingCount;

export const setPendingCount = (value: number) => {
  pendingCount = value;
  listeners.forEach((listener) => listener());
};

export const incrementPending = () => {
  pendingCount += 1;
  listeners.forEach((listener) => listener());
};

export const subscribePending = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const usePendingCount = () => {
  const [count, setCount] = useState(getPendingCount());

  useEffect(() => {
    return subscribePending(() => setCount(getPendingCount()));
  }, []);

  return count;
};

// Expo Router treats files under app/ as routes; provide a no-op component to satisfy default export requirement.
export default function OwnerDashboardState() {
  return null;
}
