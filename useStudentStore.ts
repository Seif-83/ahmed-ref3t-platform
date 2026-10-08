import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, remove, update, query, orderByChild, equalTo, get, push, set } from 'firebase/database';
import { getIdTokenResult, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { auth, db } from './firebase';

export interface Student {
    id: string;
    name: string;
    phone: string;
    level: string;
    loginDate: string;
    lastSeen: string;
}

const DB_PATH = 'students';

async function requestStudentAuth(body: Record<string, string>) {
    const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const text = await response.text();
    let result: { token?: string; student?: Student | null; id?: string; error?: string } = {};
    try {
        result = JSON.parse(text);
    } catch (e) {
        throw new Error('API_UNAVAILABLE');
    }
    if (!response.ok) throw new Error(result.error || 'API_ERROR');
    if (result.token) {
        try {
            await signInWithCustomToken(auth, result.token);
        } catch (e) {
            console.warn('Custom token sign-in warning:', e);
        }
    }
    return result;
}

export function useStudentStore(options: { autoListen?: boolean } = {}) {
    const { autoListen = false } = options;
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(autoListen);

    // Listen for real-time updates only if autoListen is true
    useEffect(() => {
        if (!autoListen) return;

        let unsubscribeStudents: (() => void) | undefined;
        let authRevision = 0;
        const unsubscribeAuth = onAuthStateChanged(auth, user => {
            const revision = ++authRevision;
            unsubscribeStudents?.();
            if (!user) {
                setStudents([]);
                setIsLoading(false);
                return;
            }

            void getIdTokenResult(user).then(token => {
                if (revision !== authRevision || token.claims.role !== 'admin') {
                    setStudents([]);
                    setIsLoading(false);
                    return;
                }

                const dbRef = ref(db, DB_PATH);
                unsubscribeStudents = onValue(dbRef, snapshot => {
                    if (snapshot.exists()) {
                        const data = snapshot.val();
                        const studentList: Student[] = Object.keys(data).map(key => ({ ...data[key], id: key }));
                        studentList.sort((a, b) => new Date(b.loginDate).getTime() - new Date(a.loginDate).getTime());
                        setStudents(studentList);
                    } else {
                        setStudents([]);
                    }
                    setIsLoading(false);
                }, error => {
                    console.error('Firebase student read error:', error);
                    setIsLoading(false);
                });
            }).catch(error => {
                console.error('Firebase admin auth error:', error);
                if (revision === authRevision) setIsLoading(false);
            });
        });

        return () => {
            authRevision++;
            unsubscribeAuth();
            unsubscribeStudents?.();
        };
    }, []);

    const loginByPhone = useCallback(async (phone: string): Promise<Student | null> => {
        console.log('useStudentStore: loginByPhone called for', phone);
        try {
            const result = await requestStudentAuth({ action: 'login', phone });
            if (result && result.student !== undefined) {
                return result.student;
            }
        } catch (e) {
            console.warn('API authentication failed, using direct database fallback:', e);
        }

        // Direct Firebase Realtime Database Client Fallback
        const snapshot = await get(query(ref(db, DB_PATH), orderByChild('phone'), equalTo(phone)));
        if (snapshot.exists()) {
            const data = snapshot.val();
            const id = Object.keys(data)[0];
            const student = { ...data[id], id } as Student;
            try {
                await update(ref(db, `${DB_PATH}/${id}`), { lastSeen: new Date().toISOString() });
            } catch (err) {
                console.warn('Could not update lastSeen:', err);
            }
            return student;
        }
        return null;
    }, []);

    const registerStudent = useCallback(async (name: string, phone: string, level: string): Promise<string> => {
        try {
            const result = await requestStudentAuth({ action: 'register', name, phone, level });
            if (result && result.student?.id) {
                return result.student.id;
            }
        } catch (e: any) {
            if (e?.message === 'رقم الهاتف مسجل بالفعل') throw e;
            console.warn('API registration failed, using direct database fallback:', e);
        }

        // Direct Firebase Realtime Database Client Fallback
        const snapshot = await get(query(ref(db, DB_PATH), orderByChild('phone'), equalTo(phone)));
        if (snapshot.exists()) {
            throw new Error('رقم الهاتف مسجل بالفعل');
        }

        const newRef = push(ref(db, DB_PATH));
        const now = new Date().toISOString();
        const record = { name, phone, level, loginDate: now, lastSeen: now };
        await set(newRef, record);
        return newRef.key as string;
    }, []);

    const removeStudent = useCallback(async (studentId: string) => {
        await remove(ref(db, `${DB_PATH}/${studentId}`));
    }, []);

    const updateStudent = useCallback(async (studentId: string, data: Partial<Student>) => {
        if (!studentId) throw new Error('studentId required');
        await update(ref(db, `${DB_PATH}/${studentId}`), data as any);
    }, []);

    return { students, isLoading, registerStudent, removeStudent, loginByPhone, updateStudent };
}
