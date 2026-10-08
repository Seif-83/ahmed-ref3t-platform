import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signOut, onAuthStateChanged, getIdTokenResult } from 'firebase/auth';
import { auth } from '../firebase';
import { useContentStore } from '../useContentStore';
import { useStudentStore } from '../useStudentStore';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isStudentLoggedIn, setIsStudentLoggedIn] = useState(() => sessionStorage.getItem('student_logged_in') === 'true');
  const [studentName, setStudentName] = useState(() => sessionStorage.getItem('student_name') || '');
  const [studentLevel, setStudentLevel] = useState(() => sessionStorage.getItem('student_level') || '');
  const { levels } = useContentStore();
  const { updateStudent } = useStudentStore();

  useEffect(() => {
    const syncStudentState = () => {
      const loggedIn = sessionStorage.getItem('student_logged_in') === 'true';
      setIsStudentLoggedIn(loggedIn);
      setStudentName(sessionStorage.getItem('student_name') || '');
      setStudentLevel(sessionStorage.getItem('student_level') || '');
    };

    syncStudentState();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await getIdTokenResult(user);
          if (token.claims.role === 'admin') {
            setIsAdminLoggedIn(true);
            setIsStudentLoggedIn(false);
            return;
          } else if (token.claims.role === 'student') {
            setIsAdminLoggedIn(false);
            setIsStudentLoggedIn(true);
            syncStudentState();
            return;
          }
        } catch (e) {
          console.error('Navbar auth error:', e);
        }
      }
      setIsAdminLoggedIn(false);
      syncStudentState();
    });

    window.addEventListener('storage', syncStudentState);
    return () => {
      unsubscribe();
      window.removeEventListener('storage', syncStudentState);
    };
  }, [location.pathname]);

  const handleLogout = () => {
    void signOut(auth).finally(() => {
      sessionStorage.removeItem('student_logged_in');
      sessionStorage.removeItem('student_name');
      sessionStorage.removeItem('student_phone');
      sessionStorage.removeItem('student_level');
      sessionStorage.removeItem('student_id');
      localStorage.removeItem('student_phone_persist');
      setIsMenuOpen(false);
      setIsAdminLoggedIn(false);
      setIsStudentLoggedIn(false);
      navigate('/');
      window.location.reload();
    });
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/85 border-b border-emerald-950/10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
            <div className="flex flex-col text-right">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-black text-base sm:text-xl text-emerald-950 font-alexandria tracking-tight">
                  الأستاذ أحمد رفعت
                </span>
                <span className="bg-amber-100 text-amber-900 text-[10px] sm:text-[11px] font-extrabold px-2 py-0.5 rounded-full border border-amber-300/60 shadow-xs">
                  لغة عربية
                </span>
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-emerald-800/80 leading-tight">منصة التفوق والتأسيس في اللغة العربية</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-reverse space-x-6">
            <Link 
              to="/" 
              className="text-emerald-950 hover:text-amber-600 font-extrabold text-base transition-colors px-3 py-2 rounded-xl hover:bg-emerald-50/60"
            >
              الرئيسية
            </Link>

            {isAdminLoggedIn ? (
              <div className="flex items-center gap-3 bg-amber-500/10 p-1.5 pr-4 pl-2 rounded-2xl border border-amber-400/30">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-sm font-black text-emerald-950">👨‍🏫 لوحة المعلم</span>
                </div>
                <Link
                  to="/admin"
                  className="bg-emerald-900 hover:bg-emerald-950 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-sm transition-all"
                >
                  لوحة التحكم
                </Link>
                <button
                  onClick={handleLogout}
                  title="تسجيل الخروج"
                  className="p-2 text-red-600 hover:bg-red-100/60 rounded-xl transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4-4H7m6 4v1" />
                  </svg>
                </button>
              </div>
            ) : isStudentLoggedIn ? (
              <div className="flex items-center gap-3 bg-emerald-50/90 p-1.5 pr-4 rounded-2xl border border-emerald-900/10">
                {/* Student Info */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    🎓
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-bold text-emerald-950 leading-none">
                      {studentName}
                    </span>
                  </div>
                </div>

                {/* Level selector */}
                <select
                  value={studentLevel}
                  onChange={async e => {
                    const newLevel = e.target.value;
                    sessionStorage.setItem('student_level', newLevel);
                    const sid = sessionStorage.getItem('student_id');
                    if (sid) {
                      try {
                        await updateStudent(sid, { level: newLevel });
                      } catch (err) {
                        console.error('Failed to update student level', err);
                      }
                    }
                    window.location.reload();
                  }}
                  className="bg-white text-emerald-900 font-extrabold text-xs py-1.5 px-3 rounded-xl border border-emerald-200 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-sm"
                >
                  {levels.map(l => (
                    <option key={l.id} value={l.id}>{l.titleAr}</option>
                  ))}
                </select>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  title="تسجيل الخروج"
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors mr-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4-4H7m6 4v1" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="arabic-gradient text-white px-6 py-2.5 rounded-2xl font-black text-sm shadow-md shadow-emerald-950/20 hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2 border border-emerald-400/20"
                >
                  <span>تسجيل الدخول</span>
                  <svg className="w-4 h-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14" />
                  </svg>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-950 hover:bg-emerald-100 transition-all border border-emerald-900/10 active:scale-95 shadow-xs"
              aria-label="القائمة"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16m-7 6h7" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMenuOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-emerald-950/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsMenuOpen(false)}
          ></div>

          {/* Drawer Content */}
          <div className="relative w-4/5 max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 border-r border-emerald-900/10">
            {/* Drawer Header */}
            <div className="p-5 border-b border-emerald-900/10 flex justify-between items-center arabic-gradient text-white">
              <div className="flex items-center gap-3">
                
                <div>
                  <h3 className="font-extrabold text-base text-white">الأستاذ أحمد رفعت</h3>
                  <p className="text-xs text-amber-300 font-medium">منصة اللغة العربية</p>
                </div>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Drawer Links */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <Link
                to="/"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 text-right text-base font-bold text-emerald-950 p-3.5 rounded-2xl bg-emerald-50/50 hover:bg-emerald-50 transition-all border border-emerald-900/5"
              >
                <span>🏠</span>
                <span>الرئيسية</span>
              </Link>

              {isAdminLoggedIn ? (
                <div className="bg-amber-50/80 rounded-2xl p-5 border border-amber-200 space-y-4">
                  <div className="flex items-center gap-3 text-right">
                    <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-lg">
                      👨‍🏫
                    </div>
                    <div>
                      <span className="text-xs text-amber-800 block font-bold">مرحباً بالأستاذ</span>
                      <span className="text-emerald-950 font-black text-lg">أحمد رفعت (المعلم)</span>
                    </div>
                  </div>

                  <Link
                    to="/admin"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-3 arabic-gradient text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all text-sm"
                  >
                    <span>⚙️ لوحة التحكم</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full py-3 bg-white text-red-600 border border-red-200 rounded-xl font-bold text-sm hover:bg-red-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              ) : isStudentLoggedIn ? (
                <div className="bg-emerald-50/80 rounded-2xl p-5 border border-emerald-200/60 space-y-4">
                  <div className="flex items-center gap-3 text-right">
                    <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-lg">
                      🎓
                    </div>
                    <div>
                      <span className="text-xs text-emerald-700 block font-semibold">مرحباً بك الطالب</span>
                      <span className="text-emerald-950 font-extrabold text-lg">{studentName}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-right">
                    <label className="text-xs font-bold text-emerald-800">تغيير المرحلة الدراسية:</label>
                    <select
                      value={studentLevel}
                      onChange={async e => {
                        const newLevel = e.target.value;
                        sessionStorage.setItem('student_level', newLevel);
                        const sid = sessionStorage.getItem('student_id');
                        if (sid) {
                          try {
                            await updateStudent(sid, { level: newLevel });
                          } catch (err) {
                            console.error('Failed to update student level', err);
                          }
                        }
                        window.location.reload();
                      }}
                      className="w-full p-3 rounded-xl bg-white text-emerald-950 font-bold border border-emerald-300 outline-none text-sm shadow-sm"
                    >
                      {levels.map(l => <option key={l.id} value={l.id}>{l.titleAr}</option>)}
                    </select>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full py-3 bg-white text-red-600 border border-red-200 rounded-xl font-bold text-sm hover:bg-red-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-3.5 arabic-gradient text-white rounded-2xl font-bold text-base shadow-lg shadow-emerald-950/20 transition-all"
                  >
                    <span>تسجيل الدخول</span>
                    <span className="text-amber-300 font-bold">👨‍🎓</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </nav>
  );
};

export default Navbar;

