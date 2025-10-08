import { useRouter } from 'expo-router';
import React, { useState, useRef } from 'react';
import { SafeAreaView, StatusBar, Text, TouchableOpacity, View, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import FaceWebView from './FaceWebView';
import { setSignup, getSignup } from '../_lib/signupStore';

export default function UploadIdFace() {
  const router = useRouter();
  const [idUri, setIdUri] = useState<string | null>(getSignup().id_path ?? null);
  const [selfieUri, setSelfieUri] = useState<string | null>(getSignup().selfie_path ?? null);
  const [webVisible, setWebVisible] = useState(false);
  const [idBase64, setIdBase64] = useState<string | null>(null);
  const [selfieBase64, setSelfieBase64] = useState<string | null>(null);
  const faceCallbackRef = useRef<any>(null);

  const pickImage = async (mode: 'id' | 'selfie') => {
    // Only allow picking for ID images. Selfies must be captured via camera for liveness.
    if (mode === 'selfie') {
      Alert.alert('Selfie must be taken', 'Please capture the selfie using the Take selfie button.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!res.canceled && res.assets && res.assets.length) {
      const asset = res.assets[0];
      const uri = asset.uri;
      if (mode === 'id') {
        setIdUri(uri);
        setSignup({ id_path: uri, id_name: asset.fileName || 'id-photo' });
        // preload base64 for webview
        try {
          const b = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
          setIdBase64('data:image/jpeg;base64,' + b);
        } catch (e) {
          console.warn('failed to read id base64', e);
        }
      }
    }
  };

  const takePhoto = async (mode: 'id' | 'selfie') => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Camera permission required', 'Please grant camera access to take a photo.');
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!res.canceled && res.assets && res.assets.length) {
      const asset = res.assets[0];
      const uri = asset.uri;
      if (mode === 'id') {
        setIdUri(uri);
        setSignup({ id_path: uri, id_name: asset.fileName || 'id-photo' });
          try { const b = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 }); setIdBase64('data:image/jpeg;base64,' + b); } catch(e) {}
      } else {
        setSelfieUri(uri);
        setSignup({ selfie_path: uri });
          try { const b = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 }); setSelfieBase64('data:image/jpeg;base64,' + b); } catch(e) {}
      }
    }
  };

  const continueNext = async () => {
    if (!idUri || !selfieUri) return Alert.alert('Missing images', 'Please provide both ID image and a selfie.');
    try {
      if (!idBase64) {
        const b = await FileSystem.readAsStringAsync(idUri as string, { encoding: FileSystem.EncodingType.Base64 });
        setIdBase64('data:image/jpeg;base64,' + b);
      }
    } catch (e) {
      console.warn('failed to read id base64', e);
      return Alert.alert('Error', 'Failed to process ID image. Please try again.');
    }
    try {
      if (!selfieBase64) {
        const b2 = await FileSystem.readAsStringAsync(selfieUri as string, { encoding: FileSystem.EncodingType.Base64 });
        setSelfieBase64('data:image/jpeg;base64,' + b2);
      }
    } catch (e) {
      console.warn('failed to read selfie base64', e);
      return Alert.alert('Error', 'Failed to process selfie. Please try taking the selfie again.');
    }
    // open webview to compare
    setWebVisible(true);
  };

  const handleFaceResult = (res: any) => {
    // close the modal first
    setWebVisible(false);
    if (res && res.error) {
      Alert.alert('Face check failed', res.error);
      return router.push({ pathname: '/login/UploadOrCr' } as any);
    }
    // store into signup store
    setSignup({ face_score: res.score, face_verified: !!res.verified });
    // show success alert with score, navigate on OK
    const scoreText = typeof res?.score === 'number' ? `${Math.round(res.score * 100)}%` : 'N/A';
    Alert.alert(
      'Face verified',
      `Face verification passed (score: ${scoreText}).`,
      [{ text: 'OK', onPress: () => router.push({ pathname: '/login/UploadOrCr' } as any) }],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Text className="text-2xl font-bold mt-8">Upload ID</Text>
      <View className="mt-4">
        <Text>Please provide a clear photo of your ID and a selfie.</Text>
        <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
          <TouchableOpacity className="bg-gray-200 rounded p-3" onPress={() => pickImage('id')}>
            <Text>Pick ID</Text>
          </TouchableOpacity>
          <TouchableOpacity className="bg-gray-200 rounded p-3" onPress={() => takePhoto('id')}>
            <Text>Take ID</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
          {/* Selfie must be taken live via camera to ensure liveness */}
          <TouchableOpacity className="bg-gray-200 rounded p-3" onPress={() => takePhoto('selfie')}>
            <Text>Take selfie</Text>
          </TouchableOpacity>
        </View>

        {idUri ? (
          <View style={{ marginTop: 12, width: 120, height: 80 }}>
            <Image source={{ uri: idUri }} style={{ width: 120, height: 80 }} />
          </View>
        ) : null}
        {selfieUri ? (
          <View style={{ marginTop: 12, width: 120, height: 120 }}>
            <Image source={{ uri: selfieUri }} style={{ width: 120, height: 120 }} />
          </View>
        ) : null}

        <View style={{ marginTop: 16 }}>
          <TouchableOpacity className="bg-bsu rounded-full py-3 items-center" onPress={continueNext}>
            <Text className="text-white">Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
      <FaceWebView visible={webVisible} idDataUri={idBase64 || ''} selfieDataUri={selfieBase64 || ''} onResult={handleFaceResult} onClose={()=>setWebVisible(false)} />
    </SafeAreaView>
  );
}
