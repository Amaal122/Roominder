import { useEffect, useState } from "react";

export type FavoriteItem = {
  id: string;
  title: string;
  location?: string;
  price?: string;
  image?: string;
};

type Subscriber = (items: FavoriteItem[]) => void;

let favorites: FavoriteItem[] = [];
const subscribers: Subscriber[] = [];

const notify = () => {
  subscribers.forEach((cb) => cb([...favorites]));
};

export const addFavorite = (item: FavoriteItem) => {
  const exists = favorites.some((fav) => fav.id === item.id);
  if (exists) return;
  favorites = [item, ...favorites];
  notify();
};

export const useFavoritesStore = () => {
  const [items, setItems] = useState<FavoriteItem[]>(favorites);

  useEffect(() => {
    const subscriber: Subscriber = (next) => setItems(next);
    subscribers.push(subscriber);
    return () => {
      const idx = subscribers.indexOf(subscriber);
      if (idx >= 0) subscribers.splice(idx, 1);
    };
  }, []);

  return items;
};
