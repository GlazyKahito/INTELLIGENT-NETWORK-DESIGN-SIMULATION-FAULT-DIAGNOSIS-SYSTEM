import React, { Suspense, lazy, useState, useEffect } from 'react';
import { NetworkDevice, NetworkLink } from './types/network';
import { INITIAL_DEVICES, INITIAL_LINKS } from './data/defaultTopology';
import { LiveWallpaper } from './components/common/LiveWallpaper';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { Header } from './components/layout/Header';
import { WorksLauncher } from './components/layout/WorksLauncher';
import { JourneyDock } from './components/layout/JourneyDock';
import { Hero } from './components/modules/01_Home/Hero';
import { AimSection } from './components/modules/02_Aim/AimSection';
import { TheoryHub } from './components/modules/03_Theory/TheoryHub';
import { DesignerCanvas } from './components/modules/04_NetworkDesign/DesignerCanvas';
import { SimulationView } from './components/modules/05_Simulation/SimulationView';
import { DiagnosisHub } from './components/modules/06_FaultDiagnosis/DiagnosisHub';
import { AssessmentHub } from './components/modules/07_Assessments/AssessmentHub';
import { ForwardingPlaneGame } from './components/modules/08_MiniGame/ForwardingPlaneGame';
import { LabReport } from './components/modules/09_Conclusion/LabReport';
import { FullLabSandbox } from './components/modules/10_LaunchLab/FullLabSandbox';
import { playSound } from './lib/sound';
import { hasSeenIntro } from './lib/intro-session';

// Three.js only ships with the opening sequence, so returning visitors never download it.
const OpeningSequence = lazy(() => import('./components/layout/OpeningSequence').then(m => ({ default: m.OpeningSequence })));

export function App() {
  // The opening sequence plays once per tab session; reloads go straight to the lab.
  const [bootDone, setBootDone] = useState(hasSeenIntro);
  const [activeModule, setActiveModule] = useState<string>('home');
  const [isWorksOpen, setIsWorksOpen] = useState(false);
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  const [theoryInitialTab, setTheoryInitialTab] = useState('fundamentals');

  // Shared Centralized Topology State
  const [devices, setDevices] = useState<NetworkDevice[]>(INITIAL_DEVICES);
  const [links, setLinks] = useState<NetworkLink[]>(INITIAL_LINKS);

  // Track completed lab modules
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set(['home']));

  // Mark module visited / completed
  const handleNavigateModule = (modId: string) => {
    setActiveModule(modId);
    setCompletedModules(prev => new Set([...prev, modId]));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Keyboard shortcut: Press 'M' to open Works Hub, 'F' for Fullscreen Lab
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      if (!bootDoneRef.current || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        playSound('click');
        setIsWorksOpen(prev => !prev);
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        playSound('click');
        setIsSandboxOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  const bootDoneRef = React.useRef(bootDone);
  bootDoneRef.current = bootDone;

  const progressPercent = Math.min(100, Math.round((completedModules.size / 9) * 100));

  return (
    <MotionConfig reducedMotion="user">
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300 relative overflow-x-hidden">
      {/* 1. Subtle Constellation Live Wallpaper (Background) */}
      <LiveWallpaper />

      {/* 2. Opening sequence: warp tunnel → product intro → lab */}
      {!bootDone && (
        <Suspense fallback={<div className="fixed inset-0 z-[60] bg-background" aria-hidden />}>
        <OpeningSequence
          onEnter={(targetModule?: string) => {
            if (targetModule && targetModule !== 'home') {
              handleNavigateModule(targetModule);
            }
            setBootDone(true);
          }}
        />
        </Suspense>
      )}

      <div inert={!bootDone} className="contents">

      {/* 3. Persistent Navigation Header */}
      <Header
        activeModule={activeModule}
        setActiveModule={handleNavigateModule}
        openWorksModal={() => setIsWorksOpen(true)}
        onOpenSandbox={() => setIsSandboxOpen(true)}
        progressPercent={progressPercent}
      />

      {/* 4. Works Launcher 10-Module Hub (Keyboard/Mouse modal) */}
      <WorksLauncher
        isOpen={isWorksOpen}
        onClose={() => setIsWorksOpen(false)}
        onSelectModule={handleNavigateModule}
        activeModule={activeModule}
        completedModules={completedModules}
      />

      {/* 5. Full Unrestricted Lab Sandbox Overlay */}
      {isSandboxOpen && (
        <FullLabSandbox
          devices={devices}
          setDevices={setDevices}
          links={links}
          setLinks={setLinks}
          onClose={() => setIsSandboxOpen(false)}
        />
      )}

      {/* 6. Main Content Modules */}
      <main className="flex-1 relative z-10">
        <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeModule}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
        {/* Module 00: Home / Hero */}
        {activeModule === 'home' && (
          <>
            <Hero
              onExploreLab={() => handleNavigateModule('aim')}
              onLaunchSimulator={() => handleNavigateModule('simulation')}
              onOpenDiagnostics={() => handleNavigateModule('diagnostics')}
            />

            {/* Quick syllabus progression cards */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
              <div className="p-6 rounded-3xl bg-[#0d1322]/90 backdrop-blur-md border border-slate-800 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                    Virtual Laboratory Curriculum Roadmap
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Step-by-Step Educational Progression
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div
                    onClick={() => handleNavigateModule('aim')}
                    className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900 transition-all cursor-pointer group shadow-sm"
                  >
                    <div className="text-[10px] font-mono text-emerald-400 font-bold mb-1">01 AIM</div>
                    <div className="text-sm font-bold text-slate-200 group-hover:text-emerald-300">Aim & Objectives</div>
                    <p className="text-xs text-slate-400 mt-1">Formal curricular statements & Bloom’s taxonomy outcomes.</p>
                  </div>

                  <div
                    onClick={() => handleNavigateModule('theory')}
                    className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900 transition-all cursor-pointer group shadow-sm"
                  >
                    <div className="text-[10px] font-mono text-emerald-400 font-bold mb-1">02 THEORY</div>
                    <div className="text-sm font-bold text-slate-200 group-hover:text-emerald-300">Experiments 1 to 7</div>
                    <p className="text-xs text-slate-400 mt-1">Commands, Cabling, TCP/UDP, Subnetting, Hamming Code.</p>
                  </div>

                  <div
                    onClick={() => handleNavigateModule('design')}
                    className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900 transition-all cursor-pointer group shadow-sm"
                  >
                    <div className="text-[10px] font-mono text-emerald-400 font-bold mb-1">03 DESIGN</div>
                    <div className="text-sm font-bold text-slate-200 group-hover:text-emerald-300">Network Designer</div>
                    <p className="text-xs text-slate-400 mt-1">Canvas, node placement, IP configuration, validation.</p>
                  </div>

                  <div
                    onClick={() => handleNavigateModule('diagnostics')}
                    className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900 transition-all cursor-pointer group shadow-sm"
                  >
                    <div className="text-[10px] font-mono text-emerald-400 font-bold mb-1">04 DIAGNOSIS</div>
                    <div className="text-sm font-bold text-slate-200 group-hover:text-emerald-300">Intelligent Troubleshooting</div>
                    <p className="text-xs text-slate-400 mt-1">CLI tests, empirical evidence, root cause analysis, repair.</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Module 01: Aim */}
        {activeModule === 'aim' && (
          <AimSection
            onProceedToTheory={() => handleNavigateModule('theory')}
            onJumpToExperiment={expId => {
              const tabMap: Record<number, string> = {
                1: 'commands',
                2: 'cabling',
                3: 'wireshark',
                4: 'tcp',
                5: 'addressing',
                6: 'hamming',
                7: 'udp',
              };
              setTheoryInitialTab(tabMap[expId] || 'fundamentals');
              handleNavigateModule('theory');
            }}
          />
        )}

        {/* Module 02: Theory */}
        {activeModule === 'theory' && (
          <TheoryHub
            initialTab={theoryInitialTab}
            onProceedToDesign={() => handleNavigateModule('design')}
            onTestInTerminal={cmd => {
              handleNavigateModule('diagnostics');
            }}
          />
        )}

        {/* Module 03: Network Design */}
        {activeModule === 'design' && (
          <DesignerCanvas
            devices={devices}
            setDevices={setDevices}
            links={links}
            setLinks={setLinks}
            onProceedToSimulation={() => handleNavigateModule('simulation')}
          />
        )}

        {/* Module 04: Simulation */}
        {activeModule === 'simulation' && (
          <SimulationView
            devices={devices}
            links={links}
            onOpenDiagnostics={() => handleNavigateModule('diagnostics')}
          />
        )}

        {/* Module 05: Diagnostics */}
        {activeModule === 'diagnostics' && (
          <DiagnosisHub
            devices={devices}
            setDevices={setDevices}
            links={links}
            setLinks={setLinks}
            onProceedToAssessments={() => handleNavigateModule('assessments')}
          />
        )}

        {/* Module 06: Assessments */}
        {activeModule === 'assessments' && (
          <AssessmentHub
            onProceedToMiniGame={() => handleNavigateModule('minigame')}
            onReviewTheory={cat => {
              handleNavigateModule('theory');
            }}
          />
        )}

        {/* Module 07: Mini-Game */}
        {activeModule === 'minigame' && (
          <ForwardingPlaneGame
            onProceedToConclusion={() => handleNavigateModule('conclusion')}
          />
        )}

        {/* Module 08: Conclusion & Report */}
        {activeModule === 'conclusion' && (
          <LabReport
            onLaunchFullLab={() => setIsSandboxOpen(true)}
            onReturnToHome={() => handleNavigateModule('home')}
          />
        )}
        </motion.div>
        </AnimatePresence>
      </main>

      {/* 7. Floating Journey Stepper Dock (Across Learning Modules) */}
      {activeModule !== 'home' && (
        <JourneyDock
          activeModule={activeModule}
          onNavigate={handleNavigateModule}
          completedModules={completedModules}
        />
      )}

      {/* 8. Academic Institutional Footer */}
      <footer className="border-t border-slate-800/80 bg-[#06090e] py-8 text-xs text-slate-500 font-mono relative z-10 pb-20 sm:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-400 font-semibold">
              SOMAIYA VIRTUAL LABS // DCN LABORATORY
            </span>
            <span>—</span>
            <span>Intelligent Network Design, Simulation & Fault Diagnosis System</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
            <button
              type="button"
              onClick={() => {
                playSound('click');
                setBootDone(false);
              }}
              className="text-slate-400 hover:text-emerald-300 underline-offset-4 hover:underline transition-colors"
            >
              Replay intro
            </button>
            <span>Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 border border-slate-700">M</kbd> for Modules Hub</span>
            <span>Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 border border-slate-700">F</kbd> for Fullscreen Lab</span>
          </div>
        </div>
      </footer>
      </div>
    </div>
    </MotionConfig>
  );
}

export default App;
