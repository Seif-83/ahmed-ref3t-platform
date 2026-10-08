import { signInWithCustomToken } from 'firebase/auth';
import { auth } from './firebase';

export async function signInTeacher(password: string): Promise<void> {
  const cleanPassword = password.trim();
  const validPassword = 'ahmed-admin-2025';

  if (cleanPassword !== validPassword) {
    throw new Error('كلمة المرور غير صحيحة');
  }

  sessionStorage.setItem('admin_authenticated', 'true');

  try {
    const response = await fetch('/api/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: cleanPassword }),
    });

    if (response.ok) {
      const result = await response.json() as { token?: string };
      if (result.token) {
        await signInWithCustomToken(auth, result.token);
      }
    }
  } catch (e) {
    console.warn('API admin login failed, proceeding with local admin session:', e);
  }
}
