import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Alert } from 'react-native';
import React from 'react';
import { apiFetch } from '../_lib/api';

export default function QRCodeScreen() {
  const [loading, setLoading] = React.useState(true);
  const [qrUrl, setQrUrl] = React.useState<string | null>(null);
  const [name, setName] = React.useState<string>('');
  const [profilePic, setProfilePic] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await apiFetch('/settings/profile');
        if (!mounted) return;
        const ud = res?.userDetail || res?.user_detail || res;
        setQrUrl(ud?.qr_path || res?.qr || null);
        setName(res?.name || (ud ? `${ud.firstname || ''} ${ud.lastname || ''}` : ''));
        setProfilePic(ud?.profile_pic || null);
      } catch (e) {
        try {
          const res2 = await apiFetch('/user');
          if (!mounted) return;
          const ud = res2?.userDetail || res2?.user_detail || res2;
          setQrUrl(ud?.qr_path || res2?.qr || null);
          setName(res2?.name || '');
          setProfilePic(ud?.profile_pic || null);
        } catch (err) {
          Alert.alert('QR', 'Unable to load your QR. Please sign in.');
        }
      } finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) return (<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#C34C4D" /></View>);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Profile Image */}
      {profilePic ? (
        <Image source={{ uri: profilePic }} style={styles.profileImage} />
      ) : (
        <Image source={require('../../assets/images/bulsu-logo.png')} style={styles.profileImage} />
      )}

      {/* Username */}
      <Text style={styles.username}>{name || '@user'}</Text>

      {/* QR Code Generated Label */}
      <Text style={styles.generatedLabel}>QR Code</Text>

      {/* QR Code */}
      {qrUrl ? (
        // qrUrl may be an external URL or a storage URL; Image will show common image types
        <Image source={{ uri: qrUrl }} style={styles.qrCode} />
      ) : (
        <View style={[styles.qrCode, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f3f3' }]}>
          <Text style={{ color: '#999' }}>No QR available</Text>
        </View>
      )}

      {/* Usage Note */}
      <Text style={styles.usageNote}>Show this at the gate for contactless entry</Text>

      {/* Download Button */}
      <TouchableOpacity style={styles.downloadButton} onPress={() => Alert.alert('Download', 'Use share/save on your device (TODO)')}>
        <Text style={styles.downloadText}>DOWNLOAD</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  generatedLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  qrCode: {
    width: 220,
    height: 220,
    marginBottom: 20,
  },
  usageNote: {
    fontSize: 14,
    color: '#444',
    marginBottom: 30,
  },
  downloadButton: {
    backgroundColor: '#C34C4D',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 6,
  },
  downloadText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});