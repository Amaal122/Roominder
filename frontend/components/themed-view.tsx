import React from "react";
import { View, ViewProps } from "react-native";
import { useThemeColor } from "@/hooks/use-theme-color";

export const ThemedView: React.FC<ViewProps> = ({ children, style, ...rest }) => {
  const backgroundColor = useThemeColor({}, "background");
  return (
    <View style={[{ backgroundColor }, style]} {...rest}>
      {children}
    </View>
  );
};

export default ThemedView;
