
export type PrepLevel = '1st-prep' | '2nd-prep' | '3rd-prep';

export interface Video {
  id: string;
  title: string;
  videoUrl: string;
  description?: string;
}

export interface Lesson {
  id: string;
  title: string;
  videoUrl?: string; // legacy single video URL
  videos?: Video[]; // new: multiple videos
  pdfUrl: string;
  pdfFiles?: { id: string; title: string; pdfUrl: string }[];
  description: string;
  code?: string;
  coverImage?: string; // base64 data URL or image URL for lesson cover
  // Single-use access codes for this lesson
  requiresCode?: boolean;
  availableCodes?: number;
  hasVideos?: boolean;
  hasNotes?: boolean;
  codes?: {
    value: string;
    used?: boolean;
    assignedTo?: string | null;
  }[];
}

export interface PrepData {
  id: PrepLevel;
  title: string;
  titleAr: string;
  image: string;
  description: string;
  lessons: Lesson[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// Exams and grading
export type QuestionType = 'mcq' | 'text';

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  promptType?: 'text' | 'image'; // text or image prompt
  promptImageUrl?: string; // image URL if promptType is 'image'
  // For MCQ
  options?: string[];
  correctOptionIndex?: number; // for MCQ
  // Points for the question
  points?: number;
}

export interface Exam {
  id: string;
  title: string;
  description?: string;
  levelId: PrepLevel;
  questions: Question[];
  timeLimitMinutes?: number | null;
  published?: boolean;
  createdAt?: number;
}

export interface ExamResult {
  id: string;
  examId: string;
  studentPhone?: string | null;
  studentName?: string | null;
  answers: { questionId: string; answer: string | number }[];
  score: number;
  maxScore: number;
  submittedAt: number;
}

export interface SiteSettings {
  heroImage: string;
}
