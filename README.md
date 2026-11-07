# MultiLaptop Mouse Controller

A high-performance Windows desktop application that enables users to control multiple laptops using a single mouse and keyboard. The application features an interactive, drag-and-drop visual layout editor where users can arrange their laptop screens according to their physical positions (vertical stacked, horizontal side-by-side, or custom freeform).

Mouse and keyboard sharing is powered by **Deskflow** (the active open-source successor to Barrier and Synergy), with verified native process management and real-time configuration generation.

---

## 🌟 Key Features

1. **Visual Screen Layout Editor**
   - Interactive 2D drag-and-drop canvas with grid snapping.
   - Realistic laptop screen cards showing hostname, local IP, and Host/Guest designation.
   - Dynamic boundary edge highlighting (active transitions glow emerald green).
   - Floating directional transition badges (`↓`, `↑`, `←`, `→`) illustrating cursor flow.
   - Instant presets:
     - **Vertical (Stacked)**: Ideal for setups where the Host Laptop is physically above the Client Laptop. Moving off the bottom edge of the Host Laptop transitions to the Client Laptop; moving off the top edge of the Client Laptop returns to the Host Laptop.
     - **Horizontal (Side-by-Side)**: For left/right desktop multi-laptop arrangements.
     - **Grid (2x2)**: Multi-screen workstation matrix.
     - **Custom**: Freeform positioning with automatic overlap interval detection.

2. **Real Mouse & Keyboard Sharing (No Fakes)**
   - Integrates with the official, verified **Deskflow** core daemon (`deskflow-core.exe`).
   - Generates compliant Deskflow INI settings and `server.conf` files on the fly.
   - Calculates bidirectional edge intervals (`start%` to `end%`) for precise transitions.
   - Supports Host Laptop (Server) and Client Laptop (Guest) roles.

3. **Status Dashboard & Process Control**
   - Real-time engine status (Running / Stopped / Starting / Error).
   - Instant Start, Stop, and Restart controls.
   - Live uptime counter, process PID, and listening port indicator.
   - Mini-map preview of the active screen layout.

4. **Multi-Laptop Management**
   - Add, edit, and remove laptops with custom hostnames, IP addresses, and screen colors.
   - Assign primary Host (Server) vs Guest (Client) computers.
   - Windows hostname discovery guidance.

5. **Deskflow Diagnostic Terminal**
   - Live streaming stdout/stderr log capture.
   - Log filtering by severity (`INFO`, `WARNING`, `ERROR`, `FATAL`, `DEBUG`).
   - One-click copy logs to clipboard and clear console.

6. **Application Preferences & Security**
   - Electron security best practices: `contextIsolation: true`, `nodeIntegration: false`, and strictly typed preload IPC bridge.
   - Bundled portable Deskflow binary (v1.27.0) out of the box or custom executable path support.
   - Shared clipboard toggle (copy and paste text/images between laptops).
   - Edge switch delay (prevents accidental transitions near screen borders) and double-tap to switch.
   - Auto-start daemon on app launch.

---

## 📐 Technology Stack

- **Desktop Framework**: Electron 32 (with isolated context & IPC)
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Bootstrap 5, Bootstrap Icons, Custom CSS
- **Backend / Daemon**: Node.js & Deskflow 1.27.0
- **Operating System**: Windows 10 and Windows 11 (64-bit)

---

## 📁 Project Folder Structure

```
multilaptop-mouse-controller/
├── package.json                   # Dependencies, build scripts & electron-builder config
├── tsconfig.json                  # TypeScript config for React frontend
├── tsconfig.node.json             # TypeScript config for Electron Main and Preload
├── vite.config.ts                 # Vite bundler configuration
├── index.html                     # HTML root entry
├── resources/
│   └── bin/
│       └── deskflow/              # Bundled portable Deskflow v1.27.0 core binaries & DLLs
│           ├── deskflow-core.exe
│           ├── Qt6Core.dll
│           ├── Qt6Widgets.dll
│           └── ...
├── src/
│   ├── shared/
│   │   └── types.ts               # Shared TypeScript models, contracts, and IPC interface
│   ├── main/
│   │   ├── main.ts                # Electron window lifecycle & security setup
│   │   ├── ipc/
│   │   │   └── registerIpc.ts     # IPC handlers (Config, Deskflow daemon, Geometry, System)
│   │   └── services/
│   │       ├── ConfigService.ts   # JSON config storage (AppData/userData)
│   │       ├── DeskflowService.ts # Child process spawn, config generator & log streamer
│   │       ├── LayoutGeometryService.ts # 2D screen overlap to Deskflow links converter
│   │       └── NetworkService.ts  # Hostname and local IPv4 adapter discovery
│   ├── preload/
│   │   └── preload.ts             # Secure contextBridge exposing typed window.api
│   └── renderer/
│       ├── main.tsx               # React DOM entry point
│       ├── App.tsx                # Application state & tab controller
│       ├── layouts/
│       │   └── MainLayout.tsx     # App shell with sidebar, header pills, and status bar
│       ├── pages/
│       │   ├── DashboardPage.tsx  # Engine status, mini layout preview, and connected laptops
│       │   ├── LayoutEditorPage.tsx # Draggable visual screen editor with live boundaries
│       │   ├── ComputersPage.tsx  # Add / edit / delete laptop configurations
│       │   ├── LogsPage.tsx       # Live Deskflow streaming terminal
│       │   └── SettingsPage.tsx   # Networking, timing, clipboard & binary options
│       ├── services/
│       │   └── api.ts             # Typed client wrapper for window.api with fallback mocks
│       └── styles/
│           └── index.css          # Bootstrap custom styles, grid canvas & glow effects
└── test/
    ├── run-test.js                # Integration verification suite
    └── verification.ts            # Geometric arrangement test assertions
```

---

## 🚀 Getting Started & Development Setup

### Prerequisites
- **Node.js**: v18+ (tested with v24)
- **Windows**: Windows 10 or Windows 11 (64-bit)
- **Visual C++ Redistributable**: Microsoft Visual C++ 2015-2022 x64 (installed on most Windows PCs)

### Installation
1. Clone or open the repository:
   ```cmd
   cd d:\sharief\mouse
   ```
2. Install npm dependencies:
   ```cmd
   npm install
   ```

### Running in Development
To run the Electron app with live Vite frontend reload:
```cmd
npm run dev:electron
```
Or start Vite and Electron independently:
```cmd
# Terminal 1: Vite dev server
npm run dev

# Terminal 2: Compile main process and run Electron
npm run build:main
npm start
```

### Running Tests
Execute the verification test suite to validate the layout geometry calculations, bidirectional Deskflow links, and network interfaces:
```cmd
npm run build:main
node test/run-test.js
```

---

## 💻 Deskflow Integration Architecture

### 1. Deskflow 1.27 Architecture
Deskflow operates via a unified core executable `deskflow-core.exe` invoked in either `server` or `client` mode:
```cmd
deskflow-core.exe server -s "C:\path\to\Deskflow_server.ini" --new-instance
deskflow-core.exe client -s "C:\path\to\Deskflow_client.ini" --new-instance
```

### 2. Configuration Generation
In Deskflow 1.27+, screens are registered inside the primary INI configuration under `[computer_<screen_name>]`, while spatial transitions and mouse options are defined in an external `server.conf` file referenced via `externalConfigFile`.

When the user arranges screens in the visual editor, `MultiLaptop Mouse Controller` dynamically generates:

#### `Deskflow_server.ini`:
```ini
[core]
coreMode=2
computerName=Host-Laptop
port=24800

[server]
externalConfig=true
externalConfigFile=C:/Users/.../AppData/Roaming/MultiLaptop/deskflow_runtime/server.conf
enableClipboard=true
switchDelay=250

[computer_Host-Laptop]
name=Host-Laptop

[computer_Client-Laptop]
name=Client-Laptop
```

#### `server.conf`:
```text
section: links
	Host-Laptop:
		down = Client-Laptop
	Client-Laptop:
		up = Host-Laptop
end

section: options
	relativeMouseMoves = false
	win32KeepForeground = false
	clipboardSharing = true
	switchDelay = 250
	switchDoubleTap = 0
end
```

### 3. Bidirectional Edge Mathematics
For screens $A$ and $B$:
- **Vertical Stack**: If the Client Laptop is below the Host Laptop and their horizontal bounds $[x, x + w]$ overlap:
  $$\text{Overlap}_X = [\max(A.x, B.x), \min(A.x + A.w, B.x + B.w)]$$
  - Down transition ($A \to B$): `Host-Laptop: down(start%, end%) = Client-Laptop(target_start%, target_end%)`
  - Up return transition ($B \to A$): `Client-Laptop: up(target_start%, target_end%) = Host-Laptop(start%, end%)`
- **Horizontal Alignment**: If the Client Laptop is to the right of the Host Laptop and their vertical bounds $[y, y + h]$ overlap:
  - Right transition ($A \to B$): `Host-Laptop: right = Client-Laptop`
  - Left return transition ($B \to A$): `Client-Laptop: left = Host-Laptop`

---

## 🔄 Auto-Updater (electron-updater)
The application includes full integration with `electron-updater`:
- Checks for new releases published on GitHub (`Sharief2854/MultiLaptop-Mouse-Controller`).
- Shows update availability and download progress directly in **Settings > Software Updates**.
- One-click restart and automatic installation of verified updates.

---

## 🛠️ Step-by-Step Multi-Laptop Usage Guide

### Scenario: Host Laptop physically placed ABOVE Client Laptop

1. **On Host Laptop (Primary with physical mouse & keyboard)**:
   - Launch **MultiLaptop Mouse Controller**.
   - Note down the Host Laptop's local IP (e.g., `192.168.1.100`) shown on the Dashboard.
   - Go to **Screen Layout** tab.
   - Click the **Vertical (Stacked)** preset button (or drag the Host Laptop directly above the Client Laptop).
   - The boundary between the Host Laptop bottom and the Client Laptop top will glow emerald green with a `↓` arrow.
   - Click **Save Layout Changes**.
   - Click **Start Sharing**. The status turns green (`RUNNING`).

2. **On Client Laptop (Secondary - Receiving mouse control)**:
   - Launch **MultiLaptop Mouse Controller** (or client utility).
   - In **Settings**, set Role to **Guest Laptop (Client)**.
   - Enter the Host Laptop IP: `192.168.1.100`.
   - Click **Start Sharing**.
   - Once connected, move your mouse down off the bottom edge of the Host Laptop — the cursor will seamlessly glide onto the Client Laptop!
   - Move the cursor up off the top edge of the Client Laptop — it instantly returns to the Host Laptop!

---

## 📦 Building the Windows Executable & Installer

To build the standalone Windows application and installer:
```cmd
# 1. Compile React frontend and TypeScript main process
npm run build

# 2. Package into unpacked Windows binary directory (release/win-unpacked/)
npm run package:dir

# 3. Create full Windows NSIS Setup installer (.exe)
npm run package
```
Output files are placed in the `release/` directory:
- `release/win-unpacked/MultiLaptop Mouse Controller.exe` (run directly without installing)
- `release/MultiLaptop Mouse Controller Setup 1.0.0.exe` (standard Windows installer)

---

## 🔒 Security Best Practices
- **Electron Sandbox**: `contextIsolation` is enabled; `nodeIntegration` is disabled in all renderer windows.
- **Controlled IPC**: No arbitrary shell command execution is exposed to the frontend; only strictly validated parameters are accepted by the Main process.
- **LAN Isolation**: Mouse and keyboard control signals are exchanged strictly within your local network.
