import assert from 'assert';
import { LayoutGeometryService } from '../src/main/services/LayoutGeometryService';
import { ConfigService } from '../src/main/services/ConfigService';
import { NetworkService } from '../src/main/services/NetworkService';
import { ComputerNode } from '../src/shared/types';

console.log('--- STARTING MULTILAPTOP CONTROLLER VERIFICATION TESTS ---');

// TEST 1: Vertical Arrangement (The User's Exact Prompt Scenario)
// Laptop 1 is physically positioned above Laptop 2.
console.log('\n[Test 1] Testing Vertical Screen Arrangement (Laptop 1 ABOVE Laptop 2)...');
const verticalLaptops: ComputerNode[] = [
  {
    id: 'laptop-1',
    name: 'Laptop-1',
    ip: '192.168.1.100',
    port: 24800,
    isServer: true,
    x: 200,
    y: 50,
    width: 220,
    height: 130
  },
  {
    id: 'laptop-2',
    name: 'Laptop-2',
    ip: '192.168.1.150',
    port: 24800,
    isServer: false,
    x: 200,
    y: 230, // Directly below Laptop 1 (gap = 50px)
    width: 220,
    height: 130
  }
];

const verticalResult = LayoutGeometryService.calculateLinks(verticalLaptops);
console.log('Vertical Links found:', verticalResult.links.length);
console.log('Deskflow syntax output:\n' + verticalResult.deskflowLinksSection);

assert(verticalResult.links.length >= 1, 'Should find vertical transition links');
const downLink = verticalResult.links.find(
  (l) => l.fromScreen === 'Laptop-1' && l.toScreen === 'Laptop-2' && l.direction === 'down'
);
assert(downLink, 'Laptop-1 must transition DOWN into Laptop-2');
console.log('✓ PASS: Laptop-1 transitions DOWN to Laptop-2');

// TEST 2: Horizontal Arrangement (Laptop 1 LEFT of Laptop 2)
console.log('\n[Test 2] Testing Horizontal Screen Arrangement (Laptop 1 LEFT of Laptop 2)...');
const horizontalLaptops: ComputerNode[] = [
  {
    id: 'laptop-1',
    name: 'Laptop-1',
    ip: '192.168.1.100',
    port: 24800,
    isServer: true,
    x: 100,
    y: 100,
    width: 220,
    height: 130
  },
  {
    id: 'laptop-2',
    name: 'Laptop-2',
    ip: '192.168.1.150',
    port: 24800,
    isServer: false,
    x: 360, // Directly to the right
    y: 100,
    width: 220,
    height: 130
  }
];

const horizontalResult = LayoutGeometryService.calculateLinks(horizontalLaptops);
console.log('Horizontal Links found:', horizontalResult.links.length);
console.log('Deskflow syntax output:\n' + horizontalResult.deskflowLinksSection);

const rightLink = horizontalResult.links.find(
  (l) => l.fromScreen === 'Laptop-1' && l.toScreen === 'Laptop-2' && l.direction === 'right'
);
assert(rightLink, 'Laptop-1 must transition RIGHT into Laptop-2');
console.log('✓ PASS: Laptop-1 transitions RIGHT to Laptop-2');

// TEST 3: Network Service
console.log('\n[Test 3] Testing Network Service info retrieval...');
const sysInfo = NetworkService.getSystemInfo();
console.log(`Hostname: ${sysInfo.hostname}`);
console.log(`Platform: ${sysInfo.platform} (${sysInfo.arch})`);
console.log(`Network Interfaces detected: ${sysInfo.networkInterfaces.length}`);
assert(sysInfo.hostname.length > 0, 'Hostname must not be empty');
console.log('✓ PASS: Network Service works');

// TEST 4: Config Service
console.log('\n[Test 4] Testing Config Service persistence...');
const configService = new ConfigService();
const initialConfig = configService.getConfig();
assert(initialConfig.computers.length >= 2, 'Default config should contain at least 2 computers');
console.log(`Config loaded with ${initialConfig.computers.length} computers.`);
console.log('✓ PASS: Config Service works');

console.log('\n--- ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ---');
