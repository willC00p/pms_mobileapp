import { Bell } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import React from 'react';
import { apiFetch } from '../_lib/api';
import { useRouter } from 'expo-router';

export default function Notification() {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();

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

  const handlePress = async (n: any) => {
    // mark notification read locally and on server
    markRead(n.id).catch(() => {});

    // If notification payload contains layout and slot info, navigate to layout and highlight
    try {
      const payload = n.data || n.payload || n.meta || {};
      const layoutId = payload.layout_id || payload.parking_layout_id || n.parking_layout_id || n.layout_id;
      const slotId = payload.slot_id || payload.parking_slot_id || n.parking_slot_id || n.slot_id;
      if (layoutId) {
        // use object form so expo-router matches the dynamic route reliably
        const params: any = { id: String(layoutId) };
        if (slotId) params.highlightSlotId = String(slotId);
        router.push({ pathname: '/available_parking/[id]', params } as any);
        return;
      }

      // If notification includes a link that might contain layout/slot info, try to parse it
      if (n.link && typeof n.link === 'string') {
        // support links like '/available-parking/3' or '/available-parking/3?highlightSlotId=7'
        try {
          const u = new URL(n.link, 'http://localhost'); // base allows relative paths
          const parts = u.pathname.split('/').filter(Boolean);
          // accept both hyphen and underscore route forms
          if ((parts[0] === 'available-parking' || parts[0] === 'available_parking') && parts[1]) {
            const lid = parts[1];
            const q = u.searchParams.get('highlightSlotId') || u.searchParams.get('slotId') || '';
            const params: any = { id: String(lid) };
            if (q) params.highlightSlotId = String(q);
            router.push({ pathname: '/available_parking/[id]', params } as any);
            return;
          }
        } catch (e) {
          // ignore parse errors
        }
      }

      // Fallback: ask backend for current user's active assignment and navigate there
      try {
        const resp = await apiFetch('/api/parking-assignments/active');
        // backend returns { message, data: assignment } or just assignment
        const a = resp?.data || resp;
          if (a) {
          // accommodate multiple naming conventions
          const ps = a.parkingSlot || a.parking_slot || a.parking_slot || a.parking_slot_data || (a.data && (a.data.parkingSlot || a.data.parking_slot));
          const lid = (ps && (ps.layout_id || ps.layoutId)) || a.layout_id || a.parking_layout_id || (ps && ps.layout) || null;
          const sid = a.parking_slot_id || a.slot_id || (ps && (ps.id || ps.slot_id)) || a.id || (a.parkingSlot && a.parkingSlot.id) || null;
          if (lid) {
            const params: any = { id: String(lid) };
            if (sid) params.highlightSlotId = String(sid);
            router.push({ pathname: '/available_parking/[id]', params } as any);
            return;
          }
        }
      } catch (e) {
        console.warn('Failed to fetch active assignment for notification fallback', e);
      }
    } catch (err) {
      console.warn('Failed to handle notification press navigation', err);
    }

    // Otherwise just show an alert with message
    Alert.alert(n.type || 'Notification', n.message || JSON.stringify(n));
  };

  if (loading) return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><ActivityIndicator size="large" /></View>;

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}><Text style={styles.headerTitle}>Notifications</Text></View>
      <ScrollView contentContainerStyle={styles.content}>
        {items.map(n => (
          <TouchableOpacity key={n.id} onPress={() => handlePress(n)} style={[styles.card, n.read ? {opacity:0.6} : {}]}>
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