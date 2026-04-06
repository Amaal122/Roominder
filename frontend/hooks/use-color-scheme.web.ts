import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { useSettings } from "@/app/state/settings";

type Scheme = "light" | "dark";

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);
  const { theme } = useSettings();

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const colorScheme = useRNColorScheme();

  if (theme === "Light") {
    return "light" as Scheme;
  }

  if (theme === "Dark") {
    return "dark" as Scheme;
  }

  if (hasHydrated) {
    return (colorScheme ?? "light") as Scheme;
  }

  return 'light' as Scheme;
}
