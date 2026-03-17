import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

type Props = {
  lat: number;
  lng: number;
};

export default function PropertyMap({ lat, lng }: Props) {
  if (Platform.OS === "web") {
    return (
      <View style={styles.webPlaceholder}>
        <View style={styles.pin} />
        <Text style={styles.webTitle}>Map Preview</Text>
        <Text style={styles.webCoords}>
          {lat.toFixed(4)}, {lng.toFixed(4)}
        </Text>
      </View>
    );
  }

  return (
    <MapView
      provider={PROVIDER_GOOGLE}
      style={StyleSheet.absoluteFill}
      initialRegion={{
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
    >
      <Marker coordinate={{ latitude: lat, longitude: lng }} />
    </MapView>
  );
}

const styles = StyleSheet.create({
  webPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  pin: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#F4896B",
    marginBottom: 8,
  },
  webTitle: { fontSize: 12, fontWeight: "600", color: "#2B2B33" },
  webCoords: { fontSize: 11, color: "#7A6D6A", marginTop: 2 },
});
