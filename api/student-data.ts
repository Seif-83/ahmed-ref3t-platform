import {
  firebaseDatabaseRequest,
  verifyFirebaseIdToken,
  type ApiRequest,
  type ApiResponse,
} from '../firebaseAdminServer';
import type { Exam, PrepData, SiteSettings } from '../types';

function getBearerToken(req: ApiRequest): string | null {
  const authorization = req.headers?.authorization ?? req.headers?.Authorization;
  return authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  res.setHeader('Cache-Control', 'no-store');

  try {
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ error: 'يجب تسجيل الدخول' });
    const { uid, claims } = await verifyFirebaseIdToken(token);
    if (claims.role !== 'student') return res.status(403).json({ error: 'هذا المحتوى للطلاب فقط' });
    const student = await firebaseDatabaseRequest<{ phone?: string; level?: string } | null>(`students/${uid}`, 'GET');
    if (!student?.phone || !student.level) return res.status(403).json({ error: 'حساب الطالب غير صالح' });

    const [content, settings, exams, unlocks] = await Promise.all([
      firebaseDatabaseRequest<PrepData[] | Record<string, PrepData> | null>('platform_content', 'GET'),
      firebaseDatabaseRequest<SiteSettings | null>('site_settings', 'GET'),
      firebaseDatabaseRequest<Exam[] | Record<string, Exam> | null>('exams', 'GET'),
      firebaseDatabaseRequest<Record<string, boolean> | null>(`student_unlocks/${uid}`, 'GET'),
    ]);

    const levels = content ? (Array.isArray(content) ? content : Object.values(content)) : [];
    const safeLevels = levels.filter(level => level.id === student.level).map(level => ({
      ...level,
      lessons: (level.lessons || []).map(lesson => {
        const { code, codes, ...safeLesson } = lesson;
        const requiresCode = Boolean(code || codes?.length);
        const isUnlocked = Boolean(unlocks?.[lesson.id]);
        const hasVideos = Boolean(lesson.videos?.length || lesson.videoUrl?.trim());
        const hasNotes = Boolean(lesson.pdfFiles?.length || lesson.pdfUrl?.trim());
        if (requiresCode && !isUnlocked) {
          const { videoUrl: _videoUrl, videos: _videos, pdfUrl: _pdfUrl, pdfFiles: _pdfFiles, ...lockedLesson } = safeLesson;
          return {
            ...lockedLesson,
            requiresCode: true,
            availableCodes: codes ? codes.filter(item => !item.used).length : code ? 1 : 0,
            hasVideos,
            hasNotes,
          };
        }
        return {
          ...safeLesson,
          requiresCode: false,
          availableCodes: codes ? codes.filter(item => !item.used).length : code ? 1 : 0,
          hasVideos,
          hasNotes,
        };
      }),
    }));
    const examList = exams ? (Array.isArray(exams) ? exams : Object.values(exams)) : [];
    const safeExams = examList.filter(exam => exam.published && exam.levelId === student.level).map(exam => ({
      ...exam,
      questions: (exam.questions || []).map(question => {
        const { correctOptionIndex: _answer, ...safeQuestion } = question;
        return safeQuestion;
      }),
    }));

    return res.status(200).json({ levels: safeLevels, siteSettings: settings, exams: safeExams });
  } catch (error) {
    console.error('Student data request failed:', error);
    return res.status(500).json({ error: 'تعذر تحميل بيانات الطالب' });
  }
}