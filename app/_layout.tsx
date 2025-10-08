// Import the router. Depending on bundler/module config, expo-router may expose
// Stack as the default export or as a named property. Resolve at runtime and
// cast to `any` so `.Screen` access won't crash.
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Ensure Ionicons font is loaded early so tab icons don't render as placeholders.
try {
  // loadFont may be undefined in some environments; call if present.
  // react-native-vector-icons exposes loadFont on the default import
  if ((Ionicons as any).loadFont) {
    (Ionicons as any).loadFont();
  }
} catch (e) {
  // ignore in environments where font loading is unnecessary
}
import './globals.css';

// Debug webhook logger: captures console logs and uncaught JS errors and POSTs them to webhook.site
// Enabled when __DEV__ is true (development) or when DEBUG_LOG_WEBHOOK environment flag is present.
try {
  const enabled = (typeof __DEV__ !== 'undefined' && __DEV__) || (typeof process !== 'undefined' && process.env && process.env.DEBUG_LOG_WEBHOOK === 'true');
  if (enabled) {
    const DEBUG_WEBHOOK_URL = 'https://webhook.site/048f5342-21a4-490b-a2cf-1d8f01bf49a3';

    function safePost(payload: any) {
      try {
        fetch(DEBUG_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch(() => {});
      } catch (e) {}
    }

    (global as any).__debugLogs = (global as any).__debugLogs || [];

    function pushLog(level: string, args: any[]) {
      try {
        const text = args.map(a => {
          try { return typeof a === 'string' ? a : JSON.stringify(a); } catch (e) { return String(a); }
        }).join(' ');
        const entry = { ts: new Date().toISOString(), level, text };
        (global as any).__debugLogs.unshift(entry);
        if ((global as any).__debugLogs.length > 200) (global as any).__debugLogs.pop();
        safePost({ level, text, ts: entry.ts });
      } catch (e) {}
    }

    ['log','info','warn','error','debug'].forEach((level) => {
      const orig = (console as any)[level] && (console as any)[level].bind(console);
      (console as any)[level] = (...args: any[]) => { pushLog(level, args); if (orig) orig(...args); };
    });

    if ((global as any).ErrorUtils && typeof (global as any).ErrorUtils.setGlobalHandler === 'function') {
      const oldHandler = (global as any).ErrorUtils.getGlobalHandler && (global as any).ErrorUtils.getGlobalHandler();
      (global as any).ErrorUtils.setGlobalHandler((error: any, isFatal: boolean) => {
        pushLog('fatal', [error && (error.stack || error.message) || String(error)]);
        safePost({ level: 'fatal', message: error && (error.stack || error.message), isFatal });
        if (oldHandler) oldHandler(error, isFatal);
      });
    } else {
      const origHandler = (global as any).handleError || (() => {});
      (global as any).handleError = (err: any) => {
        pushLog('fatal', [err && (err.stack || err.message) || String(err)]);
        safePost({ level: 'fatal', message: err && (err.stack||err.message) });
        origHandler(err);
      };
    }
  }
} catch (e) {}

export default function RootLayout() {
  return (
    <Stack initialRouteName="index"> {/* pang set ng starting point */}
      <Stack.Screen
        name="main-home"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="available_parking/[id]"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="components/[Hamburger-menu]"
        options={{ headerShown: false }}
      />
        <Stack.Screen name="log-in module/index" options={{ headerShown: false }} />
        <Stack.Screen name="log-in module/login" options={{ headerShown: false }} />
        <Stack.Screen name="log-in module/signup" options={{ headerShown: false }} />
        <Stack.Screen name="log-in module/usertypepage" options={{ headerShown: false }} />
        <Stack.Screen name="log-in module/studentinfo" options={{ headerShown: false }} />
        <Stack.Screen name="log-in module/uploadidstudent" options={{ headerShown: false }} />
        <Stack.Screen name="log-in module/orcrstudent" options={{ headerShown: false }} />
        <Stack.Screen name="log-in module/qrconfirmstudent" options={{ headerShown: false }} />
    </Stack>
  );
}