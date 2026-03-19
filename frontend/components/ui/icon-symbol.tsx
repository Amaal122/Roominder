import React from "react";
import { Text } from "react-native";

type Props = { name?: string; size?: number; color?: string };

export const IconSymbol: React.FC<Props> = ({
  name,
  size = 20,
  color = "#000",
}) => {
  // Simple placeholder icon renderer using the name as fallback
  return <Text style={{ fontSize: size, color }}>{name ?? "◻️"}</Text>;
};

export default IconSymbol;
