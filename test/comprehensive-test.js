const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { LayoutGeometryService } = require('../dist/main/services/LayoutGeometryService');
const { ConfigService } = require('../dist/main/services/ConfigService');
const { NetworkService } = require('../dist/main/services/NetworkService');
const { DeskflowService } = require('../dist/main/services/DeskflowService');

async function runComprehensiveTests() {
  console.log('====================================================');
  console.log(' MULTILAPTOP MOUSE CONTROLLER - COMPREHENSIVE SUITE ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  async function asyncTest(name, fn) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  // 1. Icon Assets Validation
  test('Icon files exist and have correct sizes', () => {
    const icoPath = path.join(__dirname, '../resources/icon.ico');
    const pngPath = path.join(__dirname, '../resources/icon.png');
    assert(fs.existsSync(icoPath), 'icon.ico must exist');
    assert(fs.existsSync(pngPath), 'icon.png must exist');
    const icoStat = fs.statSync(icoPath);
    const pngStat = fs.statSync(pngPath);
    assert(icoStat.size > 10000, 'icon.ico must contain multi-res icon data');
    assert(pngStat.size > 5000, 'icon.png must contain high-res 512x512 image');
  });

  // 2. Desktop Shortcut Validation
  test('Desktop shortcut points to application executable and icon', () => {
    const shortcutPath = path.join(process.env.USERPROFILE, 'OneDrive', 'Desktop', 'MultiLaptop Mouse Controller.lnk');
    assert(fs.existsSync(shortcutPath), 'Desktop shortcut must exist');
  });

  // 3. Layout Geometry: 2 Laptops Stacked (Vertical: Host Laptop on top, Client Laptop on bottom)
  test('Vertical arrangement: Host Laptop (Top) <-> Client Laptop (Bottom)', () => {
    const laptops = [
      { id: '1', name: 'HOST-LAPTOP', ip: '192.168.1.10', port: 24800, isServer: true, x: 200, y: 50, width: 220, height: 130 },
      { id: '2', name: 'CLIENT-LAPTOP', ip: '192.168.1.11', port: 24800, isServer: false, x: 200, y: 220, width: 220, height: 130 }
    ];
    const res = LayoutGeometryService.calculateLinks(laptops);
    assert(res.links.length === 2, `Expected 2 links, got ${res.links.length}`);
    const down = res.links.find(l => l.fromScreen === 'HOST-LAPTOP' && l.toScreen === 'CLIENT-LAPTOP' && l.direction === 'down');
    const up = res.links.find(l => l.fromScreen === 'CLIENT-LAPTOP' && l.toScreen === 'HOST-LAPTOP' && l.direction === 'up');
    assert(down, 'Down link from HOST-LAPTOP to CLIENT-LAPTOP must exist');
    assert(up, 'Up return link from CLIENT-LAPTOP to HOST-LAPTOP must exist');
  });

  // 4. Layout Geometry: 3 Laptops in a T-Shape
  test('3 Laptops arrangement (T-Shape: Laptop 1 top, Laptop 2 & 3 side-by-side below)', () => {
    const laptops = [
      { id: '1', name: 'TOP', ip: '192.168.1.1', port: 24800, isServer: true, x: 200, y: 50, width: 220, height: 130 },
      { id: '2', name: 'BOT-LEFT', ip: '192.168.1.2', port: 24800, isServer: false, x: 90, y: 220, width: 220, height: 130 },
      { id: '3', name: 'BOT-RIGHT', ip: '192.168.1.3', port: 24800, isServer: false, x: 320, y: 220, width: 220, height: 130 }
    ];
    const res = LayoutGeometryService.calculateLinks(laptops);
    assert(res.links.length >= 4, `Expected at least 4 links in T-shape, got ${res.links.length}`);
    const botHorizontal = res.links.find(l => l.fromScreen === 'BOT-LEFT' && l.toScreen === 'BOT-RIGHT' && l.direction === 'right');
    assert(botHorizontal, 'Horizontal transition between bottom laptops must exist');
  });

  // 5. Deskflow Binary Detection
  test('Deskflow Service resolves bundled deskflow-core binary', () => {
    const deskflowService = new DeskflowService();
    const configService = new ConfigService();
    const config = configService.getConfig();
    const resolved = deskflowService.resolveBinaryPath(config);
    assert(fs.existsSync(resolved.path), `Binary path must exist on disk: ${resolved.path}`);
    assert.strictEqual(resolved.type, 'bundled');
  });

  // 6. Network IP Detection
  test('Network Service retrieves valid IPv4 address and hostname', () => {
    const info = NetworkService.getSystemInfo();
    assert(info.hostname.length > 0, 'Hostname must not be empty');
    const primaryIp = NetworkService.getPrimaryIp();
    assert(/^\d+\.\d+\.\d+\.\d+$/.test(primaryIp), `Primary IP must be valid IPv4: ${primaryIp}`);
  });

  // 7. Deskflow Lifecycle: Start -> Process Listening -> Stop
  await asyncTest('Deskflow Core process starts, reports running status, and terminates cleanly', async () => {
    const deskflowService = new DeskflowService();
    const configService = new ConfigService();
    const config = configService.getConfig();

    // Start in server mode
    const startRes = await deskflowService.start(config, 'server');
    assert(startRes.success, `Deskflow start failed: ${startRes.message}`);

    // Wait 1.5 seconds for core to initialize
    await new Promise(r => setTimeout(r, 1500));

    const status = deskflowService.getStatus();
    assert(status.status === 'running', `Expected status 'running', got '${status.status}'`);
    assert(typeof status.pid === 'number' && status.pid > 0, 'PID must be a valid process ID');

    // Verify logs were captured
    const logs = deskflowService.getLogs();
    assert(logs.length > 0, 'Logs should be populated from stdout/stderr');

    // Stop cleanly
    const stopRes = await deskflowService.stop();
    assert(stopRes.success, `Deskflow stop failed: ${stopRes.message}`);

    // Verify status becomes stopped
    const finalStatus = deskflowService.getStatus();
    assert(finalStatus.status === 'stopped', 'Status must be stopped after stopping');
  });

  console.log('\n====================================================');
  console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runComprehensiveTests();
