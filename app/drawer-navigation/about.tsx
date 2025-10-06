import { ChevronLeft } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AboutUs() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <ChevronLeft size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Us</Text>
      </View>

      {/* Description */}
      <Text style={styles.paragraph}>
  Welcome to ParkBulsu, the smart solution for managing parking spaces efficiently. Our mobile app is designed to make parking easier, faster, and more organized for everyone. Whether you&apos;re a student, faculty member, personnel, or security staff, our app helps you find available parking spots, manage space allocation, and improve traffic flow within the area.
      </Text>

      <Text style={styles.paragraph}>
        Our goal is to reduce parking congestion, enhance user experience, and streamline the entire parking process. With real-time updates and an intuitive interface, we aim to make parking hassle-free for everyone.
      </Text>

      <Text style={styles.paragraph}>
        ParkBulsu is committed to providing a seamless and user-friendly parking management system that benefits both users and facility administrators. Join us in creating a smarter parking experience today!
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
    color: '#333',
  },
});