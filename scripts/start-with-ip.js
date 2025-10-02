const { execSync } = require('child_process');
const os = require('os');

function getLocalIp() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

const ip = getLocalIp();
const api = process.env.NEXT_PUBLIC_API_URL || `http://${ip}:8000`;
console.log(`Detected IP: ${ip}, using NEXT_PUBLIC_API_URL=${api}`);

// persist to .env so Expo/Next picks it up reliably across shells
const fs = require('fs');
const envPath = require('path').join(__dirname, '..', '.env');
try {
  let envContents = '';
  if (fs.existsSync(envPath)) {
    envContents = fs.readFileSync(envPath, 'utf8');
  }
  const re = /^NEXT_PUBLIC_API_URL=.*/m;
  if (re.test(envContents)) {
    envContents = envContents.replace(re, `NEXT_PUBLIC_API_URL=${api}`);
  } else {
    if (envContents.length && !envContents.endsWith('\n')) envContents += '\n';
    envContents += `NEXT_PUBLIC_API_URL=${api}\n`;
  }
  fs.writeFileSync(envPath, envContents, 'utf8');
  console.log(`Wrote NEXT_PUBLIC_API_URL to ${envPath}`);
} catch (err) {
  console.warn('Could not write .env file:', err);
}

// spawn expo with the environment var
const spawn = require('child_process').spawn;
const args = process.argv.slice(2).map(a => a.replace(/"/g, '\\"'));
const cmd = `npx expo start ${args.join(' ')}`;

try {
  // Use shell spawn to avoid EINVAL on Windows for .cmd wrappers
  const child = spawn(cmd, { shell: true, stdio: 'inherit', env: { ...process.env, NEXT_PUBLIC_API_URL: api } });
  child.on('exit', code => process.exit(code));
  child.on('error', err => {
    console.error('Failed to start child process:', err);
    console.error('Command attempted:', cmd);
    process.exit(1);
  });
} catch (err) {
  console.error('Error launching expo:', err);
  console.error('Tried command:', cmd);
  process.exit(1);
}
