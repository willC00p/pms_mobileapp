import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, TextInput, ScrollView, StyleSheet } from 'react-native';
import { apiFetch } from '../_lib/api';
import { useRouter } from 'expo-router';

export default function GuardHome() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [layouts, setLayouts] = useState<any[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let mounted = true;
    async function loadLayouts() {
      setLoading(true);
      try {
        const res = await apiFetch('/api/parking-layouts');
        const data = res?.data || res;
        if (!mounted) return;
        setLayouts(data || []);
      } catch (e) {
        setLayouts([]);
      }
      setLoading(false);
    }
    loadLayouts();
    return () => { mounted = false; };
  }, []);

  const filtered = layouts.filter((l:any) => (l.name || '').toLowerCase().includes(query.toLowerCase()));

  return (
    <View style={styles.container}>
      <View style={styles.headerBackground} />
      <Text style={styles.title}>Guard — Available Parkings</Text>

      <View style={styles.searchWrap}>
        <TextInput placeholder="Search layouts..." value={query} onChangeText={setQuery} style={styles.searchInput} />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator size="large" /></View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
          {filtered.map((layout: any) => (
            <TouchableOpacity key={layout.id} style={styles.card} onPress={() => router.push({ pathname: '/parking-assignment/[id]', params: { id: String(layout.id) } } as any)}>
              <View style={styles.cardRow}>
                <Text style={styles.cardTitle}>{layout.name || 'Unnamed'}</Text>
                <Text style={styles.cardMeta}>{(layout.parking_slots || []).length} slots</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Floating action to open scanner (navigates to guard/scan tab) */}
      <TouchableOpacity style={styles.scanButton} onPress={() => router.push('/guard/scan')}>
        <Text style={styles.scanButtonText}>Open Scanner</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F4F4' },
  headerBackground: { backgroundColor: '#D32F2F', height: 120, position: 'absolute', left: 0, right: 0, top: 0 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700', paddingTop: 40, paddingHorizontal: 16, marginBottom: 8 },
  searchWrap: { marginTop: 8, paddingHorizontal: 12 },
  searchInput: { backgroundColor: '#fff', padding: 10, borderRadius: 8 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, marginHorizontal: 6, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontWeight: '700', fontSize: 16 },
  cardMeta: { color: '#666' },
  scanButton: { position: 'absolute', bottom: 24, right: 20, backgroundColor: '#C34C4D', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 40, elevation: 6 },
  scanButtonText: { color: '#fff', fontWeight: '700' }
});
