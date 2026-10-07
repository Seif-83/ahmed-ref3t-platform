import React from 'react';
import { Link } from 'react-router-dom';
import { useExamStore } from '../useExamStore';

const StudentExams: React.FC = () => {
  const { exams, isLoading } = useExamStore();

  const studentLevel = sessionStorage.getItem('student_level');
  if (!studentLevel) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass-card p-10 rounded-3xl text-center max-w-md w-full border border-white">
          <p className="text-emerald-950 font-bold text-lg mb-4">يرجى تسجيل الدخول كطالب لعرض الاختبارات المتاحة.</p>
          <Link to="/login" className="px-6 py-3 arabic-gradient text-white rounded-2xl font-bold inline-block shadow-md">
            تسجيل الدخول
          </Link>
        </div>
      </div>
    );
  }

  const available = exams.filter(e => e.published && e.levelId === studentLevel);

  return (
    <div className="min-h-screen pb-20 relative z-10">
      <div className="arabic-gradient pt-24 pb-32 text-white text-center px-4 relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-amber-300 px-5 py-2 rounded-full font-bold text-sm transition-all mb-4 backdrop-blur">
            <span>← العودة للرئيسية</span>
          </Link>
          <h1 className="text-4xl sm:text-5xl font-black mb-3 font-cairo">الاختبارات الإلكترونية المتاحة</h1>
          <p className="text-amber-300 text-xl font-bold">اختر اختباراً لقياس مستواكك واستلام النتيجة مباشرة</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-16">
        {isLoading && (
          <div className="p-12 glass-card rounded-3xl text-center text-emerald-950 font-bold">
            جاري تحميل الاختبارات...
          </div>
        )}
        {!isLoading && available.length === 0 && (
          <div className="p-12 glass-card rounded-3xl text-center text-slate-600 font-bold border border-white">
            لا توجد اختبارات منشورة لمرحلتك حالياً.
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {available.map(ex => (
            <div key={ex.id} className="p-8 glass-card rounded-[2.5rem] border border-white flex flex-col justify-between hover:shadow-2xl transition-all">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1 rounded-full border border-amber-300">
                    اختبار إلكتروني
                  </span>
                  <span className="text-xs font-semibold text-slate-500">⏱️ {ex.timeLimitMinutes ?? 'غير محدد'} دقيقة</span>
                </div>
                <h3 className="font-black text-2xl text-emerald-950 mb-2 font-cairo">{ex.title}</h3>
                <p className="text-slate-600 text-sm font-medium leading-relaxed mb-4">{ex.description}</p>
                <p className="text-xs font-bold text-emerald-800">أسئلة الاختبار: {ex.questions?.length ?? 0} سؤال</p>
              </div>
              <div className="mt-6">
                <Link to={`/exam/${ex.id}`} className="block w-full text-center py-3.5 arabic-gradient text-white rounded-2xl font-bold text-base shadow-md hover:shadow-lg transition-all">
                  ابدأ الاختبار الآن ✍️
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentExams;
