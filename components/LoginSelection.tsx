import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInTeacher } from '../adminAuth';

const LoginSelection: React.FC = () => {
    const navigate = useNavigate();
    const [showPasswordInput, setShowPasswordInput] = useState(false);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleTeacherClick = () => {
        setShowPasswordInput(true);
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        try {
            await signInTeacher(password);
            sessionStorage.setItem('admin_authenticated', 'true');
            navigate('/admin');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'تعذر إكمال تسجيل الدخول');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStudentLogin = () => {
        navigate('/student-login');
    };

    if (showPasswordInput) {
        return (
            <div className="min-h-screen flex items-center justify-center relative z-10 px-4 py-8 sm:py-12">
                <div className="max-w-md w-full glass-card rounded-[2.5rem] p-6 sm:p-10 border border-white/80 shadow-2xl text-center animate-fade-in">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 arabic-gradient rounded-3xl flex items-center justify-center mx-auto mb-5 sm:mb-6 shadow-xl shadow-emerald-950/20 border border-amber-400/30">
                        <svg className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-black text-emerald-950 mb-2 font-cairo">لوحة المعلم</h2>
                    <p className="text-slate-600 mb-6 sm:mb-8 font-medium text-xs sm:text-sm">يرجى إدخال كلمة مرور المعلم للمتابعة</p>

                    <form onSubmit={handlePasswordSubmit} className="space-y-4 sm:space-y-5">
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                placeholder="كلمة المرور الخاصة بالمعلم"
                                className="w-full p-3.5 sm:p-4 pl-12 bg-white/90 border border-emerald-950/15 rounded-2xl text-center text-base sm:text-lg font-bold focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all shadow-sm"
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-emerald-700"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    {showPassword ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.2A10.7 10.7 0 0112 5c5 0 8.3 4.5 9 7-.2.8-.8 1.8-1.7 2.8M6.2 6.2C3.9 7.7 2.4 10 2 12c.3 1.3 1.4 3.2 3.3 4.7A10.8 10.8 0 0012 19c1 0 1.9-.2 2.8-.5" />
                                    ) : (
                                        <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" strokeWidth="2" /></>
                                    )}
                                </svg>
                            </button>
                        </div>
                        {error && <p className="text-red-600 font-bold text-xs sm:text-sm bg-red-50 py-2.5 rounded-xl border border-red-200">{error}</p>}

                        <div className="flex flex-col gap-3">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3.5 sm:py-4 arabic-gradient text-white rounded-2xl font-bold text-base sm:text-lg hover:shadow-xl active:scale-[0.98] transition-all duration-300 shadow-md border border-emerald-400/20"
                            >
                                {isSubmitting ? 'جارٍ التحقق...' : 'دخول لوحة التحكم'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowPasswordInput(false)}
                                className="w-full py-2.5 text-slate-500 hover:text-emerald-950 font-bold text-xs sm:text-sm transition-colors"
                            >
                                ← العودة لخيارات الدخول
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center relative z-10 px-4 py-8 sm:py-12">
            <div className="max-w-4xl w-full">
                <div className="text-center mb-8 sm:mb-10">
                    <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full border border-amber-300/60 mb-3 inline-block">
                        مرحباً بك في منصة الأستاذ أحمد رفعت
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-black text-emerald-950 mb-2 sm:mb-3 font-cairo">تسجيل الدخول</h2>
                    <p className="text-base sm:text-lg text-slate-600 font-medium">من فضلك اختر نوع الحساب للمتابعة</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mt-6 sm:mt-8">
                    
                    {/* Student Card */}
                    <button
                        onClick={handleStudentLogin}
                        className="group relative glass-card glass-card-hover rounded-[2.5rem] p-6 sm:p-10 border border-white/80 shadow-xl text-right w-full flex flex-col justify-between overflow-hidden active:scale-[0.98]"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-bl-[5rem] -mr-8 -mt-8 group-hover:scale-125 transition-transform duration-500"></div>

                        <div className="relative z-10">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 arabic-gradient rounded-3xl flex items-center justify-center mb-5 sm:mb-6 shadow-lg shadow-emerald-950/20 group-hover:scale-110 transition-transform duration-500 border border-amber-400/30">
                                <span className="text-2xl sm:text-3xl">🎓</span>
                            </div>

                            <span className="bg-emerald-100 text-emerald-900 text-xs font-bold px-3 py-1 rounded-full mb-3 inline-block">
                                للطلاب والطالبات
                            </span>
                            <h3 className="text-2xl sm:text-3xl font-black text-emerald-950 mb-2 sm:mb-3 font-cairo">دخول الطالب</h3>
                            <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-medium mb-6">
                                متابعة دروس الفيديو، تحميل المذكرات والملخصات، وحل الاختبارات الإلكترونية لمرحلتك.
                            </p>
                        </div>

                        <div className="pt-4 border-t border-emerald-950/10 flex items-center justify-between text-emerald-900 font-extrabold text-sm sm:text-base group-hover:text-amber-700 transition-colors">
                            <span>الانتقال لصفحة الطالب</span>
                            <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-100 group-hover:bg-amber-400 text-emerald-950 flex items-center justify-center text-sm transition-all duration-300">
                                ←
                            </span>
                        </div>
                    </button>

                    {/* Teacher Card */}
                    <button
                        onClick={handleTeacherClick}
                        className="group relative glass-card glass-card-hover rounded-[2.5rem] p-6 sm:p-10 border border-white/80 shadow-xl text-right w-full flex flex-col justify-between overflow-hidden active:scale-[0.98]"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-700/10 rounded-bl-[5rem] -mr-8 -mt-8 group-hover:scale-125 transition-transform duration-500"></div>

                        <div className="relative z-10">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 gold-gradient rounded-3xl flex items-center justify-center mb-5 sm:mb-6 shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform duration-500 border border-amber-300">
                                <span className="text-2xl sm:text-3xl">👨‍🏫</span>
                            </div>

                            <span className="bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1 rounded-full mb-3 inline-block">
                                للمعلم والمسؤول
                            </span>
                            <h3 className="text-2xl sm:text-3xl font-black text-emerald-950 mb-2 sm:mb-3 font-cairo">لوحة التحكم</h3>
                            <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-medium mb-6">
                                إمكانية إضافة الدروس، رفع الفيديوهات والمذكرات، متابعة الطلاب وإنشاء الاختبارات.
                            </p>
                        </div>

                        <div className="pt-4 border-t border-emerald-950/10 flex items-center justify-between text-amber-800 font-extrabold text-sm sm:text-base group-hover:text-emerald-950 transition-colors">
                            <span>دخول المعلم</span>
                            <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-amber-100 group-hover:bg-emerald-800 text-emerald-950 group-hover:text-white flex items-center justify-center text-sm transition-all duration-300">
                                ←
                            </span>
                        </div>
                    </button>

                </div>
            </div>
        </div>
    );
};

export default LoginSelection;
