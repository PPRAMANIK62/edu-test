import * as ExpoImagePicker from "expo-image-picker";
import { Image, Trash2, Upload } from "lucide-react-native";
import React from "react";
import {
  Alert,
  Image as RNImage,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface ImagePickerProps {
  label: string;
  imageUri: string | null;
  onImageSelected: (uri: string) => void;
  onImageRemoved: () => void;
  error?: string;
}

const ImagePicker = ({
  label,
  imageUri,
  onImageSelected,
  onImageRemoved,
  error,
}: ImagePickerProps) => {
  const pickImage = async () => {
    // Request permission
    const { status } =
      await ExpoImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Sorry, we need camera roll permissions to upload images."
      );
      return;
    }

    // Launch image picker
    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onImageSelected(result.assets[0].uri);
    }
  };

  return (
    <View className="mb-4">
      <Text className="text-sm font-semibold text-gray-700 mb-2">{label}</Text>

      {imageUri ? (
        <View className="relative">
          <RNImage
            source={{ uri: imageUri }}
            className="w-full h-48 rounded-xl"
            resizeMode="cover"
          />
          <View className="absolute top-3 right-3 flex-row gap-2">
            <TouchableOpacity
              onPress={pickImage}
              className="bg-violet-600 rounded-lg p-2"
              activeOpacity={0.8}
            >
              <Upload size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onImageRemoved}
              className="bg-red-600 rounded-lg p-2"
              activeOpacity={0.8}
            >
              <Trash2 size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          onPress={pickImage}
          className={`border-2 ${
            error ? "border-red-500" : "border-dashed border-gray-300"
          } rounded-xl p-8 items-center justify-center bg-gray-50`}
          activeOpacity={0.7}
        >
          <View className="bg-violet-100 rounded-full p-4 mb-3">
            <Image size={32} color="#7c3aed" />
          </View>
          <Text className="text-gray-900 font-semibold mb-1">
            Upload Course Image
          </Text>
          <Text className="text-gray-500 text-sm text-center">
            Tap to select an image from your gallery
          </Text>
          <Text className="text-gray-400 text-xs mt-2">
            Recommended: 16:9 aspect ratio
          </Text>
        </TouchableOpacity>
      )}

      {error && <Text className="text-red-500 text-sm mt-1">{error}</Text>}
    </View>
  );
};

export default ImagePicker;
