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
6. [Forwarding Plane Mini-Game](#6-forwarding-plane-mini-game)
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
│ PDF / Cert   │     │ GAME (LPM)   │     │ Ping Sweep Audit  │     │ Hypothesis & CLI    │
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
| **08_MiniGame** | **Forwarding Plane** | Be router R1's forwarding engine: apply ACL → TTL → longest-prefix match to a live ingress queue across four timed shifts, with binary-lens hints, per-decision explanations and star ratings. |
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

## 6. Forwarding Plane Mini-Game

Located in `src/components/modules/08_MiniGame/ForwardingPlaneGame.tsx`, driven by the pure engine in `src/lib/network/forwarding.ts`:
- **Premise**: the student *is* router R1's forwarding engine. Packets queue at ingress; each must leave by `Gi0/0`, `Gi0/1`, `Se0/0/0`, or be dropped — before its head-of-queue timer expires.
- **Decision model (`decide()`)**: inbound ACL (first matching line) → TTL (≤1 ⇒ drop, ICMP Time Exceeded) → longest-prefix match (no match & no default ⇒ drop; Null0 ⇒ blackhole). Every verdict carries a human-readable reason.
- **Four shifts**:
  - *Connected networks* — two /24 LANs + default route.
  - *Longest prefix wins* — overlapping /8, /16, /24 and a /12; no default route.
  - *Filters & hop limits* — ACL 110 (telnet, spoofed 10.66/16) and TTL-1 packets.
  - *Peak hour* — /16 with a /18 and a /24 carve-out, Null0 route, SNMP filter, faster arrivals.
- **Pressure & scoring**: arrival rate, head timeout and queue capacity per shift; tail-drop on overflow; link health drains on wrong ports, timeouts and overflow. Points reward speed and streaks (up to ×2).
- **Teaching aids**: Binary Lens hint (`H`, −50) shows the destination and matched prefix bit-by-bit; the routing-table row / ACL line that decided each packet is highlighted; each shift ends with accuracy, average decision time, best streak, 1–3 stars and a mistake review.
- **Controls**: `1`–`4` / `D`, `H`, `Space`; full touch support via port buttons. Best run stored per browser (`localStorage`).

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
- **Page transitions**: modules cross-fade via `motion` `AnimatePresence`.
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
│   │       ├── 08_MiniGame/ForwardingPlaneGame.tsx # Router forwarding-plane game
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
