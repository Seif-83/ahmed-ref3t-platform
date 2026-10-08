import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, set, push, get, child } from 'firebase/database';
import { getIdTokenResult, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';
import { Exam, ExamResult } from './types';

const EXAMS_PATH = 'exams';
const EXAM_RESULTS_PATH = 'exam_results';

export function useExamStore() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const dbRef = ref(db, EXAMS_PATH);
    const unsubscribeExams = onValue(dbRef, snapshot => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const list: Exam[] = Array.isArray(val) ? val : Object.keys(val).map(k => ({
          ...val[k],
          questions: val[k].questions || []
        }));
        setExams(list);
      } else {
        setExams([]);
      }
      setIsLoading(false);
    }, err => {
      console.error('useExamStore: Failed to read exams:', err);
      setIsLoading(false);
    });

    return () => {
      unsubscribeExams();
    };
  }, []);

  const createExam = useCallback(async (exam: Omit<Exam, 'id' | 'createdAt'>) => {
    const newRef = push(ref(db, EXAMS_PATH));
    const id = newRef.key as string;
    const payload: Exam = { ...exam as Exam, id, createdAt: Date.now() };
    await set(newRef, payload);
    return id;
  }, []);

  const updateExam = useCallback(async (examId: string, data: Partial<Exam>) => {
    const examRef = child(ref(db), `${EXAMS_PATH}/${examId}`);
    const snapshot = await get(examRef);
    if (!snapshot.exists()) throw new Error('Exam not found');
    const existing = snapshot.val();
    await set(examRef, { ...existing, ...data });
  }, []);

  const deleteExam = useCallback(async (examId: string) => {
    const examRef = child(ref(db), `${EXAMS_PATH}/${examId}`);
    await set(examRef, null);
  }, []);

  const listExams = useCallback(() => exams, [exams]);

  const submitResult = useCallback(async (result: Omit<ExamResult, 'id' | 'submittedAt'>) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const idToken = await user.getIdToken();
        const response = await fetch('/api/exam-result', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({ examId: result.examId, answers: result.answers }),
        });
        const payload = await response.json() as { id?: string; score?: number; maxScore?: number; error?: string };
        if (response.ok && payload.id) return payload;
      }
    } catch (err) {
      console.warn('Exam submit API failed, using fallback:', err);
    }

    // Direct Firebase Realtime Database Fallback
    const newRef = push(ref(db, EXAM_RESULTS_PATH));
    const studentName = sessionStorage.getItem('student_name') || 'طالب';
    const studentPhone = sessionStorage.getItem('student_phone') || '';
    const studentId = sessionStorage.getItem('student_id') || 'guest';
    const submittedAt = Date.now();

    const record: ExamResult = {
      id: newRef.key as string,
      examId: result.examId,
      studentName,
      studentPhone,
      score: result.score ?? 0,
      maxScore: result.maxScore ?? 0,
      answers: result.answers,
      submittedAt,
    };
    await set(newRef, record);
    return record;
  }, []);

  const getResultsForExam = useCallback(async (examId: string) => {
    const resRef = ref(db, EXAM_RESULTS_PATH);
    const snapshot = await get(resRef);
    if (!snapshot.exists()) return [] as ExamResult[];
    const val = snapshot.val();
    const list: ExamResult[] = Array.isArray(val) ? val : Object.keys(val).map(k => val[k]);
    return list.filter(r => r.examId === examId);
  }, []);

  return {
    exams,
    isLoading,
    createExam,
    updateExam,
    deleteExam,
    listExams,
    submitResult,
    getResultsForExam,
  };
}
