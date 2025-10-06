import { Bell } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import React from 'react';
import { apiFetch } from '../_lib/api';

export default function Notification() {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await apiFetch('/api/notifications');
      const data = res?.data || res;
      setItems(data || []);
    } catch (e) {
      console.warn('Failed to load notifications', e);
    }
    setLoading(false);
  }

  React.useEffect(() => {
    load();
    const id = setInterval(load, 30_000); // poll every 30s
    return () => clearInterval(id);
  }, []);

  const markRead = async (id:number) => {
    try {
  await apiFetch(`/api/notifications/${id}/mark-read`, { method: 'POST' });
      setItems(prev => prev.map(it => it.id === id ? { ...it, read: true } : it));
    } catch (e) {
      Alert.alert('Error', 'Failed to mark read');
    }
  };

  if (loading) return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><ActivityIndicator size="large" /></View>;

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}><Text style={styles.headerTitle}>Notifications</Text></View>
      <ScrollView contentContainerStyle={styles.content}>
        {items.map(n => (
          <TouchableOpacity key={n.id} onPress={() => markRead(n.id)} style={[styles.card, n.read ? {opacity:0.6} : {}]}>
            <View style={styles.cardHeader}>
              <Bell size={24} color="#D32F2F" />
              <View style={styles.cardText}><Text style={styles.cardTitle}>{n.type || 'Notice'}</Text>
              <Text style={styles.cardTimestamp}>{new Date(n.created_at).toLocaleString()}</Text></View>
            </View>
            <Text style={styles.cardMessage}>{n.message}</Text>
          </TouchableOpacity>
        ))}
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