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
    let unsubscribeExams: (() => void) | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let authRevision = 0;
    const unsubscribeAuth = onAuthStateChanged(auth, user => {
      const revision = ++authRevision;
      unsubscribeExams?.();
      if (timer) clearTimeout(timer);
      if (!user) {
        setExams([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      void getIdTokenResult(user).then(token => {
        if (revision !== authRevision) return;
        if (token.claims.role === 'student') {
          void user.getIdToken().then(idToken => fetch('/api/student-data', {
            headers: { Authorization: `Bearer ${idToken}` },
          })).then(async response => {
            const result = await response.json() as { exams?: Exam[] };
            if (!response.ok) throw new Error('Could not load student exams');
            if (revision === authRevision) {
              setExams(result.exams || []);
              setIsLoading(false);
            }
          }).catch(error => {
            console.error('useExamStore: Student exams error:', error);
            if (revision === authRevision) setIsLoading(false);
          });
          return;
        }
        if (token.claims.role !== 'admin') {
          setIsLoading(false);
          return;
        }
        timer = setTimeout(() => {
          console.warn('useExamStore: Loading timed out after 5s');
          setIsLoading(false);
        }, 5000);

        const dbRef = ref(db, EXAMS_PATH);
        unsubscribeExams = onValue(dbRef, snapshot => {
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
      }).catch(err => {
        console.error('useExamStore: Authentication error:', err);
        if (revision === authRevision) setIsLoading(false);
      });
    });

    return () => {
      authRevision++;
      unsubscribeAuth();
      unsubscribeExams?.();
      if (timer) clearTimeout(timer);
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
    const user = auth.currentUser;
    if (!user) throw new Error('Student is not authenticated');
    const idToken = await user.getIdToken();
    const response = await fetch('/api/exam-result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ examId: result.examId, answers: result.answers }),
    });
    const payload = await response.json() as { id?: string; score?: number; maxScore?: number; error?: string };
    if (!response.ok || !payload.id) throw new Error(payload.error || 'فشل إرسال النتيجة');
    return payload;
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
