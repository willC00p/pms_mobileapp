import React from 'react';
import { View, Text, StyleSheet, Button, Alert, ActivityIndicator, FlatList, TouchableOpacity, Linking, TextInput } from 'react-native';
// We'll dynamically import the camera/barcode scanner so the app doesn't crash when the native module
// isn't present (Expo Go vs custom dev client differences). Prefer `expo-camera` (newer) and fall
// back to `expo-barcode-scanner` if needed. The import and permission request are handled in useEffect below.
// We'll keep both the imported module and the component reference separate so
// the rendered element is always a component/function (not the module object).
let CameraModule: any = null;
let CameraComp: any = null;
import { API_BASE, apiFetch, isRole } from '../_lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function GuardScanScreen() {
  const [hasPermission, setHasPermission] = React.useState<boolean | null>(null);
  const [scanned, setScanned] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [user, setUser] = React.useState<any>(null);
  const [slots, setSlots] = React.useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = React.useState<any>(null);
  const [confirmVisible, setConfirmVisible] = React.useState(false);
  const [errorDetail, setErrorDetail] = React.useState<string | null>(null);
  // no manual fallback; require native scanner runtime

  // Helper to dynamically import the scanner module and request permissions.
  const requestPermissions = React.useCallback(async () => {
    try {
      if (!CameraComp) {
        // Prefer expo-camera (maintained) and fall back to expo-barcode-scanner if necessary
        try {
          const mod = await import('expo-camera');
          CameraModule = mod ?? {};

          // Common shapes:
          // 1) { Camera: Component, requestCameraPermissionsAsync: fn }
          // 2) default export: { Camera: Component } under mod.default
          // 3) module itself is the component (rare)
          let resolved: any = mod?.Camera ?? mod?.default ?? mod;

          // If resolved is a module namespace object (not a component), try to pull Camera off it
          if (resolved && typeof resolved === 'object' && !resolved.hasOwnProperty('render') && typeof resolved !== 'function') {
            resolved = resolved.Camera ?? resolved.default ?? resolved;
          }

          // Validate that resolved looks like a React component (function or object with render)
          const looksLikeComponent = typeof resolved === 'function' || (resolved && typeof resolved === 'object' && (resolved.render || resolved.$$typeof || resolved.prototype?.render));
          CameraComp = looksLikeComponent ? resolved : null;
        } catch (e) {
          CameraModule = null;
          CameraComp = null;
        }
      }

      // Permission API may be exported at module root or as a static on Camera
      const requestFn =
        (CameraModule && (CameraModule.requestCameraPermissionsAsync || CameraModule.requestPermissionsAsync)) ||
        (CameraModule && CameraModule.Camera && (CameraModule.Camera.requestCameraPermissionsAsync || CameraModule.Camera.requestPermissionsAsync)) ||
        (CameraModule?.default && (CameraModule.default.requestCameraPermissionsAsync || CameraModule.default.requestPermissionsAsync)) ||
        (CameraComp && (CameraComp.requestCameraPermissionsAsync || CameraComp.requestPermissionsAsync));

      if (requestFn) {
        const r = await requestFn();
        const granted = Boolean(r?.status === 'granted' || r?.granted === true);
        setHasPermission(granted);
        return granted;
      }

      setHasPermission(false);
      return false;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Camera permission request failed', err);
      setHasPermission(false);
      return false;
    }
  }, []);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      setHasPermission(null); // show requesting state
      await requestPermissions();
    })();
    return () => { mounted = false; };
  }, [requestPermissions]);

  // ensure only guard role can access scanner
  React.useEffect(() => {
    (async () => {
      try {
  const profile = await apiFetch('/api/settings/profile');
        // Allow either role name 'Guard' or numeric role id 7
        if (!(isRole(profile, 'Guard') || isRole(profile, 7))) {
          Alert.alert('Access denied', 'Scanner is available to guard users only');
          setHasPermission(false);
        }
      } catch (e) {
        // ignore and let camera permission flow decide
      }
    })();
  }, []);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);
    setLoading(true);
    try {
      // data is expected to be the token payload
      // call verify endpoint via apiFetch (which includes auth token when present)
      const json = await apiFetch('/verify-qr', { method: 'POST', body: JSON.stringify({ token: data }) });
  // normalize response to find user and payload
  const u = (json && json.data && json.data.user) ? json.data.user : (json && json.user) ? json.user : (json && json.data) ? json.data : null;
  const payload = (json && json.data && json.data.payload) ? json.data.payload : (json && json.payload) ? json.payload : null;
  setUser(u);

      // Quick checks
      const fromPending = (u?.userDetail?.from_pending ?? u?.from_pending ?? payload?.from_pending ?? false);
      if (fromPending) {
        Alert.alert('User Pending', 'This user is pending approval and cannot be assigned a slot.');
        setLoading(false);
        return;
      }

      // fetch slots for the layout(s) - for simplicity assume a single layout id in payload or default to layout 1
      const layoutId = payload?.layout_id ?? 1;
      // fetch parking slots; backend may provide a dedicated endpoint (/api/parking-slots)
      let slotsJson: any = [];
      try {
        slotsJson = await apiFetch(`/parking-assignments/by-layout/${layoutId}`);
      } catch (e) {
        // ignore
      }
      // byLayout returns assignments; instead fetch parking slots if available
      // try a fallback route: /api/parking-slots?layout={id}
      let parkingSlots: any[] = [];
      try {
        parkingSlots = await apiFetch(`/parking-slots?layout=${layoutId}`);
      } catch (e) {
        // ignore
      }

      // If parkingSlots empty, try to derive available slots from assignments response
      if (parkingSlots.length === 0 && Array.isArray(slotsJson)) {
        // slotsJson contains assignments; extract slot objects
        parkingSlots = slotsJson.map((a: any) => a.parking_slot).filter(Boolean);
      }

      // filter available slots and compatible with vehicle type
      const vehicleType = u?.vehicles && u.vehicles.length ? (u.vehicles[0].vehicle_type || u.userDetail?.vehicle_type) : u?.userDetail?.plate_number ? 'car' : u?.userDetail?.vehicle_type;
      const candidates = parkingSlots.filter(s => s && s.space_status === 'available' && (
        (s.space_type === 'compact' && ['motorcycle','bicycle'].includes(vehicleType)) ||
        (s.space_type === 'standard' && vehicleType === 'car') ||
        (!s.space_type)
      ));

      setSlots(candidates || []);
      // auto-select first candidate if any
      if (candidates && candidates.length > 0) setSelectedSlot(candidates[0]);

    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  // Fallback removed — use native scanner only

  const assignSelected = async () => {
    if (!selectedSlot || !user) return Alert.alert('Missing', 'No slot or user selected');
    setConfirmVisible(true);
  };

  const doAssign = async () => {
    setConfirmVisible(false);
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const body = {
        user_id: user.id,
        vehicle_plate: (user.vehicles && user.vehicles[0]) ? user.vehicles[0].plate_number : user.userDetail?.plate_number,
        vehicle_type: (user.vehicles && user.vehicles[0]) ? user.vehicles[0].vehicle_type : user.userDetail?.vehicle_type,
        assignment_type: 'assign'
      };
      const res = await fetch(`${API_BASE.replace(/\/$/, '')}/api/parking-assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body)
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorDetail(String(json?.error || json?.message || 'Unknown'));
        Alert.alert('Assign failed', String(json?.message || json?.error || 'Unable to create assignment'));
        setLoading(false);
        return;
      }
      Alert.alert('Assigned', 'Parking slot assigned successfully');
      setUser(null); setSlots([]); setSelectedSlot(null); setScanned(false);
    } catch (e: any) {
      setErrorDetail(e?.message || 'Unexpected');
      Alert.alert('Error', String(e?.message || 'Unexpected'));
    } finally { setLoading(false); }
  };

  // If permissions are being requested, show a neutral requesting state
  if (hasPermission === null) return <View style={styles.center}><Text>Requesting camera permission...</Text></View>;

  // If native camera component is missing OR permissions denied, show fallback UI with clear actions
  if (!CameraComp || hasPermission === false) {
    return (
      <View style={styles.center}>
        <Text style={{textAlign:'center', marginBottom:12}}>Barcode scanner native module not available or camera permission denied.</Text>
        <Text style={{textAlign:'center', marginBottom:12}}>Please run a native build or an Expo dev client so the native module is present.</Text>
        <View style={{ marginTop: 12 }}>
          <Button title="Retry Permission" onPress={async () => { await requestPermissions(); }} />
        </View>
        <View style={{ marginTop: 12 }}>
          <Button title="Open App Settings" onPress={() => { Linking.openSettings(); }} />
        </View>
      </View>
    );
  }

  // No manual entry UI; rely on native scanner

  return (
    <View style={styles.container}>
      {!scanned && (
        <View style={styles.scanner}>
          {/* Render the Camera component we resolved dynamically. */}
          {CameraComp ? (
            <CameraComp onBarCodeScanned={scanned ? undefined : handleBarCodeScanned} style={{ flex: 1 }} />
          ) : (
            <Text>Camera component not available.</Text>
          )}
        </View>
      )}
      {loading && <ActivityIndicator size="large" />}
      {user && (
        <View style={styles.info}>
          <Text style={styles.title}>User: {user.name}</Text>
          <Text>Pending: {String(user.userDetail?.from_pending ?? false)}</Text>
          <Text>Plate: {user.vehicles && user.vehicles[0]?.plate_number}</Text>
        </View>
      )}
      {slots.length > 0 && (
        <View style={styles.list}>
          <Text style={styles.title}>Available slots ({slots.length})</Text>
          <FlatList data={slots} keyExtractor={(i:any)=>String(i.id)} renderItem={({item})=> (
            <TouchableOpacity onPress={()=>setSelectedSlot(item)} style={[styles.slot, selectedSlot?.id===item.id?{backgroundColor:'#cde'}:null]}>
              <Text>#{item.space_number} - {item.space_type} - {item.space_status}</Text>
            </TouchableOpacity>
          )} />
          <Button title="Assign Selected Slot" onPress={assignSelected} />
        </View>
      )}
      {scanned && !loading && (
        <Button title="Scan Again" onPress={()=>{ setScanned(false); setUser(null); setSlots([]); setSelectedSlot(null); }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  scanner: { flex: 1, overflow: 'hidden', borderRadius: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  info: { padding: 8 },
  list: { flex: 1 },
  title: { fontWeight: '600', marginBottom: 6 },
  slot: { padding: 8, borderBottomWidth: 1, borderColor: '#eee' }
});
