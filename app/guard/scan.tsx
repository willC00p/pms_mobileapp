import React from 'react';
import { View, Text, StyleSheet, Button, Alert, ActivityIndicator, FlatList, TouchableOpacity, Linking, TextInput, Image } from 'react-native';
import { useRouter } from 'expo-router';
// Use expo-camera directly for now. We built a native debug APK so the native module should be
// available; a static import simplifies behavior and ensures the Camera component is present.
// Do not import expo-camera at module top-level. We'll dynamically import it
// after mount to avoid creating promises during render which can trigger
// the "suspended by an uncached promise" runtime warnings in the new
// client component model used by expo-router.
import { API_BASE, apiFetch, isRole } from '../_lib/api';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PrimaryButton, Card, Header } from '../components/ui';

export default function GuardScanScreen() {
  const [hasPermission, setHasPermission] = React.useState<boolean | null>(null);
  const [scanned, setScanned] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [CameraModule, setCameraModule] = React.useState<any>(null);
  const [cameraLoading, setCameraLoading] = React.useState<boolean>(false);
  const [showCamera, setShowCamera] = React.useState<boolean>(false);
  const [user, setUser] = React.useState<any>(null);
  const [selectedVehicle, setSelectedVehicle] = React.useState<any>(null);
  const [showVehiclePicker, setShowVehiclePicker] = React.useState<boolean>(false);
  const [slots, setSlots] = React.useState<any[]>([]);
  const [lastLayoutId, setLastLayoutId] = React.useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = React.useState<any>(null);
  const [layouts, setLayouts] = React.useState<any[]>([]);
  const [layoutsLoading, setLayoutsLoading] = React.useState<boolean>(false);
  const [selectedLayoutId, setSelectedLayoutId] = React.useState<number | null>(null);
  const [confirmVisible, setConfirmVisible] = React.useState(false);
  const [errorDetail, setErrorDetail] = React.useState<string | null>(null);
  const processingRef = React.useRef<boolean>(false);
  const lastScannedDataRef = React.useRef<string | null>(null);
  const lastScanTimeRef = React.useRef<number>(0);
  const [debugLog, setDebugLog] = React.useState<string[]>([]);
  const [autoAssignStatus, setAutoAssignStatus] = React.useState<string | null>(null);
  const [autoAssignInProgress, setAutoAssignInProgress] = React.useState<boolean>(false);
  const autoAssignAbortRef = React.useRef<boolean>(false);
  const router = useRouter();

  // Request camera/barcode permissions on-demand. Import expo-camera here
  // so any async initialization runs outside of the render path.
  const requestPermissions = React.useCallback(async () => {
    // debug trace
    // eslint-disable-next-line no-console
    console.warn('[GuardScan] requestPermissions called');
    try {
      setCameraLoading(true);
      // load module if not already loaded
      let mod = CameraModule;
      if (!mod) {
        try {
          // dynamic import - runs only when user asks
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          mod = await import('expo-camera');
          setCameraModule(mod);
          // eslint-disable-next-line no-console
          console.warn('[GuardScan] expo-camera module loaded (deferred)');
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('[GuardScan] failed to load expo-camera (deferred)', e);
        }
      }

      // Try to find the permission API in a few possible shapes. Some
      // builds expose the method at module.requestCameraPermissionsAsync,
      // others under module.default, or module.Camera. If not found, fall
      // back to expo-image-picker's requestCameraPermissionsAsync which
      // also asks camera permission.
      const Cam = (mod || CameraModule) as any;
      let fn: any = null;
      if (Cam && typeof Cam.requestCameraPermissionsAsync === 'function') {
        fn = Cam.requestCameraPermissionsAsync.bind(Cam);
        // eslint-disable-next-line no-console
        console.warn('[GuardScan] using CameraModule.requestCameraPermissionsAsync');
      } else if (Cam && Cam.default && typeof Cam.default.requestCameraPermissionsAsync === 'function') {
        fn = Cam.default.requestCameraPermissionsAsync.bind(Cam.default);
        // eslint-disable-next-line no-console
        console.warn('[GuardScan] using CameraModule.default.requestCameraPermissionsAsync');
      } else if (Cam && Cam.Camera && typeof Cam.Camera.requestCameraPermissionsAsync === 'function') {
        fn = Cam.Camera.requestCameraPermissionsAsync.bind(Cam.Camera);
        // eslint-disable-next-line no-console
        console.warn('[GuardScan] using CameraModule.Camera.requestCameraPermissionsAsync');
      } else if (ImagePicker && typeof ImagePicker.requestCameraPermissionsAsync === 'function') {
        fn = ImagePicker.requestCameraPermissionsAsync.bind(ImagePicker);
        // eslint-disable-next-line no-console
        console.warn('[GuardScan] falling back to ImagePicker.requestCameraPermissionsAsync');
      }

      if (!fn) {
        // eslint-disable-next-line no-console
        console.warn('[GuardScan] no camera permission API available');
        setHasPermission(false);
        return false;
      }
      const r = await fn();
      // eslint-disable-next-line no-console
      console.warn('[GuardScan] requestPermissions result', r);
      const granted = Boolean(r?.status === 'granted' || r?.granted === true);
      setHasPermission(granted);
      return granted;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Camera permission request failed', err);
      setHasPermission(false);
      return false;
    } finally {
      setCameraLoading(false);
    }
  }, [CameraModule]);


  // Only enable showing the Camera component after mount and after the module
  // is loaded and permission is granted. We set showCamera inside a useEffect
  // to ensure the Camera component is mounted outside of the initial render
  // pass to avoid any promise creation during render.
  React.useEffect(() => {
    if (!cameraLoading && CameraModule && hasPermission) {
      // schedule to show camera after current render frame
      const t = setTimeout(() => setShowCamera(true), 0);
      return () => clearTimeout(t);
    }
    setShowCamera(false);
    return undefined;
  }, [cameraLoading, CameraModule, hasPermission]);

  // Log module and permission state changes (avoid logging each render)
  React.useEffect(() => {
    // eslint-disable-next-line no-console
    console.warn('[GuardScan] camera state:', { cameraLoading, moduleLoaded: !!CameraModule, hasPermission, showCamera });
    if (CameraModule) {
      try {
        const keys = Object.keys(CameraModule);
        // eslint-disable-next-line no-console
        console.warn('[GuardScan] CameraModule keys:', keys.join(', '));
        // if there's a nested Camera export, show its keys too
        const nested = (CameraModule as any).Camera || (CameraModule as any).default || null;
        if (nested) {
          // eslint-disable-next-line no-console
          console.warn('[GuardScan] Camera export keys:', Object.keys(nested).join(', '));
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[GuardScan] failed to inspect CameraModule', e);
      }
    }
  }, [cameraLoading, CameraModule, hasPermission, showCamera]);

  // Do NOT request permissions automatically during render/mount. Creating
  // promises during render or inside certain client components can trigger
  // React "suspended by an uncached promise" warnings in the app router.
  // Instead, request permissions only in response to an explicit user action.

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
    // prevent re-entrancy - camera can fire multiple scans while we're processing
    if (processingRef.current) {
      // eslint-disable-next-line no-console
      console.warn('[GuardScan] scan event ignored, already processing');
      return;
    }
    processingRef.current = true;
    // dedupe identical scans for a short cooldown to avoid flooding the server
    try {
      const now = Date.now();
      if (lastScannedDataRef.current && lastScannedDataRef.current === data && (now - (lastScanTimeRef.current || 0)) < 5000) {
        // eslint-disable-next-line no-console
        console.warn('[GuardScan] duplicate scan ignored (cooldown)');
        processingRef.current = false;
        return;
      }
      lastScannedDataRef.current = data;
      lastScanTimeRef.current = now;
    } catch (e) {
      // ignore
    }

    // immediately mark scanned and hide the camera to stop further events
    try { setScanned(true); } catch (e) { /* ignore */ }
    try { setShowCamera(false); } catch (e) { /* ignore */ }
    setLoading(true);
    try {
      // data is expected to be the token payload
      // call verify endpoint via apiFetch (which includes auth token when present)
      // Log the token briefly for debug (do NOT include sensitive info in persistent logs)
      // eslint-disable-next-line no-console
      console.warn('[GuardScan] verifying token', { tokenPreview: String(data).slice(0, 64) });
  const json = await apiFetch('/api/verify-qr', { method: 'POST', body: JSON.stringify({ token: data }) });
  // normalize response to find user and payload
  const u = (json && json.data && json.data.user) ? json.data.user : (json && json.user) ? json.user : (json && json.data) ? json.data : null;
  const payload = (json && json.data && json.data.payload) ? json.data.payload : (json && json.payload) ? json.payload : null;
      // Attach richer user details and vehicles for the scanned user using users-with-vehicles endpoint
      try {
        if (u && u.id) {
          try {
            const uwv = await apiFetch('/api/users-with-vehicles');
            const all = uwv?.data || uwv || [];
            const found = (all || []).find((x: any) => Number(x.id) === Number(u.id));
            if (found) {
              // merge vehicles and user details into the user object the scanner uses
              u.vehicles = found.vehicles || [];
              u.role = found.role || u.role || null;
              u.userDetail = u.userDetail || {};
              u.userDetail.department = u.userDetail.department || found.department;
              u.userDetail.contact_number = u.userDetail.contact_number || found.contact_number;
              u.userDetail.plate_number = u.userDetail.plate_number || (u.vehicles && u.vehicles[0] ? u.vehicles[0].plate_number : undefined);
            }
          } catch (e) {
            // if the lightweight users-with-vehicles endpoint fails, continue with whatever verify returned
            console.warn('[GuardScan] failed to fetch users-with-vehicles', e);
          }
        }
      } catch (e) {
        // ignore
      }
      setUser(u);

      // Quick checks
      const fromPending = (u?.userDetail?.from_pending ?? u?.from_pending ?? payload?.from_pending ?? false);
      if (fromPending) {
        Alert.alert('User Pending', 'This user is pending approval and cannot be assigned a slot.');
        setLoading(false);
        return;
      }

      // mark scanned so camera hides; next show vehicle selection (if multiple)
      setScanned(true);
      // if multiple vehicles exist for this user, show picker; otherwise proceed to load layouts
      try {
        if (u?.vehicles && u.vehicles.length > 1) {
          setShowVehiclePicker(true);
        } else {
          await loadLayouts();
        }
      } catch (e) {
        console.warn('[GuardScan] loadLayouts error', e);
      }

  } catch (err: any) {
      // apiFetch throws a plain object {status, body} for non-2xx responses.
      // Network failures and other errors may throw Error instances. Normalize
      // and log everything so we can diagnose the root cause.
      // eslint-disable-next-line no-console
      console.warn('[GuardScan] verify-qr failed', err);
      let msg = 'Unexpected error';
      try {
        if (!err) msg = 'Unknown error';
        else if (typeof err === 'string') msg = err;
        else if (err.message) msg = err.message;
        else if (err.status) msg = `HTTP ${err.status}: ${JSON.stringify(err.body)}`;
        else msg = JSON.stringify(err);
      } catch (e) {
        msg = 'Error formatting error message';
      }
  Alert.alert('Error', msg);
  // allow immediate re-scan after an error
      try { setScanned(false); } catch (e) { /* ignore */ }
      // allow re-showing the camera for retry after a short delay
      try {
        setTimeout(() => {
          lastScannedDataRef.current = null;
          setShowCamera(true);
        }, 800);
      } catch (e) { /* ignore */ }
    } finally {
      setLoading(false);
      processingRef.current = false;
    }
  };

  // Attempt to assign the given slot in a silent/programmatic way and return success/failure.
  const attemptAssign = async (slot: any) => {
    if (!slot || !user) return { success: false, error: 'missing slot or user' };
    if (processingRef.current) return { success: false, error: 'busy' };
    processingRef.current = true;
    try {
      // build request body similar to assignToSlot/doAssign
      const roleNameFromObj = (user && user.role && typeof user.role === 'object' && (user.role.name || user.role.display_name)) ? (user.role.name || user.role.display_name) : null;
      const roleNameRaw = roleNameFromObj || (user?.role && typeof user.role === 'string' ? user.role : null) || null;
      const roleIdLocal = (user && user.role && typeof user.role === 'object' && user.role.id) ? Number(user.role.id) : (user?.role_id ? Number(user.role_id) : (user?.userDetail?.role_id ? Number(user.userDetail.role_id) : null));
      const roleMapLocal: Record<number, string> = { 3: 'student', 4: 'faculty', 5: 'employee', 6: 'admin', 7: 'guard' };
      const roleNameResolvedLocal = roleNameRaw ? String(roleNameRaw) : (roleIdLocal ? (roleMapLocal[roleIdLocal] || 'guest') : 'guest');
      const assignee_type_local = roleNameResolvedLocal ? roleNameResolvedLocal.toLowerCase() : 'guest';
      const rawVehicleTypeForAssign = (selectedVehicle && selectedVehicle.vehicle_type) ? selectedVehicle.vehicle_type : (user.vehicles && user.vehicles[0]) ? user.vehicles[0].vehicle_type : user.userDetail?.vehicle_type;
      let vehicle_type_for_assign = String(rawVehicleTypeForAssign ?? 'car').toLowerCase();
      if (/suv|sedan|van|truck|auto|vehicle/.test(vehicle_type_for_assign)) vehicle_type_for_assign = 'car';
      if (/motor|moto|bike|biker/.test(vehicle_type_for_assign)) vehicle_type_for_assign = 'motorcycle';
      if (/bicycle|cycle|pushbike/.test(vehicle_type_for_assign)) vehicle_type_for_assign = 'bicycle';
      let vehicle_color_for_assign = (selectedVehicle && (selectedVehicle.vehicle_color || selectedVehicle.color || selectedVehicle.colour)) ? (selectedVehicle.vehicle_color || selectedVehicle.color || selectedVehicle.colour) : (user.userDetail && (user.userDetail.vehicle_color || user.userDetail.color)) ? (user.userDetail.vehicle_color || user.userDetail.color) : 'unknown';
      if ((!vehicle_color_for_assign || vehicle_color_for_assign === 'unknown' || vehicle_color_for_assign === '') && user?.id) {
        try {
          const vs = await apiFetch(`/api/vehicles?user=${user.id}`);
          const vehiclesFromApi = vs?.data || vs || [];
          if (Array.isArray(vehiclesFromApi) && vehiclesFromApi.length > 0) {
            const plate = (selectedVehicle && (selectedVehicle.plate_number || selectedVehicle.plate)) || (user.vehicles && user.vehicles[0] && (user.vehicles[0].plate_number || user.vehicles[0].plate)) || user.userDetail?.plate_number;
            let found = null;
            if (plate) {
              found = vehiclesFromApi.find((x:any) => String((x.plate_number || x.plate || '')).trim().toLowerCase() === String(plate).trim().toLowerCase());
            }
            if (!found) found = vehiclesFromApi[0];
            if (found) vehicle_color_for_assign = found.vehicle_color || found.color || found.colour || vehicle_color_for_assign || 'unknown';
          }
        } catch (e) {
          // ignore enrichment failures
        }
      }
      let faculty_position_local = user.userDetail?.position || user.userDetail?.faculty_position || null;
      const _now = new Date();
      const pad = (n:number) => String(n).padStart(2, '0');
      const nowSql = `${_now.getFullYear()}-${pad(_now.getMonth()+1)}-${pad(_now.getDate())} ${pad(_now.getHours())}:${pad(_now.getMinutes())}:${pad(_now.getSeconds())}`;
      const body: any = {
        parking_slot_id: slot.id,
        user_id: user.id,
        vehicle_plate: (selectedVehicle && selectedVehicle.plate_number) ? selectedVehicle.plate_number : (user.vehicles && user.vehicles[0]) ? user.vehicles[0].plate_number : user.userDetail?.plate_number,
        vehicle_type: vehicle_type_for_assign,
        vehicle_color: vehicle_color_for_assign,
        start_time: nowSql,
        end_time: null,
        faculty_position: faculty_position_local,
        assignment_type: 'assign',
        purpose: 'parking',
        assignee_type: assignee_type_local
      };
      if (assignee_type_local === 'faculty' || assignee_type_local === 'employee') {
        body.faculty_name = user.userDetail?.name || user.name || null;
        faculty_position_local = faculty_position_local || user.userDetail?.position || null;
        body.faculty_position = faculty_position_local;
        body.guest_name = null;
      } else {
        body.guest_name = user.userDetail?.name || user.name || null;
        body.faculty_name = null;
      }
      // perform assignment call
      try {
        const json = await apiFetch('/api/parking-assignments', { method: 'POST', body: JSON.stringify(body) });
        return { success: true, json };
      } catch (err:any) {
        return { success: false, error: err };
      }
    } finally { processingRef.current = false; }
  };

  // load layouts helper
  const loadLayouts = async () => {
    setLayoutsLoading(true);
    try {
      const layoutsResp = await apiFetch('/api/parking-layouts');
      const layoutsData = layoutsResp?.data || layoutsResp || [];
      const normalized = (layoutsData || []).map((l: any) => ({ id: l.id, name: l.name || `Layout ${l.id}`, parking_slots: l.parking_slots || (l.layout_data && l.layout_data.parking_slots) || [] }));
      setLayouts(normalized);
      setDebugLog((s) => [...s.slice(-20), `loaded_layouts=${normalized.length}`]);
    } catch (e:any) {
      console.warn('[GuardScan] failed to load layouts', e);
      Alert.alert('Error', 'Failed to load parking layouts');
    } finally {
      setLayoutsLoading(false);
    }
  };

  const refreshSlots = async () => {
    if (!lastLayoutId) return Alert.alert('No layout', 'No layout context available to refresh slots.');
    setLoading(true);
    try {
      let slotsJson: any = [];
      try { slotsJson = await apiFetch(`/api/parking-assignments/by-layout/${lastLayoutId}`); } catch (e) { /* ignore */ }
      let parkingSlotsResp: any = [];
      try { parkingSlotsResp = await apiFetch(`/api/parking-slots?layout=${lastLayoutId}`); } catch (e) { /* ignore */ }
      // unwrap .data if apiFetch returned an object wrapper
      let parkingSlots: any[] = parkingSlotsResp?.data || parkingSlotsResp || [];
      const slotsArrayFromAssignments = (slotsJson?.data || slotsJson || []);
      if ((parkingSlots || []).length === 0 && Array.isArray(slotsArrayFromAssignments)) {
        parkingSlots = slotsArrayFromAssignments.map((a: any) => a.parking_slot).filter(Boolean);
      }
      // normalize slots (match parking-assignment page normalization)
      const normalize = (s: any) => ({
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
      });
  const normalizedSlots = (parkingSlots || []).map(normalize);
      // Derive vehicle type robustly. Prefer explicit vehicle record, then userDetail.vehicle_type,
      // then infer 'car' when a plate number exists. Default to 'car' if still unknown to match server behavior.
  const rawVehicleType = (selectedVehicle && selectedVehicle.vehicle_type) ? selectedVehicle.vehicle_type : (user?.vehicles?.length ? (user.vehicles[0]?.vehicle_type || user.userDetail?.vehicle_type) : (user?.userDetail?.vehicle_type ?? (user?.userDetail?.plate_number ? 'Car' : undefined)));
  let vehicleTypeNorm = String(rawVehicleType ?? 'car').toLowerCase();
  // map common variants to server-expected canonical types
  if (/suv|sedan|van|truck|auto|vehicle/.test(vehicleTypeNorm)) vehicleTypeNorm = 'car';
  if (/motor|moto|bike|biker/.test(vehicleTypeNorm)) vehicleTypeNorm = 'motorcycle';
  if (/bicycle|cycle|pushbike/.test(vehicleTypeNorm)) vehicleTypeNorm = 'bicycle';
      // Normalize slot fields too
      const candidates = normalizedSlots.filter(s => {
        if (!s) return false;
        const status = String(s.space_status ?? (s.metadata && s.metadata.status) ?? '').toLowerCase();
        if (status !== 'available') return false;
        const slotType = String(s.space_type ?? (s.metadata && s.metadata.type) ?? '').toLowerCase();
        // compatibility rules: compact -> motorcycle|bicycle; standard -> car; unknown slotType accept any
        if (slotType === 'compact') return ['motorcycle', 'bicycle'].includes(vehicleTypeNorm);
        if (slotType === 'standard') return vehicleTypeNorm === 'car';
        return true;
      });
      // debug vehicle type information (also emit to console for immediate logs)
      // eslint-disable-next-line no-console
      console.warn('[GuardScan] refreshSlots vehicleType', { vehicleTypeNorm, rawVehicleType, sampleSlot: normalizedSlots[0] });
      setDebugLog((s) => [...s.slice(-20), `vehicleType=${vehicleTypeNorm} raw=${String(rawVehicleType)}`]);
      // If strict filtering yields nothing but available slots exist, fallback to any available slots
      if ((candidates || []).length === 0) {
        const availableFallback = normalizedSlots.filter(s => String(s.space_status ?? (s.metadata && s.metadata.status) ?? '').toLowerCase() === 'available');
        if (availableFallback.length > 0) {
          // eslint-disable-next-line no-console
          console.warn('[GuardScan] candidate filter produced 0 results; falling back to any available slots', { availableFallbackLength: availableFallback.length });
          setDebugLog((s) => [...s.slice(-20), `fallback_any_available=${availableFallback.length}`]);
          setSlots(availableFallback);
          if (availableFallback.length > 0) setSelectedSlot(availableFallback[0]);
          setLoading(false);
          processingRef.current = false;
          return;
        }
      }
    // debug traces to understand why slots may not appear
    // eslint-disable-next-line no-console
    console.warn('[GuardScan] refreshSlots', { layout: lastLayoutId, parkingSlotsLength: parkingSlots.length, normalizedSlotsLength: normalizedSlots.length, candidatesLength: candidates.length, sample: normalizedSlots[0] });
    setDebugLog((s) => [...s.slice(-20), `refresh layout=${lastLayoutId} candidates=${candidates.length}`]);
    setSlots(candidates || []);
      if (candidates && candidates.length > 0) setSelectedSlot(candidates[0]);
    } catch (e:any) {
      console.warn('[GuardScan] refreshSlots failed', e);
      Alert.alert('Error', 'Failed to refresh slots');
    } finally { setLoading(false); }
  };

  const selectLayout = async (layoutId: number) => {
    setSelectedLayoutId(layoutId);
    setLoading(true);
    setDebugLog((s) => [...s.slice(-20), `selected_layout=${layoutId}`]);
    try {
      setLastLayoutId(layoutId);
      let slotsJson: any = [];
      // Prefer layout's embedded parking_slots if available
      let parkingSlots: any[] = [];
      try {
        const layoutResp = await apiFetch(`/api/parking-layouts/${layoutId}`);
        const layoutData = layoutResp?.data || layoutResp || null;
        if (layoutData && (layoutData.parking_slots || (layoutData.layout_data && layoutData.layout_data.parking_slots))) {
          parkingSlots = layoutData.parking_slots || (layoutData.layout_data && layoutData.layout_data.parking_slots) || [];
        } else {
          try {
            const psr = await apiFetch(`/api/parking-slots?layout=${layoutId}`);
            parkingSlots = psr?.data || psr || [];
          } catch (e) { /* ignore */ }
          if ((parkingSlots || []).length === 0) {
            try { slotsJson = await apiFetch(`/api/parking-assignments/by-layout/${layoutId}`); } catch (e) { /* ignore */ }
            const slotsFromAsg = (slotsJson?.data || slotsJson || []);
            if (Array.isArray(slotsFromAsg)) parkingSlots = slotsFromAsg.map((a: any) => a.parking_slot).filter(Boolean);
          }
        }
      } catch (e) {
        // fallback to direct endpoints
        try { const psr = await apiFetch(`/api/parking-slots?layout=${layoutId}`); parkingSlots = psr?.data || psr || []; } catch (e) { /* ignore */ }
      }

      // normalize slots to same shape used on ParkingAssignment page
      const normalize = (s: any) => ({
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
      });
      const normalizedSlots = (parkingSlots || []).map(normalize);
      // Derive vehicle type robustly (same logic as refreshSlots)
  const rawVehicleType = (selectedVehicle && selectedVehicle.vehicle_type) ? selectedVehicle.vehicle_type : (user?.vehicles?.length ? (user.vehicles[0]?.vehicle_type || user.userDetail?.vehicle_type) : (user?.userDetail?.vehicle_type ?? (user?.userDetail?.plate_number ? 'car' : undefined)));
  let vehicleTypeNorm = String(rawVehicleType ?? 'car').toLowerCase();
  if (/suv|sedan|van|truck|auto|vehicle/.test(vehicleTypeNorm)) vehicleTypeNorm = 'car';
  if (/motor|moto|bike|biker/.test(vehicleTypeNorm)) vehicleTypeNorm = 'motorcycle';
  if (/bicycle|cycle|pushbike/.test(vehicleTypeNorm)) vehicleTypeNorm = 'bicycle';
      const candidates = normalizedSlots.filter(s => {
        if (!s) return false;
        const status = String(s.space_status ?? (s.metadata && s.metadata.status) ?? '').toLowerCase();
        if (status !== 'available') return false;
        const slotType = String(s.space_type ?? (s.metadata && s.metadata.type) ?? '').toLowerCase();
        if (slotType === 'compact') return ['motorcycle', 'bicycle'].includes(vehicleTypeNorm);
        if (slotType === 'standard') return vehicleTypeNorm === 'car';
        return true;
      });
      // eslint-disable-next-line no-console
      console.warn('[GuardScan] selectLayout vehicleType', { vehicleTypeNorm, rawVehicleType, selected_layout: layoutId, normalizedSlotsLength: normalizedSlots.length, candidates: (candidates||[]).length, sample: normalizedSlots[0] });
      setDebugLog((s) => [...s.slice(-20), `vehicleType=${vehicleTypeNorm} raw=${String(rawVehicleType)} selected_layout=${layoutId} candidates=${(candidates||[]).length}`]);
      // fallback: if no candidates due to type mismatch, fall back to any available slots
      if ((candidates || []).length === 0) {
        const availableFallback = normalizedSlots.filter(s => String(s.space_status ?? (s.metadata && s.metadata.status) ?? '').toLowerCase() === 'available');
        if (availableFallback.length > 0) {
          // eslint-disable-next-line no-console
          console.warn('[GuardScan] selectLayout fallback to any available slots', { availableFallbackLength: availableFallback.length });
          setDebugLog((s) => [...s.slice(-20), `fallback_any_available=${availableFallback.length}`]);
          setSlots(availableFallback);
          if (availableFallback.length > 0) setSelectedSlot(availableFallback[0]);
          if (availableFallback.length === 1) {
            const slotToAssign = availableFallback[0];
            setTimeout(() => { if (!processingRef.current) assignToSlot(slotToAssign); }, 1200);
          }
          return;
        }
      }
      setSlots(candidates || []);
      if (candidates && candidates.length > 0) setSelectedSlot(candidates[0]);
      if (candidates && candidates.length > 0) {
        // If there are candidates, attempt to auto-assign one of them sequentially.
        // We'll try each candidate until one succeeds or all fail.
        const autoAssignCandidates = async (candList: any[]) => {
          setAutoAssignInProgress(true);
          autoAssignAbortRef.current = false;
          try {
            for (let i = 0; i < candList.length; i++) {
              if (autoAssignAbortRef.current) {
                setAutoAssignStatus('Cancelled');
                return false;
              }
              const s = candList[i];
              const attemptLabel = `attempt ${i+1}/${candList.length} slot=${s.id}`;
              setAutoAssignStatus(`Trying ${s.space_number || s.id} (${i+1}/${candList.length})`);
              console.warn('[GuardScan] attempting automated assign to candidate', { index: i, slotId: s.id });
              setDebugLog((d) => [...d.slice(-40), `autoAttempt slot=${s.id} idx=${i}`]);
              // be polite and wait a short moment so UI updates
              await new Promise(r => setTimeout(r, 600));
              try {
                const res = await attemptAssign(s);
                if (res && res.success) {
                  console.warn('[GuardScan] automated assign succeeded', { slotId: s.id });
                  setDebugLog((d) => [...d.slice(-40), `autoAssign success slot=${s.id}`]);
                  setAutoAssignStatus(`Assigned ${s.space_number || s.id}`);
                  // show visible confirmation
                  Alert.alert('Auto-assign', `Assigned slot ${s.space_number || s.id}`);
                  // refresh UI state similar to manual assign
                  setUser(null); setSlots([]); setSelectedSlot(null); setScanned(false);
                  return true;
                }
                // otherwise log and continue
                console.warn('[GuardScan] automated assign failed for slot', { slotId: s.id, err: res && res.error });
                setDebugLog((d) => [...d.slice(-40), `autoAssign failed slot=${s.id} err=${String(res?.error?.message || res?.error)}`]);
                setAutoAssignStatus(`Failed ${s.space_number || s.id}`);
              } catch (e:any) {
                console.warn('[GuardScan] automated assign exception', e);
                setAutoAssignStatus(`Error ${s.space_number || s.id}`);
              }
            }
            setAutoAssignStatus('No candidate succeeded');
            Alert.alert('Auto-assign', 'No candidate succeeded');
            return false;
          } finally {
            setAutoAssignInProgress(false);
          }
        };
        // run auto-assign in background after a short delay so the UI is stable
        setTimeout(() => {
          if (!processingRef.current) autoAssignCandidates(candidates).then((ok) => {
            if (!ok) console.warn('[GuardScan] automated assign: no candidate succeeded');
          });
        }, 1200);
      }
    } catch (e:any) {
      console.warn('[GuardScan] selectLayout failed', e);
      Alert.alert('Error', 'Failed to load slots for layout');
    } finally { setLoading(false); }
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
  // derive a normalized assignee_type expected by server: use numeric role id on user record
  // role id 4 => Faculty => 'faculty', otherwise 'guest'
  // derive assignee_type from role name when available; fall back to mapping by role id
  const roleNameFromObj = (user && user.role && typeof user.role === 'object' && (user.role.name || user.role.display_name)) ? (user.role.name || user.role.display_name) : null;
  const roleNameRaw = roleNameFromObj || (user?.role && typeof user.role === 'string' ? user.role : null) || null;
  const roleId = (user && user.role && typeof user.role === 'object' && user.role.id) ? Number(user.role.id) : (user?.role_id ? Number(user.role_id) : (user?.userDetail?.role_id ? Number(user.userDetail.role_id) : null));
  const roleMap: Record<number, string> = { 3: 'student', 4: 'faculty', 5: 'employee', 6: 'admin', 7: 'guard' };
  const roleNameResolved = roleNameRaw ? String(roleNameRaw) : (roleId ? (roleMap[roleId] || null) : null);
  const assignee_type = roleNameResolved ? roleNameResolved.toLowerCase() : null;
      const rawVehicleTypeForAssign = (selectedVehicle && selectedVehicle.vehicle_type) ? selectedVehicle.vehicle_type : (user.vehicles && user.vehicles[0]) ? user.vehicles[0].vehicle_type : user.userDetail?.vehicle_type;
      let vehicle_type_for_assign = String(rawVehicleTypeForAssign ?? 'car').toLowerCase();
      // canonicalize common variants to server-expected values
      if (/suv|sedan|van|truck|auto|vehicle/.test(vehicle_type_for_assign)) vehicle_type_for_assign = 'car';
      if (/motor|moto|bike|biker/.test(vehicle_type_for_assign)) vehicle_type_for_assign = 'motorcycle';
      if (/bicycle|cycle|pushbike/.test(vehicle_type_for_assign)) vehicle_type_for_assign = 'bicycle';
      let vehicle_color_for_assign = (selectedVehicle && (selectedVehicle.vehicle_color || selectedVehicle.color || selectedVehicle.colour)) ? (selectedVehicle.vehicle_color || selectedVehicle.color || selectedVehicle.colour) : (user.userDetail && (user.userDetail.vehicle_color || user.userDetail.color)) ? (user.userDetail.vehicle_color || user.userDetail.color) : 'unknown';
      // If vehicle_color still missing, try to fetch from vehicles endpoint for the user
      if ((!vehicle_color_for_assign || vehicle_color_for_assign === 'unknown' || vehicle_color_for_assign === '') && user?.id) {
        try {
          const vs = await apiFetch(`/api/vehicles?user=${user.id}`);
          const vehiclesFromApi = vs?.data || vs || [];
          if (Array.isArray(vehiclesFromApi) && vehiclesFromApi.length > 0) {
            const plate = (selectedVehicle && (selectedVehicle.plate_number || selectedVehicle.plate)) || (user.vehicles && user.vehicles[0] && (user.vehicles[0].plate_number || user.vehicles[0].plate)) || user.userDetail?.plate_number;
            let found = null;
            if (plate) {
              found = vehiclesFromApi.find((x:any) => String((x.plate_number || x.plate || '')).trim().toLowerCase() === String(plate).trim().toLowerCase());
            }
            if (!found) found = vehiclesFromApi[0];
            if (found) vehicle_color_for_assign = found.vehicle_color || found.color || found.colour || vehicle_color_for_assign || 'unknown';
          }
        } catch (e) {
          console.warn('[GuardScan] failed to fetch vehicles for color enrichment', e);
        }
      }
  const faculty_position = user.userDetail?.position || user.userDetail?.faculty_position || null;
  // format start_time as SQL datetime 'YYYY-MM-DD HH:MM:SS'
  const _now = new Date();
  const pad = (n:number) => String(n).padStart(2, '0');
  const nowSql = `${_now.getFullYear()}-${pad(_now.getMonth()+1)}-${pad(_now.getDate())} ${pad(_now.getHours())}:${pad(_now.getMinutes())}:${pad(_now.getSeconds())}`;
      const body: any = {
  parking_slot_id: selectedSlot?.id,
  user_id: user.id,
        vehicle_plate: (selectedVehicle && selectedVehicle.plate_number) ? selectedVehicle.plate_number : (user.vehicles && user.vehicles[0]) ? user.vehicles[0].plate_number : user.userDetail?.plate_number,
        vehicle_type: vehicle_type_for_assign,
  vehicle_color: vehicle_color_for_assign,
  start_time: nowSql,
        end_time: null,
        faculty_position: faculty_position,
        assignment_type: 'assign',
        purpose: 'parking',
        assignee_type: assignee_type
      };
      // Attach name fields: if role is faculty send faculty_name, otherwise when user_id is absent send guest_name
      if (assignee_type === 'faculty') {
        body.faculty_name = user.userDetail?.name || user.name || null;
        body.guest_name = null;
      } else {
        body.guest_name = user.id ? null : (user.userDetail?.name || user.name || null);
      }
      try {
        await apiFetch('/api/parking-assignments', { method: 'POST', body: JSON.stringify(body) });
        Alert.alert('Assigned', 'Parking slot assigned successfully');
        setUser(null); setSlots([]); setSelectedSlot(null); setScanned(false);
      } catch (err: any) {
        // mirror error handling used in assignToSlot
        if (err && err.status === 403) {
          Alert.alert('Assign failed', 'Forbidden: ensure you are logged in as a guard');
          setErrorDetail('Forbidden');
          return;
        }
        if (err && err.status === 422) {
          const msg = (err.body && err.body.errors) ? JSON.stringify(err.body.errors) : JSON.stringify(err.body || err);
          setErrorDetail(msg);
          Alert.alert('Assign failed', msg);
          return;
        }
        const msg = err && err.body ? JSON.stringify(err.body) : String(err?.message || err);
        setErrorDetail(msg);
        Alert.alert('Assign failed', msg);
        return;
      }
    } catch (e: any) {
      setErrorDetail(e?.message || 'Unexpected');
      Alert.alert('Error', String(e?.message || 'Unexpected'));
    } finally { setLoading(false); }
  };

  // Assign the given parking slot to the currently scanned user immediately.
  const assignToSlot = async (slot: any) => {
    if (!slot || !user) return Alert.alert('Missing', 'No slot or user selected');
    // prevent re-entrancy
    if (processingRef.current) {
      console.warn('[GuardScan] assign ignored, processing ongoing');
      return;
    }
    processingRef.current = true;
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('auth_token');
      // derive role mapping same as doAssign
      const roleNameFromObj = (user && user.role && typeof user.role === 'object' && (user.role.name || user.role.display_name)) ? (user.role.name || user.role.display_name) : null;
      const roleNameRaw = roleNameFromObj || (user?.role && typeof user.role === 'string' ? user.role : null) || null;
      const roleIdLocal = (user && user.role && typeof user.role === 'object' && user.role.id) ? Number(user.role.id) : (user?.role_id ? Number(user.role_id) : (user?.userDetail?.role_id ? Number(user.userDetail.role_id) : null));
      const roleMapLocal: Record<number, string> = { 3: 'student', 4: 'faculty', 5: 'employee', 6: 'admin', 7: 'guard' };
      const roleNameResolvedLocal = roleNameRaw ? String(roleNameRaw) : (roleIdLocal ? (roleMapLocal[roleIdLocal] || 'guest') : 'guest');
      const assignee_type_local = roleNameResolvedLocal ? roleNameResolvedLocal.toLowerCase() : 'guest';
      const rawVehicleTypeForAssign = (selectedVehicle && selectedVehicle.vehicle_type) ? selectedVehicle.vehicle_type : (user.vehicles && user.vehicles[0]) ? user.vehicles[0].vehicle_type : user.userDetail?.vehicle_type;
      let vehicle_type_for_assign = String(rawVehicleTypeForAssign ?? 'car').toLowerCase();
      if (/suv|sedan|van|truck|auto|vehicle/.test(vehicle_type_for_assign)) vehicle_type_for_assign = 'car';
      if (/motor|moto|bike|biker/.test(vehicle_type_for_assign)) vehicle_type_for_assign = 'motorcycle';
      if (/bicycle|cycle|pushbike/.test(vehicle_type_for_assign)) vehicle_type_for_assign = 'bicycle';
      let vehicle_color_for_assign = (selectedVehicle && (selectedVehicle.vehicle_color || selectedVehicle.color || selectedVehicle.colour)) ? (selectedVehicle.vehicle_color || selectedVehicle.color || selectedVehicle.colour) : (user.userDetail && (user.userDetail.vehicle_color || user.userDetail.color)) ? (user.userDetail.vehicle_color || user.userDetail.color) : 'unknown';
      if ((!vehicle_color_for_assign || vehicle_color_for_assign === 'unknown' || vehicle_color_for_assign === '') && user?.id) {
        try {
          const vs = await apiFetch(`/api/vehicles?user=${user.id}`);
          const vehiclesFromApi = vs?.data || vs || [];
          if (Array.isArray(vehiclesFromApi) && vehiclesFromApi.length > 0) {
            const plate = (selectedVehicle && (selectedVehicle.plate_number || selectedVehicle.plate)) || (user.vehicles && user.vehicles[0] && (user.vehicles[0].plate_number || user.vehicles[0].plate)) || user.userDetail?.plate_number;
            let found = null;
            if (plate) {
              found = vehiclesFromApi.find((x:any) => String((x.plate_number || x.plate || '')).trim().toLowerCase() === String(plate).trim().toLowerCase());
            }
            if (!found) found = vehiclesFromApi[0];
            if (found) vehicle_color_for_assign = found.vehicle_color || found.color || found.colour || vehicle_color_for_assign || 'unknown';
          }
        } catch (e) {
          console.warn('[GuardScan] failed to fetch vehicles for color enrichment', e);
        }
      }
      let faculty_position_local = user.userDetail?.position || user.userDetail?.faculty_position || null;
      const _now = new Date();
      const pad = (n:number) => String(n).padStart(2, '0');
      const nowSql = `${_now.getFullYear()}-${pad(_now.getMonth()+1)}-${pad(_now.getDate())} ${pad(_now.getHours())}:${pad(_now.getMinutes())}:${pad(_now.getSeconds())}`;
      const body: any = {
        parking_slot_id: slot.id,
        user_id: user.id,
        vehicle_plate: (selectedVehicle && selectedVehicle.plate_number) ? selectedVehicle.plate_number : (user.vehicles && user.vehicles[0]) ? user.vehicles[0].plate_number : user.userDetail?.plate_number,
        vehicle_type: vehicle_type_for_assign,
        vehicle_color: vehicle_color_for_assign,
        start_time: nowSql,
        end_time: null,
        faculty_position: faculty_position_local,
        assignment_type: 'assign',
        purpose: 'parking',
        assignee_type: assignee_type_local
      };
      if (assignee_type_local === 'faculty' || assignee_type_local === 'employee') {
        body.faculty_name = user.userDetail?.name || user.name || null;
        faculty_position_local = faculty_position_local || user.userDetail?.position || null;
        body.faculty_position = faculty_position_local;
        body.guest_name = null;
      } else {
        body.guest_name = user.userDetail?.name || user.name || null;
        body.faculty_name = null;
      }
      // eslint-disable-next-line no-console
      console.warn('[GuardScan] assignToSlot request', body);
      try {
        const json = await apiFetch('/api/parking-assignments', { method: 'POST', body: JSON.stringify(body) });
        // eslint-disable-next-line no-console
        console.warn('[GuardScan] assignToSlot success', json);
      } catch (err: any) {
        console.warn('[GuardScan] assignToSlot error', err);
        if (err && err.status === 403) {
          Alert.alert('Assign failed', 'Forbidden: ensure you are logged in as a guard');
          setErrorDetail('Forbidden');
          return;
        }
        if (err && err.status === 422) {
          const errorsObj = err.body && err.body.errors ? err.body.errors : null;
          let msg = 'Validation failed';
          if (errorsObj && typeof errorsObj === 'object') {
            const parts: string[] = [];
            for (const k of Object.keys(errorsObj)) {
              const v = errorsObj[k];
              if (Array.isArray(v)) parts.push(`${k}: ${v.join(', ')}`);
              else parts.push(`${k}: ${String(v)}`);
            }
            msg = parts.join('\n');
          } else if (err.body && err.body.message) {
            msg = err.body.message;
          }
          setErrorDetail(msg);
          Alert.alert('Validation failed', msg);
          return;
        }
        const serverMsg = err && err.body ? (err.body.error || err.body.message || JSON.stringify(err.body)) : String(err?.message || err);
        setErrorDetail(serverMsg);
        Alert.alert('Assign failed', serverMsg);
        return;
      }
      Alert.alert('Assigned', 'Parking slot assigned successfully');
      setUser(null); setSlots([]); setSelectedSlot(null); setScanned(false);
    } catch (e: any) {
      setErrorDetail(e?.message || 'Unexpected');
      Alert.alert('Error', String(e?.message || 'Unexpected'));
    } finally { setLoading(false); }
  };

  // If permissions are unknown, prompt the user to request camera access.
  if (hasPermission === null) {
    return (
      <View style={styles.center}>
        <Text style={{ textAlign: 'center', marginBottom: 12 }}>Camera permission is required to use the scanner.</Text>
        <Button title="Request Camera Permission" onPress={async () => {
          // show a brief requesting state
          setHasPermission(null);
          await requestPermissions();
        }} />
      </View>
    );
  }

  // If permissions denied, show fallback UI with clear actions
  if (hasPermission === false) {
    return (
      <View style={styles.center}>
        <Text style={{textAlign:'center', marginBottom:12}}>Barcode scanner native module not available or camera permission denied.</Text>
        <Text style={{textAlign:'center', marginBottom:12}}>Please run a native build or an Expo dev client so the native camera module is present.</Text>
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
      <Header title="Guard Scanner" subtitle="Scan QR to assign parking" />
      {!scanned && (
        <View style={styles.scanner}>
          {/* Render the BarCodeScanner if the native module is present. Prefer using a JSX component
              variable instead of passing a module object to React.createElement which causes
              the "type is invalid" runtime error when the module namespace is used. */}
          {(() => {
            // Render expo-camera's Camera and use its built-in barcode scanning.
            // onBarcodeScanned is the prop name used by expo-camera for SDK 51+.
            try {
              // trace camera rendering attempts
              // eslint-disable-next-line no-console
              console.warn('[GuardScan] attempting to resolve Camera component, hasPermission=', hasPermission, 'cameraLoading=', cameraLoading, 'moduleLoaded=', !!CameraModule);
              // Resolve the actual Camera component export shape from the dynamically
              // imported module. Some builds expose the component as the module default,
              // others as a `.Camera` property or nested.
              const Imported: any = CameraModule as any;
              if (cameraLoading) {
                return (
                  <View style={{ padding: 12 }}>
                    <Text>Loading camera module…</Text>
                  </View>
                );
              }
              if (!Imported) {
                return (
                  <View style={{ padding: 12 }}>
                    <Text>Camera component not available. Ensure `expo-camera` is installed and the app was rebuilt.</Text>
                  </View>
                );
              }
              const tryKeys = ['Camera', 'camera', 'default', 'Default', 'ExpoCamera'];
              let Candidate: any = null;
              // direct function (best case)
              if (typeof Imported === 'function') Candidate = Imported;
              // check common keys
              if (!Candidate && Imported && typeof Imported === 'object') {
                for (const k of tryKeys) {
                  if (typeof Imported[k] === 'function') { Candidate = Imported[k]; break; }
                }
                // if still not found, search values for a function-looking component
                if (!Candidate) {
                  for (const v of Object.values(Imported)) {
                    if (typeof v === 'function') { Candidate = v; break; }
                  }
                }
              }
              if (!Candidate) {
                const available = Imported && typeof Imported === 'object' ? Object.keys(Imported).join(', ') : String(typeof Imported);
                // eslint-disable-next-line no-console
                console.warn('[GuardScan] Camera exports available:', available);
                return (
                  <View style={{ padding: 12 }}>
                    <Text>Camera component not available. Ensure `expo-camera` is installed and the app was rebuilt.</Text>
                    <Text style={{ marginTop: 8, fontSize: 12, color: '#666' }}>Detected exports: {available}</Text>
                  </View>
                );
              }
              const CameraComp: any = Candidate;
              // Provide both handler prop names (onBarCodeScanned and onBarcodeScanned)
              // to support different expo-camera versions.
              const cameraProps: any = {
                style: { flex: 1 },
                type: 'back',
                // provide both handler prop names (some builds expect different casing)
                onBarcodeScanned: scanned ? undefined : handleBarCodeScanned,
                onBarCodeScanned: scanned ? undefined : handleBarCodeScanned,
                barcodeScannerSettings: {}
              };
              return <CameraComp {...cameraProps} />;
            } catch (e) {
              return <Text>Camera component not available. Ensure `expo-camera` is installed and the app was rebuilt.</Text>;
            }
          })()}
        </View>
      )}
      {loading && (
        <View style={styles.processingOverlay} pointerEvents="none">
          <View style={styles.processingBox}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={{ color: '#fff', marginTop: 8 }}>Processing…</Text>
          </View>
        </View>
      )}
      {user && (
        <Card style={{ margin: 12 }}>
          <Text style={{ fontWeight: '700', fontSize: 16 }}>User: {user.name}</Text>
              <Text>Pending: {String(user.userDetail?.from_pending ?? false)}</Text>
              <Text>Plate: {selectedVehicle?.plate_number || (user.vehicles && user.vehicles[0]?.plate_number)}</Text>
              <Text>Department: {user.userDetail?.department ?? user.department ?? 'N/A'}</Text>
              {/* Show ID number (student_no / id_number / faculty_id / employee_id) when available */}
              <Text>ID No: {user.userDetail?.id_number || user.userDetail?.student_no || user.userDetail?.faculty_id || user.userDetail?.employee_id || 'N/A'}</Text>
              {/* If an ID file was uploaded/displayable, show a small preview or button to open it */}
              {user.userDetail?.id_path ? (
                <View style={{ marginTop: 8 }}>
                  {(() => {
                    const uri = String(user.userDetail.id_path);
                    const isImage = /\.(jpe?g|png|gif|webp)(\?|#|$)/i.test(uri) || /^data:image\//i.test(uri);
                    if (isImage) {
                      return (
                        <TouchableOpacity onPress={() => { try { Linking.openURL(uri); } catch (e) { /* ignore */ } }}>
                          <Image source={{ uri }} style={{ width: 120, height: 80, borderRadius: 6 }} resizeMode="cover" />
                        </TouchableOpacity>
                      );
                    }
                    return (
                      <TouchableOpacity onPress={() => { try { Linking.openURL(uri); } catch (e) { /* ignore */ } }} style={{ padding: 8, backgroundColor: '#eee', borderRadius: 6 }}>
                        <Text style={{ color: '#333' }}>View ID document</Text>
                      </TouchableOpacity>
                    );
                  })()}
                </View>
              ) : null}
          {autoAssignStatus ? <Text style={{ marginTop: 8, color: '#6B7280' }}>Auto-assign: {autoAssignStatus}</Text> : null}
          {autoAssignInProgress ? <PrimaryButton title="Cancel auto-assign" onPress={() => { autoAssignAbortRef.current = true; setAutoAssignStatus('Cancelling'); }} style={{ marginTop: 8 }} /> : null}
        </Card>
      )}
      {/* Layout selection: show when user is loaded and guard has not selected a layout yet */}
      {user && scanned && showVehiclePicker && (
        <View style={{ marginVertical: 8 }}>
          <Text style={{ fontWeight: '700', marginBottom: 6 }}>Choose vehicle for assignment</Text>
          {(user.vehicles || []).map((v:any) => (
            <TouchableOpacity key={v.id} onPress={() => { setSelectedVehicle(v); setShowVehiclePicker(false); loadLayouts(); }} style={{ padding: 8, backgroundColor: '#fff', marginBottom: 6, borderRadius: 6 }}>
              <Text>{v.plate_number || v.plate || 'No plate'} — {v.vehicle_type || 'unknown'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {user && scanned && !showVehiclePicker && layouts && layouts.length > 0 && !selectedLayoutId && (
        <View style={{ marginVertical: 8 }}>
          <Text style={{ fontWeight: '700', marginBottom: 6 }}>Choose a parking layout</Text>
          {layouts.map(l => (
            <View key={l.id} style={{ padding: 8, backgroundColor: '#fff', marginBottom: 6, borderRadius: 6 }}>
              <TouchableOpacity onPress={() => selectLayout(l.id)}>
                <Text>{l.name} ({(l.parking_slots || []).length} slots)</Text>
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', marginTop: 6 }}>
                <Button title="View layout" onPress={() => router.push({ pathname: '/parking-assignment/[id]', params: { id: String(l.id) } } as any)} />
                <View style={{ width: 8 }} />
                <Button title="Select" onPress={() => selectLayout(l.id)} />
              </View>
            </View>
          ))}
        </View>
      )}
      {user && slots.length === 0 && !loading && (
        <View style={{ marginVertical: 8 }}>
          <Text style={{ marginBottom: 8 }}>No candidate slots found.</Text>
          <Button title="Find Slots" onPress={refreshSlots} />
        </View>
      )}
      {slots.length > 0 && (
        <View style={styles.list}>
          <Text style={styles.title}>Available slots ({slots.length})</Text>
          <View style={{ flexDirection: 'row', marginBottom: 6 }}>
            <Button title="View layout" onPress={() => { if (lastLayoutId) router.push({ pathname: '/parking-assignment/[id]', params: { id: String(lastLayoutId) } } as any); else Alert.alert('No layout', 'No layout selected'); }} />
            <View style={{ width: 8 }} />
            {autoAssignInProgress ? <Button title="Cancel auto-assign" onPress={() => { autoAssignAbortRef.current = true; setAutoAssignStatus('Cancelling'); }} /> : null}
          </View>
          <FlatList data={slots} keyExtractor={(i:any)=>String(i.id)} renderItem={({item})=> (
            <TouchableOpacity onPress={()=>{ setSelectedSlot(item); assignToSlot(item); }} style={[styles.slot, selectedSlot?.id===item.id?{backgroundColor:'#cde'}:null]}>
              <Text>#{item.space_number} - {item.space_type} - {item.space_status}</Text>
            </TouchableOpacity>
          )} />
          {slots.length === 1 && !loading && (
            // auto-assign the single candidate after a short pause so guard can confirm
            <Button title="Auto-assign this slot" onPress={() => assignToSlot(slots[0])} />
          )}
          <Button title="Assign Selected Slot" onPress={assignSelected} />
        </View>
      )}
      {scanned && !loading && (
        <Button title="Scan Again" onPress={()=>{ setScanned(false); setUser(null); setSlots([]); setSelectedSlot(null); }} />
      )}
      {/* Debug panel - shows recent debug entries to help diagnose server responses */}
      <View style={styles.debugPanel}>
        <Text style={{ fontWeight: '600' }}>Debug</Text>
        {debugLog.slice().reverse().map((l, idx) => (
          <Text key={idx} style={{ fontSize: 11 }}>{l}</Text>
        ))}
      </View>
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
  ,processingOverlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  processingBox: { padding: 16, backgroundColor: '#222', borderRadius: 8, alignItems: 'center' },
  debugPanel: { position: 'absolute', left: 8, right: 8, bottom: 8, maxHeight: 160, backgroundColor: 'rgba(255,255,255,0.92)', padding: 8, borderRadius: 6 }
});
