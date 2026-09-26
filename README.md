# INTELLIGENT NETWORK DESIGN, SIMULATION & FAULT DIAGNOSIS SYSTEM
### SOMAIYA VIRTUAL LABS — DATA COMMUNICATION & NETWORKING (DCN) LABORATORY

An academic-grade, production-quality Data Communication and Networking virtual laboratory developed for computer engineering students. The platform synthesizes Experiments 1 through 7 into a comprehensive interactive network design, packet simulation, fault injection, and deductive troubleshooting system (Experiment 8 Capstone).

---

## 🏛️ Academic Course Alignment & Syllabus Mapping

The system integrates all fundamental DCN laboratory practicals into an intuitive, interactive environment:

| Experiment Code | Title | Core Concepts & Interactive Modules |
| :--- | :--- | :--- |
| **EXP-01** | **Networking Commands** | Interactive diagnostic CLI runner (`ping`, `ipconfig /all`, `tracert`, `arp -a`, `nslookup`, `netstat -an`). Real simulated output tied to live topology state. |
| **EXP-02** | **LAN Cable Fabrication** | Interactive ANSI/TIA-568-A vs T568-B RJ-45 connector pinout visualizer, straight-through vs crossover wiring logic, and cable continuity tester. |
| **EXP-03** | **Wireshark / Packet Analysis** | Deep packet dissector modal inspecting Layer 2 (Ethernet II MAC/EtherType), Layer 3 (IPv4/TTL/Total Length), Layer 4 (TCP/UDP), and application payload stream. |
| **EXP-04** | **TCP Header Architecture** | Interactive RFC 793 20-byte TCP header dissector with bitfield control flags (`SYN`, `ACK`, `FIN`, `RST`, `PSH`, `URG`) and 3-Way Handshake step visualizer. |
| **EXP-05** | **IP Address Classes & Subnetting** | Interactive IPv4 class identifier (Class A, B, C, D, E), CIDR calculator, and live binary bitwise ANDing demonstrator. |
| **EXP-06** | **Hamming Code Error Correction** | Linear block (7,4) Hamming code simulator with 4-bit data input, parity bit matrix (`P1`, `P2`, `P4`), noise injection single-bit error flipper, and 3-bit syndrome (`S4, S2, S1`) auto-correction. |
| **EXP-07** | **UDP Communication** | 8-byte minimal UDP header analysis, connectionless datagram behavior, and comprehensive TCP vs UDP comparative matrix. |
| **EXP-08** | **Network Design, Simulation & Fault Diagnosis** | **Central Capstone Module:** Visual topology designer, discrete event packet simulation, 10 realistic multi-layer faults, rule-based root cause engine, and verification. |

---

## 🧭 Laboratory Execution Flow & Modules

The platform implements the complete 10-module academic learning loop:

```text
INTRO / BOOT SEQUENCE (1.5s Somaiya Virtual Labs cinematic boot)
      ↓
HOMEPAGE / HERO (System orientation, live mini-topology monitor)
      ↓
AIM & OBJECTIVES (Formal academic syllabus statement, 9 measurable Course Outcomes)
      ↓
THEORY (Interactive widgets for Experiments 01 through 07)
      ↓
NETWORK DESIGN (Drag & drop PC, Laptop, Switch, Router, Server; configure IP/Mask/GW/DNS; validate rules)
      ↓
SIMULATION (Real packet animation along SVG path; ICMP Ping, TCP Handshake, UDP stream; Wireshark inspector)
      ↓
FAULT DIAGNOSIS (Symptom → Hypothesis → Test → Evidence → Root Cause → Corrective Action → Verification)
      ↓
ASSESSMENTS (Phase I Fundamentals & Phase II Real-World Troubleshooting Scenarios)
      ↓
MINI-GAME ("ROGUE PACKET" - explore a network operations centre, trace the rogue packet, diagnose the faulty device)
      ↓
CONCLUSION & REPORT (Completion certificate, competencies checklist, JSON export, printable report)
      ↓
LAUNCH LAB (Full-screen unrestricted interactive workbench)
```

---

## 🛠️ The 10 Realistic Fault Scenarios

The intelligent diagnostic engine models deterministic, realistic networking faults across the OSI and TCP/IP protocol stack:

1. **Fault 01 — Incorrect Host IP Address Allocation** (Host configured with `10.0.0.99` in a `192.168.1.0/24` subnet)
2. **Fault 02 — Incompatible Subnet Mask Boundary** (`255.255.0.0` (/16) mask causing host to treat remote destinations as local link broadcast partners)
3. **Fault 03 — Invalid / Mismatched Default Gateway** (Host pointing to non-existent gateway `192.168.1.254` instead of `192.168.1.1`)
4. **Fault 04 — Physical Link Failure / Unplugged Cable** (Disconnected patch cable between Switch SW1 and Router R1)
5. **Fault 05 — Router Interface Administratively Shutdown** (Router R1 G0/0 interface is shutdown; ARP fails with incomplete entry)
6. **Fault 06 — Duplicate IPv4 Address Conflict** (Two devices assigned `192.168.1.10`, causing switch CAM table thrashing)
7. **Fault 07 — DNS Server Resolution Failure** (Unresolvable DNS server IP causing `nslookup` timeout)
8. **Fault 08 — Missing Routing Table Entry** (Core router lacking route for remote subnet, returning ICMP Network Unreachable)
9. **Fault 09 — Heavy Packet Loss / Degraded Cable** (75% packet loss and latency spikes caused by physical link attenuation)
10. **Fault 10 — Transport Port Blocked / Service Down** (Destination TCP Port 80 connection refused with RST-ACK flag response)

---

## 🎮 "Rogue Packet" Mini-Game

- **Premise:** a 2D top-down network operations centre. Walk seven rooms (Computer Lab, Switch Room, Router Room, Server Room, Packet Analysis Lab, Monitoring Room, Network Control Room), inspect real devices and find the component breaking the network.
- **Real simulation:** every clue comes from a network model with ARP per segment, default gateways, longest-prefix routing, TTL, link/port state and loss (`rogue-packet/network.ts`).
- **11 randomized faults:** disconnected cable, shut-down switch port, wrong IP, wrong mask, server on the wrong subnet, duplicate IP, router interface down, bad static route, routing loop, duplex-mismatch loss, server offline. Several share symptoms on purpose (cable vs. disabled port; server offline vs. wrong subnet).
- **Tools:** walk up and press `E` to inspect PCs, switches (`show interfaces status`, MAC table), the router (`show ip route`, `show arp`), the server, cables, MONITOR-01 and the packet analyzer. `P` opens ping / traceroute from any host; the analyzer unlocks **Packet Trace**, which follows the rogue packet hop by hop with the camera.
- **Live packets** travel the floor cables; the rogue packet loops, vanishes or goes to the wrong host depending on the fault. Random events (packet storm, blackout, switch reload, link flap…) add noise.
- **Five levels:** Cable Chaos → IP Crisis → Switch Failure → Routing Nightmare → Network Blackout (two faults). Wrong diagnoses explain why and let you keep investigating; each level ends with accuracy, packets investigated, time, stability and a short "you learned".
- **Controls:** WASD/arrows, E, P, Tab (topology map), G (diagnose), Esc; on-screen joystick + interact button on touch devices. Forwarding Plane remains available in the hub as a quick drill.

---

## 💻 Technical Architecture & Stack

- **Framework:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS + shadcn/ui theme tokens (`components.json`, `@/` alias, HSL CSS variables in `src/index.css`)
- **Typography:** IBM Plex Sans (UI), IBM Plex Sans Condensed (display), IBM Plex Mono (data/CLI)
- **Opening sequence:** Three.js + @react-three/fiber Warp Tunnel (`src/components/ui/warp-tunnel.tsx`), lazy-loaded so returning visitors never download it; plays once per tab session
- **Motion system:** one packet/node language across the site — warp streaks converge into a network node, "Enter lab" links a PC→Switch→Router→Server path, section changes send a packet along a route pill, the journey dock is a network path (● visited · ◉ current · ○ not yet), diagrams build hop by hop on scroll, and success/failure show a packet arriving or dropping (no confetti). Built on `motion`; honours `prefers-reduced-motion`.
- **Background:** a topographic contour "signal field" (WebGL2 shader) with a sparse live network over it — 30 fps cap, half-resolution, paused when hidden, lighter on mobile.
- **Icons:** Lucide React
- **Sound:** Web Audio API procedural synthesizer (zero external audio file dependencies; mute toggle supported)
- **Effects:** Canvas-Confetti on assessment completion & network verification
- **Accessibility:** Keyboard shortcuts (`M` for Works Hub, `F` for Fullscreen Lab, `Esc` to close, `0-9` direct jump, `prefers-reduced-motion` compliance)

---

## 🚀 Running the Project Locally

### 1. Prerequisites
- **Node.js** (v18 or higher recommended, tested on Node v24)
- **NPM** (v9 or higher)

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone <YOUR_GITHUB_REPO_URL>
cd "dcn proj"
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173/`.

### 4. Build for Production
```bash
npm run build
```
Generates an optimized static production bundle in `dist/`.

---

## 📜 Academic Integrity Note

This project is built strictly following standard data communication principles and RFC standards (RFC 791, RFC 792, RFC 793, RFC 768, IEEE 802.3, ANSI/TIA-568). No fake or randomized ping outputs are used; all connectivity, ARP lookups, and traceroute hops are computed from the simulated network graph.
