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
MINI-GAME ("NETWORK OPS: FAULT HUNT" - 2D Virtual NOC room with WASD / Touch navigation)
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

## 🎮 "Network Ops: Fault Hunt" Mini-Game

- **Engine:** 2D interactive canvas simulation with 60 FPS motion loop.
- **Controls:** `W`, `A`, `S`, `D` or Arrow keys (plus virtual on-screen joystick for mobile/touch screens).
- **Environment:** Network Operations Center (NOC) floor featuring Workstation PC, Distribution Switch, Core Router, Enterprise Server Rack, Diagnostic Terminal Console, and Wall-mounted NOC Status Display.
- **Gameplay:** Respond to network downtime alerts, navigate to hardware stations, inspect diagnostics with `[E]`, apply the physical or software fix, and initiate a network sweep to verify recovery.

---

## 💻 Technical Architecture & Stack

- **Framework:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS with custom academic dark theme (`#070a12`, emerald accents, cyan router paths, amber alerts)
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
