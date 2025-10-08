 "./app/globals.css";

// --- DEBUG: send console logs / uncaught JS errors to webhook.site for phone-only debugging
// Enable by setting DEBUG_LOG_WEBHOOK=true in your build environment (development only).
if (typeof process !== 'undefined' && process.env && process.env.DEBUG_LOG_WEBHOOK === 'true') {
  try {
    const DEBUG_WEBHOOK_URL = "https://webhook.site/048f5342-21a4-490b-a2cf-1d8f01bf49a3";

    function safePost(payload) {
      try {
        fetch(DEBUG_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(()=>{});
      } catch (e) {}
    }

    global.__debugLogs = global.__debugLogs || [];

    function pushLog(level, args) {
      try {
        const text = args.map(a => {
          try { return typeof a === 'string' ? a : JSON.stringify(a); } catch (e) { return String(a); }
        }).join(' ');
        const entry = { ts: new Date().toISOString(), level, text };
        global.__debugLogs.unshift(entry);
        if (global.__debugLogs.length > 200) global.__debugLogs.pop();
        safePost({ level, text, ts: entry.ts });
      } catch (e) {}
    }

    ['log','info','warn','error','debug'].forEach(level => {
      const orig = console[level] && console[level].bind(console);
      console[level] = (...args) => { pushLog(level, args); if (orig) orig(...args); };
    });

    if (global.ErrorUtils && typeof global.ErrorUtils.setGlobalHandler === 'function') {
      const oldHandler = global.ErrorUtils.getGlobalHandler && global.ErrorUtils.getGlobalHandler();
      global.ErrorUtils.setGlobalHandler((error, isFatal) => {
        pushLog('fatal', [error && (error.stack || error.message) || String(error)]);
        safePost({ level: 'fatal', message: error && (error.stack || error.message), isFatal });
        if (oldHandler) oldHandler(error, isFatal);
      });
    } else {
      const origHandler = global.handleError || (() => {});
      global.handleError = (err) => {
        pushLog('fatal', [err && (err.stack || err.message) || String(err)]);
        safePost({ level: 'fatal', message: err && (err.stack||err.message) });
        origHandler(err);
      };
    }
  } catch (e) {}
}

export default function App() {
  // Your App
  return (
    <div>
      {/* Your App */}
    </div>
  );
}