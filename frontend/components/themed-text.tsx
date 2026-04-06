import React from "react";
import { StyleSheet, Text, TextProps } from "react-native";
import { useThemeColor } from "@/hooks/use-theme-color";

type Props = TextProps & { type?: "title" | "subtitle" | "defaultSemiBold" };

export const ThemedText: React.FC<Props> = ({
  children,
  style,
  type,
  ...rest
}) => {
  const color = useThemeColor({}, "text");
  const typeStyle =
    type === "title"
      ? styles.title
      : type === "subtitle"
        ? styles.subtitle
        : undefined;
  return (
    <Text style={[{ color }, typeStyle, style]} {...rest}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: "800" },
  subtitle: { fontSize: 16, fontWeight: "700" },
});

export default ThemedText;
