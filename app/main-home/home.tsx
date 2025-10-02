import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View, ActivityIndicator, TextInput } from 'react-native';
import { apiFetch } from '../_lib/api';

type LayoutSummary = {
  id: number;
  name: string;
  total: number;
  occupied: number;
};

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [layouts, setLayouts] = useState<LayoutSummary[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let mounted = true;
    async function loadLayouts() {
      setLoading(true);
      try {
        const res = await apiFetch('/api/parking-layouts');
        // ParkingLayoutController@index returns { message, data }
        const data = res?.data || res;
        const items = (data || []).map((layout: any) => {
          const slots = layout.parking_slots || (layout.layout_data && layout.layout_data.parking_slots) || [];
          const total = slots.length;
          const occupied = slots.filter((s: any) => s.space_status === 'occupied' || s.space_status === 'reserved').length;
          return { id: layout.id, name: layout.name || 'Unnamed', total, occupied } as LayoutSummary;
        });
        if (!mounted) return;
        setLayouts(items);
      } catch (e) {
        console.error('Failed to load parking layouts', e);
        setLayouts([]);
      }
      setLoading(false);
    }
    loadLayouts();
    return () => { mounted = false; };
  }, []);

  const filtered = layouts.filter(l => l.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <View className="flex-1 bg-F5F4F4 relative items-center">
      <View className="bg-[#D32F2F] w-full h-40 absolute top-10 left-0" />
      <View className="absolute left-15 w-64 h-24 bg-white rounded-xl shadow-md" style={{ top: 134 }} />

      <Text className="text-white text-3xl font-bold absolute top-20 mt-15 pt-5">Available Parkings</Text>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false} contentContainerStyle={{ minHeight: '100%', marginTop: 130, paddingBottom: 210 }}>
        <View style={{ width: '100%', alignItems: 'center', marginTop: 24, marginBottom: 14 }}>
          <TextInput placeholder="Search parking layouts..." value={query} onChangeText={setQuery} style={{ width: '90%', backgroundColor: '#fff', padding: 10, borderRadius: 8 }} />
        </View>

          {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} />
        ) : (
          filtered.map((layout) => {
            const pct = layout.total > 0 ? Math.round((layout.occupied / layout.total) * 100) : 0;
            const color = pct >= 90 ? '#B3261E' : pct >= 70 ? '#F49000' : '#89E219';
            return (
              <TouchableOpacity key={layout.id} className="bg-white rounded-xl shadow-md p-4 w-80 h-24" style={{ marginTop: 18 }} onPress={() => router.push({ pathname: '/parking-assignment/[id]', params: { id: String(layout.id) } } as any)}>
                <View className="flex-row justify-between items-center py-4">
                  <Text className="text-black text-lg font-bold">{layout.name}</Text>
                  <View className="flex-row items-center">
                    <Text className="text-black text-lg">{layout.occupied}/{layout.total}</Text>
                    <View style={{ backgroundColor: color, width: 16, height: 16, borderRadius: 8, marginLeft: 8 }} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}

      </ScrollView>
    </View>
  );
}