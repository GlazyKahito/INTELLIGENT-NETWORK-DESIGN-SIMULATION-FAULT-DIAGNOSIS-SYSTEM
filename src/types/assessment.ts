// Types for DCN Laboratory Assessments

export interface QuestionOption {
  id: string;
  text: string;
}

export interface AssessmentQuestion {
  id: string;
  phase: 'Phase 1: DCN Fundamentals' | 'Phase 2: Network Diagnosis';
  category: 'Commands' | 'Cabling' | 'Wireshark' | 'TCP/IP' | 'Addressing' | 'Hamming Code' | 'UDP' | 'Simulation & Faults';
  scenarioText?: string;
  topologyDiagram?: string;
  question: string;
  options: QuestionOption[];
  correctOptionId: string;
  explanation: string;
  conceptReview: string;
}

export interface QuizState {
  answers: Record<string, string>; // questionId -> selectedOptionId
  submitted: boolean;
  score: number;
}
