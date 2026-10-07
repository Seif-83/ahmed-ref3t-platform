
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInTeacher } from '../adminAuth';

const AdminLogin: React.FC = () => {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isShaking, setIsShaking] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        try {
            await signInTeacher(password.trim());
            sessionStorage.setItem('admin_authenticated', 'true');
            navigate('/admin');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'تعذر إكمال تسجيل الدخول');
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative z-10 px-4">
            <div
                className={`bg-glass rounded-[2.5rem] shadow-2xl p-10 md:p-16 text-center max-w-md w-full border border-white/50 transition-transform ${isShaking ? 'animate-shake' : ''}`}
            >
                {/* Admin Icon */}
                <div className="w-24 h-24 bg-gradient-to-br from-sky-500 to-teal-400 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-sky-500/30">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>

                <h2 className="text-3xl font-bold text-gray-900 mb-2">لوحة التحكم</h2>
                <p className="text-gray-500 mb-10 text-lg">أدخل كلمة المرور للدخول إلى لوحة تحكم المعلم</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(''); }}
                            placeholder="كلمة المرور"
                            className="w-full p-5 pl-14 bg-white border border-gray-200 rounded-2xl text-center text-xl font-bold focus:ring-4 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all shadow-sm"
                            autoFocus
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-emerald-700"
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
                    {error && <p className="text-red-500 font-bold animate-fade-in">{error}</p>}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-5 science-gradient text-white rounded-2xl font-bold text-xl hover:shadow-2xl transition-all transform active:scale-95"
                    >
                        {isSubmitting ? 'جارٍ التحقق...' : 'دخول'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
