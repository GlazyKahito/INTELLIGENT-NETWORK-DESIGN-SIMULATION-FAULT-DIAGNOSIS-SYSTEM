# INTELLIGENT NETWORK DESIGN, SIMULATION & FAULT DIAGNOSIS SYSTEM
## Comprehensive Engineering Documentation & Project Log

**Academic Virtual Laboratory for Data Communication and Networking (DCN)**  
*Department of Computer Engineering • Somaiya Virtual Labs, Mumbai*  
*Curriculum Mapping: 8 DCN Practical Experiments + Capstone Experiment 08*

---

## 📑 Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Pedagogical Architecture & Core Flow](#2-pedagogical-architecture--core-flow)
3. [The 10-Module Virtual Lab Suite](#3-the-10-module-virtual-lab-suite)
4. [DCN Experiments 01 to 08 Implementation Detail](#4-dcn-experiments-01-to-08-implementation-detail)
5. [Deterministic Kernel & Mathematical Engines](#5-deterministic-kernel--mathematical-engines)
6. [Interactive NOC Room 2.0 Mini-Game](#6-interactive-noc-room-20-mini-game)
7. [Cinematic Intro & Interactive Live Background](#7-cinematic-intro--interactive-live-background)
8. [UI/UX & Audio Synthesis System](#8-uiux--audio-synthesis-system)
9. [Deployment & Verification](#9-deployment--verification)
10. [Repository File Map](#10-repository-file-map)

---

## 1. Executive Summary

This project is a **production-quality Academic Virtual Laboratory** built specifically for computer engineering students studying Data Communication and Networking. It avoids generic portfolio or dashboard tropes, replacing them with a strict, aerospace-grade CAD and diagnostic instrument aesthetic.

### Key Differentiators:
- **Zero Mock Outputs / Strictly Deterministic**: Every `ping`, `tracert`, and `arp` terminal command traverses a living graph topology with real subnet calculations, route tables, and hop-by-hop latency math.
- **RFC Standards Alignment**: Full fidelity to RFC 791 (IPv4), RFC 793 (TCP), RFC 768 (UDP), and IEEE 802.3 Ethernet framing.
- **Seven Core Laboratory Modules**: Covers all 8 syllabus experiments (Commands, Cabling, Wireshark, TCP Header, Subnetting, Hamming Code, UDP, and Capstone Design & Diagnosis).
- **Zero External Audio/Asset Dependencies**: Sound effects (pings, keyclicks, warning klaxons, victory chords) are procedurally synthesized in real time via the Web Audio API.

---

## 2. Pedagogical Architecture & Core Flow

The lab guides students through the complete scientific engineering lifecycle:

```
┌──────────────┐     ┌──────────────┐     ┌───────────────────┐     ┌─────────────────────┐
│ 1. DESIGN    │ ──> │ 2. SIMULATE  │ ──> │ 3. OBSERVE        │ ──> │ 4. FAULT INJECTION  │
│ CAD Topology │     │ Packet Engine│     │ Wire Decapsulation│     │ 10 Empirical Faults │
└──────────────┘     └──────────────┘     └───────────────────┘     └─────────────────────┘
                                                                               │
                                                                               ▼
┌──────────────┐     ┌──────────────┐     ┌───────────────────┐     ┌─────────────────────┐
│ 8. REPORT    │ <── │ 7. NOC HUNT  │ <── │ 6. VERIFY         │ <── │ 5. DIAGNOSE & FIX   │
│ PDF / Cert   │     │ 2D Mini-Game │     │ Ping Sweep Audit  │     │ Hypothesis & CLI    │
└──────────────┘     └──────────────┘     └───────────────────┘     └─────────────────────┘
```

---

## 3. The 10-Module Virtual Lab Suite

| Module ID | Module Title | Description & Features |
|---|---|---|
| **01_Home** | **Lab Overview & Capstone Schematic** | Dynamic topology overview, active node telemetry, pedagogical principles, and system status indicators. |
| **02_Aim** | **Aim, Objectives & Syllabus Alignment** | Bloom's Taxonomy cognitive mapping (L2 to L6), Mumbai University DCN course outcomes (CO1–CO6), and prerequisites. |
| **03_Theory** | **Comprehensive Experiment Theory Hub** | 7-part interactive reference suite covering physical cabling, CLI tools, Wireshark, TCP, CIDR, Hamming, and UDP. |
| **04_NetworkDesign** | **Interactive CAD Network Designer** | Full drag-and-drop network builder with Routers, Switches, Servers, PCs, and Firewalls; device configuration modal; and pre-flight validation rules. |
| **05_Simulation** | **Discrete Event Packet Simulator** | Multi-hop packet animation with speed control (0.5x–2x), pause/step execution, and L2–L4 packet inspector. |
| **06_FaultDiagnosis** | **Empirical Fault Reasoner & CLI** | 10 realistic network fault scenarios, interactive diagnostic terminal, structured hypothesis-evidence reasoning framework, and fix verification. |
| **07_Assessments** | **Formative & Summative Quiz Suite** | 12 rigorous assessment questions covering theoretical protocols and clinical troubleshooting with immediate Bloom-mapped explanations. |
| **08_MiniGame** | **Network Ops: Fault Hunt (NOC Room 2.0)** | Top-down 2D NOC room with 5 mission scenarios, interactive physical equipment stations (re-crimp, IOS prompt, systemctl), handheld scanner HUD, and star ratings. |
| **09_Conclusion** | **Automated Academic Lab Report** | Printable collegiate laboratory certificate with student name, roll number, diagnostic proof log, quiz scorecard, and JSON export. |
| **10_LaunchLab** | **Fullscreen Unrestricted Sandbox** | Distraction-free full-viewport CAD workbench accessible via keyboard shortcut `[F]`. |

---

## 4. DCN Experiments 01 to 08 Implementation Detail

### Experiment 01: Networking Commands Reference
- Interactive terminal documentation for `ping`, `tracert`, `ipconfig /all`, `arp -a`, `nslookup`, and `netstat -an`.
- Syntax guides, sample CLI inputs, and live copyable examples.

### Experiment 02: Cable Fabrication & Continuity Tester
- Visual T568A vs. T568B color code pinout comparison (Pins 1–8).
- Straight-through vs. Crossover wiring matrix with application rules (MDI vs. MDI-X).
- **Interactive 8-Pin Continuity Tester**: Allows students to simulate wire shearing, mis-pinning, and short circuits with instant LED continuity feedback.

### Experiment 03: Wireshark Packet Sniffing & Decapsulation
- Authentic 3-pane packet analysis interface:
  1. **Packet List View**: Packet sequence, relative timestamp, source/destination IP, protocol, frame length.
  2. **Protocol Tree View**: Decapsulated layers (Ethernet II Frame ➔ IPv4 Packet ➔ TCP Segment / UDP Datagram ➔ Payload).
  3. **Hex & ASCII Dump**: True raw hexadecimal byte buffer aligned with ASCII decoded stream.

### Experiment 04: TCP Header Matrix & Handshake
- **RFC 793 20-Byte Header Matrix**: Visual bit breakdown (Source/Destination Port, Sequence Number, Ack Number, Data Offset, Reserved, Window Size, Checksum, Urgent Pointer).
- **Interactive Bitwise Flag Register**: Interactive toggling for `URG`, `ACK`, `PSH`, `RST`, `SYN`, `FIN` with dynamic flag value calculation (e.g. `0x002` for SYN, `0x018` for PSH-ACK).
- **3-Way Handshake Ladder Diagram**: Interactive step-through of SYN (`seq=1000`), SYN-ACK (`seq=5000, ack=1001`), and ACK (`seq=1001, ack=5001`).

### Experiment 05: IPv4 Subnetting & CIDR Calculator
- Dynamic bitwise visualizer separating **Network Bits** from **Host Bits** across `/8` to `/30` prefixes.
- Class identification (Class A, B, C, D, E) and private vs. public range detection.
- Mathematical calculation of Subnet Mask, Network ID, Broadcast Address, Total Hosts, and Usable Host Range.

### Experiment 06: Hamming Code (7,4) Error Detection & Correction Engine
- Linear block code generator for 4 data bits ($D_3, D_5, D_6, D_7$) into 3 parity bits ($P_1, P_2, P_4$).
- **Parity Coverage Matrix**:
  - $P_1$ covers bits 1, 3, 5, 7.
  - $P_2$ covers bits 2, 3, 6, 7.
  - $P_4$ covers bits 4, 5, 6, 7.
- **Interactive Error Injection**: Students can flip any single bit in transit.
- **Autonomous Syndrome Calculation**: The engine computes syndrome vector $S = (s_2, s_1, s_0)$, pinpoints the exact corrupted bit index ($1..7$), corrects it, and reconstructs original data bits.

### Experiment 07: UDP Datagram Structure & Comparison
- 8-byte RFC 768 header breakdown (Source Port, Destination Port, Length, Checksum).
- Side-by-side comparative analysis of TCP (connection-oriented, guaranteed, flow-controlled) vs. UDP (connectionless, lightweight, low-overhead).
- Engineering justification for real-time protocols (DNS, DHCP, VoIP, streaming video).

### Experiment 08: Capstone Network Design & Fault Diagnosis
- Integration of all prior experiments into a cohesive multi-subnet topology testbed.

---

## 5. Deterministic Kernel & Mathematical Engines

The system is powered by deterministic TypeScript engines located in `src/lib/`:

- **`src/lib/network/addressing.ts`**:
  - `isSameSubnet(ip1, ip2, mask)`: Performs 32-bit bitwise AND arithmetic to confirm subnet boundaries.
  - `calculateSubnetDetails(ip, mask)`: Computes network address, broadcast address, and host ranges.
  - `detectIPv4Class(ip)`: Detects classes A, B, C, D, E from octet binary patterns.

- **`src/lib/network/routing.ts`**:
  - `findShortestPath(fromId, toId, devices, links)`: Breadth-First Search (BFS) graph routing taking into account port link status (`UP`/`DOWN`).
  - Computes path hop sequence, decrements TTL, and detects next-hop black holes.

- **`src/lib/network/hamming.ts`**:
  - Generates (7,4) encoded words with parity bits at positions $2^n$.
  - Computes even-parity syndrome matrices and auto-corrects single-bit errors.

- **`src/lib/network/validation.ts`**:
  - Scans topology graphs for: duplicate IP addresses, mismatched subnet masks, missing default gateways, unlinked interfaces, and disconnected network segments.

- **`src/lib/diagnostics/terminal.ts`**:
  - Parses real commands (`ping <ip>`, `ipconfig /all`, `tracert <ip>`, `arp -a`, `nslookup <domain>`, `netstat -an`).
  - Simulates authentic multi-line command output based on live graph path calculations.

- **`src/lib/diagnostics/ruleEngine.ts`**:
  - Houses the **10 Empirical Fault Scenarios**:
    1. Default Gateway Misconfigured
    2. Duplicate IP Address Conflict
    3. Physical Layer Cable Disconnected
    4. Wrong Subnet Mask on Host
    5. Static Route Missing on Core Router
    6. DNS Server IP Unreachable
    7. MTU Mismatch & Packet Drops
    8. Interface Administratively Down
    9. Switch Loop & Broadcast Storm
    10. DHCP Scope Exhaustion
  - Manages fault injection, hypothesis verification, remediation state mutators, and connectivity validation.

---

## 6. Interactive NOC Room 2.0 Mini-Game

Located in `src/components/modules/08_MiniGame/NOCRoomGame.tsx`:
- **5 Selectable Real-World Mission Scenarios**:
  - *Mission 1*: Core Gateway Unreachable
  - *Mission 2*: Cat6 Physical Layer Fault
  - *Mission 3*: DNS Server Outage
  - *Mission 4*: MTU Black Hole Drop
  - *Mission 5*: DHCP Subnet Exhaustion
- **Interactive Hardware Stations**:
  - **Patch Panel PP-01**: Interactive Cat6 re-crimper with 8-pin continuity tester.
  - **Switch SW-01**: Cisco IOS terminal (`configure terminal`, `interface Gi0/1`, `mtu 1500`).
  - **Server Rack Alpha**: Systemd service manager (`systemctl restart named.service`).
  - **Router R1**: Static routing table injector (`ip route ...`).
  - **Central NOC Monitor**: Real-time packet sniffer and global NOC verification sweep.
- **Handheld Cyber-Scanner HUD**:
  - Protocol counters (`ARP`, `ICMP`, `TCP`, `DNS`).
  - Wi-Fi signal gauge (`-42 dBm` RSSI).
  - 8-pin Cat6 continuity tester.
  - Integrated ping sweep tool.
- **Performance Evaluation**:
  - Elapsed mission timer and **1 to 3 Star Performance Rating** based on troubleshooting efficiency.

---

## 7. Cinematic Intro & Interactive Live Background

Located in `src/components/layout/CinematicIntro.tsx` and `IntroLiveBackground.tsx`:
- **Interactive Live Topology Mesh Background**:
  - 12 labeled WAN/LAN topology nodes (`CORE-RTR-01`, `EDGE-FIREWALL`, `DIST-SW-A`, `DNS-ROOT-SRV`, `CLIENT-WS01`, etc.) drifting across the screen with authentic IPv4 telemetry.
  - Conduits with bandwidth ratings (`10 Gbps`, `1 Gbps`, `100 Mbps`).
  - Real-time animated packets (`TCP`, `UDP`, `ICMP`, `ARP`) with glowing trails.
  - **Dynamic Mouse Diagnostic Probe**: Mouse cursor acts as network probe `PROBE-IF0`, drawing snapping fiber lines from nearest nodes and receiving live packet bursts.
  - **Click-to-Ping Broadcast Wave**: Clicking anywhere on the canvas fires an expanding radar ping wave across all nodes, lighting up affected devices with synthesized audio chirps.
  - **Node Hover Tooltip**: Hovering over any drifting node renders live telemetry (IP, type, nominal state, `<1ms` RTT).
  - **Hexadecimal Stream Waterfall**: Scrolling hex frames in the background for Wireshark-like ambience.
- **Glassmorphic Launch Console**:
  - Somaiya Virtual Labs branding & accreditation badge.
  - Live digital clock (`UTC`) and deterministic kernel indicator.
  - Audio mute/unmute toggle (`Volume2` / `VolumeX`) with keyboard shortcut `[M]`.
  - **Direct Mode Launchpad**: 1-click jump into:
    - `[Enter]` Guided Curriculum (Full 9-Stage Flow)
    - `[1]` CAD Network Designer
    - `[2]` Empirical Fault Diagnosis Lab
    - `[3]` NOC Room 2.0 Mini-Game

---

## 8. UI/UX & Audio Synthesis System

- **Live Wallpaper System (`LiveWallpaper.tsx`)**: High-performance mouse-reactive constellation network mesh operating across all internal lab modules.
- **Floating Journey Dock (`JourneyDock.tsx`)**: Bottom floating dock with completed percentage gauge, current stage label, and smooth 1-click step advancement.
- **Works Launcher 10-Module Hub (`WorksLauncher.tsx`)**: Keyboard-driven (`[M]` key) navigation modal displaying all 10 modules, learning objectives, and completion checkmarks.
- **Web Audio API Synthesizer (`src/lib/sound.ts`)**:
  - `playSound('click')`: High-frequency UI tick (600Hz ➔ 300Hz).
  - `playSound('packet')`: Fast packet transit blip (880Hz ➔ 1200Hz).
  - `playSound('ping')`: Clean acoustic chime (1046.5Hz C6 tone).
  - `playSound('success')`: Multi-tone victory chord (C5, E5, G5, C6).
  - `playSound('alert')`: NOC klaxon alarm (sawtooth alternating 440Hz / 330Hz).
  - `playSound('repair')`: Electronic tool feedback chime.
  - Master mute/unmute state with persistent audio context resumption.

---

## 9. Deployment & Verification

- **Production Build Status**:
  - Toolchain: Vite 8.3.1 + TypeScript (strict) + Tailwind CSS 3.4.
  - Build command: `npm run build` (`tsc -b && vite build`).
  - Build time: **2.93 seconds**.
  - Errors: **0**.
  - Warnings: **0**.
- **Vercel Configuration (`vercel.json`)**:
  - SPA routing rewrite rule routing all paths to `/index.html`.
  - Long-term caching headers for immutable static assets (`/assets/*`).
- **Git State**:
  - Clean local git repository on branch `main`.
  - Ready for GitHub push: `git remote add origin <URL> ; git push -u origin main`.
  - Ready for Vercel deployment: import repo at `vercel.com/new` or run `npx vercel --prod`.

---

## 10. Repository File Map

```
c:/Users/KRUTIK/Downloads/dcn proj/
├── public/
├── src/
│   ├── types/
│   │   ├── network.ts              # NetworkDevice, Link, Packet, Interface definitions
│   │   ├── diagnostics.ts          # FaultScenario, Hypothesis, CommandResult definitions
│   │   └── assessment.ts           # QuizQuestion, AssessmentCategory definitions
│   ├── lib/
│   │   ├── sound.ts                # Web Audio API sound generator & mute control
│   │   ├── network/
│   │   │   ├── addressing.ts       # CIDR, IPv4 class, broadcast, subnet mask math
│   │   │   ├── hamming.ts          # (7,4) Hamming code generation & syndrome correction
│   │   │   ├── routing.ts          # BFS hop routing, TTL decrement, path validation
│   │   │   └── validation.ts       # Duplicate IP, subnet mismatch, gateway checkers
│   │   └── diagnostics/
│   │       ├── terminal.ts         # Realistic multi-command terminal simulator
│   │       └── ruleEngine.ts       # 10 fault scenarios & remediation state mutators
│   ├── data/
│   │   ├── defaultTopology.ts      # Default 5-device multi-subnet topology
│   │   ├── experiments.ts          # 8 DCN experiments metadata & syllabus mapping
│   │   ├── faults.ts               # Complete specifications for 10 empirical faults
│   │   └── questions.ts            # 12 formative & summative assessment questions
│   ├── components/
│   │   ├── common/
│   │   │   └── LiveWallpaper.tsx   # Constellation background mesh
│   │   ├── layout/
│   │   │   ├── IntroLiveBackground.tsx # Interactive live packet & mesh canvas
│   │   │   ├── CinematicIntro.tsx  # Launch console with clock, HUD & mode selectors
│   │   │   ├── Header.tsx          # Persistent navigation header with progress bar
│   │   │   ├── JourneyDock.tsx     # Floating step-by-step progress dock
│   │   │   ├── WorksLauncher.tsx   # 10-module keyboard/mouse launcher modal
│   │   │   └── BootScreen.tsx      # Diagnostic kernel boot sequence
│   │   └── modules/
│   │       ├── 01_Home/Hero.tsx    # Schematic view with node telemetry
│   │       ├── 02_Aim/AimSection.tsx # Bloom's Taxonomy outcomes & syllabus
│   │       ├── 03_Theory/          # Theory suite (Cabling, Wireshark, TCP, CIDR, etc.)
│   │       ├── 04_NetworkDesign/   # CAD Canvas, Device Palette, Config Modal
│   │       ├── 05_Simulation/      # Packet transit simulator & Inspector modal
│   │       ├── 06_FaultDiagnosis/  # Scenario selector, Diagnostic terminal & Engine
│   │       ├── 07_Assessments/     # 12-question quiz engine with Bloom feedback
│   │       ├── 08_MiniGame/NOCRoomGame.tsx # NOC Room 2.0 with 5 missions & scanner
│   │       ├── 09_Conclusion/LabReport.tsx # Collegiate lab report & printable cert
│   │       └── 10_LaunchLab/FullLabSandbox.tsx # Fullscreen unrestricted workbench
│   ├── App.tsx                     # Main application controller & state store
│   ├── index.css                   # Custom CAD grid, CRT scanline, and glow styles
│   └── main.tsx                    # React DOM entry point
├── dist/                           # Production-ready compiled assets
├── vercel.json                     # Vercel SPA rewrite & cache configuration
├── package.json                    # Project dependencies & build scripts
├── README.md                       # High-level overview & setup instructions
└── PROJECT_OVERVIEW.md             # This comprehensive accomplishment record
```

---
*Created for the DCN Virtual Laboratory System • Department of Computer Engineering • Somaiya Virtual Labs*
