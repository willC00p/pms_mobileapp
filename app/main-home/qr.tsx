import { Image, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';

export default function QRCodeScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Profile Image */}
      <Image
        source={require('../../assets/images/bulsu-logo.png')} // Replace with actual image path
        style={styles.profileImage}
      />

      {/* Username */}
      <Text style={styles.username}>@JuanchoDelaCruz</Text>

      {/* QR Code Generated Label */}
      <Text style={styles.generatedLabel}>QR Code Generated!</Text>

      {/* QR Code */}
      <Image
        source={require('../../assets/images/qr-code.png')} // Replace with actual QR code path
        style={styles.qrCode}
      />

      {/* Usage Note */}
      <Text style={styles.usageNote}>Start using it for hassle-free entry</Text>

      {/* Download Button */}
      <TouchableOpacity style={styles.downloadButton}>
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