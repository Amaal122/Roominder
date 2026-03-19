import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { addProperty, getPropertyById, updateProperty } from "../state/properties";

export default function NewProperty() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const editingId = params.id ?? "";
  const editingProperty = editingId ? getPropertyById(editingId) : undefined;
  const [title, setTitle] = useState(editingProperty?.title ?? "");
  const [address, setAddress] = useState(editingProperty?.location ?? "");
  const [rent, setRent] = useState(
    editingProperty?.price?.replace("€", "") ?? ""
  );
  const [beds, setBeds] = useState(
    editingProperty?.beds ? String(editingProperty.beds) : ""
  );
  const [baths, setBaths] = useState(
    editingProperty?.baths ? String(editingProperty.baths) : ""
  );
  const [size, setSize] = useState(
    editingProperty?.size ? String(editingProperty.size) : ""
  );
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);

  const formComplete = useMemo(
    () => title && address && rent && beds && baths && size && description,
    [title, address, rent, beds, baths, size, description],
  );

  const handlePublish = () => {
    if (!formComplete) return;
    const image =
      photos[0] ||
      editingProperty?.image ||
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80";

    if (editingId) {
      updateProperty(editingId, {
        title,
        location: address,
        price: `€${rent}`,
        beds: Number(beds),
        baths: Number(baths),
        size: Number(size),
        image,
      });
    } else {
      addProperty({
        id: String(Date.now()),
        title,
        location: address,
        price: `€${rent}`,
        tenants: "Available",
        status: "Available",
        beds: Number(beds),
        baths: Number(baths),
        size: Number(size),
        views: 0,
        applications: 0,
        image,
      });
    }
    router.replace("/propertyowner");
  };

  const handlePickPhotos = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 6,
      quality: 0.8,
    });

    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      setPhotos(uris);
    }
  };

  return (
    <LinearGradient
      colors={["#F4896B", "#F7B89A", "#7ECEC4"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.cardWrapper}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Feather name="arrow-left" size={22} color="#2B2B33" />
          </TouchableOpacity>

          <Text style={styles.stepLabel}>
            {editingId ? "Edit Property" : "Add New Property"}
          </Text>
          <Text style={styles.title}>
            {editingId ? "Update the property details" : "Fill in the property details"}
          </Text>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity
              style={styles.uploadCard}
              activeOpacity={0.9}
              onPress={handlePickPhotos}
            >
              <Feather name="image" size={26} color="#F4896B" />
              <Text style={styles.uploadTitle}>Upload Photos</Text>
              <Text style={styles.uploadHint}>
                {photos.length > 0
                  ? `${photos.length} selected`
                  : "Tap to browse your gallery"}
              </Text>
            </TouchableOpacity>
            {photos.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.previewRow}
              >
                {photos.map((uri) => (
                  <Image key={uri} source={{ uri }} style={styles.previewImg} />
                ))}
              </ScrollView>
            ) : null}

            <InputField
              label="Property Title"
              icon="home"
              placeholder="Modern studio with balcony"
              value={title}
              onChangeText={setTitle}
            />
            <InputField
              label="Location / Address"
              icon="map-pin"
              placeholder="12 rue de Rivoli, Paris"
              value={address}
              onChangeText={setAddress}
            />
            <InputField
              label="Monthly Rent (€)"
              icon="dollar-sign"
              placeholder="1200"
              value={rent}
              onChangeText={setRent}
              keyboardType="numeric"
            />

            <View style={styles.inlineRow}>
              <View style={styles.inlineThird}>
                <InputField
                  label="Beds"
                  icon="layers"
                  placeholder="2"
                  value={beds}
                  onChangeText={setBeds}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.inlineThird}>
                <InputField
                  label="Baths"
                  icon="droplet"
                  placeholder="1"
                  value={baths}
                  onChangeText={setBaths}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.inlineThird}>
                <InputField
                  label="m²"
                  icon="maximize-2"
                  placeholder="70"
                  value={size}
                  onChangeText={setSize}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Description</Text>
              <View style={[styles.inputContainer, styles.textArea]}>
                <TextInput
                  style={[styles.input, styles.textAreaInput]}
                  placeholder="Describe your property..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  value={description}
                  onChangeText={setDescription}
                />
              </View>
            </View>
          </ScrollView>
        </View>

        <TouchableOpacity
          style={[styles.cta, !formComplete && styles.ctaDisabled]}
          activeOpacity={formComplete ? 0.9 : 1}
          onPress={handlePublish}
        >
          <Text style={styles.ctaText}>
            {editingId ? "Save Changes" : "Publish Property"}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
}

type InputFieldProps = {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: "default" | "numeric";
};

const InputField = ({
  label,
  icon,
  placeholder,
  value,
  onChangeText,
  keyboardType = "default",
}: InputFieldProps) => {
  return (
    <View style={styles.inputWrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <Feather name={icon} size={18} color="#9CA3AF" />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1, justifyContent: "space-between" },
  cardWrapper: {
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: "#FFF7F3",
    borderRadius: 24,
    padding: 20,
    gap: 14,
    flex: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  stepLabel: { color: "#7A6D6A", fontSize: 13, fontWeight: "700" },
  title: { fontSize: 24, fontWeight: "800", color: "#2B2B33" },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 18, gap: 14 },
  uploadCard: {
    borderWidth: 1,
    borderColor: "#F1E3DC",
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    padding: 18,
    alignItems: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  uploadTitle: { fontWeight: "700", color: "#2B2B33", fontSize: 15 },
  uploadHint: { color: "#7A6D6A", fontSize: 13 },
  previewRow: { gap: 10 },
  previewImg: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F1E3DC",
  },
  inputWrapper: { gap: 8 },
  label: { color: "#F4896B", fontSize: 13, fontWeight: "700" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1E3DC",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    backgroundColor: "#FFFFFF",
  },
  input: { flex: 1, marginLeft: 10, color: "#2B2B33", fontSize: 15 },
  inlineRow: { flexDirection: "row", gap: 10 },
  inlineThird: { flex: 1 },
  textArea: { height: 120, alignItems: "flex-start", paddingVertical: 12 },
  textAreaInput: { height: "100%", textAlignVertical: "top" },
  cta: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: "#7ECEC4",
    borderRadius: 16,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7ECEC4",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});
