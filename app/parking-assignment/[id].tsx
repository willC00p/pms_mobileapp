import React, { useEffect, useRef, useState } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';
import { View, Text, ActivityIndicator, ScrollView, ImageBackground, StyleSheet, Dimensions, Animated, Pressable, Modal, TextInput, Button } from 'react-native';
import { PanGestureHandler, PinchGestureHandler, State, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useLocalSearchParams } from 'expo-router';
import { apiFetch } from '../_lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [highlightSlotId, setHighlightSlotId] = useState<string | null>(null);

  // Animated pan & zoom
  const scale = useRef(new Animated.Value(1)).current;
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const lastScale = useRef(1);
  const lastPan = useRef({ x: 0, y: 0 });

  // baseScaleRef holds the current base (fitted) scale. Gesture (pinch) uses
  // `scale` as a temporary multiplier which is reset to 1 after the gesture ends.
  // We initialize it to 1 and set it to fitScale when the layout first computes.
  const baseScaleRef = useRef(1);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const layoutResp = await apiFetch(`/api/parking-layouts/${id}`);
        const data = layoutResp?.data || layoutResp;
        if (!mounted) return;
        setLayout(data);

        // Persist the currently viewed layout so other screens (scanner) can use it
        try {
          if (id) await AsyncStorage.setItem('selected_parking_layout', String(id));
        } catch (e) {
          console.warn('Failed to persist selected layout', e);
        }

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
          // treat 'completed' as available so completed assignments don't render as occupied
          space_status: (s.space_status === 'completed' ? 'available' : (s.space_status ?? (s.metadata && s.metadata.status) ?? 'available')),
          metadata: s.metadata ?? {}
        }));
        setSlots(normalized);

        // fetch assignments and filter out completed ones so they appear available
        let asg: any[] = [];
        try {
          const ares = await apiFetch(`/api/parking-assignments/by-layout/${id}`) || [];
          asg = (ares || []).filter((a: any) => {
            const st = (a?.status || a?.data?.status || '').toString().toLowerCase();
            return st !== 'completed';
          });
        } catch (e) {
          console.warn('Failed to fetch assignments', e);
        }
        setAssignments(asg || []);

        // try to detect logged-in user's assignment and highlight it
        try {
          const profileResp = await apiFetch('/api/profile');
          const profile = profileResp?.data || profileResp;
          if (profile && profile.id) {
            // look for assignment referencing the user's id or vehicle id
            const candidate = (asg || []).find((a: any) => {
              const userId = a?.user_id || a?.assigned_to || a?.data?.user_id || a?.data?.assigned_to;
              if (userId && String(userId) === String(profile.id)) return true;
              // also try matching by vehicle ownership if profile has vehicles
              const pvehicles = profile.vehicles || profile.my_vehicles || [];
              if (pvehicles && pvehicles.length) {
                for (const v of pvehicles) {
                  const plate = (v.plate || v.vehicle_plate || '').toString().toLowerCase();
                  const aplate = (a?.vehicle_plate || a?.data?.vehicle_plate || '').toString().toLowerCase();
                  if (plate && aplate && plate === aplate) return true;
                }
              }
              return false;
            });
            if (candidate) {
              const userSlotId = candidate.parking_slot_id || candidate.slot_id || candidate.data?.parking_slot_id;
              if (userSlotId) setHighlightSlotId(String(userSlotId));
            }
          }
        } catch (e) {
          // ignore profile fetch failures (not logged in)
        }

        const { w, h } = computeCanvasSize(normalized);
        setCanvasSize({ w, h });
        // if caller requested a highlight for a specific slot via query param, pick it
        try {
          const q = (params as any)?.highlightSlotId || (params as any)?.highlightslotid || null;
          if (q) setHighlightSlotId(String(q));
        } catch (e) {}
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
      // Fold the gesture multiplier into the base scale, clamp, then reset
      // the gesture multiplier to 1 so subsequent gestures start fresh.
      const minScale = 0.5;
      const maxScale = 3;
      const gestureScale = evt.nativeEvent.scale || 1;
      let newBase = (baseScaleRef.current || 1) * gestureScale;
      newBase = Math.max(minScale, Math.min(newBase, maxScale));
      baseScaleRef.current = newBase;
      try { fitScaleAnim.setValue(newBase); } catch (e) { /* ignore */ }
      try { scale.setValue(1); } catch (e) { /* ignore */ }
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

  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);
  const [editPlate, setEditPlate] = useState('');
  const [editVehicleType, setEditVehicleType] = useState('');

  function openEditForAssignment(a: any) {
    setEditingAssignment(a);
    setEditPlate(a?.vehicle_plate || a?.data?.vehicle_plate || '');
    setEditVehicleType(a?.vehicle_type || a?.data?.vehicle_type || 'car');
    setEditModalVisible(true);
  }

  async function saveEdit() {
    if (!editingAssignment) return;
    try {
      const idToUpdate = editingAssignment.id || (editingAssignment.data && editingAssignment.data.id);
      if (!idToUpdate) throw new Error('No assignment id');
      await apiFetch(`/api/parking-assignments/${idToUpdate}`, { method: 'PUT', body: JSON.stringify({ vehicle_plate: editPlate, vehicle_type: editVehicleType }) });
      // refresh assignments
      const ares = await apiFetch(`/api/parking-assignments/by-layout/${id}`) || [];
      const asg = (ares || []).filter((a: any) => { const st = (a?.status || a?.data?.status || '').toString().toLowerCase(); return st !== 'completed'; });
      setAssignments(asg || []);
      setEditModalVisible(false);
    } catch (e) {
      console.error('Failed to save assignment edit', e);
      setEditModalVisible(false);
    }
  }

  // build assignment map
  const assignmentBySlot: Record<string, any> = {};
  assignments.forEach(a => { if (a.parking_slot_id) assignmentBySlot[String(a.parking_slot_id)] = a; });

  // compute scale to best fit the available window. Allow upscaling so layouts fill the screen.
  const padding = 12;
  const availableW = screenW - 12;
  const availableH = screenH - 12;
  // use 'cover' fit so the layout fills the available space (matches available_parking)
  const fitScale = Math.max(availableW / (canvasSize.w + padding), availableH / (canvasSize.h + padding));
  const fitScaleAnim = useRef(new Animated.Value(fitScale)).current;

  // pulsing animation for highlighted slot (re-used from available_parking)
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);
  useEffect(() => {
    if (!highlightSlotId && !selectedSlot) {
      if (pulseLoop.current) {
        try { pulseLoop.current.stop(); } catch (e) {}
        pulseAnim.setValue(1);
      }
      return;
    }
    pulseAnim.setValue(1);
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.09, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 700, useNativeDriver: true }),
      ])
    );
    pulseLoop.current.start();
    return () => { if (pulseLoop.current) try { pulseLoop.current.stop(); } catch (e) {} };
  }, [highlightSlotId, selectedSlot]);

  useEffect(() => {
    // update fitScaleAnim when canvasSize or fitScale changes
    try { fitScaleAnim.setValue(fitScale); } catch (e) { /* ignore */ }
  }, [canvasSize.w, canvasSize.h, fitScale]);

  // sync the main animated scale value and lastScale with the computed fitScale so
  // the default view shows the same fit as other pages and we prevent zooming out past it
  useEffect(() => {
    try {
      lastScale.current = fitScale;
      scale.setValue(fitScale);
    } catch (e) { /* ignore */ }
  }, [fitScale]);

  const bgImage = layout?.background_image && typeof layout.background_image === 'string' ? layout.background_image : null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#fff', paddingTop: 6 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', marginHorizontal: 8, marginBottom: 6 }}>{layout?.name || 'Parking Layout'}</Text>
      {loading ? <ActivityIndicator style={{ marginTop: 20 }} /> : (
        <PinchGestureHandler onGestureEvent={onPinchEvent} onHandlerStateChange={onPinchStateChange}>
          <Animated.View style={{ flex: 1 }}>
            <PanGestureHandler onGestureEvent={onPanEvent} onHandlerStateChange={onPanStateChange} minPointers={1} maxPointers={2}>
              <Animated.View style={{ flex: 1 }}>
                <ScrollView horizontal contentContainerStyle={{ padding: 0, alignItems: 'center', justifyContent: 'center' }} style={{ flex: 1 }} scrollEnabled={false}>
                  <Animated.View style={{ width: canvasSize.w, height: canvasSize.h, backgroundColor: '#f8fafc', transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale: Animated.multiply(scale, fitScaleAnim) }], alignSelf: 'center' }}>
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
                          // default available color changed to pink for quick verification
                          const fill = s.metadata?.fill || (status === 'occupied' ? '#b91c1c' : status === 'reserved' ? '#b45309' : '#ff69b4');
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
                                <Pressable onPress={() => openEditForAssignment(assignmentBySlot[String(selectedSlot.id)])} style={{ marginTop: 8, padding: 6, backgroundColor: '#0369a1', borderRadius: 6 }}>
                                  <Text style={{ color: '#fff' }}>Edit</Text>
                                </Pressable>
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
                          // color: occupied(red), reserved(orange), available(green)
                          const fill = s.metadata?.fill || (status === 'occupied' ? '#b91c1c' : status === 'reserved' ? '#b45309' : '#047857');
                          const textColor = s.metadata?.textColor || '#ffffff';
                          const vehicleType = assigned?.vehicle_type || s.space_type || 'car';
                          const icon = assigned ? (vehicleType.toLowerCase().includes('motor') ? '🏍️' : '🚗') : '';
                          const isHighlighted = String(s.id) === String(highlightSlotId) || (selectedSlot && String(s.id) === String(selectedSlot.id));
                          const isUserSlot = String(s.id) === String(highlightSlotId);
                          const SlotComponent: any = isHighlighted ? Animated.createAnimatedComponent(Pressable) : Pressable;
                          const transformArray: any[] = [{ rotate: `${rot}deg` }];
                          if (isHighlighted) transformArray.push({ scale: pulseAnim });
                          return (
                            <SlotComponent key={`slot-${s.id}`} onPress={() => handleSlotPress(s)} style={[styles.slot, { left, top, width: w, height: h, backgroundColor: fill, transform: transformArray }, isHighlighted ? styles.highlightedSlot : {}] }>
                              <Text style={{ color: textColor, fontWeight: '700' }}>{s.space_number}</Text>
                              {icon ? <Text style={{ fontSize: 18 }}>{icon}</Text> : null}
                              {assigned ? (
                                <View style={styles.assignedBadge} pointerEvents="none">
                                  <Text style={styles.assignedBadgeText}>{isUserSlot ? 'YOU' : 'A'}</Text>
                                </View>
                              ) : null}
                            </SlotComponent>
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
      {/* Edit assignment modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent={true} onRequestClose={() => setEditModalVisible(false)}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View style={{ width: '90%', backgroundColor: '#fff', padding: 16, borderRadius: 8 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Edit Assignment</Text>
            <Text style={{ fontSize: 12, color: '#333' }}>Vehicle Plate</Text>
            <TextInput value={editPlate} onChangeText={setEditPlate} style={{ borderWidth: 1, borderColor: '#ddd', padding: 8, marginBottom: 8, borderRadius: 4 }} />
            <Text style={{ fontSize: 12, color: '#333' }}>Vehicle Type</Text>
            <TextInput value={editVehicleType} onChangeText={setEditVehicleType} style={{ borderWidth: 1, borderColor: '#ddd', padding: 8, marginBottom: 8, borderRadius: 4 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <Button title="Cancel" onPress={() => setEditModalVisible(false)} />
              <View style={{ width: 8 }} />
              <Button title="Save" onPress={saveEdit} />
            </View>
          </View>
        </View>
      </Modal>
      <View style={{ padding: 12 }}>
        <Text style={{ color: '#666', fontSize: 12 }}>Tipsidy: rotate device to landscape or expand screen for best results.</Text>
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
  ,
  highlightedSlot: {
    borderWidth: 3,
    borderColor: '#FFD54F',
    shadowColor: '#FFD54F',
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8
  },
  assignedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    elevation: 6,
  },
  assignedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#b91c1c'
  }
});

export default ParkingAssignmentPage;
