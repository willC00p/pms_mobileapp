import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { apiFetch, API_BASE } from '../_lib/api';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function FilesScreen() {
  const [loading, setLoading] = React.useState(true);
  const [profile, setProfile] = React.useState<any>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const p = await apiFetch('/settings/profile');
        if (!mounted) return;
        setProfile(p);
      } catch (e) {
        try { const u = await apiFetch('/user'); if (!mounted) return; setProfile(u); } catch (err) { Alert.alert('Files', 'Unable to load profile'); }
      } finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, []);

  const upload = async (which: 'or'|'cr'|'deed') => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: false });
      if ((res as any).type !== 'success') return;
      const uri = (res as any).uri as string;
      const name = (res as any).name as string;

      // If user has a vehicle, upload to /api/vehicles/{id}
      const vehicleId = profile?.vehicles?.[0]?.id;
      if ((which === 'or' || which === 'cr') && vehicleId) {
        const form = new FormData();
        const field = which === 'or' ? 'or_file' : 'cr_file';
        // Normalize uri: if starts with '/' add file:// for native platforms
        let nUri = uri;
        if (typeof nUri === 'string' && nUri.startsWith('/') && !nUri.startsWith('file://')) {
          nUri = 'file://' + nUri;
        }
        // @ts-ignore
        if (typeof nUri === 'string' && (nUri.startsWith('file://') || nUri.startsWith('content://'))) {
          (form as any).append(field, { uri: nUri, name, type: 'application/octet-stream' } as any);
        } else {
          // fallback: fetch and append blob (web or remote url)
          try {
            const fetched = await fetch(nUri);
            const blob = await fetched.blob();
            (form as any).append(field, blob, name);
          } catch (e) {
            // last resort: append uri string (may not be accepted by server)
            (form as any).append(field, { uri: nUri, name, type: 'application/octet-stream' } as any);
          }
        }

        setLoading(true);
        const url = `${API_BASE.replace(/\/$/, '')}/api/vehicles/${vehicleId}`;
        const token = await AsyncStorage.getItem('auth_token');
        const headers: any = { Accept: 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // Try POST then fallback to PUT
        let r = await fetch(url, { method: 'POST', body: form, headers });
        if (!r.ok) {
          r = await fetch(url, { method: 'PUT', body: form, headers });
        }
        if (!r.ok) throw new Error('Upload failed: ' + r.status);
        Alert.alert('Upload', 'File uploaded successfully. Refresh to see changes.');
        return;
      }

      if (which === 'deed') {
        Alert.alert('Not supported', 'Deed upload after registration is not supported from this screen.');
        return;
      }

      Alert.alert('No vehicle', 'You do not have a registered vehicle. Please add a vehicle first.');
    } catch (e) {
      Alert.alert('Upload failed', (e as any).message || String(e));
    } finally { setLoading(false); }
  };

  if (loading) return (<View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#C34C4D" /></View>);

  const ud = profile?.userDetail || profile?.user_detail || profile;

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 12 }}>Your Uploaded Files</Text>

      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontWeight: '600' }}>Official Receipt (OR)</Text>
        {ud?.or_path ? (
          <View style={{ marginTop: 8 }}>
            <TouchableOpacity onPress={() => { /* open in webview/browser */ }}>
              <Text style={{ color: '#1E90FF' }}>{ud.or_path}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={{ color: '#666', marginTop: 8 }}>No OR uploaded</Text>
        )}
        <TouchableOpacity style={{ backgroundColor: '#C34C4D', padding: 10, marginTop: 8, borderRadius: 6 }} onPress={() => upload('or')}>
          <Text style={{ color: 'white', textAlign: 'center' }}>Upload OR</Text>
        </TouchableOpacity>
      </View>

      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontWeight: '600' }}>Certificate of Registration (CR)</Text>
        {ud?.cr_path ? (
          <View style={{ marginTop: 8 }}>
            <TouchableOpacity onPress={() => { }}>
              <Text style={{ color: '#1E90FF' }}>{ud.cr_path}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={{ color: '#666', marginTop: 8 }}>No CR uploaded</Text>
        )}
        <TouchableOpacity style={{ backgroundColor: '#C34C4D', padding: 10, marginTop: 8, borderRadius: 6 }} onPress={() => upload('cr')}>
          <Text style={{ color: 'white', textAlign: 'center' }}>Upload CR</Text>
        </TouchableOpacity>
      </View>

      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontWeight: '600' }}>Deed of Sale (if applicable)</Text>
        {ud?.deed_path ? (
          <View style={{ marginTop: 8 }}>
            <TouchableOpacity onPress={() => { }}>
              <Text style={{ color: '#1E90FF' }}>{ud.deed_path}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={{ color: '#666', marginTop: 8 }}>No deed uploaded</Text>
        )}
        <TouchableOpacity style={{ backgroundColor: '#C34C4D', padding: 10, marginTop: 8, borderRadius: 6 }} onPress={() => upload('deed')}>
          <Text style={{ color: 'white', textAlign: 'center' }}>Upload Deed</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}
