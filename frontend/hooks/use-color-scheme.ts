import { useColorScheme as useRNColorScheme } from "react-native";

import { useSettings } from "@/app/state/settings";

type Scheme = "light" | "dark";

export function useColorScheme(): Scheme {
	const { theme } = useSettings();
	const systemScheme = useRNColorScheme();

	if (theme === "Light") return "light";
	if (theme === "Dark") return "dark";

	return (systemScheme ?? "light") as Scheme;
}
