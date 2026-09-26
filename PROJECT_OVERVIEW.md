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
6. [Rogue Packet Mini-Game](#6-rogue-packet-mini-game)
7. [Opening Sequence: Warp Tunnel & Product Intro](#7-opening-sequence-warp-tunnel--product-intro)
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
│ 8. REPORT    │ <── │ 7. ROUTER    │ <── │ 6. VERIFY         │ <── │ 5. DIAGNOSE & FIX   │
│ PDF / Cert   │     │ ROGUE PACKET │     │ Ping Sweep Audit  │     │ Hypothesis & CLI    │
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
| **08_MiniGame** | **Rogue Packet** (+ Forwarding Plane drill) | 2D top-down NOC exploration game: inspect devices, ping/traceroute, trace the rogue packet and diagnose one of 11 randomized faults across five levels. |
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

## 6. Rogue Packet Mini-Game

Located in `src/components/modules/08_MiniGame/` — `MinigameHub.tsx` (landing, "enter the network" node-expansion transition, Forwarding Plane drill) and `rogue-packet/` (`network.ts` model & faults, `map.ts` facility, `engine.ts` canvas loop, `panels.tsx`, `RoguePacketGame.tsx`).

- **Premise:** a 2D top-down network operations centre. Walk seven rooms (Computer Lab, Switch Room, Router Room, Server Room, Packet Analysis Lab, Monitoring Room, Network Control Room), inspect real devices and find the component breaking the network.
- **Real simulation:** every clue comes from a network model with ARP per segment, default gateways, longest-prefix routing, TTL, link/port state and loss (`rogue-packet/network.ts`).
- **11 randomized faults:** disconnected cable, shut-down switch port, wrong IP, wrong mask, server on the wrong subnet, duplicate IP, router interface down, bad static route, routing loop, duplex-mismatch loss, server offline. Several share symptoms on purpose (cable vs. disabled port; server offline vs. wrong subnet).
- **Tools:** walk up and press `E` to inspect PCs, switches (`show interfaces status`, MAC table), the router (`show ip route`, `show arp`), the server, cables, MONITOR-01 and the packet analyzer. `P` opens ping / traceroute from any host; the analyzer unlocks **Packet Trace**, which follows the rogue packet hop by hop with the camera.
- **Live packets** travel the floor cables; the rogue packet loops, vanishes or goes to the wrong host depending on the fault. Random events (packet storm, blackout, switch reload, link flap…) add noise.
- **Five levels:** Cable Chaos → IP Crisis → Switch Failure → Routing Nightmare → Network Blackout (two faults). Wrong diagnoses explain why and let you keep investigating; each level ends with accuracy, packets investigated, time, stability and a short "you learned".
- **Controls:** WASD/arrows, E, P, Tab (topology map), G (diagnose), Esc; on-screen joystick + interact button on touch devices. Forwarding Plane remains available in the hub as a quick drill.
- **Engineering:** one requestAnimationFrame loop; static geometry pre-rendered to an offscreen canvas; React only hears about changes (nearest object, room, trace hops). The game chunk is lazy-loaded (~92 kB) and portalled above the site chrome.

---

## 7. Opening Sequence: Warp Tunnel & Product Intro

Located in `src/components/layout/OpeningSequence.tsx` and `src/components/ui/warp-tunnel.tsx`:
- **Phase 1 — Warp Tunnel (~3.5 s)**: an instanced Three.js / R3F streak field (≈420 streaks on desktop, 150 on mobile) accelerates through a data conduit while the wordmark resolves and an OSI readout descends L1 → L7. The timeline starts on the tunnel's first rendered frame, so slow GPUs never miss the entrance.
- **Skippable**: "Skip intro →" button, `Esc` or `Enter`.
- **Phase 2 — Product intro**: title, the five-verb workflow (Design → Inject → Trace → Diagnose → Verify), `Enter lab` CTA, quick jumps (`1` designer, `2` fault diagnosis, `3` game) and the 8-step journey rail; the tunnel keeps cruising, dimmed, behind a readability vignette.
- **Once per session**: `sessionStorage` (`src/lib/intro-session.ts`) — reloads and module navigation go straight to the lab; "Replay intro" lives in the footer.
- **Performance & accessibility**: lazy-loaded chunk (three.js never ships to returning visitors), device-aware DPR and streak count, render loop paused while the tab is hidden, R3F disposes the scene and WebGL context on unmount, WebGL-less fallback, reduced motion ⇒ static tunnel and straight to the intro, app behind the overlay is `inert`.
- **Theme**: `useShadcnTheme()` reads the shadcn CSS variables (`--primary`, `--accent`, `--background`) and re-reads them on theme change; the light theme renders with normal blending.

---

## 8. UI/UX & Audio Synthesis System

- **Typography**: IBM Plex Sans / Plex Sans Condensed / Plex Mono — an engineering typeface family replacing Inter / Space Grotesk / Fira Code.
- **Live Wallpaper (`LiveWallpaper.tsx`)**: a light "tunnel echo" of the opening — ~70 faint streaks drifting from a vanishing point over a masked grid; 2D canvas capped at 30 fps, paused when hidden, static under reduced motion.
- **Motion system** (`src/components/motion/`): `PacketPath` (nodes activate, links draw, a packet arrives or drops), `RouteTransition` (section-to-section hop; Simulation → Diagnosis breaks the link), `TopologyWalkthrough` (scroll-built PC→Switch→Router→Server lesson in Theory), `NetStatus` (network-themed success/error toasts replacing confetti), `LinkLoader` (○──○──○ loader). Journey dock rebuilt as a network path. Timing tokens: micro 100–250 ms, cards 300 ms, panels 250–450 ms, transitions 500–900 ms, cinematic 800–1400 ms.
- **Opening upgrade**: the warp shows a decoding title, a SYN → SYN-ACK → ACK handshake, a live packet counter and the OSI descent; streaks then converge into a node that bursts into the intro.
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
  - Toolchain: Vite 8.3.1 + TypeScript + Tailwind CSS 3.4 + shadcn/ui config; three 0.186, @react-three/fiber 9, motion 13.
  - Build command: `npm run build` (`tsc -b && vite build`).
  - Errors: **0**.
  - Bundles: main ≈686 kB (≈199 kB gzip); opening-sequence chunk incl. three.js ≈929 kB (≈247 kB gzip), loaded only when the intro plays.
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
│   ├── hooks/
│   │   └── use-prefers-reduced-motion.ts # Live reduced-motion media query
│   ├── lib/
│   │   ├── utils.ts                # shadcn cn() helper
│   │   ├── intro-session.ts        # Once-per-session intro flag
│   │   ├── sound.ts                # Web Audio API sound generator & mute control
│   │   ├── network/
│   │   │   ├── addressing.ts       # CIDR, IPv4 class, broadcast, subnet mask math
│   │   │   ├── hamming.ts          # (7,4) Hamming code generation & syndrome correction
│   │   │   ├── routing.ts          # BFS hop routing, TTL decrement, path validation
│   │   │   ├── forwarding.ts       # ACL → TTL → LPM decision engine & game shifts
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
│   │   ├── ui/
│   │   │   ├── warp-tunnel.tsx     # R3F instanced warp tunnel (shadcn-themed)
│   │   │   └── warp-tunnel-utils/  # scene-container.tsx, use-shadcn-theme.ts
│   │   ├── common/
│   │   │   └── LiveWallpaper.tsx   # Lightweight tunnel-echo background
│   │   ├── layout/
│   │   │   ├── OpeningSequence.tsx # Warp tunnel → product intro → lab
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
│   │       ├── 08_MiniGame/        # MinigameHub, rogue-packet/ (Rogue Packet), ForwardingPlaneGame drill
│   │       ├── 09_Conclusion/LabReport.tsx # Collegiate lab report & printable cert
│   │       └── 10_LaunchLab/FullLabSandbox.tsx # Fullscreen unrestricted workbench
│   ├── App.tsx                     # Main application controller & state store
│   ├── index.css                   # Custom CAD grid, CRT scanline, and glow styles
│   └── main.tsx                    # React DOM entry point
├── dist/                           # Production-ready compiled assets
├── components.json                 # shadcn/ui configuration
├── vercel.json                     # Vercel SPA rewrite & cache configuration
├── package.json                    # Project dependencies & build scripts
├── README.md                       # High-level overview & setup instructions
└── PROJECT_OVERVIEW.md             # This comprehensive accomplishment record
```

---
*Created for the DCN Virtual Laboratory System • Department of Computer Engineering • Somaiya Virtual Labs*
