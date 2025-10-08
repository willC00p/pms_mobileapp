import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, ActivityIndicator, View, Alert } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { apiFetch, API_BASE } from '../_lib/api';
import { useRouter } from 'expo-router';

export default function QRCodeScreen() {
	const router = useRouter();
	const [loading, setLoading] = React.useState(true);
	const [qrUrl, setQrUrl] = React.useState<string | null>(null);
	const [qrSvg, setQrSvg] = React.useState<string | null>(null);
	const [username, setUsername] = React.useState<string | null>(null);

	React.useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const res = await apiFetch('/api/settings/profile');
				if (!mounted) return;

				try { console.log('[QR] profile response ->', res); } catch (e) {}

				const payload = (res && (res.data ?? res)) || res;
				const candidates: Array<string | undefined> = [];
				const d = payload?.data ?? payload;
				candidates.push(d?.qr);
				candidates.push(d?.qr_path);
				candidates.push(d?.qr_url);
				candidates.push(d?.user?.userDetail?.qr_path);
				candidates.push(d?.user?.user_detail?.qr_path);
				candidates.push(d?.user?.qr);
				candidates.push(d?.userDetail?.qr_path);
				candidates.push(res?.userDetail?.qr_path);
				candidates.push(res?.user?.userDetail?.qr_path);

				const found = candidates.find(c => !!c) || null;
				if (found && mounted) {
					let urlStr = String(found);
					if (!/^https?:\/\//i.test(urlStr)) {
						const base = (API_BASE || '').replace(/\/$/, '');
						if (urlStr.startsWith('/storage')) {
							urlStr = base + urlStr;
						} else if (/^storage\//i.test(urlStr) || /^[a-z0-9_\-]+\//i.test(urlStr)) {
							urlStr = base + '/storage/' + urlStr.replace(/^\/+/, '');
						} else {
							urlStr = base + '/storage/' + urlStr.replace(/^\/+/, '');
						}
					}
					setQrUrl(urlStr);

					// If the QR is an SVG file, fetch the XML so we can render it via SvgXml
					try {
						if (/\.svg($|\?)/i.test(urlStr)) {
							const r = await fetch(urlStr);
							if (r.ok) {
								const text = await r.text();
								if (mounted) setQrSvg(text);
							}
						}
					} catch (e) {
						// ignore fetch errors for svg preview; Image fallback will still work for some platforms
						console.warn('[QR] svg fetch failed', e);
					}
				}

				const name = d?.user?.name || d?.user?.username || d?.user?.email || d?.name || d?.username || null;
				if (name && mounted) setUsername(name as string);
			} catch (err: any) {
				// If unauthorized, redirect to login
				try {
					if (err && err.status === 401) {
						try { router.push('/log-in module/login'); } catch (e) {}
						return;
					}
				} catch (e) {}

				try { console.warn('[QR] load failed', err); Alert.alert('QR', 'Unable to load QR. Please login.'); } catch (e) {}
			} finally {
				if (mounted) setLoading(false);
			}
		})();
		return () => { mounted = false; };
	}, []);

	if (loading) {
		return (
			<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
				<ActivityIndicator size="large" />
			</View>
		);
	}

	return (
		<ScrollView contentContainerStyle={styles.container}>
			<Image source={require('../../assets/images/bulsu-logo.png')} style={styles.profileImage} />

			<Text style={styles.username}>{username ? `@${username}` : ''}</Text>

			<Text style={styles.generatedLabel}>QR Code Generated!</Text>

			{qrUrl ? (
				qrSvg ? (
					// Render inline SVG when available
					<SvgXml xml={qrSvg} width={220} height={220} />
				) : (
					// Fallback to Image for non-SVG or if svg fetch failed
					<Image source={{ uri: qrUrl }} style={styles.qrCode} />
				)
			) : (
				<View style={[styles.qrCode, { justifyContent: 'center', alignItems: 'center' }]}> 
					<Text>No QR available</Text>
				</View>
			)}

			<Text style={styles.usageNote}>Start using it for hassle-free entry</Text>

			<TouchableOpacity
				style={styles.downloadButton}
				onPress={() => {
					if (!qrUrl) { Alert.alert('Download', 'No QR available'); return; }
					Alert.alert('Download', 'QR download not implemented in-app yet.');
				}}
			>
				<Text style={styles.downloadText}>DOWNLOAD</Text>
			</TouchableOpacity>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		paddingVertical: 40,
		backgroundColor: '#fff',
	},
	profileImage: {
		width: 100,
		height: 100,
		borderRadius: 50,
		marginBottom: 12,
	},
	username: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#333',
		marginBottom: 8,
	},
	generatedLabel: {
		fontSize: 16,
		color: '#666',
		marginBottom: 20,
	},
	qrCode: {
		width: 220,
		height: 220,
		marginBottom: 20,
	},
	usageNote: {
		fontSize: 14,
		color: '#444',
		marginBottom: 30,
	},
	downloadButton: {
		backgroundColor: '#C34C4D',
		paddingVertical: 12,
		paddingHorizontal: 40,
		borderRadius: 6,
	},
	downloadText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: 'bold',
	},
});
