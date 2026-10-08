import {
  createFirebaseCustomToken,
  firebaseDatabaseRequest,
  type ApiRequest,
  type ApiResponse,
} from './firebaseAdminServer';

type StudentRecord = {
  name: string;
  phone: string;
  level: string;
  loginDate: string;
  lastSeen: string;
};

const allowedLevels = new Set(['1st-prep', '2nd-prep', '3rd-prep']);
const phonePattern = /^01[0125]\d{8}$/;

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  res.setHeader('Cache-Control', 'no-store');

  let body: any = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) {}
  }
  const phone = body?.phone?.trim().replace(/\s/g, '');
  if (!phone || !phonePattern.test(phone)) {
    return res.status(400).json({ error: 'يرجى إدخال رقم هاتف مصري صحيح' });
  }

  try {
    const matches = await firebaseDatabaseRequest<Record<string, StudentRecord> | null>(
      'students',
      'GET',
      undefined,
      { orderBy: '"phone"', equalTo: JSON.stringify(phone) },
    );
    const existing = matches ? Object.entries(matches)[0] : undefined;

    if (body?.action === 'login') {
      if (!existing) return res.status(200).json({ student: null });

      const [id, student] = existing;
      student.lastSeen = new Date().toISOString();
      await firebaseDatabaseRequest(`students/${id}`, 'PATCH', { lastSeen: student.lastSeen });
      const token = await createFirebaseCustomToken(id, {
        role: 'student',
        phone: student.phone,
        name: student.name,
      });
      return res.status(200).json({ student: { ...student, id }, token });
    }

    if (body?.action !== 'register') return res.status(400).json({ error: 'طلب غير صالح' });
    if (existing) return res.status(409).json({ error: 'رقم الهاتف مسجل بالفعل' });

    const name = body.name?.trim();
    const level = body.level;
    if (!name || name.length < 3 || !level || !allowedLevels.has(level)) {
      return res.status(400).json({ error: 'يرجى إكمال بيانات التسجيل' });
    }

    const now = new Date().toISOString();
    const record: StudentRecord = { name, phone, level, loginDate: now, lastSeen: now };
    const created = await firebaseDatabaseRequest<{ name: string }>('students', 'POST', record);
    const id = created.name;
    const token = await createFirebaseCustomToken(id, { role: 'student', phone, name });
    return res.status(201).json({ student: { ...record, id }, token });
  } catch (error: any) {
    console.error('Student authentication failed:', error);
    const msg = error instanceof Error ? error.message : 'تعذر الاتصال بقاعدة البيانات';
    return res.status(500).json({ error: msg });
  }
}