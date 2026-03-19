import React from "react";
import { StyleSheet, Text, View } from "react-native";

export const HelloWave: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.wave}>👋</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center" },
  wave: { fontSize: 22 },
});

export default HelloWave;
