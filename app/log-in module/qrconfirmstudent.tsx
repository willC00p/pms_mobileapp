import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Buffer } from 'buffer';
import { useEffect, useState } from 'react';
import { SvgXml } from 'react-native-svg';

export default function QrGeneratedScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const qrParam = (params as any)?.qr || null;

  const [svgXml, setSvgXml] = useState<string | null>(null);
  const [isSvg, setIsSvg] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function fetchSvg() {
      if (!qrParam) return;
      const qrRaw = String(qrParam || '').trim();

      // If it's an inline SVG blob (starts with '<svg') render directly
      if (/^\s*<svg[\s\S]*>/i.test(qrRaw)) {
        setIsSvg(true);
        if (mounted) setSvgXml(qrRaw);
        return;
      }

      // If it's a data URI (data:image/svg+xml;utf8,<svg ...> or base64), decode
      if (/^data:image\/svg\+xml(;base64)?,/i.test(qrRaw) || /^data:[^,]+;base64,/i.test(qrRaw)) {
        try {
          // handle base64 or percent-encoded
          const comma = qrRaw.indexOf(',');
          const meta = qrRaw.substring(5, comma);
          const payload = qrRaw.substring(comma + 1);
          let svgText = '';
          if (/;base64/i.test(meta)) {
            if (typeof atob === 'function') {
              svgText = atob(payload);
            } else {
              svgText = Buffer.from(payload, 'base64').toString('utf8');
            }
          } else {
            svgText = decodeURIComponent(payload);
          }
          setIsSvg(true);
          if (mounted) setSvgXml(svgText);
        } catch (e) {
          setIsSvg(false);
        }
        return;
      }

      // Otherwise treat as a URL and fetch; allow relative URLs that the caller already normalized
      try {
        const resp = await fetch(qrRaw, { method: 'GET' });
        const ct = resp.headers.get('content-type') || '';
        if (ct.includes('image/svg') || ct.includes('xml') || /<svg[\s\S]*>/i.test(await resp.clone().text())) {
          const text = await resp.text();
          if (mounted) { setIsSvg(true); setSvgXml(text); }
        } else {
          if (mounted) setIsSvg(false);
        }
      } catch (e) {
        if (mounted) setIsSvg(false);
      }
    }
    fetchSvg();
    return () => { mounted = false; };
  }, [qrParam]);

  const qrSource = qrParam ? { uri: String(qrParam) } : require('../../assets/images/qr-code.png');

  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      {/* BulSU Logo */}
      <Image
        source={require('../../assets/images/bulsu-logo.png')} // adjust path as needed
        className="w-24 h-24 mb-6"
        resizeMode="contain"
      />

      {/* Heading */}
      <Text className="text-2xl font-bold text-center text-black mb-4">
        Congratulations!
      </Text>

      {/* QR Code */}
      <View className="w-64 h-64 mb-6 items-center justify-center">
        {qrParam && isSvg && svgXml ? (
          <SvgXml xml={svgXml} width="100%" height="100%" />
        ) : (
          <Image
            source={qrSource}
            style={{ width: 256, height: 256 }}
            resizeMode="contain"
          />
        )}
      </View>

      {/* Caption */}
      <Text className="text-base text-gray-600 text-center mb-10">
        Your account is ready. Save this QR for entry.
      </Text>

      {/* Continue Button */}
      <TouchableOpacity
        className="bg-red-600 rounded-full py-3 px-8"
        onPress={() => router.push('/main-home/home')} // adjust route as needed
      >
        <Text className="text-white font-semibold text-base">CONTINUE</Text>
      </TouchableOpacity>
    </View>
  );
}