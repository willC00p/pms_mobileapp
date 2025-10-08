import { ChevronLeft } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PrivacyPolicy() {
  return (
    <View style={styles.wrapper}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <ChevronLeft size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy & Policy</Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Privacy Policy for Parking Management System</Text>

        <Text style={styles.paragraph}>
          At ParkBulsu, we respect your privacy. This policy explains how we collect, use, and protect your personal information when you use our mobile parking management app.
        </Text>

        <Text style={styles.subheading}>1. Information We Collect</Text>
        <Text style={styles.paragraph}>- Personal Information: When you sign up, we collect your name, email, phone number, and vehicle details.</Text>
        <Text style={styles.paragraph}>- Location Data: We collect your location to show nearby available parking spaces.</Text>
        <Text style={styles.paragraph}>- Usage Data: We track how you use the app to improve your experience.</Text>

        <Text style={styles.subheading}>2. How We Use Your Information</Text>
        <Text style={styles.paragraph}>- To provide and improve the app’s features.</Text>
        <Text style={styles.paragraph}>- To send you updates or notifications related to parking.</Text>
        <Text style={styles.paragraph}>- To personalize your parking experience.</Text>

        <Text style={styles.subheading}>3. Sharing Your Information</Text>
        <Text style={styles.paragraph}>
          We don’t sell your personal information. We share it with trusted service providers only as required by law.
        </Text>

        <Text style={styles.subheading}>4. Data Security</Text>
        <Text style={styles.paragraph}>
          We take steps to protect your information, but no method is 100% secure.
        </Text>

        <Text style={styles.subheading}>5. Your Rights</Text>
        <Text style={styles.paragraph}>
          You can access, update, or delete your personal data by managing your account settings.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#C34C4D',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#000',
  },
  subheading: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 6,
    color: '#333',
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    color: '#444',
    marginBottom: 8,
  },
});