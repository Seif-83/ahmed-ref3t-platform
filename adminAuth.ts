import { signInWithCustomToken } from 'firebase/auth';
import { auth } from './firebase';

export async function signInTeacher(password: string): Promise<void> {
  const response = await fetch('/api/admin-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const result = await response.json() as { token?: string; error?: string };
  if (!response.ok || !result.token) {
    throw new Error(result.error || 'تعذر إكمال تسجيل الدخول');
  }

  await signInWithCustomToken(auth, result.token);
}