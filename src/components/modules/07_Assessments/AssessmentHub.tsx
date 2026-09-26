import React, { useState } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  RotateCcw, 
  Award, 
  BookOpen,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { notifyNet } from '@/components/motion/NetStatus';
import { ASSESSMENT_QUESTIONS } from '../../../data/questions';
import { AssessmentQuestion } from '../../../types/assessment';
import { playSound } from '../../../lib/sound';

interface AssessmentHubProps {
  onProceedToMiniGame: () => void;
  onReviewTheory: (category: string) => void;
}

export const AssessmentHub: React.FC<AssessmentHubProps> = ({
  onProceedToMiniGame,
  onReviewTheory,
}) => {
  const [selectedPhase, setSelectedPhase] = useState<'all' | 'phase1' | 'phase2'>('all');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  // One question on screen at a time keeps the page to a single screen.
  const [current, setCurrent] = useState(0);

  const filteredQuestions = ASSESSMENT_QUESTIONS.filter(q => {
    if (selectedPhase === 'phase1') return q.phase.includes('Phase 1');
    if (selectedPhase === 'phase2') return q.phase.includes('Phase 2');
    return true;
  });

  const handleSelectOption = (questionId: string, optionId: string) => {
    if (submitted) return;
    playSound('click');
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const calculateScore = () => {
    let correctCount = 0;
    filteredQuestions.forEach(q => {
      if (answers[q.id] === q.correctOptionId) {
        correctCount++;
      }
    });
    return correctCount;
  };

  const handleSubmit = () => {
    playSound('success');
    setSubmitted(true);
    const score = calculateScore();
    const percent = Math.round((score / filteredQuestions.length) * 100);

    notifyNet(
      percent >= 70
        ? { ok: true, title: 'Assessment passed', detail: `Scored ${percent}% — route to the mini game is open.` }
        : { ok: false, title: 'Below threshold', detail: `Scored ${percent}% — review the flagged topics and retry.` },
    );
  };

  const handleReset = () => {
    playSound('repair');
    setAnswers({});
    setSubmitted(false);
  };

  const score = calculateScore();
  const total = filteredQuestions.length;
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;

  // Track concepts needing review
  const mistakes = filteredQuestions.filter(q => submitted && answers[q.id] !== q.correctOptionId);

  return (
    <section className="py-10 bg-[#0c0b09]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest mb-1.5">
              <span>Assessment Engine // Academic Evaluation</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-100 font-display">
              Laboratory Knowledge & Diagnostic Examination
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Phase 1 evaluates DCN theoretical foundations. Phase 2 tests scenario-based network troubleshooting acumen.
            </p>
          </div>

          <button
            onClick={() => {
              playSound('success');
              onProceedToMiniGame();
            }}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(255,95,31,0.3)] shrink-0"
          >
            Play Mini-Game: Rogue Packet →
          </button>
        </div>

        {/* Phase Filter Pill Bar & Score Summary */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#151412] border border-slate-800 rounded-2xl shadow-xl">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              onClick={() => {
                playSound('click');
                setSelectedPhase('all');
              }}
              className={`px-3.5 py-1.5 rounded-lg transition-colors ${
                selectedPhase === 'all' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'
              }`}
            >
              All Modules ({ASSESSMENT_QUESTIONS.length})
            </button>
            <button
              onClick={() => {
                playSound('click');
                setSelectedPhase('phase1');
              }}
              className={`px-3.5 py-1.5 rounded-lg transition-colors ${
                selectedPhase === 'phase1' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'
              }`}
            >
              Phase 1: Fundamentals (6)
            </button>
            <button
              onClick={() => {
                playSound('click');
                setSelectedPhase('phase2');
              }}
              className={`px-3.5 py-1.5 rounded-lg transition-colors ${
                selectedPhase === 'phase2' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'
              }`}
            >
              Phase 2: Diagnosis Scenarios (6)
            </button>
          </div>

          <div className="flex items-center gap-3">
            {submitted ? (
              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="text-slate-300">
                  Score: <span className="text-emerald-400 font-bold text-sm">{score} / {total}</span> ({percent}%)
                </span>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry Quiz</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={Object.keys(answers).length === 0}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold font-mono text-xs rounded-xl transition-all shadow-[0_0_12px_rgba(255,95,31,0.3)] active:scale-95"
              >
                Submit Answers ({Object.keys(answers).length}/{total})
              </button>
            )}
          </div>
        </div>

        {/* Mistakes & Remediation Box (if submitted) */}
        {submitted && mistakes.length > 0 && (
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3 font-sans animate-in fade-in">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>Recommended Concepts Requiring Review ({mistakes.length} items):</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
              {mistakes.map(m => (
                <div key={m.id} className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 text-slate-300">
                  <span className="text-amber-300 font-semibold">• {m.conceptReview}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Question navigator */}
        <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Questions">
          {filteredQuestions.map((q, i) => {
            const answered = !!answers[q.id];
            const right = submitted && answers[q.id] === q.correctOptionId;
            const wrong = submitted && !right;
            return (
              <button
                key={q.id}
                role="tab"
                aria-selected={i === current}
                onClick={() => setCurrent(i)}
                className={`h-8 w-8 border font-mono text-xs transition-colors ${
                  i === current ? 'border-emerald-400 text-emerald-300' : 'border-slate-800 text-slate-400 hover:border-slate-600'
                } ${right ? 'bg-emerald-500/20' : wrong ? 'bg-rose-500/15' : answered ? 'bg-slate-800' : 'bg-transparent'}`}
              >
                {String(i + 1).padStart(2, '0')}
              </button>
            );
          })}
        </div>

        {/* Current question */}
        <div className="space-y-4">
          {filteredQuestions.map((q, qIdx) => {
            if (qIdx !== Math.min(current, filteredQuestions.length - 1)) return null;
            const isAnswered = !!answers[q.id];
            const isCorrect = submitted && answers[q.id] === q.correctOptionId;
            const isWrong = submitted && isAnswered && !isCorrect;

            return (
              <div
                key={q.id}
                className={`p-6 rounded-2xl border transition-all ${
                  submitted
                    ? isCorrect
                      ? 'bg-emerald-500/5 border-emerald-500/40 shadow-sm'
                      : isWrong
                      ? 'bg-rose-500/5 border-rose-500/40 shadow-sm'
                      : 'bg-[#151412] border-slate-800'
                    : 'bg-[#151412] border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Meta Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800/80 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">
                      Q{qIdx + 1 < 10 ? `0${qIdx + 1}` : qIdx + 1}
                    </span>
                    <span className="text-slate-500">|</span>
                    <span className="text-slate-400">{q.phase}</span>
                  </div>

                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                    {q.category}
                  </span>
                </div>

                {/* Scenario Context Box (if Phase 2 scenario) */}
                {q.scenarioText && (
                  <div className="p-4 rounded-xl bg-black/40 border border-slate-800 text-xs font-mono text-slate-300 mb-4 whitespace-pre-line leading-relaxed">
                    <span className="text-amber-400 font-bold block mb-1">Scenario Log & Observational Data:</span>
                    {q.scenarioText}
                  </div>
                )}

                {/* Question Prompt */}
                <h3 className="text-sm sm:text-base font-semibold text-slate-100 mb-4 leading-snug">
                  {q.question}
                </h3>

                {/* Options List */}
                <div className="grid gap-2.5 md:grid-cols-2">
                  {q.options.map(opt => {
                    const isSelected = answers[q.id] === opt.id;
                    const isCorrectOpt = opt.id === q.correctOptionId;

                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleSelectOption(q.id, opt.id)}
                        className={`p-3.5 rounded-xl border text-xs sm:text-sm font-medium transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          submitted
                            ? isCorrectOpt
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200'
                              : isSelected
                              ? 'bg-rose-500/20 border-rose-500 text-rose-200'
                              : 'bg-slate-900/60 border-slate-800/80 text-slate-500'
                            : isSelected
                            ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 font-semibold shadow-sm'
                            : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/80 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-5 h-5 rounded-full bg-black/30 border border-slate-700 flex items-center justify-center text-xs font-mono font-bold shrink-0">
                            {opt.id.toUpperCase()}
                          </span>
                          <span>{opt.text}</span>
                        </div>

                        {submitted && isCorrectOpt && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                        {submitted && isSelected && !isCorrectOpt && (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Card (Revealed upon Submission) */}
                {submitted && (
                  <div className="mt-4 p-4 rounded-xl bg-[#11100e] border border-slate-800 text-xs space-y-1.5 animate-in fade-in">
                    <div className="font-bold text-emerald-400 font-mono">
                      Theoretical & Practical Explanation:
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      {q.explanation}
                    </p>
                    <div className="text-[11px] font-mono text-slate-500 pt-1">
                      Reference: {q.conceptReview}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrent(c => Math.max(0, c - 1))}
              disabled={current === 0}
              className="px-4 py-2 border border-slate-700 text-slate-300 text-xs font-mono disabled:opacity-30 hover:border-slate-500"
            >
              ← Previous
            </button>
            <span className="text-xs font-mono text-slate-500">
              {Math.min(current, total - 1) + 1} / {total}
            </span>
            <button
              onClick={() => setCurrent(c => Math.min(total - 1, c + 1))}
              disabled={current >= total - 1}
              className="px-4 py-2 border border-emerald-500/60 text-emerald-300 text-xs font-mono disabled:opacity-30 hover:bg-emerald-500/10"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
