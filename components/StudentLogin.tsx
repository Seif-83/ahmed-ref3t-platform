import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudentStore } from '../useStudentStore';

const StudentLogin: React.FC = () => {
    const [step, setStep] = useState<1 | 2>(1);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [level, setLevel] = useState('1st-prep');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const { registerStudent, loginByPhone } = useStudentStore();

    const handlePhoneSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const phoneClean = phone.trim().replace(/\s/g, '');

        // Egyptian Phone Regex: 01 followed by 0,1,2,5 and then 8 digits
        const egyptPhoneRegex = /^01[0125][0-9]{8}$/;

        if (!egyptPhoneRegex.test(phoneClean)) {
            setError('يرجى إدخال رقم هاتف مصري صحيح (11 رقم يبدأ بـ 01)');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const student = await loginByPhone(phoneClean);
            if (student) {
                sessionStorage.setItem('student_logged_in', 'true');
                sessionStorage.setItem('student_name', student.name);
                sessionStorage.setItem('student_phone', student.phone);
                sessionStorage.setItem('student_level', student.level || '1st-prep');
                sessionStorage.setItem('student_id', (student as any).id || '');
                localStorage.setItem('student_phone_persist', phoneClean);

                navigate('/');
            } else {
                setStep(2);
            }
        } catch (err: any) {
            if (err.message?.includes('Permission denied')) {
                setError('عذراً، لا توجد صلاحيات للوصول لقاعدة البيانات. يرجى مراجعة المعلم.');
            } else if (err.message?.includes('timeout')) {
                setError('حدث خطأ في الاتصال، يرجى المحاولة مرة أخرى');
            } else {
                setError('حدث خطأ في الاتصال، يرجى المحاولة مرة أخرى');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || name.trim().length < 3) {
            setError('يرجى إدخال الاسم بالكامل (3 كلمات على الأقل)');
            return;
        }

        setIsSubmitting(true);
        setError('');
        const phoneClean = phone.trim().replace(/\s/g, '');

        try {
            const id = await registerStudent(name.trim(), phoneClean, level);
            sessionStorage.setItem('student_logged_in', 'true');
            sessionStorage.setItem('student_name', name.trim());
            sessionStorage.setItem('student_phone', phoneClean);
            sessionStorage.setItem('student_level', level);
            if (id) sessionStorage.setItem('student_id', id);

            localStorage.setItem('student_phone_persist', phoneClean);

            navigate('/');
        } catch (err: any) {
            setError(err.message || 'حدث خطأ أثناء التسجيل');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative z-10 px-4 py-12">
            <div className="glass-card rounded-[2.5rem] p-8 md:p-12 text-center max-w-md w-full border border-white/80 shadow-2xl relative overflow-hidden">
                
                {/* Decorative Top Accent */}
                <div className="absolute top-0 right-0 left-0 h-2 arabic-gradient"></div>

                {/* Student Avatar Icon */}
                <div className="w-20 h-20 arabic-gradient rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-950/20 border border-amber-400/30">
                    <span className="text-3xl">🎓</span>
                </div>

                {step === 1 ? (
                    <>
                        <h2 className="text-3xl font-black text-emerald-950 mb-2 font-cairo">دخول الطالب</h2>
                        <p className="text-slate-600 mb-8 text-sm font-semibold">أدخل رقم الهاتف للمتابعة والدخول للمحتوى</p>

                        <form onSubmit={handlePhoneSubmit} className="space-y-5">
                            <div>
                                <label className="block text-right text-xs font-extrabold text-emerald-950 mb-2 mr-1">
                                    رقم الهاتف (واتساب):
                                </label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => { setPhone(e.target.value); setError(''); }}
                                    placeholder="01XXXXXXXXX"
                                    className="w-full p-4 bg-white/90 border border-emerald-950/15 rounded-2xl text-center text-lg font-bold tracking-wider focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all shadow-sm dir-ltr"
                                    maxLength={11}
                                    autoFocus
                                />
                            </div>

                            {error && (
                                <p className="text-red-600 font-bold text-xs bg-red-50 p-3 rounded-xl border border-red-200 text-center leading-relaxed">
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 arabic-gradient text-white rounded-2xl font-bold text-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 shadow-md border border-emerald-400/20 disabled:opacity-60"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                        <span>جاري التحقق...</span>
                                    </span>
                                ) : (
                                    'متابعة الدخول'
                                )}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="animate-fade-in">
                        <span className="bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1 rounded-full mb-2 inline-block">
                            طالب جديد
                        </span>
                        <h2 className="text-3xl font-black text-emerald-950 mb-2 font-cairo">إنشاء حساب</h2>
                        <p className="text-slate-600 mb-6 text-sm font-semibold">أهلاً بك! يرجى إكمال بياناتك البسيطة</p>

                        <form onSubmit={handleRegisterSubmit} className="space-y-5">
                            <div>
                                <label className="block text-right text-xs font-extrabold text-emerald-950 mb-2 mr-1">
                                    الاسم الثلاثي:
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => { setName(e.target.value); setError(''); }}
                                    placeholder="مثال: أحمد محمد علي"
                                    className="w-full p-4 bg-white/90 border border-emerald-950/15 rounded-2xl text-center text-base font-bold focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all shadow-sm"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-right text-xs font-extrabold text-emerald-950 mb-2 mr-1">
                                    اختر المرحلة الدراسية:
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: '1st-prep', label: '1 إعدادي' },
                                        { id: '2nd-prep', label: '2 إعدادي' },
                                        { id: '3rd-prep', label: '3 إعدادي' }
                                    ].map((l) => (
                                        <button
                                            key={l.id}
                                            type="button"
                                            onClick={() => setLevel(l.id)}
                                            className={`p-3 rounded-xl border-2 font-bold text-xs transition-all ${level === l.id
                                                ? 'border-emerald-600 bg-emerald-700 text-white shadow-md'
                                                : 'border-emerald-950/10 bg-white text-emerald-950 hover:bg-emerald-50'
                                                }`}
                                        >
                                            {l.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {error && (
                                <p className="text-red-600 font-bold text-xs bg-red-50 p-3 rounded-xl border border-red-200 text-center leading-relaxed">
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 arabic-gradient text-white rounded-2xl font-bold text-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 shadow-md border border-emerald-400/20 disabled:opacity-60"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                        <span>جاري التسجيل...</span>
                                    </span>
                                ) : (
                                    'تأكيد الدخول للمنصة'
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="text-slate-500 hover:text-emerald-950 font-bold text-xs transition-colors block mx-auto pt-2"
                            >
                                ← تغيير رقم الهاتف
                            </button>
                        </form>
                    </div>
                )}

                <p className="mt-8 text-xs font-semibold text-slate-500">
                  🔒 بياناتك محفوظة وآمنة للمتابعة مع المعلم
                </p>
            </div>
        </div>
    );
};

export default StudentLogin;
