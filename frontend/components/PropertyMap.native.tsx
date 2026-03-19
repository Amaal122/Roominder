import MapView, { Marker } from "react-native-maps";
import { StyleSheet, ViewStyle } from "react-native";

type Props = {
  lat: number;
  lng: number;
  style?: ViewStyle;
};

export default function PropertyMap({ lat, lng, style }: Props) {
  return (
    <MapView
      style={[styles.map, style]}
      region={{
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
  map: { width: "100%", height: "100%" },
});
