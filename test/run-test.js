const assert = require('assert');
const { LayoutGeometryService } = require('../dist/main/services/LayoutGeometryService');
const { NetworkService } = require('../dist/main/services/NetworkService');

console.log('--- RUNNING COMPILED VERIFICATION SUITE ---');

// 1. Vertical Arrangement
console.log('\n[Test 1] Testing Vertical Screen Arrangement (Host Laptop ABOVE Client Laptop):');
const verticalLaptops = [
  { id: 'laptop-1', name: 'Host-Laptop', ip: '192.168.1.100', port: 24800, isServer: true, x: 200, y: 50, width: 220, height: 130 },
  { id: 'laptop-2', name: 'Client-Laptop', ip: '192.168.1.150', port: 24800, isServer: false, x: 200, y: 230, width: 220, height: 130 }
];

const verticalResult = LayoutGeometryService.calculateLinks(verticalLaptops);
console.log('Generated Links:\n' + verticalResult.deskflowLinksSection);
const downLink = verticalResult.links.find(l => l.fromScreen === 'Host-Laptop' && l.toScreen === 'Client-Laptop' && l.direction === 'down');
assert(downLink, 'Host-Laptop must transition DOWN into Client-Laptop');
console.log('✓ PASS: Vertical Down Link Verified!');

// 2. Horizontal Arrangement
console.log('\n[Test 2] Testing Horizontal Screen Arrangement:');
const horizontalLaptops = [
  { id: 'laptop-1', name: 'Host-Laptop', ip: '192.168.1.100', port: 24800, isServer: true, x: 100, y: 100, width: 220, height: 130 },
  { id: 'laptop-2', name: 'Client-Laptop', ip: '192.168.1.150', port: 24800, isServer: false, x: 360, y: 100, width: 220, height: 130 }
];
const horizontalResult = LayoutGeometryService.calculateLinks(horizontalLaptops);
console.log('Generated Links:\n' + horizontalResult.deskflowLinksSection);
const rightLink = horizontalResult.links.find(l => l.fromScreen === 'Host-Laptop' && l.toScreen === 'Client-Laptop' && l.direction === 'right');
assert(rightLink, 'Host-Laptop must transition RIGHT into Client-Laptop');
console.log('✓ PASS: Horizontal Right Link Verified!');

// 3. System Info
console.log('\n[Test 3] Testing Network System Info:');
const sysInfo = NetworkService.getSystemInfo();
console.log('Hostname:', sysInfo.hostname);
console.log('Interfaces detected:', sysInfo.networkInterfaces.length);
assert(sysInfo.hostname.length > 0);
console.log('✓ PASS: System Info Verified!');

console.log('\n=== ALL TESTS PASSED! ===');
