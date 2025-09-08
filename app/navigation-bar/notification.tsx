import { AlertTriangle, Bell, MessageCircle, ParkingCircle, PhoneCall } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function Notification() {
  return (
    <View style={styles.wrapper}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      {/* Notification List */}
      <ScrollView contentContainerStyle={styles.content}>
        <NotificationCard
          icon={<Bell size={24} color="#D32F2F" />}
          title="Security Updates!"
          timestamp="Today | 09:24 AM"
          message="We've updated our system with the latest security patches to keep your account and parking details safe."
        />

        <NotificationCard
          icon={<AlertTriangle size={24} color="#D32F2F" />}
          title="Urgent: Move Your Vehicle!"
          timestamp="1 day ago | 14:43 PM"
          message="Your vehicle is improperly parked or blocking the way. Kindly relocate it immediately."
        />

        <NotificationCard
          icon={<PhoneCall size={24} color="#D32F2F" />}
          title="Admin is Calling!"
          timestamp="5 days ago | 10:29 AM"
          message="The admin is trying to reach you regarding parking. Please answer the call."
        />

        <NotificationCard
          icon={<MessageCircle size={24} color="#D32F2F" />}
          title="Admin Message Received!"
          timestamp="5 days ago | 10:25 AM"
          message="The admin has sent you a message regarding parking. Tap to view."
        />

        <NotificationCard
          icon={<ParkingCircle size={24} color="#D32F2F" />}
          title="Parking Assigned!"
          timestamp="6 days ago | 15:38 PM"
          message="You have been assigned to Parking Space #43 Premital Hall. Please proceed to park your vehicle there."
        />
      </ScrollView>
    </View>
  );
}

function NotificationCard({ icon, title, timestamp, message }: {
  icon: React.ReactNode;
  title: string;
  timestamp: string;
  message: string;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {icon}
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardTimestamp}>{timestamp}</Text>
        </View>
      </View>
      <Text style={styles.cardMessage}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F5F4F4',
  },
  header: {
    backgroundColor: '#D32F2F',
    height: 100,
    justifyContent: 'flex-end',
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardText: {
    marginLeft: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  cardTimestamp: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  cardMessage: {
    fontSize: 14,
    color: '#444',
    marginTop: 4,
  },
});