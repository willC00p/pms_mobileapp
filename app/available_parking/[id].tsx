import React, { useEffect, useRef, useState } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';
import { View, Text, ActivityIndicator, ScrollView, ImageBackground, StyleSheet, Animated, Pressable, useWindowDimensions } from 'react-native';
import { PanGestureHandler, PinchGestureHandler, State, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useLocalSearchParams } from 'expo-router';
import { apiFetch } from '../_lib/api';
import { useRouter } from 'expo-router';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// window dimensions are read inside the component so they update on rotation

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
  const { width: screenW, height: screenH } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [layout, setLayout] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 });
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [highlightSlotId, setHighlightSlotId] = useState<string | null>(null);
  const router = useRouter();

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
          // treat 'completed' as available so it doesn't display as a special state
          space_status: (s.space_status === 'completed' ? 'available' : (s.space_status ?? (s.metadata && s.metadata.status) ?? 'available')),
          metadata: s.metadata ?? {}
        }));
        setSlots(normalized);

        // if caller requested a highlight for a specific slot via query param, pick it
        try {
          const q = (params as any)?.highlightSlotId || (params as any)?.highlightslotid || null;
          if (q) {
            setHighlightSlotId(String(q));
          }
        } catch (e) {}

        // fetch assignments
        let asg: any[] = [];
        try {
          const ares = await apiFetch(`/api/parking-assignments/by-layout/${id}`);
          // filter out completed assignments so the layout treats them as available
          const raw = ares || [];
          asg = (raw || []).filter((a: any) => {
            const st = (a?.status || a?.data?.status || '').toString().toLowerCase();
            return st !== 'completed';
          });
        } catch (e) {
          console.warn('Failed to fetch assignments', e);
        }
        setAssignments(asg || []);

  const { w, h } = computeCanvasSize(normalized);
        setCanvasSize({ w, h });
        // after slots set, if highlight requested, select it and center it on screen
            setTimeout(() => {
          try {
            const hid = (params as any)?.highlightSlotId || (params as any)?.highlightslotid || null;
            if (hid) {
              const found = normalized.find((s: any) => String(s.id) === String(hid));
              if (found) {
                setSelectedSlot(found);
                // compute center offset using fitScale so slot is centered in the window
                    const slotCenterX = (found.position_x + (found.width || 60) / 2) * fitScale;
                    const slotCenterY = (found.position_y + (found.height || 60) / 2) * fitScale;
                const ox = (availableW / 2) - slotCenterX;
                const oy = (availableH / 2) - slotCenterY;
                try { pan.setOffset({ x: ox, y: oy }); pan.setValue({ x: 0, y: 0 }); } catch (e) { /* ignore */ }
              }
            }
          } catch (e) { /* ignore */ }
        }, 120);
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
  assignments.forEach(a => {
    // try many shapes to locate the referenced slot id
    const slotId = a?.parking_slot_id || a?.slot_id || a?.parkingSlot?.id || a?.parking_slot?.id || a?.slot?.id || (a?.data && (a.data.parking_slot_id || a.data.slot_id));
    if (slotId) assignmentBySlot[String(slotId)] = a;
  });

  // compute scale to fit the available window (allow upscaling so small layouts fill the screen)
  const padding = 0;
  const availableW = screenW;
  const availableH = screenH;
  // apply a slight boost so the layout better fills landscape screens
  const fitScale = Math.min(availableW / (canvasSize.w + padding), availableH / (canvasSize.h + padding)) * 1.03;
  const fitScaleAnim = useRef(new Animated.Value(fitScale)).current;

  // pulsing animation for highlighted slot
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);
  useEffect(() => {
    if (!highlightSlotId && !selectedSlot) {
      // stop pulse
      if (pulseLoop.current) {
        try { pulseLoop.current.stop(); } catch (e) {}
        pulseAnim.setValue(1);
      }
      return;
    }
    // start pulse
    pulseAnim.setValue(1);
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.09, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 700, useNativeDriver: true }),
      ])
    );
    pulseLoop.current.start();
    return () => {
      if (pulseLoop.current) try { pulseLoop.current.stop(); } catch (e) {}
    };
  }, [highlightSlotId, selectedSlot]);

  useEffect(() => {
    // update fitScaleAnim when canvasSize or window size changes
    try { fitScaleAnim.setValue(fitScale); } catch (e) { /* ignore */ }
    // center the canvas in the available window
    try {
      const ox = (availableW - canvasSize.w * fitScale) / 2;
      const oy = (availableH - canvasSize.h * fitScale) / 2;
      pan.setOffset({ x: ox, y: oy });
      pan.setValue({ x: 0, y: 0 });
    } catch (e) { /* ignore */ }
  }, [canvasSize.w, canvasSize.h, fitScale]);

  const bgImage = layout?.background_image && typeof layout.background_image === 'string' ? layout.background_image : null;
  // shared canvas transform used by both the main canvas and the tooltip overlay
  const canvasTransform: any[] = [{ translateX: pan.x }, { translateY: pan.y }, { scale: Animated.multiply(scale, fitScaleAnim) }];

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Title overlay so the layout can occupy the full screen underneath */}
      <View style={{ position: 'absolute', top: 12, left: 12, zIndex: 20 }} pointerEvents="none">
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#000' }}>{layout?.name || 'Parking Layout'}</Text>
      </View>
      {loading ? <ActivityIndicator style={{ marginTop: 20 }} /> : (
        <PinchGestureHandler onGestureEvent={onPinchEvent} onHandlerStateChange={onPinchStateChange}>
          <Animated.View style={{ flex: 1 }}>
            <PanGestureHandler onGestureEvent={onPanEvent} onHandlerStateChange={onPanStateChange} minPointers={1} maxPointers={2}>
              <Animated.View style={{ flex: 1 }}>
                <ScrollView horizontal contentContainerStyle={{ padding: 0, flex: 1 }} scrollEnabled={false} style={{ flex: 1 }}>
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
                          // determine effective status. If assignment exists and its status is 'completed',
                          // treat it as available for coloring purposes.
                          const rawStatus = assigned ? (assigned.status || 'occupied') : (s.space_status || 'available');
                          const status = (rawStatus === 'completed') ? 'available' : rawStatus;
                          // mark as actively assigned only when there's an assignment that is not 'completed'
                          const assignedActive = !!assigned && String(rawStatus) !== 'completed';
                          // prefer assignedActive slots to show as occupied (red) by default
                          let fill = assignedActive ? '#b91c1c' : (status === 'reserved' ? '#b45309' : '#047857');
                          // respect explicit metadata override if provided
                          if (s.metadata && s.metadata.fill && s.metadata.override_color === true) {
                            fill = s.metadata.fill;
                          }
                          const textColor = s.metadata?.textColor || '#ffffff';
                          const vehicleType = assigned?.vehicle_type || s.space_type || 'car';
                          const icon = assigned ? (vehicleType.toLowerCase().includes('motor') ? '🏍️' : '🚗') : '';
                          const isHighlighted = String(s.id) === String(highlightSlotId) || (selectedSlot && String(s.id) === String(selectedSlot.id));
                          const isUserSlot = String(s.id) === String(highlightSlotId);
                          const SlotComponent: any = isHighlighted ? AnimatedPressable : Pressable;
                          // combine rotate and pulse scale so rotation is preserved when animating
                          const transformArray: any[] = [{ rotate: `${rot}deg` }];
                          if (isHighlighted) transformArray.push({ scale: pulseAnim });
                          const slotStyle = [styles.slot, { left, top, width: w, height: h, backgroundColor: fill, transform: transformArray }, isHighlighted ? styles.highlightedSlot : {}];
                          return (
                            <SlotComponent key={`slot-${s.id}`} onPress={() => handleSlotPress(s)} style={slotStyle}>
                              <Text style={{ color: textColor, fontWeight: '700' }}>{s.space_number}</Text>
                              {icon ? <Text style={{ fontSize: 18 }}>{icon}</Text> : null}
                              {/* assigned badge only for active assignments (completed assignments are treated as available) */}
                              {assignedActive ? (
                                <View style={styles.assignedBadge} pointerEvents="none">
                                  <Text style={styles.assignedBadgeText}>{isUserSlot ? 'YOU' : 'A'}</Text>
                                </View>
                              ) : null}
                            </SlotComponent>
                          );
                        })}

                        {/* tooltip intentionally rendered via overlay (below) so it stays above slots */}
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
                          // assignmentBySlot only contains active assignments (completed filtered out),
                          // so assigned variable here indicates an active assignment
                          const status = assigned ? (assigned.status || 'occupied') : (s.space_status || 'available');
                          const fill = assigned ? '#b91c1c' : (status === 'reserved' ? '#b45309' : '#047857');
                          if (s.metadata && s.metadata.fill && s.metadata.override_color === true) {
                            // metadata override still respected
                            // but do not show assignment visuals if assignment is completed (filtered earlier)
                            // since assigned would be falsy for completed ones, this block only applies when client explicitly overrides
                            // keep fill assignment
                            // (no-op besides assigning fill)
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

                        {/* tooltip intentionally rendered via overlay (below) so it stays above slots */}
                      </View>
                    )}
                  </Animated.View>
                </ScrollView>
              </Animated.View>
            </PanGestureHandler>
          </Animated.View>
        </PinchGestureHandler>
      )}
      {/* Tooltip overlay: mirrors canvas transform so it appears above everything */}
      {selectedSlot ? (
        <Animated.View pointerEvents="box-none" style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', transform: canvasTransform }}>
          <Pressable onPress={closeTooltip} style={[styles.tooltip, { left: selectedSlot.position_x, top: Math.max(4, selectedSlot.position_y - 40), zIndex: 99999, elevation: 99999 }]}>
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
        </Animated.View>
      ) : null}
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
    elevation: 20,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }
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
  }
  ,
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
