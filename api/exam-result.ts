import {
  firebaseDatabaseRequest,
  verifyFirebaseIdToken,
  type ApiRequest,
  type ApiResponse,
} from './firebaseAdminServer';
import type { Exam, ExamResult } from '../types';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  res.setHeader('Cache-Control', 'no-store');

  const authorization = req.headers?.authorization ?? req.headers?.Authorization;
  const idToken = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
  const body = req.body as { examId?: string; answers?: { questionId: string; answer: string | number }[] } | undefined;
  if (!idToken || !body?.examId || !Array.isArray(body.answers)) {
    return res.status(400).json({ error: 'بيانات الاختبار غير مكتملة' });
  }

  try {
    const { uid, claims } = await verifyFirebaseIdToken(idToken);
    if (claims.role !== 'student') return res.status(403).json({ error: 'الاختبارات للطلاب فقط' });
    const [student, rawExams] = await Promise.all([
      firebaseDatabaseRequest<{ name?: string; phone?: string; level?: string } | null>(`students/${uid}`, 'GET'),
      firebaseDatabaseRequest<Exam[] | Record<string, Exam> | null>('exams', 'GET'),
    ]);
    if (!student?.phone || !student.name || !student.level || !rawExams) {
      return res.status(403).json({ error: 'حساب الطالب غير صالح' });
    }

    const exams = Array.isArray(rawExams) ? rawExams : Object.values(rawExams);
    const exam = exams.find(item => item.id === body.examId && item.published && item.levelId === student.level);
    if (!exam) return res.status(404).json({ error: 'الاختبار غير متاح لهذا الطالب' });

    const submitted = new Map(body.answers.map(answer => [answer.questionId, String(answer.answer ?? '')]));
    let score = 0;
    let maxScore = 0;
    const answers = (exam.questions || []).map(question => {
      const points = question.points ?? 1;
      maxScore += points;
      const answer = submitted.get(question.id) ?? '';
      if (question.type === 'mcq' && answer !== '' && Number(answer) === question.correctOptionIndex) score += points;
      return { questionId: question.id, answer };
    });

    const record: Omit<ExamResult, 'id'> = {
      examId: exam.id,
      studentPhone: student.phone,
      studentName: student.name,
      answers,
      score,
      maxScore,
      submittedAt: Date.now(),
    };
    const created = await firebaseDatabaseRequest<{ name: string }>('exam_results', 'POST', record);
    return res.status(201).json({ id: created.name, score, maxScore });
  } catch (error) {
    console.error('Exam result submission failed:', error);
    return res.status(500).json({ error: 'فشل إرسال النتيجة' });
  }
}