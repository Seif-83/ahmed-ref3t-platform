import {
  firebaseDatabaseRequest,
  verifyFirebaseIdToken,
  type ApiRequest,
  type ApiResponse,
} from './firebaseAdminServer';
import type { PrepData } from '../types';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  res.setHeader('Cache-Control', 'no-store');

  const token = req.headers?.authorization ?? req.headers?.Authorization;
  const idToken = token?.startsWith('Bearer ') ? token.slice(7) : '';
  const body = req.body as { levelId?: string; lessonId?: string; code?: string } | undefined;
  if (!idToken || !body?.levelId || !body.lessonId || !body.code) {
    return res.status(400).json({ error: 'بيانات فتح الدرس غير مكتملة' });
  }

  try {
    const { uid, claims } = await verifyFirebaseIdToken(idToken);
    if (claims.role !== 'student') return res.status(403).json({ error: 'هذا المحتوى للطلاب فقط' });
    const [student, content] = await Promise.all([
      firebaseDatabaseRequest<{ phone?: string; level?: string } | null>(`students/${uid}`, 'GET'),
      firebaseDatabaseRequest<PrepData[] | Record<string, PrepData> | null>('platform_content', 'GET'),
    ]);
    if (!student?.phone || student.level !== body.levelId || !content) return res.status(403).json({ error: 'حساب الطالب غير صالح لهذه المرحلة' });

    const levels = Array.isArray(content) ? content : Object.values(content);
    const level = levels.find(item => item.id === body.levelId);
    const lesson = level?.lessons.find(item => item.id === body.lessonId);
    if (!lesson) return res.status(404).json({ error: 'الدرس غير موجود' });

    if (lesson.codes?.length) {
      const code = lesson.codes.find(item => item.value === body.code);
      if (!code) return res.status(400).json({ error: 'الكود غير صحيح' });
      if (code.used) return res.status(409).json({ error: 'هذا الكود مستخدم بالفعل' });
      code.used = true;
      code.assignedTo = student.phone;
      await firebaseDatabaseRequest('platform_content', 'PUT', content);
      await firebaseDatabaseRequest(`student_unlocks/${uid}/${lesson.id}`, 'PUT', true);
      return res.status(200).json({ unlocked: true });
    }

    if (lesson.code && lesson.code === body.code) {
      await firebaseDatabaseRequest(`student_unlocks/${uid}/${lesson.id}`, 'PUT', true);
      return res.status(200).json({ unlocked: true });
    }
    return res.status(400).json({ error: 'الكود غير صحيح' });
  } catch (error) {
    console.error('Lesson unlock failed:', error);
    return res.status(500).json({ error: 'تعذر فتح الدرس' });
  }
}