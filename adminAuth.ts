import { signInWithCustomToken } from 'firebase/auth';
import { auth } from './firebase';

export async function signInTeacher(password: string): Promise<void> {
  const response = await fetch('/api/admin-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });

  let result: { token?: string; error?: string } = {};
  try {
    result = (await response.json()) as { token?: string; error?: string };
  } catch {
    throw new Error('تعذر الاتصال بالخادم، يرجى التأكد من تشغيل المشروع بشكل صحيح');
  }

  if (!response.ok || !result.token) {
    throw new Error(result.error || 'تعذر إكمال تسجيل الدخول');
  }

  await signInWithCustomToken(auth, result.token);
}
