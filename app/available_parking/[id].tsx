import React, { useEffect, useRef, useState } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';
import { View, Text, ActivityIndicator, ScrollView, ImageBackground, StyleSheet, Dimensions, Animated, Pressable } from 'react-native';
import { PanGestureHandler, PinchGestureHandler, State, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useLocalSearchParams } from 'expo-router';
import { apiFetch } from '../_lib/api';

const { width: screenW, height: screenH } = Dimensions.get('window');

function computeCanvasSize(slots: any[]) {
  // compute bounding box from slots positions
  let maxX = 400;
  let maxY = 300;
  slots.forEach(s => {
    const x = s.position_x ?? s.x_coordinate ?? s.x ?? 0;
    const y = s.position_y ?? s.y_coordinate ?? s.y ?? 0;
    const w = s.width ?? 60;
    const h = s.height ?? 120;
    maxX = Math.max(maxX, x + w + 20);
    maxY = Math.max(maxY, y + h + 20);
  });
  return { w: Math.ceil(maxX), h: Math.ceil(maxY) };
}

const ParkingAssignmentPage = () => {
  const params = useLocalSearchParams();
  const id = (params as any)?.id;
  const [loading, setLoading] = useState(true);
  const [layout, setLayout] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 });
  const [selectedSlot, setSelectedSlot] = useState<any>(null);

  // Animated pan & zoom
  const scale = useRef(new Animated.Value(1)).current;
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const lastScale = useRef(1);
  const lastPan = useRef({ x: 0, y: 0 });

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const layoutResp = await apiFetch(`/api/parking-layouts/${id}`);
        const data = layoutResp?.data || layoutResp;
        if (!mounted) return;
        setLayout(data);

        const layoutSlots = data?.parking_slots || (data?.layout_data?.parking_slots) || [];
        // normalize slot fields
        const normalized = layoutSlots.map((s: any) => ({
          id: s.id,
          position_x: s.position_x ?? s.x_coordinate ?? s.x ?? 0,
          position_y: s.position_y ?? s.y_coordinate ?? s.y ?? 0,
          width: s.width ?? 60,
          height: s.height ?? 120,
          rotation: s.rotation ?? (s.metadata && s.metadata.rotation) ?? 0,
          space_number: s.space_number ?? (s.metadata && s.metadata.name) ?? `#${s.id}`,
          space_type: s.space_type ?? (s.metadata && s.metadata.type) ?? 'standard',
          space_status: s.space_status ?? (s.metadata && s.metadata.status) ?? 'available',
          metadata: s.metadata ?? {}
        }));
        setSlots(normalized);

        // fetch assignments
        let asg: any[] = [];
        try {
          const ares = await apiFetch(`/api/parking-assignments/by-layout/${id}`);
          asg = ares || [];
        } catch (e) {
          console.warn('Failed to fetch assignments', e);
        }
        setAssignments(asg || []);

        const { w, h } = computeCanvasSize(normalized);
        setCanvasSize({ w, h });
      } catch (e) {
        console.error('Failed to load parking assignment page', e);
      }
      setLoading(false);
    }
    if (id) load();
    return () => { mounted = false; };
  }, [id]);

  // lock orientation to landscape while this screen is mounted
  useEffect(() => {
    let mounted = true;
    async function lockLandscape() {
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      } catch (e) {
        // if the API isn't available (web or not installed), ignore
        console.warn('Failed to lock orientation to landscape', e);
      }
    }
    lockLandscape();
    return () => {
      // on unmount, restore to portrait-up
      (async () => {
        try {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        } catch (e) {
          console.warn('Failed to restore orientation to portrait', e);
        }
      })();
      mounted = false;
    };
  }, []);

  // Pinch & Pan handlers
  const onPinchEvent = Animated.event(
    [{ nativeEvent: { scale: scale } }],
    { useNativeDriver: false }
  );
  const onPinchStateChange = (evt: any) => {
    if (evt.nativeEvent.oldState === State.ACTIVE) {
      lastScale.current = lastScale.current * evt.nativeEvent.scale;
      scale.setValue(lastScale.current);
    }
  };

  const onPanEvent = Animated.event(
    [{ nativeEvent: { translationX: pan.x, translationY: pan.y } }],
    { useNativeDriver: false }
  );
  const onPanStateChange = (evt: any) => {
    if (evt.nativeEvent.oldState === State.ACTIVE) {
      lastPan.current.x += evt.nativeEvent.translationX;
      lastPan.current.y += evt.nativeEvent.translationY;
      pan.setOffset({ x: lastPan.current.x, y: lastPan.current.y });
      pan.setValue({ x: 0, y: 0 });
    }
  };

  function handleSlotPress(s: any) {
    setSelectedSlot(s);
  }

  function closeTooltip() { setSelectedSlot(null); }

  // build assignment map
  const assignmentBySlot: Record<string, any> = {};
  assignments.forEach(a => { if (a.parking_slot_id) assignmentBySlot[String(a.parking_slot_id)] = a; });

  // compute scale to fit screen width (landscape-friendly) but allow horizontal scroll
  const padding = 20;
  const availableW = Math.max(screenW, screenH) - 40; // prefer landscape width
  const availableH = Math.min(screenH, screenW) - 120;
  const fitScale = Math.min(1, Math.min(availableW / (canvasSize.w + padding), availableH / (canvasSize.h + padding)));
  const fitScaleAnim = useRef(new Animated.Value(fitScale)).current;

  useEffect(() => {
    // update fitScaleAnim when canvasSize changes
    try { fitScaleAnim.setValue(fitScale); } catch (e) { /* ignore */ }
  }, [canvasSize.w, canvasSize.h, fitScale]);

  const bgImage = layout?.background_image && typeof layout.background_image === 'string' ? layout.background_image : null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#fff', paddingTop: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', marginHorizontal: 12, marginBottom: 8 }}>{layout?.name || 'Parking Layout'}</Text>
      {loading ? <ActivityIndicator style={{ marginTop: 20 }} /> : (
        <PinchGestureHandler onGestureEvent={onPinchEvent} onHandlerStateChange={onPinchStateChange}>
          <Animated.View style={{ flex: 1 }}>
            <PanGestureHandler onGestureEvent={onPanEvent} onHandlerStateChange={onPanStateChange} minPointers={1} maxPointers={2}>
              <Animated.View style={{ flex: 1 }}>
                <ScrollView horizontal contentContainerStyle={{ padding: 0 }} scrollEnabled={false}>
                  <Animated.View style={{ width: canvasSize.w, height: canvasSize.h, backgroundColor: '#f8fafc', transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale: Animated.multiply(scale, fitScaleAnim) }] }}>
                    {bgImage ? (
                      <ImageBackground source={{ uri: bgImage }} style={{ width: canvasSize.w, height: canvasSize.h }} resizeMode="contain">
                        {/* render lines */}
                        {(layout?.layout_data?.lines || []).map((ln: any, idx: number) => {
                          const x1 = (ln.x1 || ln.x1_coordinate || 0);
                          const y1 = (ln.y1 || ln.y1_coordinate || 0);
                          const x2 = (ln.x2 || ln.x2_coordinate || 0);
                          const y2 = (ln.y2 || ln.y2_coordinate || 0);
                          const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
                          return <View key={`line-${idx}`} style={[styles.line, { left: Math.min(x1, x2), top: Math.min(y1, y2), width: Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1)), transform: [{ rotate: `${angle}deg` }] }]} />;
                        })}

                        {/* texts */}
                        {(layout?.layout_data?.texts || []).map((t: any, i: number) => {
                          const x = (t.x || t.position_x || 0);
                          const y = (t.y || t.position_y || 0);
                          const rot = t.rotation || 0;
                          return (
                            <View key={`txt-${i}`} style={[styles.textWrap, { left: x, top: y, transform: [{ rotate: `${rot}deg` }] }] }>
                              <Text style={{ fontSize: t.size || 12, color: t.color || '#000' }}>{t.text}</Text>
                            </View>
                          );
                        })}

                        {/* slots */}
                        {slots.map(s => {
                          const left = s.position_x;
                          const top = s.position_y;
                          const w = Math.max(8, s.width);
                          const h = Math.max(8, s.height);
                          const rot = s.rotation || 0;
                          const assigned = assignmentBySlot[String(s.id)];
                          const status = assigned ? (assigned.status || 'occupied') : (s.space_status || 'available');
                          // prefer status-based color; only respect metadata.fill when explicitly allowed
                          let fill = status === 'occupied' ? '#b91c1c' : status === 'reserved' ? '#b45309' : '#047857';
                          if (s.metadata && s.metadata.fill && s.metadata.override_color === true) {
                            fill = s.metadata.fill;
                          }
                          const textColor = s.metadata?.textColor || '#ffffff';
                          const vehicleType = assigned?.vehicle_type || s.space_type || 'car';
                          const icon = assigned ? (vehicleType.toLowerCase().includes('motor') ? '🏍️' : '🚗') : '';
                          return (
                            <Pressable key={`slot-${s.id}`} onPress={() => handleSlotPress(s)} style={[styles.slot, { left, top, width: w, height: h, backgroundColor: fill, transform: [{ rotate: `${rot}deg` }] }] }>
                              <Text style={{ color: textColor, fontWeight: '700' }}>{s.space_number}</Text>
                              {icon ? <Text style={{ fontSize: 18 }}>{icon}</Text> : null}
                            </Pressable>
                          );
                        })}

                        {/* tooltip (inside scaled container so positions match) */}
                        {selectedSlot ? (
                          <Pressable onPress={closeTooltip} style={[styles.tooltip, { left: selectedSlot.position_x, top: Math.max(4, selectedSlot.position_y - 40) }]}>
                            <Text style={{ fontWeight: '700' }}>{selectedSlot.space_number}</Text>
                            {assignmentBySlot[String(selectedSlot.id)] ? (
                              <View>
                                <Text>Plate: {assignmentBySlot[String(selectedSlot.id)].vehicle_plate || '—'}</Text>
                                <Text>Type: {assignmentBySlot[String(selectedSlot.id)].vehicle_type || '—'}</Text>
                                <Text>Status: {assignmentBySlot[String(selectedSlot.id)].status || '—'}</Text>
                              </View>
                            ) : (
                              <Text>Available</Text>
                            )}
                          </Pressable>
                        ) : null}
                      </ImageBackground>
                    ) : (
                      <View style={{ width: canvasSize.w, height: canvasSize.h }}>
                        {/* render lines */}
                        {(layout?.layout_data?.lines || []).map((ln: any, idx: number) => {
                          const x1 = (ln.x1 || ln.x1_coordinate || 0);
                          const y1 = (ln.y1 || ln.y1_coordinate || 0);
                          const x2 = (ln.x2 || ln.x2_coordinate || 0);
                          const y2 = (ln.y2 || ln.y2_coordinate || 0);
                          const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
                          return <View key={`line-${idx}`} style={[styles.line, { left: Math.min(x1, x2), top: Math.min(y1, y2), width: Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1)), transform: [{ rotate: `${angle}deg` }] }]} />;
                        })}

                        {/* texts */}
                        {(layout?.layout_data?.texts || []).map((t: any, i: number) => {
                          const x = (t.x || t.position_x || 0);
                          const y = (t.y || t.position_y || 0);
                          const rot = t.rotation || 0;
                          return (
                            <View key={`txt-${i}`} style={[styles.textWrap, { left: x, top: y, transform: [{ rotate: `${rot}deg` }] }] }>
                              <Text style={{ fontSize: t.size || 12, color: t.color || '#000' }}>{t.text}</Text>
                            </View>
                          );
                        })}

                        {/* slots */}
                        {slots.map(s => {
                          const left = s.position_x;
                          const top = s.position_y;
                          const w = Math.max(8, s.width);
                          const h = Math.max(8, s.height);
                          const rot = s.rotation || 0;
                          const assigned = assignmentBySlot[String(s.id)];
                          const status = assigned ? (assigned.status || 'occupied') : (s.space_status || 'available');
                          let fill = status === 'occupied' ? '#b91c1c' : status === 'reserved' ? '#b45309' : '#047857';
                          if (s.metadata && s.metadata.fill && s.metadata.override_color === true) {
                            fill = s.metadata.fill;
                          }
                          const textColor = s.metadata?.textColor || '#ffffff';
                          const vehicleType = assigned?.vehicle_type || s.space_type || 'car';
                          const icon = assigned ? (vehicleType.toLowerCase().includes('motor') ? '🏍️' : '🚗') : '';
                          return (
                            <Pressable key={`slot-${s.id}`} onPress={() => handleSlotPress(s)} style={[styles.slot, { left, top, width: w, height: h, backgroundColor: fill, transform: [{ rotate: `${rot}deg` }] }] }>
                              <Text style={{ color: textColor, fontWeight: '700' }}>{s.space_number}</Text>
                              {icon ? <Text style={{ fontSize: 18 }}>{icon}</Text> : null}
                            </Pressable>
                          );
                        })}

                        {/* tooltip */}
                        {selectedSlot ? (
                          <Pressable onPress={closeTooltip} style={[styles.tooltip, { left: selectedSlot.position_x, top: Math.max(4, selectedSlot.position_y - 40) }]}>
                            <Text style={{ fontWeight: '700' }}>{selectedSlot.space_number}</Text>
                            {assignmentBySlot[String(selectedSlot.id)] ? (
                              <View>
                                <Text>Plate: {assignmentBySlot[String(selectedSlot.id)].vehicle_plate || '—'}</Text>
                                <Text>Type: {assignmentBySlot[String(selectedSlot.id)].vehicle_type || '—'}</Text>
                                <Text>Status: {assignmentBySlot[String(selectedSlot.id)].status || '—'}</Text>
                              </View>
                            ) : (
                              <Text>Available</Text>
                            )}
                          </Pressable>
                        ) : null}
                      </View>
                    )}
                  </Animated.View>
                </ScrollView>
              </Animated.View>
            </PanGestureHandler>
          </Animated.View>
        </PinchGestureHandler>
      )}
      <View style={{ padding: 12 }}>
        <Text style={{ color: '#666', fontSize: 12 }}>Tip: rotate device to landscape or expand screen for best results.</Text>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  slot: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    padding: 4,
    overflow: 'hidden'
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 8,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }
  },
  line: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#cbd5e1',
    borderRadius: 2
  },
  textWrap: {
    position: 'absolute'
  }
});

export default ParkingAssignmentPage;
