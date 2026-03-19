import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";

type Props = {
  headerBackgroundColor?: { light?: string; dark?: string };
  headerImage?: React.ReactNode;
  children?: React.ReactNode;
};

const ParallaxScrollView: React.FC<Props> = ({ headerImage, children }) => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {headerImage && <View style={styles.header}>{headerImage}</View>}
      <View style={styles.content}>{children}</View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { paddingBottom: 40 },
  header: { height: 180, overflow: "hidden" },
  content: { padding: 16 },
});

export default ParallaxScrollView;
