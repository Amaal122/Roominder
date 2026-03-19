import { useEffect, useState } from "react";

export type MatchProfile = {
  id: string;
  name: string;
  age: number;
  role: string;
  location: string;
  image: string;
  match: number;
};

type Subscriber = (profiles: MatchProfile[]) => void;

let matches: MatchProfile[] = [];
const subscribers: Subscriber[] = [];

const notify = () => {
  subscribers.forEach((callback) => callback([...matches]));
};

export const addMatch = (profile: MatchProfile) => {
  const exists = matches.some((item) => item.id === profile.id);
  if (exists) return;
  matches = [profile, ...matches];
  notify();
};

export const useMatchesStore = () => {
  const [data, setData] = useState<MatchProfile[]>(matches);

  useEffect(() => {
    const subscriber: Subscriber = (updated) => setData(updated);
    subscribers.push(subscriber);

    return () => {
      const idx = subscribers.indexOf(subscriber);
      if (idx >= 0) subscribers.splice(idx, 1);
    };
  }, []);

  return data;
};
