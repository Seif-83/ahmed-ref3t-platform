
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useContentStore } from '../useContentStore';
import { useStudentStore } from '../useStudentStore';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const isStudentLoggedIn = sessionStorage.getItem('student_logged_in') === 'true';
  const studentName = sessionStorage.getItem('student_name') || '';
  const studentLevel = sessionStorage.getItem('student_level') || '';
  const { levels } = useContentStore();
  const { updateStudent } = useStudentStore();

  const handleStudentLogout = () => {
    sessionStorage.removeItem('student_logged_in');
    sessionStorage.removeItem('student_name');
    sessionStorage.removeItem('student_phone');
    setIsMenuOpen(false);
    navigate('/');
    // Force re-render
    window.location.reload();
  };

  const handleScrollToLevels = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsMenuOpen(false);
    const element = document.getElementById('levels');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#f7f2e8]/90 backdrop-blur-xl border-b border-emerald-900/10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">


          <div className="hidden md:flex items-center space-x-reverse space-x-6">
            <Link to="/" className="text-emerald-900 hover:text-amber-700 font-bold transition-colors">الرئيسية</Link>
            {isStudentLoggedIn ? (
              <div className="flex items-center gap-3">
                <a
                  href="https://ipn.eg/S/amrmohsenhassanaly/instapay/21x3Xu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="arabic-gradient text-white px-4 py-2 rounded-full font-bold text-sm hover:shadow-lg hover:shadow-emerald-900/30 transition-all flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 10m10 0l2-10m0 0h2.4M17 7l-2 10" /></svg>
                  وسيلة دفع
                </a>
                <span className="text-sky-600 font-bold text-sm flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  {studentName}
                </span>
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
                    // refresh to apply new level everywhere
                    window.location.reload();
                  }}
                  className="p-1 rounded text-sm border ml-2"
                >
                  {levels.map(l => (
                    <option key={l.id} value={l.id}>{l.titleAr}</option>
                  ))}
                </select>
                <button
                  onClick={handleStudentLogout}
                  className="text-gray-400 hover:text-red-500 text-sm font-medium transition-colors"
                >
                  خروج
                </button>
              </div>
            ) : (
              <Link to="/login" className="arabic-gradient text-white px-5 py-2 rounded-full font-bold text-sm hover:shadow-lg hover:shadow-emerald-900/30 transition-all">
                تسجيل الدخول
              </Link>
            )}
            {/* Removed Admin Control Panel link per request */}
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-500 hover:text-gray-700 p-2 transition-transform duration-300" style={{ transform: isMenuOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu with smooth animation */}
      {/* Mobile Menu Overlay & Drawer - Portalled to body to match viewport height */}
      {isMenuOpen && createPortal(
        <div className="fixed inset-0 z-[100]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-fade-in"
            onClick={() => setIsMenuOpen(false)}
          ></div>

          {/* Drawer - Slides from Right to Left */}
          <div
            className="absolute top-0 right-0 bottom-0 w-3/4 max-w-xs bg-white shadow-2xl flex flex-col animate-slide-in-right"
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <span className="font-bold text-gray-900">القائمة</span>
              <button onClick={() => setIsMenuOpen(false)} className="p-2 text-gray-500 hover:text-red-500 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Drawer Links - vertically scrollable if needed */}
            <div className="flex-1 overflow-y-auto py-4 px-4 space-y-2">
              <Link to="/" onClick={() => setIsMenuOpen(false)} className="block text-right text-lg font-medium text-emerald-900 hover:text-amber-700 py-3 px-4 rounded-xl hover:bg-emerald-50 transition-all border-b border-emerald-100">
                الرئيسية 🏠
              </Link>

              {isStudentLoggedIn ? (
                <div className="bg-emerald-50 rounded-2xl p-4 mt-2">
                  <div className="text-right mb-3">
                    <span className="text-xs text-gray-500 block mb-1">مرحباً بك</span>
                    <span className="text-sky-700 font-bold text-lg">{studentName} 🎓</span>
                  </div>
                  <div className="mb-3 text-right">
                    <label className="text-xs text-gray-500">المرحلة:</label>
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
                      className="w-full mt-2 p-2 rounded border"
                    >
                      {levels.map(l => <option key={l.id} value={l.id}>{l.titleAr}</option>)}
                    </select>
                  </div>
                  <a
                    href="https://ipn.eg/S/amrmohsenhassanaly/instapay/21x3Xu"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full py-2 mb-3 arabic-gradient text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all text-center"
                  >
                    💳 وسيلة الدفع
                  </a>
                  <button
                    onClick={handleStudentLogout}
                    className="w-full py-2 bg-white text-red-500 border border-red-100 rounded-xl text-sm font-bold shadow-sm hover:bg-red-50 transition-all"
                  >
                    تسجيل الخروج
                  </button>
                </div>
              ) : (
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block text-center text-lg font-bold text-white py-3 px-4 rounded-xl arabic-gradient shadow-lg shadow-emerald-900/20 mt-4 transition-transform active:scale-95">
                  تسجيل الدخول 👨‍🎓
                </Link>
              )}

              {/* Removed Admin Control Panel link per request */}
            </div>
          </div>
        </div>,
        document.body
      )}
    </nav>
  );
};

export default Navbar;
