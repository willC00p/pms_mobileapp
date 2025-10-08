import React from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { setSignup, getSignup } from '../_lib/signupStore';
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';

export default function OrCrPicker() {
  const router = useRouter();
  

  const params = useLocalSearchParams();
  const targetFor = (params as any)?.for || null;

  const [deedName, setDeedName] = React.useState<string | null>(null);

  const [parsing, setParsing] = React.useState(false);

  const pick = async (which: 'or' | 'cr' | 'deed') => {
    try {
      console.log('orcrstudent: start pick', which);
  // allow PDF or common image types (jpeg/png). Use '*/*' and then filter/inspect the result
  const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      console.log('orcrstudent: raw result', res);

      // normalize result shapes (older/newer DocumentPicker)
      let uri: string | undefined;
      let name: string | undefined;
      if ((res as any).type === 'success') {
        uri = (res as any).uri;
        name = (res as any).name;
      } else if ((res as any).assets && (res as any).assets.length) {
        uri = (res as any).assets[0].uri;
        name = (res as any).assets[0].name || (res as any).assets[0].fileName;
      }

      if (!uri) {
        console.warn('orcrstudent: no uri returned from picker', res);
        return Alert.alert('Pick failed', 'No file URI returned. Try again.');
      }

      // If user is uploading a deed (second-hand flow) we don't need to parse it.
      // Simply store the picked file path/name and return immediately.
      if (which === 'deed') {
        const fallback = name || ((uri || '').split('/').pop() || uri || 'deed');
        setSignup({ deed_path: uri, deed_name: fallback });
        setDeedName(fallback as string);
        console.log('orcrstudent: deed saved ->', getSignup());
        router.back();
        return;
      }

      // Upload picked file to backend parse endpoint for text extraction
      try {
        const form = new FormData();
  // determine mime type based on filename / picker metadata
  const lowerName = (name || '').toLowerCase();
  let mimeType = 'application/octet-stream';
  if (lowerName.endsWith('.pdf')) mimeType = 'application/pdf';
  else if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) mimeType = 'image/jpeg';
  else if (lowerName.endsWith('.png')) mimeType = 'image/png';
  else if ((res as any).mimeType) mimeType = (res as any).mimeType;

  const defaultName = name || (mimeType === 'application/pdf' ? 'doc.pdf' : (mimeType === 'image/png' ? 'doc.png' : 'doc.jpg'));
  // @ts-ignore
  form.append('doc', { uri, name: defaultName, type: mimeType } as any);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const { API_BASE } = await import('../_lib/api');
        const endpoint = API_BASE.replace(/\/+$/, '') + '/api/parse-document';
  setParsing(true);
  try {
    const pRes = await fetch(endpoint, { method: 'POST', body: form, headers: { Accept: 'application/json' } });
    const pJson = await pRes.json();
    console.log('orcrstudent: parse response', pJson);
    const parsed = pJson.data?.parsed || pJson.parsed || {};

        let parsedName = parsed.name || null;
        let parsedOr = parsed.or_number || null;
        let parsedCr = parsed.cr_number || null;

  // local OCR fallback when server returns nothing and file is an image
        // Use OCR.space cloud API to avoid tesseract/WASM worker issues in Expo.
        // For production replace 'helloworld' with your OCR.space API key (https://ocr.space/ocrapi)
        const isImage = (mimeType || '').startsWith('image/') || !!lowerName.match(/\.(jpe?g|png)$/i);
        if (!parsedName && !parsedOr && !parsedCr && isImage) {
          try {
            const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
            const extMatch = (name || '').match(/\.([^.?#]+)(?:[?#]|$)/);
            const mime = extMatch && extMatch[1].toLowerCase() === 'png' ? 'image/png' : 'image/jpeg';
            const base64Image = `data:${mime};base64,${b64}`;

            const ocrForm = new FormData();
            ocrForm.append('apikey', 'helloworld');
            ocrForm.append('base64Image', base64Image);
            ocrForm.append('language', 'eng');
            ocrForm.append('isOverlayRequired', 'false');
            ocrForm.append('detectOrientation', 'true');

            const ocrRes = await fetch('https://api.ocr.space/parse/image', { method: 'POST', body: ocrForm });
            const ocrJson = await ocrRes.json();
            const parsedText = ocrJson?.ParsedResults && ocrJson.ParsedResults[0] ? ocrJson.ParsedResults[0].ParsedText : '';
            if (!parsedText) {
              console.log('orcrstudent: OCR.space raw response', JSON.stringify(ocrJson));
              if (ocrJson?.IsErroredOnProcessing) console.log('orcrstudent: OCR.space error', ocrJson?.ErrorMessage || ocrJson);
            }

                const heurWhich: 'or' | 'cr' = which as 'or' | 'cr';
                const heur = parseTextForNameAndNumber(parsedText || '', heurWhich);
                if (heur.name) parsedName = parsedName || heur.name;
                if (heur.number) {
                  if (which === 'or') parsedOr = parsedOr || heur.number;
                  else parsedCr = parsedCr || heur.number;
                }
                console.log('orcrstudent: OCR.space heuristics', heur, 'raw:', parsedText?.slice(0,200));
                // No additional AI fallback configured in-app. Use the OCR.space heuristics results above.
          } catch (ocrErr) {
            console.warn('orcrstudent: OCR.space fallback failed', ocrErr);
          }
        }

        

  const messageLines = [] as string[];
          if (parsedName) messageLines.push('Parsed name: ' + parsedName);
          if (which === 'or' && parsedOr) messageLines.push('Parsed OR #: ' + parsedOr);
          if (which === 'cr' && parsedCr) messageLines.push('Parsed CR #: ' + parsedCr);
        if (messageLines.length === 0) messageLines.push('No parsed text or numbers were found.');

        // Show confirmation alert and persist only if user accepts
        Alert.alert('Parsed document', messageLines.join('\n'), [
          { text: 'Reject', style: 'cancel' },
          { text: 'Accept', onPress: () => {
            // prefer parsed values; fall back to heuristics/filename when missing
            const parsedNumber = which === 'or' ? parsedOr : parsedCr;
            const number = parsedNumber || (name || '').split(/[^0-9]+/).filter(Boolean)[0] || '';
            if (which === 'or') {
              setSignup({ or_path: uri, or_file: uri, or_name: parsedName || name || '', or_number: parsedOr || number });
            } else {
              setSignup({ cr_path: uri, cr_file: uri, cr_name: parsedName || name || '', cr_number: parsedCr || number });
            }
            console.log('orcrstudent: after setSignup ->', getSignup());
            router.back();
          } }
        ]);
  } finally {
    setParsing(false);
  }
      } catch (parseErr) {
        console.warn('orcrstudent: parse upload failed', parseErr);
        return Alert.alert('Parse failed', 'Could not validate document. Try again.');
      }
      
    } catch (err) {
      console.error('orcrstudent: pick error', err);
      Alert.alert('Error', 'Could not pick file.');
    }
  };

/**
 * Very small heuristic parser to find a probable name and a number (OR/CR) from free text
 */
function parseTextForNameAndNumber(text: string, which: 'or' | 'cr') {
  const lines = (text || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  let name: string | null = null;
  let number: string | null = null;

  const whole = (text || '').replace(/\r?\n/g, ' ');

  // Name heuristics
  if (which === 'or') {
    // Look for RECEIVED FROM label, capture inline or take next non-empty line
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      const m = l.match(/RECEIVED\s+FROM[:\s-]*\(?(.{2,120})\)?/i);
      // prefer next-line value if it looks like a name (avoids picking inline OCR garbage)
      if (/RECEIVED\s+FROM/i.test(l)) {
        const next = (lines[i+1] || '').trim();
        const nextLooksLikeName = next && /^[A-Z][A-Za-z ,.'\-]{2,}$/.test(next.replace(/[0-9]/g, ''));
        if (nextLooksLikeName) { name = next; break; }
      }
      if (m && m[1] && m[1].trim().length > 2) { name = m[1].trim(); break; }
    }
  } else {
    // CR
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      const m = l.match(/COMPLETE\s+OWNERS?\s+NAME[:\s-]*(.{2,120})/i);
      if (/COMPLETE\s+OWNERS?\s+NAME/i.test(l)) {
        const next = (lines[i+1] || '').trim();
        const nextLooksLikeName = next && /^[A-Z][A-Za-z ,.'\-]{2,}$/.test(next.replace(/[0-9]/g, ''));
        if (nextLooksLikeName) { name = next; break; }
      }
      if (m && m[1] && m[1].trim().length > 2) { name = m[1].trim(); break; }
    }
  }

  // Number heuristics
  if (which === 'cr') {
    // Try inline CR No. patterns and prefer tokens after the label
    let m = whole.match(/CR\s*No\.?\s*[:\-\s]*([0-9A-Za-z\-\/]{6,})/i);
    if (m && m[1]) number = m[1].trim();
    // try line-based: if a line contains 'CR' try to extract digit-heavy tokens nearby
    if (!number) {
      const crCandidates: string[] = [];
      // check each line for CR and gather numeric-like sequences
      for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        if (/\bCR\b|CERTIFICATE\s+OF\s+REGISTRATION/i.test(l)) {
          const found = (l.match(/\d[0-9\-\s\/]{4,}\d/g) || []).map(s => s.replace(/\s+/g, ''));
          for (const f of found) crCandidates.push(f.replace(/[^0-9A-Za-z\-\/]/g, ''));
          // also look at the next line which often contains the number
          if (lines[i+1]) {
            const nextFound = (lines[i+1].match(/\d[0-9\-\s\/]{4,}\d/g) || []).map(s => s.replace(/\s+/g, ''));
            for (const f of nextFound) crCandidates.push(f.replace(/[^0-9A-Za-z\-\/]/g, ''));
          }
        }
      }
      // search whole text for occurrences of 'CR' and gather nearby digit sequences
      try {
        const re = /\bCR\b/gi;
        let it;
        while ((it = re.exec(whole)) !== null) {
          const pos = it.index || 0;
          const slice = whole.slice(pos, pos + 80);
          const found = (slice.match(/\d[0-9\-\s\/]{4,}\d/g) || []).map(s => s.replace(/\s+/g, ''));
          for (const f of found) crCandidates.push(f.replace(/[^0-9A-Za-z\-\/]/g, ''));
        }
      } catch (e) { /* ignore */ }
      // prefer candidates that are mostly digits and have reasonable length (>=7)
      if (crCandidates.length) {
        crCandidates.sort((a, b) => (b.replace(/[^0-9]/g, '').length - a.replace(/[^0-9]/g, '').length) || (b.length - a.length));
        const pick = crCandidates.find(c => (c.replace(/[^0-9]/g, '').length >= 7)) || crCandidates[0];
        if (pick) number = pick;
      }
    }
  // If number is short or missing, scan tokens and try to combine adjacent numeric tokens (handles split digits like '29' + '9826332')
    if (!number || (number && number.replace(/[^0-9]/g, '').length < 6)) {
      try {
        const tokenRe = /[0-9A-Za-z\-\/]{1,}/g;
        const matches = Array.from(whole.matchAll(tokenRe)).map(x => ({ text: x[0], idx: x.index || 0 }));
        if (matches.length) {
          // if we have an existing short number, try to find a match that contains or ends with it
          if (number) {
            const suffix = number;
            const found = matches.find(t => t.text.replace(/[^0-9A-Za-z]/g, '').endsWith(suffix));
            if (found) number = found.text;
          }
          // try combining adjacent matches where concatenation yields a long numeric token
          if (!number) {
            for (let i = 0; i < matches.length - 1; i++) {
              const a = matches[i].text.replace(/[^0-9A-Za-z]/g, '');
              const b = matches[i+1].text.replace(/[^0-9A-Za-z]/g, '');
              if (/^[0-9]+$/.test(a + b) && (a + b).length >= 6) {
                // ensure tokens are adjacent or only separated by short whitespace/punct
                const gap = matches[i+1].idx - (matches[i].idx + matches[i].text.length);
                if (gap >= 0 && gap <= 3) { number = a + b; break; }
              }
            }
          }
          // as another fallback pick the longest numeric-like token
          if (!number) {
            const nums = matches.map(m2 => m2.text).filter(t => /[0-9]/.test(t));
            if (nums.length) number = nums.reduce((a, b) => a.length >= b.length ? a : b);
          }
        }
      } catch (e) { /* ignore */ }
    }
    // If we still have a number but it's missing leading digits, look slightly left in the full OCR text for digit fragments and prepend them
    if (number) {
      try {
        const idx = whole.indexOf(number);
        if (idx > 0) {
          const leftWindow = whole.slice(Math.max(0, idx - 14), idx);
          // extract trailing digit characters from the left window (allow spaces/punct between)
          const leftDigits = leftWindow.replace(/[^0-9]/g, '');
          if (leftDigits && leftDigits.length >= 1) {
            // prefer taking up to last 4 left digits but ensure final length is reasonable (>=7)
            for (let take = Math.min(4, leftDigits.length); take >= 1; take--) {
              const cand = leftDigits.slice(-take) + number.replace(/[^0-9A-Za-z]/g, '');
              if (cand.length >= 6) { number = cand; break; }
            }
          }
        }
      } catch (e) { /* ignore */ }
    }
  } else {
    // OR
    let m = whole.match(/OR\s*No\.?\s*[:\-\s]*([A-Za-z0-9\-\/]+)/i) || whole.match(/OFFICIAL\s+RECEIPT\s*(?:NO\.?|NO)?[:\s-]*([0-9A-Za-z\-\/]+)/i);
    if (m && m[1]) number = m[1].trim();
    if (!number) {
      // prefer number to the right of 'OFFICIAL RECEIPT' on the same area; look for digit-heavy tokens and ignore 'RECEIV' artifacts
      try {
        const pos = whole.search(/OFFICIAL\s+RECEIPT/i);
        if (pos >= 0) {
          const after = whole.slice(pos, pos + 120); // larger window after phrase
          // collect digit-heavy sequences (allow hyphens/slashes/spaces)
          const candidates = (after.match(/\d[0-9\-\s\/]{3,}\d/g) || []).map(s => s.replace(/\s+/g, '')).map(s => s.replace(/[^0-9A-Za-z\-\/]/g, ''));
          // also try tokens that include hyphen patterns like 0352-000000290269
          const hyphenCandidates = (after.match(/\d{3,}[\-\/]\d{4,}/g) || []).map(s => s.replace(/\s+/g, ''));
          for (const h of hyphenCandidates) candidates.push(h);
          // filter out obvious artifacts like 'RECEIV' or tokens with mostly letters
          const filtered = candidates.filter(c => !/RECEIV|RECEIVED/i.test(c) && (c.replace(/[^0-9]/g, '').length >= Math.max(3, Math.floor(c.length / 2))));
          if (filtered.length) {
            // prefer the one with most digits
            filtered.sort((a, b) => (b.replace(/[^0-9]/g, '').length - a.replace(/[^0-9]/g, '').length) || (b.length - a.length));
            number = filtered[0];
          } else if (candidates.length) {
            number = candidates[0];
          }
        }
      } catch (e) { /* ignore */ }
      if (!number) {
        for (let i = 0; i < lines.length; i++) {
          const l = lines[i];
          if (/OR\s*No\.?/i.test(l) || /OFFICIAL\s+RECEIPT/i.test(l)) {
            // get numeric-like tokens from the same line and the next
            const toks = (l.match(/[0-9][0-9\-\/]{2,}[0-9]/g) || []).map(s => s.replace(/\s+/g, ''));
            if (toks.length) { number = toks[0].replace(/[^0-9A-Za-z\-\/]/g, ''); break; }
            if (lines[i+1]) {
              const nextToks = (lines[i+1].match(/[0-9][0-9\-\/]{2,}[0-9]/g) || []).map(s => s.replace(/\s+/g, ''));
              if (nextToks.length) { number = nextToks[0].replace(/[^0-9A-Za-z\-\/]/g, ''); break; }
            }
          }
        }
      }
    }
  }

  // Final fallback for name if still missing: pick a probable name-like line
  if (!name) {
    const candidate = lines.find(l => /^[A-Z][A-Za-z ,.'\-]{2,}$/.test(l));
    if (candidate) name = candidate;
  }

  // Normalize common 'Last. First Middle' patterns into 'First Middle Last'
  if (name) {
    // remove excessive punctuation
    name = name.replace(/\s{2,}/g, ' ').trim();
    const m = name.match(/^([^.,]+)\.\s*(.+)$/);
    if (m) {
      const last = m[1].trim();
      const rest = m[2].trim().replace(/\s+,\s*/g, ' ').replace(/\s*\,$/, '');
      name = `${rest} ${last}`.replace(/\s{2,}/g, ' ').trim();
    }
    // Also handle comma-separated 'Last, First Middle' formats
    const c = name.match(/^([^,]+),\s*(.+)$/);
    if (c) {
      const last = c[1].trim();
      const rest = c[2].trim();
      name = `${rest} ${last}`.replace(/\s{2,}/g, ' ').trim();
    }
    // trim trailing punctuation
    name = name.replace(/^[\s\-:;,\.]+|[\s\-:;,\.]+$/g, '');
    // remove stray tokens like the literal word 'NAME' or leftover parentheses
    name = name.replace(/\bNAME\b/ig, '').replace(/[()\[\]]/g, '');
    // collapse duplicate adjacent words (e.g. 'FIRST NAME NAME LAST' -> 'FIRST NAME LAST')
    name = name.replace(/\b(\w+)\s+\1\b/ig, '$1');
    // remove hyphens inside names unless they're between letters (convert uncommon hyphens to spaces)
    name = name.replace(/\s*-\s*/g, ' ').trim();
    // merge small split tokens that are likely parts of a single surname (e.g. 'COLL AMAN' -> 'COLLAMAN')
    const parts = name.split(/\s+/);
    for (let i = 0; i < parts.length - 1; i++) {
      const a = parts[i];
      const b = parts[i+1];
      if (a.length <= 4 && b.length <= 5 && /^[A-Za-z]+$/.test(a) && /^[A-Za-z]+$/.test(b)) {
        // merge if combined length looks surname-like
        const merged = (a + b);
        if (merged.length >= 6) {
          parts[i] = merged;
          parts.splice(i+1, 1);
        }
      }
    }
    // Try to recover a missing leading letter for the first token, e.g. 'IOLITO' -> 'DIOLITO'
    try {
      const first = parts[0] || '';
      if (first && first.length >= 3) {
        // build regex to find a single letter immediately before the token in the whole OCR text
        const esc = (s: string) => s.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
        const re = new RegExp('([A-Za-z])\\s*' + esc(first), 'i');
        const m = whole.match(re);
        if (m && m[1]) {
          // prepend the found letter if it isn't already present
          const prefix = m[1].toUpperCase();
          if (!first.startsWith(prefix)) {
            parts[0] = prefix + first;
          }
        }
      }
    } catch (e) {
      // ignore
    }
    name = parts.join(' ').replace(/\s{2,}/g, ' ').trim();
  }
  // Final fallback for number: pick first long-ish numeric token
  if (!number) {
    const tok = (text.match(/\b([0-9]{3,}[0-9A-Za-z\-\/]*)\b/) || [])[1];
    if (tok) number = tok;
  }
  // sanitize number: remove stray spaces and surrounding punctuation
  if (number) {
    number = (number || '').replace(/[\s\,\:\;]+/g, '').replace(/^[^0-9A-Za-z]+|[^0-9A-Za-z]+$/g, '');
  }
  // CR-specific: if number seems truncated (short), try to find a longer token in whole text that ends with it
  if (which === 'cr') {
    try {
      if (!number || (number && number.length < 6)) {
        const allNums = Array.from((whole.matchAll(/[0-9A-Za-z\-\/]{4,}/g) || [])).map(m => m[0]);
        if (allNums.length) {
          // if we have a suffix, prefer a token that ends with it
          if (number) {
            const suffix = number || '';
            const cand = allNums.find(a => a.endsWith(suffix));
            if (cand) number = cand;
            else number = allNums.reduce((a, b) => a.length >= b.length ? a : b);
          } else {
            number = allNums.reduce((a, b) => a.length >= b.length ? a : b);
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }
  return { name, number };
}



  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.body}>
        <Text style={styles.title}>Pick OR / CR PDF</Text>
        <TouchableOpacity style={styles.btn} onPress={() => pick('or')}>
          <Text style={styles.btnText}>Pick OR (Official Receipt)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={() => pick('cr')}>
          <Text style={styles.btnText}>Pick CR (Certificate of Registration)</Text>
        </TouchableOpacity>
        {/* If navigated here to upload a deed (second-hand flow), show a deed button that simply stores the file path/name without parsing */}
        {targetFor === 'deed' ? (
          <TouchableOpacity style={styles.btn} onPress={() => pick('deed')}>
            <Text style={styles.btnText}>Pick Deed of Sale</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={styles.cancel} onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        {parsing ? (
          <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' }} pointerEvents="auto">
            <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 8, alignItems: 'center' }}>
              <ActivityIndicator size="large" />
              <Text style={{ marginTop: 12 }}>Parsing document, please wait...</Text>
            </View>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  body: { padding: 16, marginTop: 48 },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 20, textAlign: 'center' },
  btn: { backgroundColor: '#e5e7eb', padding: 14, borderRadius: 8, marginBottom: 12 },
  btnText: { textAlign: 'center', fontSize: 16 },
  cancel: { marginTop: 20, padding: 12 },
  cancelText: { textAlign: 'center', color: '#666' },
});
