import os from 'os';
import { SystemInfo, NetworkInterfaceInfo } from '../../shared/types';

export class NetworkService {
  public static getSystemInfo(): SystemInfo {
    const interfaces = os.networkInterfaces();
    const networkInterfaces: NetworkInterfaceInfo[] = [];

    for (const [name, netList] of Object.entries(interfaces)) {
      if (netList) {
        for (const net of netList) {
          if (net.family === 'IPv4' && !net.internal) {
            networkInterfaces.push({
              name,
              address: net.address,
              family: net.family,
              internal: net.internal
            });
          }
        }
      }
    }

    return {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      networkInterfaces
    };
  }

  public static getPrimaryIp(): string {
    const info = this.getSystemInfo();
    // Prefer Wi-Fi or Ethernet IPv4
    const nonInternal = info.networkInterfaces.find((i) => !i.internal && i.family === 'IPv4');
    return nonInternal ? nonInternal.address : '127.0.0.1';
  }
}
