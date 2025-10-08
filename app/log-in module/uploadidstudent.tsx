import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function UploadIdScreen() {
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [imageAspect, setImageAspect] = useState<number>(4 / 3);
  const progressPercent = 0.33; // 33% filled
  const router = useRouter();


  // Do not request camera permission on mount to avoid creating promises during
  // render that can suspend Client Components. Request permission when the
  // user taps the camera button instead.

  // open camera
  const openCamera = async () => {
    if (!hasCameraPermission) {
      // Request permission on-demand
      const { status: camStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const granted = camStatus === 'granted';
      setHasCameraPermission(granted);
      if (!granted) {
        Alert.alert('No camera access', 'Please allow camera permissions in settings.');
        return;
      }
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length) {
      const asset = result.assets[0];
      setPhotoUri(asset.uri);
      setImageAspect(asset.width / asset.height);
    }
  };

  // open image library
  const pickImage = async () => {
    // request library permissions on-demand
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'We need access to your photos to select a file.'
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length) {
      const asset = result.assets[0];
      setPhotoUri(asset.uri);
      setImageAspect(asset.width / asset.height);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        

        {/* Heading */}
        <Text style={styles.title}>
          Upload a photo of your Student ID Card
        </Text>
        <Text style={styles.subtitle}>
          Regulations require you to upload a student identity card. Don’t worry,
          your data will stay safe and private.
        </Text>

        {/* File Select Area (dynamic size based on crop) */}
        <TouchableOpacity
          style={[
            styles.uploadBox,
            photoUri && { height: undefined, aspectRatio: imageAspect },
          ]}
          onPress={pickImage}
        >
          {photoUri ? (
            <Image
              source={{ uri: photoUri }}
              style={styles.uploadImage}
              resizeMode="contain"
            />
          ) : (
            <>
              <Text style={styles.uploadIcon}>📷</Text>
              <Text style={styles.uploadText}>Select file</Text>
            </>
          )}
        </TouchableOpacity>

        {/* OR separator */}
        <View style={styles.orRow}>
          <View style={styles.line} />
          <Text style={styles.orText}>or</Text>
          <View style={styles.line} />
        </View>

        {/* Camera Button */}
        <TouchableOpacity style={styles.cameraBtn} onPress={openCamera}>
          <Text style={styles.cameraBtnText}>
            📸 Take a Photo
          </Text>
        </TouchableOpacity>

        {/* “Don’t have a School ID?” */}
        <View style={styles.bottomRow}>
          <Text style={styles.bottomText}>Don’t have a School ID? You can use your</Text>
          
            <Text style={styles.corText}>COR</Text>
          
        </View>
      </ScrollView>

      {/* Continue Button */}
      <TouchableOpacity
        style={styles.continueBtn}
        onPress={() => router.push({ pathname: '/login/orcrstudent' } as any)}
      >
        <Text style={styles.continueText}>CONTINUE</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 16, paddingTop:100, paddingBottom: 80 },
  progressBar: {
    height: 6,
    flexDirection: 'row',
    backgroundColor: '#eee',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 24,
  },
  progressFill: { backgroundColor: '#C34C4D' },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  uploadBox: {
    height: 150,
    borderWidth: 2,
    borderColor: '#ccc',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  uploadImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  uploadIcon: { fontSize: 32, marginBottom: 8 },
  uploadText: { fontSize: 16, color: '#555' },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  line: { flex: 1, height: 1, backgroundColor: '#ccc' },
  orText: { marginHorizontal: 8, color: '#555', fontSize: 14 },
  cameraBtn: {
    backgroundColor: '#FFD1DC',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 100,
  },
  cameraBtnText: { fontSize: 16, color: '#000' },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  bottomText: { fontSize: 14, color: '#555' },
  corText: {
    fontSize: 14,
    color: '#C34C4D',
    fontWeight: '600',
    marginLeft: 4,
  },
  continueBtn: {
    position: 'absolute',
    bottom: 250,
    left: 16,
    right: 16,
    backgroundColor: '#C34C4D',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});