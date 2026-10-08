import { timingSafeEqual } from 'crypto';
import { createFirebaseCustomToken, type ApiRequest, type ApiResponse } from './firebaseAdminServer';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  res.setHeader('Cache-Control', 'no-store');

  const expectedPassword = process.env.ADMIN_PASSWORD;
  const suppliedPassword = (req.body as { password?: unknown } | undefined)?.password;
  if (!expectedPassword || typeof suppliedPassword !== 'string') {
    return res.status(500).json({ error: 'Admin login is not configured' });
  }

  const supplied = Buffer.from(suppliedPassword);
  const expected = Buffer.from(expectedPassword);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    return res.status(401).json({ error: 'كلمة المرور غير صحيحة' });
  }

  try {
    const token = await createFirebaseCustomToken('teacher-admin', { role: 'admin' });
    return res.status(200).json({ token });
  } catch (error) {
    console.error('Admin token creation failed:', error);
    return res.status(500).json({ error: 'تعذر إكمال تسجيل الدخول' });
  }
}