import React, { useEffect, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { SafeAreaView, StatusBar, Text, TouchableOpacity, View, ActivityIndicator, Platform, Alert, Switch } from 'react-native';
import { getSignup, resetSignup, setSignup } from '../_lib/signupStore';
import { Modal, TextInput } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { PDFDocument } from 'pdf-lib';
import { Buffer } from 'buffer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createWorker, PSM } from 'tesseract.js';

export default function UploadOrCr() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [orName, setOrName] = useState<string | null>(null);
  const [crName, setCrName] = useState<string | null>(null);
  const [idName, setIdName] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'match' | 'mismatch' | null>(null);
  const [modalName, setModalName] = useState<string | null>(null);
  const [modalOrName, setModalOrName] = useState<string | null>(null);
  const [modalOrNumber, setModalOrNumber] = useState<string | null>(null);
  const [modalCrName, setModalCrName] = useState<string | null>(null);
  const [modalCrNumber, setModalCrNumber] = useState<string | null>(null);
  const [modalPct, setModalPct] = useState<number>(0);
  const [modalOrPct, setModalOrPct] = useState<number>(0);
  const [modalCrPct, setModalCrPct] = useState<number>(0);
  const [modalResolve, setModalResolve] = useState<((v: any) => void) | null>(null);
  const [isSecondHand, setIsSecondHand] = useState<boolean>(false);
  const [deedName, setDeedName] = useState<string | null>(null);

  const getFilenameFromUri = (uri?: string | null) => {
    if (!uri) return null;
    try {
      const decoded = decodeURIComponent(uri);
      const last = decoded.split('/').pop() || decoded;
      return last.split('?')[0];
    } catch (e) {
      return uri;
    }
  };

  const isFocused = useIsFocused();

  useEffect(() => {
    const store = getSignup();
    console.log('UploadOrCr focus check; isFocused=', isFocused, 'store=', store);
    setIdName((store as any).id_name || getFilenameFromUri((store as any).id_path));
    setOrName((store as any).or_name || getFilenameFromUri((store as any).or_path || (store as any).or_file));
    setCrName((store as any).cr_name || getFilenameFromUri((store as any).cr_path || (store as any).cr_file));
    setIsSecondHand(!!(store as any).is_second_hand);
    setDeedName((store as any).deed_name || getFilenameFromUri((store as any).deed_path));
  }, [isFocused]);

  const openPicker = () => router.push({ pathname: '/log-in module/orcrstudent' } as any);

  const pickDeed = async () => {
    // reuse the OR/CR picker route for simplicity; the picker route supports pdf/image
    router.push({ pathname: '/log-in module/orcrstudent', params: { for: 'deed' } } as any);
  };

  const appendFileToForm = async (form: FormData, fieldName: string, uri?: string | null, filename?: string, mime?: string) => {
    if (!uri) return;
    try {
      // Normalize URI: ensure native file URIs have file:// prefix when needed
      let nUri = uri as string;
      if (typeof nUri === 'string' && nUri.startsWith('/') && !nUri.startsWith('//') && !nUri.startsWith('file://')) {
        // sometimes FileSystem returns absolute path without file://
        nUri = 'file://' + nUri;
      }
      const isNativeFile = typeof nUri === 'string' && (nUri.startsWith('file://') || nUri.startsWith('content://'));
      if (Platform.OS !== 'web' && isNativeFile) {
        // If the file:// path exists in FS, append as a file object expected by RN fetch
        try {
          // Use the normalized URI when checking for file existence. Do not strip file:// prefix.
          const info = await FileSystem.getInfoAsync(nUri);
          if (info && info.exists) {
            (form as any).append(fieldName, { uri: nUri, name: filename || getFilenameFromUri(nUri) || fieldName, type: mime || 'application/octet-stream' });
            return;
          } else {
            // File doesn't exist at this path; fall through to attempt fetch by uri or send fallback field
            console.warn('appendFileToForm: native file not found at', nUri, 'info=', info);
          }
        } catch (fsErr) {
          console.warn('appendFileToForm: checking local file existence failed', fsErr);
        }
        // If we couldn't append as a native file, still include the client URI string so the server debug sees what client attempted to send
        try { (form as any).append(fieldName + '_client_uri', String(uri)); } catch (e) { /* ignore */ }
      }
      // Web / non-native: fetch the resource and append blob
      const res = await fetch(nUri);
      const blob = await res.blob();
      // append with filename
      (form as any).append(fieldName, blob, filename || getFilenameFromUri(nUri) || fieldName);
    } catch (err) {
      console.warn('appendFileToForm fallback', err);
      try { (form as any).append(fieldName, { uri, name: filename || fieldName, type: mime || 'application/octet-stream' }); } catch (e) { console.error('appendFileToForm final fallback', e); }
    }
  };

  // Convert image (jpg/png) URI to a one-page PDF stored in cache. Returns the file:// URI of the created PDF.
  const convertImageUriToPdf = async (imageUri: string, outName = 'converted.pdf') => {
    try {
      // Read image as base64
      const b64 = await FileSystem.readAsStringAsync(imageUri, { encoding: FileSystem.EncodingType.Base64 });
      const imageExtMatch = (imageUri || '').match(/\.([^.?#]+)(?:[?#]|$)/);
      const ext = imageExtMatch ? imageExtMatch[1].toLowerCase() : 'jpg';

      // Create PDF
      const pdfDoc = await PDFDocument.create();

      const imgBytes = Buffer.from(b64, 'base64');
      let embeddedImage: any;
      if (ext === 'png') {
        embeddedImage = await pdfDoc.embedPng(imgBytes);
      } else {
        // fallback to jpg
        embeddedImage = await pdfDoc.embedJpg(imgBytes);
      }

      const imgDims = embeddedImage.scale(1);
      const page = pdfDoc.addPage([imgDims.width, imgDims.height]);
      page.drawImage(embeddedImage, { x: 0, y: 0, width: imgDims.width, height: imgDims.height });

      const pdfBytes = await pdfDoc.save();
      const pdfBase64 = Buffer.from(pdfBytes).toString('base64');
      const outPath = `${FileSystem.cacheDirectory}${outName}`;
      await FileSystem.writeAsStringAsync(outPath, pdfBase64, { encoding: FileSystem.EncodingType.Base64 });
      return outPath;
    } catch (err) {
      console.error('convertImageUriToPdf failed', err);
      throw err;
    }
  };

  const submitAll = async () => {
    setSubmitting(true);
    const store = getSignup();
    console.log('UploadOrCr submitAll store snapshot:', store);
    const orUri = (store as any).or_path || (store as any).or_file;
    const crUri = (store as any).cr_path || (store as any).cr_file;
    if (!orUri && !crUri) {
      Alert.alert('No OR/CR selected', 'Pick at least one file before submitting.');
      setSubmitting(false);
      return;
    }

    // OCR extraction helper
    const runOcrAndExtract = async (fileUri: string) => {
      try {
        // If it's a PDF we would need to extract image from page; for now run OCR on image URIs directly
        const isPdf = /\.pdf(\?|#|$)/i.test(fileUri);
        let imageUri = fileUri;
        if (isPdf) {
          // For simplicity, don't handle embedded PDF images here - skip OCR on PDFs for now
          return { name: null, orcr: null, rawText: '' };
        }

        // Read image as base64 and convert to data URL for tesseract
        const b64 = await FileSystem.readAsStringAsync(imageUri, { encoding: FileSystem.EncodingType.Base64 });
        const extMatch = (imageUri || '').match(/\.([^.?#]+)(?:[?#]|$)/);
        const mime = extMatch && extMatch[1].toLowerCase() === 'png' ? 'image/png' : 'image/jpeg';
        const dataUrl = `data:${mime};base64,${b64}`;

        const worker = createWorker({
          logger: (m: any) => console.log('tesseract', m),
        }) as any;
        await worker.load();
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
        await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO });
        const { data } = await worker.recognize(dataUrl);
        await worker.terminate();

        const extracted = parseOrCrText(data.text);
        return extracted;
      } catch (err) {
        console.error('OCR failed', err);
        return { name: null, orcr: null, rawText: '' };
      }
    };

    try {
      const store = getSignup();
      const form = new FormData();
      form.append('progress_step', '5');
      form.append('firstname', (store as any).firstname || '');
      form.append('middlename', (store as any).middlename || '');
      form.append('lastname', (store as any).lastname || '');
      form.append('email', (store as any).email || '');
      form.append('password', (store as any).password || '');
      form.append('c_password', (store as any).password || '');
  form.append('student_no', (store as any).student_no || '');
  // include selected role id (signup store stores role as numeric string now)
  if ((store as any).role) form.append('role_id', String((store as any).role));
  // include extra profile/vehicle fields
  form.append('department', (store as any).department || '');
  form.append('contact_number', (store as any).contact_number || '');
  form.append('plate_number', (store as any).plate_number || '');
  form.append('vehicle_color', (store as any).vehicle_color || '');
  form.append('vehicle_type', (store as any).vehicle_type || '');
  form.append('brand', (store as any).brand || '');
  form.append('model', (store as any).model || '');
  form.append('course', (store as any).course || '');
  form.append('yr_section', (store as any).yr_section || '');
  // include any face verification results already present
  if ((store as any).face_score !== undefined) form.append('face_score', String((store as any).face_score));
  if ((store as any).face_verified !== undefined) form.append('face_verified', (store as any).face_verified ? '1' : '0');

      // attach id file if present
      if ((store as any).id_path) {
        form.append('id_path', (store as any).id_path);
        await appendFileToForm(form, 'id_file', (store as any).id_path, (store as any).id_name || 'id.jpg', 'image/jpeg');
      }
      // attach selfie file if present
      if ((store as any).selfie_path) {
        form.append('selfie_path', (store as any).selfie_path);
        const selfieName = (store as any).selfie_name || getFilenameFromUri((store as any).selfie_path) || 'selfie.jpg';
        form.append('selfie_name', selfieName);
        await appendFileToForm(form, 'selfie_file', (store as any).selfie_path, selfieName, 'image/jpeg');
      }

  // Prefer parsed values produced earlier by the OR/CR picker (orcrstudent)
      let ocrResult: { name: string | null; orcr: string | null; rawText: string } = { name: null, orcr: null, rawText: '' };
      // use values stored in signup store first
      if ((store as any).or_name || (store as any).or_number) {
        ocrResult.name = (store as any).or_name || null;
        ocrResult.orcr = (store as any).or_number || null;
        ocrResult.rawText = '';
      } else if ((store as any).cr_name || (store as any).cr_number) {
        ocrResult.name = (store as any).cr_name || null;
        ocrResult.orcr = (store as any).cr_number || null;
        ocrResult.rawText = '';
      } else {
        if (orUri) {
          const orIsImage = /\.(jpe?g|png)($|\?|#)/i.test(orUri);
          if (orIsImage) {
            ocrResult = await runOcrAndExtract(orUri);
          }
        }
        if ((!ocrResult.name && !ocrResult.orcr) && crUri) {
          const crIsImage = /\.(jpe?g|png)($|\?|#)/i.test(crUri);
          if (crIsImage) {
            ocrResult = await runOcrAndExtract(crUri);
          }
        }
      }

      // Persist extracted data for later comparison
      try {
        await AsyncStorage.setItem('orcr_extracted', JSON.stringify({ ...ocrResult, savedAt: Date.now() }));
      } catch (e) {
        console.warn('Failed to save extracted data', e);
      }
      // Show immediate alert with extracted values
      Alert.alert('Extracted', `Name: ${ocrResult.name ?? 'n/a'}\nOR/CR: ${ocrResult.orcr ?? 'n/a'}`);

  // If we found a probable name from OCR, compare it to the submitted name and show a modal
  const submittedFullName = `${store.firstname || ''} ${store.middlename || ''} ${store.lastname || ''}`.trim();

      // character-based similarity using Levenshtein distance
      const levenshtein = (a: string, b: string) => {
        a = (a || '').toLowerCase();
        b = (b || '').toLowerCase();
        if (a === b) return 0;
        const al = a.length; const bl = b.length;
        if (al === 0) return bl;
        if (bl === 0) return al;
        const v0 = new Array(bl + 1).fill(0);
        const v1 = new Array(bl + 1).fill(0);
        for (let i = 0; i <= bl; i++) v0[i] = i;
        for (let i = 0; i < al; i++) {
          v1[0] = i + 1;
          for (let j = 0; j < bl; j++) {
            const cost = a[i] === b[j] ? 0 : 1;
            v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
          }
          for (let k = 0; k <= bl; k++) v0[k] = v1[k];
        }
        return v1[bl];
      };
      const calcMatchPct = (submitted: string, foundText: string | null) => {
        if (!submitted || !foundText) return 0;
        const sa = submitted.trim();
        const sb = foundText.trim();
        const maxLen = Math.max(sa.length, sb.length);
        if (maxLen === 0) return 0;
        const dist = levenshtein(sa, sb);
        const sim = Math.max(0, 1 - dist / maxLen);
        return sim; // 0..1
      };

      // compute separate confidences for OR and CR using available parsed values
      const threshold = 0.7; // 70%
      const orText = (store as any).or_name || (orUri ? ocrResult.name : null) || '';
      const crText = (store as any).cr_name || (crUri ? ocrResult.name : null) || '';
      const orPct = orText ? calcMatchPct(submittedFullName, orText) : 0;
      const crPct = crText ? calcMatchPct(submittedFullName, crText) : 0;

      // If user specified second-hand, skip OCR/name-matching flow and require deed upload
      if (isSecondHand) {
        // mark as pending review and include deed if available
        setSignup({ is_second_hand: true });
      } else if (ocrResult.name && submittedFullName) {
        const pct = calcMatchPct(submittedFullName, ocrResult.name || ocrResult.rawText);
  // const threshold defined above
        // show modal and await user decision
          const waitForModal = () => new Promise(resolve => {
            // populate modal fields with parsed values (OR/CR separate)
            setModalOrName((store as any).or_name || ocrResult.name || null);
            setModalOrNumber((store as any).or_number || (orUri ? ocrResult.orcr : null) || null);
            setModalCrName((store as any).cr_name || (crUri ? ocrResult.name : null) || null);
            setModalCrNumber((store as any).cr_number || (crUri ? ocrResult.orcr : null) || null);
            setModalOrPct(orPct);
            setModalCrPct(crPct);
            setModalPct(Math.max(orPct, crPct));
            setModalType((orPct >= threshold || crPct >= threshold) ? 'match' : 'mismatch');
            setModalResolve(() => resolve);
            setModalVisible(true);
          });

        try {
          const result: any = await waitForModal();
          setModalVisible(false);
          setModalResolve(null);
          // result: { action: 'apply'|'skip'|'cancel', name, number }
          if (!result || result.action === 'cancel') {
            setSubmitting(false);
            return; // user cancelled
          }
          if (result.action === 'apply') {
            // apply parsed values to the signup store (persist parsed OR/CR name+number)
            setSignup({
              or_name: result.or_name ?? (store as any).or_name,
              or_number: result.or_number ?? (store as any).or_number,
              cr_name: result.cr_name ?? (store as any).cr_name,
              cr_number: result.cr_number ?? (store as any).cr_number,
            });
          }
          // if action was 'skip' we simply continue without applying parsed values
        } catch (e) {
          console.warn('Modal handling failed', e);
          setSubmitting(false);
          return;
        }
      }

      // After modal decisions, re-read store so we pick up any applied parsed values
      const finalStore = getSignup();

      // If second-hand, attach deed if present
      if (isSecondHand && (finalStore as any).deed_path) {
        await appendFileToForm(form, 'deed_file', (finalStore as any).deed_path, (finalStore as any).deed_name || 'deed.pdf', 'application/pdf');
        form.append('is_second_hand', '1');
      }

      // If selected files are images, convert them to PDF before attaching
      if (orUri) {
        let orUploadUri = orUri;
        const orIsImage = /\.(jpe?g|png)($|\?|#)/i.test(orUri);
        if (orIsImage) {
          const outName = (finalStore as any).or_name ? `${(finalStore as any).or_name.replace(/\.[^.]+$/, '')}.pdf` : 'or.pdf';
          try {
            orUploadUri = await convertImageUriToPdf(orUri, outName);
          } catch (e) {
            console.warn('Failed to convert OR image to PDF, will upload original', e);
            orUploadUri = orUri;
          }
        }
        await appendFileToForm(form, 'or_file', orUploadUri, (finalStore as any).or_name || 'or.pdf', 'application/pdf');
        form.append('or_name', (finalStore as any).or_name || '');
        form.append('or_number', (finalStore as any).or_number || '');
      }

      if (crUri) {
        let crUploadUri = crUri;
        const crIsImage = /\.(jpe?g|png)($|\?|#)/i.test(crUri);
        if (crIsImage) {
          const outName = (finalStore as any).cr_name ? `${(finalStore as any).cr_name.replace(/\.[^.]+$/, '')}.pdf` : 'cr.pdf';
          try {
            crUploadUri = await convertImageUriToPdf(crUri, outName);
          } catch (e) {
            console.warn('Failed to convert CR image to PDF, will upload original', e);
            crUploadUri = crUri;
          }
        }
        await appendFileToForm(form, 'cr_file', crUploadUri, (finalStore as any).cr_name || 'cr.pdf', 'application/pdf');
        form.append('cr_name', (finalStore as any).cr_name || '');
        form.append('cr_number', (finalStore as any).cr_number || '');
      }

      // also include second-hand flag if set (in case deed uploaded separately)
      if (isSecondHand) {
        form.append('is_second_hand', '1');
      }

      // include role-specific user_detail fields
      const roleId = Number((finalStore as any).role || 0);
      // map fields per role similar to admin create payload
      if (roleId === 3) {
        // student
        form.append('user_detail[student_no]', (finalStore as any).student_no || '');
        form.append('user_detail[course]', (finalStore as any).course || '');
        form.append('user_detail[yr_section]', (finalStore as any).yr_section || '');
      } else if (roleId === 4) {
        // faculty
        form.append('user_detail[faculty_id]', (finalStore as any).faculty_id || '');
        form.append('user_detail[position]', (finalStore as any).position || '');
      } else if (roleId === 5) {
        // employee
        form.append('user_detail[employee_id]', (finalStore as any).employee_id || '');
        form.append('user_detail[position]', (finalStore as any).position || '');
      } else if (roleId === 7) {
        // guard minimal fields
        form.append('user_detail[position]', (finalStore as any).position || 'Security Guard');
      }

      // endpoint
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const { API_BASE } = await import('../_lib/api');
      const endpoint = API_BASE.replace(/\/+$/, '') + '/api/register';

      console.log('UploadOrCr: submitting to', endpoint, 'form preview:', { id: !!(store as any).id_path, or: !!orUri, cr: !!crUri });

      const res = await fetch(endpoint, { method: 'POST', body: form, headers: { Accept: 'application/json' } });
      const json = await res.json();
      console.log('UploadOrCr: server response', res.status, json);
      if (!res.ok) throw new Error(JSON.stringify(json));

      // Show success / pending alert based on server-side from_pending flag
      const pending = !!(json?.data?.user?.userDetail?.from_pending);
      if (pending) {
        Alert.alert('Account created — pending review', 'Your account was created but will be reviewed. You will be notified when it is approved.', [
          { text: 'OK', onPress: () => { resetSignup(); router.replace('/main-home/home'); } }
        ]);
      } else {
        // if server returned a qr (either local storage url or external url), navigate to a QR confirm screen that displays it
        const rawQr = json?.data?.qr || json?.data?.user?.userDetail?.qr_path || null;
        let qrUrl: string | null = rawQr;
        // Normalize relative paths to absolute using API_BASE; allow data: URIs and absolute URLs untouched
        try {
          if (qrUrl && typeof qrUrl === 'string') {
            const s = qrUrl.trim();
            if (!s.match(/^data:/i) && !s.match(/^https?:\/\//i)) {
              // if server returned a path like '/storage/...' or 'storage/...', ensure leading slash then prefix API base
              const leading = s.startsWith('/') ? s : `/${s}`;
              qrUrl = API_BASE.replace(/\/+$|\/+$/g, '').replace(/\/+$/,'') + leading;
            } else {
              qrUrl = s;
            }
          }
        } catch (e) {
          // if normalization fails, fall back to the raw value
          qrUrl = rawQr as any;
        }

        if (qrUrl) {
          resetSignup();
          router.replace({ pathname: '/log-in module/qrconfirmstudent', params: { qr: qrUrl } } as any);
        } else {
          Alert.alert('Account created', 'Your account was created successfully.', [ { text: 'OK', onPress: () => { resetSignup(); router.replace('/main-home/home'); } } ]);
        }
      }
    } catch (err) {
      console.error('UploadOrCr submit failed', err);
      Alert.alert('Submit failed', String(err));
    }
    setSubmitting(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Text className="text-2xl font-bold mt-8">Upload OR / CR</Text>
      <View className="mt-6">
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text>Second-hand owner?</Text>
          <Switch value={isSecondHand} onValueChange={(v) => { setIsSecondHand(v); setSignup({ is_second_hand: v }); }} />
        </View>
        {isSecondHand ? (
          <View style={{ marginBottom: 12 }}>
            <TouchableOpacity className="bg-gray-200 rounded p-3 mb-3" onPress={pickDeed}>
              <Text>Pick Deed of Sale</Text>
            </TouchableOpacity>
            {deedName ? <Text className="text-sm text-gray-600">Selected deed: {deedName}</Text> : <Text className="text-sm text-gray-400">No deed selected</Text>}
          </View>
        ) : null}
        <TouchableOpacity className="bg-gray-200 rounded p-3 mb-3" onPress={openPicker}>
          <Text>Open OR/CR picker</Text>
        </TouchableOpacity>
        {orName ? <Text className="text-sm text-gray-600">Selected OR: {orName}</Text> : <Text className="text-sm text-gray-400">No OR selected</Text>}
        <View style={{ height: 12 }} />
        {crName ? <Text className="text-sm text-gray-600">Selected CR: {crName}</Text> : <Text className="text-sm text-gray-400">No CR selected</Text>}

        <View className="mt-6">
          {submitting ? <ActivityIndicator /> : (
            <TouchableOpacity className="bg-bsu rounded-full py-3 items-center" onPress={submitAll}>
              <Text className="text-white">Submit signup</Text>
            </TouchableOpacity>
          )}
        </View>

        <View className="mt-4">
          {idName ? <Text className="text-sm text-gray-600">ID: {idName}</Text> : null}
        </View>

      </View>
      {/* Modal for applying/examining parsed OR/CR values */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View style={{ width: '90%', backgroundColor: 'white', padding: 16, borderRadius: 8 }}>
            <Text style={{ fontWeight: '700', fontSize: 16, marginBottom: 8 }}>Parsed document values</Text>
            <Text style={{ marginBottom: 8 }}>Confidence (name match): {(modalPct * 100).toFixed(0)}%</Text>
            <Text style={{ marginBottom: 6, fontWeight: '600' }}>OR confidence: {(modalOrPct * 100).toFixed(0)}%  ·  CR confidence: {(modalCrPct * 100).toFixed(0)}%</Text>
            {( (modalOrPct > 0 && modalOrPct < 0.7) || (modalCrPct > 0 && modalCrPct < 0.7) ) ? (
              <Text style={{ color: 'crimson', marginBottom: 8 }}>Low confidence detected for one or more parsed names. If you apply these values your account will be marked as pending for manual review.</Text>
            ) : null}
            <Text style={{ fontWeight: '600' }}>OR parsed name</Text>
            <TextInput value={modalOrName ?? ''} onChangeText={setModalOrName as any} style={{ borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 6, marginBottom: 8 }} />
            <Text style={{ fontWeight: '600' }}>OR parsed number</Text>
            <TextInput value={modalOrNumber ?? ''} onChangeText={setModalOrNumber as any} style={{ borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 6, marginBottom: 12 }} />
            <Text style={{ fontWeight: '600' }}>CR parsed name</Text>
            <TextInput value={modalCrName ?? ''} onChangeText={setModalCrName as any} style={{ borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 6, marginBottom: 8 }} />
            <Text style={{ fontWeight: '600' }}>CR parsed number</Text>
            <TextInput value={modalCrNumber ?? ''} onChangeText={setModalCrNumber as any} style={{ borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 6, marginBottom: 12 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity onPress={() => {
                // cancel entire submission
                setModalVisible(false);
                if (modalResolve) modalResolve({ action: 'cancel' });
              }} style={{ padding: 10 }}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                // skip applying parsed values, continue submission
                setModalVisible(false);
                if (modalResolve) modalResolve({ action: 'skip' });
              }} style={{ padding: 10 }}>
                <Text>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                // apply parsed values for both OR and CR
                setModalVisible(false);
                if (modalResolve) modalResolve({ action: 'apply', or_name: modalOrName, or_number: modalOrNumber, cr_name: modalCrName, cr_number: modalCrNumber });
              }} style={{ padding: 10, backgroundColor: '#0b5fff', borderRadius: 6 }}>
                <Text style={{ color: 'white' }}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}


/**
 * Heuristic parser for OR/CR text. Returns { name?, orcr?, rawText }
 */
function parseOrCrText(text: string) {
  const rawText = text || '';
  const lines = rawText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  let orcr: string | null = null;
  for (const l of lines) {
    const m = l.match(/(?:\bOR\b|\bCR\b)[\s#:\-]*([A-Za-z0-9\-\/]+)/i);
    if (m) { orcr = m[1].trim(); break; }
    const unlabeled = l.match(/\b([0-9]{3,}[-\/]?[0-9\-\/]{2,})\b/);
    if (!orcr && unlabeled) { orcr = unlabeled[1]; }
  }

  let name: string | null = null;
  for (const l of lines) {
    const m = l.match(/\b(Name|Owner|Registered Owner|Registered to)[:\s-]+(.{2,80})/i);
    if (m) { name = m[2].trim(); break; }
  }
  if (!name) {
    const candidate = lines.find(l => /^[A-Z][A-Za-z ,.'-]{2,}$/.test(l));
    if (candidate) name = candidate;
  }

  return { name, orcr, rawText };
}
