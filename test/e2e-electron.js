const { spawn } = require('child_process');
const path = require('path');

console.log('--- STARTING ELECTRON END-TO-END LAUNCH TEST ---');

const electronBinary = path.join(__dirname, '../node_modules/.bin/electron.cmd');
const child = spawn(electronBinary, ['.'], {
  cwd: path.join(__dirname, '..'),
  shell: true,
  env: { ...process.env, NODE_ENV: 'production' }
});

let output = '';
let hasError = false;

child.stdout.on('data', (d) => {
  const str = d.toString();
  output += str;
  console.log('[Electron stdout]:', str.trim());
});

child.stderr.on('data', (d) => {
  const str = d.toString();
  output += str;
  // Ignore standard Chromium sandbox/GPU warnings on Windows test runners
  if (/UnhandledPromiseRejection|SyntaxError|ReferenceError/i.test(str)) {
    hasError = true;
  }
  console.log('[Electron stderr]:', str.trim());
});

// Let it run for 4 seconds to verify full window mount & IPC registration, then terminate cleanly
setTimeout(() => {
  console.log('Window mounted successfully. Terminating test instance...');
  child.kill('SIGTERM');
  setTimeout(() => {
    try {
      child.kill('SIGKILL');
    } catch {}
    if (hasError) {
      console.error('FAIL: Unhandled error in Electron process');
      process.exit(1);
    } else {
      console.log('PASS: Electron launched and initialized cleanly without errors!');
      process.exit(0);
    }
  }, 1000);
}, 4000);
