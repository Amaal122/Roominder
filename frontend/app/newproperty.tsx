import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
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
import {
  addProperty,
  getPropertyById,
  updateProperty,
} from "./state/properties";

const resolveImageUrl = (value?: string | null) => {
  if (!value) return null;

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:")
  ) {
    return value;
  }

  if (value.startsWith("/")) {
    return `http://localhost:8001${value}`;
  }

  return `http://localhost:8001/${value}`;
};

export default function NewProperty() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const editingId = params.id ?? "";
  const editingProperty = editingId ? getPropertyById(editingId) : undefined;
  const [title, setTitle] = useState(editingProperty?.title ?? "");
  const [address, setAddress] = useState(editingProperty?.location ?? "");
  const [rent, setRent] = useState(
    editingProperty?.price?.replace("€", "") ?? "",
  );
  const [beds, setBeds] = useState(
    editingProperty?.beds ? String(editingProperty.beds) : "",
  );
  const [baths, setBaths] = useState(
    editingProperty?.baths ? String(editingProperty.baths) : "",
  );
  const [size, setSize] = useState(
    editingProperty?.size ? String(editingProperty.size) : "",
  );
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);

  const formComplete = useMemo(
    () => title && address && rent && beds && baths && size && description,
    [title, address, rent, beds, baths, size, description],
  );

  const inferCity = (value: string) => {
    const parts = value
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length > 0) {
      return parts[parts.length - 1];
    }
    return "Unknown";
  };

  const parseRent = (value: string) => {
    const normalized = value.replace(",", ".").replace(/[^\d.]/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const handlePublish = async () => {
    if (!formComplete) return;
    let imageUrl =
      editingProperty?.image ||
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80";

    if (photos[0]) {
      const uri = photos[0];
      const filename = uri.split("/").pop()?.split("?")[0] || "property.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const mimeType = match ? `image/${match[1].toLowerCase()}` : "image/jpeg";

      try {
        const formData = new FormData();

        if (uri.startsWith("blob:") || uri.startsWith("data:")) {
          const blobResponse = await fetch(uri);
          const blob = await blobResponse.blob();
          formData.append("file", blob, filename);
        } else {
          formData.append(
            "file",
            {
              uri,
              name: filename,
              type: mimeType,
            } as any,
          );
        }

        const uploadRes = await fetch(
          "http://127.0.0.1:8001/properties/upload-image",
          {
            method: "POST",
            body: formData,
          },
        );

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          imageUrl = resolveImageUrl(uploadData.image_url ?? uploadData.url) ?? imageUrl;
        } else {
          console.error("Upload failed with status:", uploadRes.status);
        }
      } catch (e) {
        console.error("Image upload failed", e);
      }
    }
    console.log("[DEBUG] Final imageUrl for property:", imageUrl);

    const payload = {
      title,
      address,
      city: inferCity(address),
      price: parseRent(rent),
      rooms: Number(beds) || 1,
      description,
      image_url: imageUrl,
    };

    try {
      if (editingId) {
        await updateProperty(editingId, payload);
      } else {
        await addProperty(payload);
      }
      router.replace("/propertyowner");
    } catch (error) {
      console.error(error);
      alert("Error while saving property. Please login again and retry.");
    }
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
            {editingId
              ? "Update the property details"
              : "Fill in the property details"}
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

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  cardWrapper: {
    flex: 1,
    backgroundColor: "#FFF7F3",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#FEE7DD",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  stepLabel: { color: "#F4896B", fontWeight: "700", marginBottom: 4 },
  title: { fontSize: 20, fontWeight: "800", color: "#2B2B33" },
  scroll: { flex: 1, marginTop: 12 },
  scrollContent: { paddingBottom: 20, gap: 14 },
  uploadCard: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#F5B39D",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFF5F1",
  },
  uploadTitle: { fontWeight: "700", color: "#2B2B33" },
  uploadHint: { color: "#9CA3AF", fontSize: 12 },
  previewRow: { gap: 10, paddingTop: 8 },
  previewImg: { width: 80, height: 80, borderRadius: 12 },
  inputWrapper: { width: "100%", marginBottom: 4 },
  label: {
    color: "#F4896B",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 5,
    marginLeft: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EEE",
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 55,
    backgroundColor: "white",
  },
  input: { flex: 1, marginLeft: 10, color: "#333" },
  textArea: { height: 120, alignItems: "flex-start", paddingTop: 12 },
  textAreaInput: { height: 100, textAlignVertical: "top" },
  inlineRow: { flexDirection: "row", gap: 10 },
  inlineThird: { flex: 1 },
  cta: {
    backgroundColor: "#7ECEC4",
    paddingVertical: 16,
    borderRadius: 18,
    margin: 20,
    alignItems: "center",
  },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { color: "white", fontWeight: "800", fontSize: 16 },
});

const InputField = ({
  label,
  icon,
  placeholder,
  secure = false,
  value,
  onChangeText,
  keyboardType,
}: any) => (
  <View style={styles.inputWrapper}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputContainer}>
      <Feather name={icon} size={18} color="#999" />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        secureTextEntry={secure}
        placeholderTextColor="#CCC"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
    </View>
  </View>
);