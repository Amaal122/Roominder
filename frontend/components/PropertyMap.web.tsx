import { Image, StyleSheet, View, ViewStyle } from "react-native";

type Props = {
  lat: number;
  lng: number;
  style?: ViewStyle;
};

export default function PropertyMap({ style }: Props) {
  const franceSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="320" viewBox="0 0 640 320">
  <rect width="640" height="320" fill="#F3F0FF"/>
  <path d="M220 70 L260 40 L330 50 L360 80 L420 90 L450 140 L430 190 L460 230 L420 260 L370 250 L330 280 L280 260 L240 230 L200 220 L180 180 L190 130 Z"
        fill="#6C63FF" fill-opacity="0.2" stroke="#6C63FF" stroke-width="3"/>
  <circle cx="320" cy="170" r="6" fill="#6C63FF"/>
  <text x="320" y="210" font-family="Arial" font-size="14" text-anchor="middle" fill="#6C63FF">France</text>
</svg>`;
  const mapUri = `data:image/svg+xml;utf8,${encodeURIComponent(franceSvg)}`;

  return (
    <View style={[styles.mapFallback, style]}>
      <Image
        source={{ uri: mapUri }}
        style={styles.mapImage}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mapFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  mapImage: { width: "100%", height: "100%" },
});
