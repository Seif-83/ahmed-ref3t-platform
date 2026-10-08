import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useParams, Link, Navigate } from 'react-router-dom';
import { getIdTokenResult, onAuthStateChanged } from 'firebase/auth';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import PrepLevelCard from './components/PrepLevelCard';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import AdminExams from './components/AdminExams';
import StudentExams from './components/StudentExams';
import StudentExamPage from './components/StudentExamPage';
import AdminExamResults from './components/AdminExamResults';
import StudentLogin from './components/StudentLogin';
import LoginSelection from './components/LoginSelection';
import StudentManagement from './components/StudentManagement';
import { useContentStore } from './useContentStore';
import { Lesson } from './types';
import { useExamStore } from './useExamStore';
import { useStudentStore } from './useStudentStore';
import ErrorBoundary from './components/ErrorBoundary';
import { auth } from './firebase';

const HomePage: React.FC = () => {
  const { levels, isLoading } = useContentStore();
  const [isStudentLoggedIn, setIsStudentLoggedIn] = useState(false);
  const [studentLevel, setStudentLevel] = useState<string | null>(null);

  const { exams, isLoading: isExamsLoading } = useExamStore();
  const { loginByPhone } = useStudentStore();

  useEffect(() => {
    const init = async () => {
      const loggedIn = sessionStorage.getItem('student_logged_in') === 'true';
      const level = sessionStorage.getItem('student_level');

      if (!loggedIn) {
        const persistedPhone = localStorage.getItem('student_phone_persist');
        if (persistedPhone) {
          try {
            const student = await loginByPhone(persistedPhone);
            if (student) {
              sessionStorage.setItem('student_logged_in', 'true');
              sessionStorage.setItem('student_name', student.name);
              sessionStorage.setItem('student_phone', student.phone);
              sessionStorage.setItem('student_level', student.level || '1st-prep');
              sessionStorage.setItem('student_id', (student as any).id || '');

              setIsStudentLoggedIn(true);
              setStudentLevel(student.level || '1st-prep');
              return;
            }
          } catch (e) {
            console.error('Auto-login failed', e);
          }
        }
      }

      setIsStudentLoggedIn(loggedIn);
      setStudentLevel(level);
    };

    init();
  }, [loginByPhone]);

  if (isLoading || isExamsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative z-10">
        <div className="text-center bg-white/80 p-8 rounded-3xl shadow-xl backdrop-blur-md border border-white">
          <div className="w-14 h-14 border-4 border-emerald-200 border-t-emerald-700 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-emerald-950 text-lg font-bold">جاري تحميل منصة الأستاذ أحمد رفعت...</p>
        </div>
      </div>
    );
  }

  const displayedLevels = isStudentLoggedIn
    ? levels.filter(l => l.id === studentLevel)
    : levels;

  const availableExamsForLevel = isStudentLoggedIn && studentLevel
    ? exams.filter(e => e.published && e.levelId === studentLevel)
    : [];

  return (
    <div className="relative">
      <Hero />

      {/* Main Levels Section */}
      <section id="levels" className="py-10 sm:py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-10 sm:mb-16">
          <span className="bg-amber-100 text-amber-900 text-xs font-bold px-4 py-1.5 rounded-full border border-amber-300/60 mb-3 inline-block">
            {isStudentLoggedIn ? 'مرحلتك الحالية' : 'المراحل الدراسية'}
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-emerald-950 font-cairo">
            {isStudentLoggedIn ? 'محتوى مرحلتك الدراسية' : 'اختر مرحلتك الدراسية'}
          </h2>
          <div className="mt-3 h-1.5 w-20 sm:w-24 gold-gradient mx-auto rounded-full"></div>
          <p className="mt-3 sm:mt-4 text-slate-600 max-w-2xl mx-auto text-sm sm:text-base font-medium">
            كل ما تحتاجه لتتعلم اللغة العربية وتتقن النحو والبلاغة والقراءة مع الأستاذ أحمد رفعت.
          </p>
        </div>

        {displayedLevels.length > 0 ? (
          <div className={`grid grid-cols-1 ${isStudentLoggedIn ? 'max-w-2xl mx-auto' : 'md:grid-cols-3'} gap-8 justify-center`}>
            {displayedLevels.map(level => (
              <PrepLevelCard key={level.id} data={level} isStudentLoggedIn={isStudentLoggedIn} />
            ))}
          </div>
        ) : (
          <div className="text-center p-12 glass-card rounded-3xl border border-white">
            <p className="text-xl text-emerald-950 font-bold">لم يتم العثور على محتوى للمرحلة المختارة.</p>
            <Link to="/login" className="mt-4 inline-block text-amber-700 font-extrabold hover:underline">
              تسجيل الخروج وتغيير المرحلة
            </Link>
          </div>
        )}

        {/* Available Exams Section for Student */}
        {isStudentLoggedIn && (
          <div className="mt-20 pt-16 border-t border-emerald-950/10">
            <div className="text-center mb-10">
              <span className="bg-emerald-100 text-emerald-900 text-xs font-bold px-3 py-1 rounded-full mb-2 inline-block">
                اختبارات تفاعلية
              </span>
              <h3 className="text-3xl font-black text-emerald-950 font-cairo">اختبارات لمرحلتك</h3>
              <p className="text-slate-600 mt-2 text-sm font-medium">حل الاختبارات المنشورة لقياس مستواكك واستلام نتائجك فوراً</p>
            </div>

            <div className="max-w-4xl mx-auto">
              {availableExamsForLevel.length === 0 ? (
                <div className="p-10 glass-card rounded-3xl text-center text-slate-600 font-bold border border-white">
                  <span>📝 لا توجد اختبارات منشورة لمرحلتك حالياً. سيقوم المعلم بنشر اختبارات قريباً.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {availableExamsForLevel.map(ex => (
                    <div key={ex.id} className="p-6 glass-card rounded-3xl border border-white/80 flex flex-col justify-between hover:shadow-xl transition-all">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-300/40">
                            اختبار إلكتروني
                          </span>
                          <span className="text-xs font-semibold text-slate-500">⏱️ {ex.timeLimitMinutes ?? 'غير محدد'} دقيقة</span>
                        </div>
                        <h4 className="font-extrabold text-xl text-emerald-950">{ex.title}</h4>
                        <p className="text-sm text-slate-600 mt-2 font-medium leading-relaxed">{ex.description}</p>
                        <p className="text-xs font-semibold text-emerald-800 mt-3">عدد الأسئلة: {ex.questions?.length ?? 0} سؤال</p>
                      </div>
                      <div className="mt-6">
                        <Link to={`/exam/${ex.id}`} className="block w-full text-center py-3 arabic-gradient text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition-all text-sm">
                          ابدأ الاختبار الآن ✍️
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Join Platform Callout for Guest */}
      {!isStudentLoggedIn && (
        <section className="py-16 max-w-5xl mx-auto px-4 relative z-10 text-center">
          <div className="arabic-gradient rounded-[3rem] p-10 md:p-16 text-white shadow-2xl relative overflow-hidden border border-amber-400/20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10">
              <span className="bg-white/20 backdrop-blur text-amber-300 text-xs font-bold px-4 py-1.5 rounded-full mb-4 inline-block">
                انضم إلينا اليوم
              </span>
              <h2 className="text-3xl sm:text-5xl font-black mb-4 font-cairo">ابدأ رحلة التفوق في اللغة العربية</h2>
              <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto font-medium">
                سجل دخولك الآن برقم الهاتف للوصول للدروس الخاصة بمرحلتك، المذكرات الشاملة، والتفاعل مع الأستاذ أحمد رفعت.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 bg-amber-400 text-emerald-950 px-10 py-4 rounded-2xl font-black text-xl hover:bg-amber-300 transition-all shadow-xl hover:scale-105 active:scale-95"
              >
                <span>سجل دخولك الآن</span>
                <span>👨‍🎓</span>
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

const LessonLock: React.FC<{
  lesson: Lesson;
  levelId: string;
  onUnlock: () => void;
  type: 'فيديوهات' | 'مذكرات'
}> = ({ lesson, levelId, onUnlock, type }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
      setError('يرجى تسجيل الدخول أولاً');
      return;
    }

    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/unlock-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ levelId, lessonId: lesson.id, code: code.trim() }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        setError(result.error || 'الكود غير صحيح');
        return;
      }
      sessionStorage.setItem(`lesson_unlocked_${lesson.id}`, 'true');
      onUnlock();
      window.location.reload();
    } catch (error) {
      console.error('Failed to unlock lesson', error);
      setError('حدث خطأ، يرجى المحاولة لاحقاً');
    }
  };

  return (
    <div className="glass-card rounded-[2.5rem] shadow-2xl border border-white p-8 md:p-12 text-center animate-fade-in max-w-lg mx-auto">
      <div className="w-20 h-20 bg-amber-100 text-amber-900 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-md border border-amber-300">
        <span className="text-4xl">🔒</span>
      </div>
      <h3 className="text-emerald-950 font-black mb-2 text-2xl font-cairo">محتوى الـ{type} محمي بكود وصول</h3>
      <p className="text-slate-600 text-sm font-semibold mb-6">يرجى الحصول على كود الوصول من الأستاذ أحمد رفعت لمشاهدة المحتوى</p>

      {lesson.requiresCode && lesson.availableCodes === 0 ? (
        <div className="text-red-600 bg-red-50 p-4 rounded-2xl max-w-xs mx-auto border border-red-200">
          <p className="font-bold text-sm">عذراً، لا توجد أكواد متاحة حالياً.</p>
          <p className="text-xs mt-1">يرجى التواصل مع المعلم للحصول على كود جديد.</p>
        </div>
      ) : (
        <form onSubmit={handleUnlock} className="w-full max-w-xs space-y-4 mx-auto">
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="أدخل كود الوصول"
            className="w-full px-4 py-3.5 rounded-2xl bg-white border border-emerald-950/20 text-emerald-950 text-center font-bold text-lg focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none shadow-sm"
          />
          {error && <p className="text-red-600 text-xs font-bold bg-red-50 py-2 rounded-xl border border-red-200">{error}</p>}
          <button
            type="submit"
            className="w-full py-3.5 arabic-gradient text-white rounded-2xl font-bold transition-all hover:shadow-lg shadow-md text-base"
          >
            فتح المحتوى 🔓
          </button>
        </form>
      )}
    </div>
  );
};

const VideoLessonCard: React.FC<{ lesson: Lesson; levelId: string }> = ({ lesson, levelId }) => {
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    return Boolean(lesson.requiresCode || lesson.code || lesson.codes?.length);
  });

  useEffect(() => {
    setIsLocked(Boolean(lesson.requiresCode || lesson.code || lesson.codes?.length));
  }, [lesson.id, lesson.code, lesson.codes, lesson.requiresCode]);

  const videos = lesson.videos && lesson.videos.length > 0
    ? lesson.videos
    : (lesson.videoUrl ? [{ id: 'legacy-' + lesson.id, title: lesson.title, videoUrl: lesson.videoUrl }] : []);

  if (isLocked) {
    return <LessonLock lesson={lesson} levelId={levelId} type="فيديوهات" onUnlock={() => setIsLocked(false)} />;
  }

  return (
    <div className="space-y-8">
      {!isLocked && videos.map((video, idx) => (
        <div key={video.id} className="glass-card rounded-[2.5rem] shadow-2xl overflow-hidden border border-white flex flex-col">
          <div className="aspect-video relative bg-emerald-950 overflow-hidden shadow-inner">
            {video.videoUrl && (video.videoUrl.startsWith('data:') || video.videoUrl.endsWith('.mp4')) ? (
              <video
                className="w-full h-full"
                src={video.videoUrl}
                controls
                controlsList="nodownload"
                onContextMenu={(e) => {
                  e.preventDefault();
                  return false;
                }}
              />
            ) : (
              <iframe
                className="w-full h-full"
                src={video.videoUrl}
                title={video.title}
                allowFullScreen
              ></iframe>
            )}
          </div>
          <div className="p-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1 rounded-full border border-amber-300">
                فيديو شرح
              </span>
              {videos.length > 1 && (
                <span className="text-xs text-slate-500 font-semibold">المقطع {idx + 1} من {videos.length}</span>
              )}
            </div>
            <h3 className="text-2xl font-black text-emerald-950 mb-3 font-cairo">📹 {video.title}</h3>
            {video.description && (
              <p className="text-slate-600 leading-relaxed font-medium">{video.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const CoursesPage: React.FC = () => {
  const { levelId } = useParams<{ levelId: string }>();
  const { levels } = useContentStore();
  const level = levels.find(l => l.id === levelId);

  if (!level) return <div className="p-20 text-center font-bold text-2xl text-emerald-950">المرحلة غير موجودة.</div>;

  return (
    <div className="min-h-screen pb-32 relative z-10">
      <div className="arabic-gradient pt-20 pb-36 text-white text-center px-4 relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-amber-300 px-5 py-2 rounded-full font-bold text-sm transition-all mb-6 backdrop-blur">
            <span>← العودة للرئيسية</span>
          </Link>
          <h1 className="text-4xl sm:text-5xl font-black mb-3 font-cairo">{level.titleAr}</h1>
          <p className="text-amber-300 text-xl font-bold">📹 مكتبة فيديوهات الشرح</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(level.lessons || [])
            .filter(l => l.hasVideos || (l.videos && l.videos.length > 0) || (l.videoUrl && l.videoUrl.trim() !== ''))
            .map(lesson => (
              <Link key={lesson.id} to={`/level/${levelId}/videos/${lesson.id}`} className="block group">
                <div className="glass-card glass-card-hover rounded-[2.5rem] shadow-xl overflow-hidden border border-white flex flex-col h-full">
                  <div
                    className="aspect-video relative bg-emerald-950"
                    style={lesson.coverImage ? { backgroundImage: `url(${lesson.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-emerald-950/30 to-transparent group-hover:from-emerald-950/70 transition-all flex items-end p-5">
                      <div>
                        <span className="bg-amber-400 text-emerald-950 font-bold text-[11px] px-2.5 py-0.5 rounded-full mb-2 inline-block">
                          درس تفاعلي
                        </span>
                        <h3 className="text-white text-xl font-black font-cairo leading-snug">{lesson.title}</h3>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 flex-grow flex flex-col justify-between">
                    <p className="text-slate-600 text-sm font-medium line-clamp-2 mb-4">{lesson.description}</p>
                    <div className="flex items-center justify-between text-emerald-950 font-extrabold text-sm pt-4 border-t border-emerald-950/10">
                      <span>مشاهدة الفيديو</span>
                      <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-900 group-hover:bg-amber-400 group-hover:text-emerald-950 flex items-center justify-center transition-colors">
                        ←
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
};

const NoteLessonCard: React.FC<{ lesson: Lesson; levelId: string }> = ({ lesson, levelId }) => {
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    return Boolean(lesson.requiresCode || lesson.code || lesson.codes?.length);
  });

  useEffect(() => {
    setIsLocked(Boolean(lesson.requiresCode || lesson.code || lesson.codes?.length));
  }, [lesson.id, lesson.code, lesson.codes, lesson.requiresCode]);

  if (isLocked) {
    return <LessonLock lesson={lesson} levelId={levelId} type="مذكرات" onUnlock={() => setIsLocked(false)} />;
  }

  const pdfs = lesson.pdfFiles && lesson.pdfFiles.length > 0
    ? lesson.pdfFiles
    : (lesson.pdfUrl ? [{ id: 'legacy-' + lesson.id, title: lesson.title, pdfUrl: lesson.pdfUrl }] : []);

  return (
    <div className="glass-card rounded-[2.5rem] shadow-2xl overflow-hidden border border-white flex flex-col animate-fade-in">
      <div className="h-44 bg-emerald-50/80 flex items-center justify-center text-emerald-900 border-b border-emerald-900/10">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center text-3xl shadow-inner">
          📚
        </div>
      </div>
      <div className="p-8">
        <h3 className="text-2xl font-black text-emerald-950 mb-3 font-cairo pb-3 border-b border-emerald-950/10">{lesson.title}</h3>
        {lesson.description && <p className="text-slate-600 leading-relaxed mb-6 text-sm font-medium">{lesson.description}</p>}

        <div className="space-y-3">
          {pdfs.map((pdf, idx) => (
            <a
              key={pdf.id}
              href={pdf.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 bg-white border border-emerald-900/15 text-emerald-950 rounded-2xl font-bold hover:arabic-gradient hover:text-white transition-all flex items-center justify-between px-6 shadow-sm hover:shadow-md group/btn"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center text-xs font-black group-hover/btn:bg-white/20 group-hover/btn:text-white">
                  {idx + 1}
                </span>
                <span className="line-clamp-1 font-semibold text-base">{pdf.title}</span>
              </div>
              <span className="text-amber-600 group-hover/btn:text-amber-300 font-extrabold text-sm">
                تحميل PDF 📄
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

const NotesPlaylistPage: React.FC = () => {
  const { levelId } = useParams<{ levelId: string }>();
  const { levels } = useContentStore();
  const level = levels.find(l => l.id === levelId);

  if (!level) return <div className="p-20 text-center font-bold text-2xl text-emerald-950">المرحلة غير موجودة.</div>;

  const lessonsWithNotes = (level.lessons || []).filter(l => l.hasNotes || (l.pdfFiles && l.pdfFiles.length > 0) || (l.pdfUrl && l.pdfUrl.trim() !== ''));

  return (
    <div className="min-h-screen pb-32 relative z-10">
      <div className="arabic-gradient pt-20 pb-36 text-white text-center px-4 relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-amber-300 px-5 py-2 rounded-full font-bold text-sm transition-all mb-6 backdrop-blur">
            <span>← العودة للرئيسية</span>
          </Link>
          <h1 className="text-4xl sm:text-5xl font-black mb-3 font-cairo">{level.titleAr}</h1>
          <p className="text-amber-300 text-xl font-bold">📚 مذكرات وملخصات الشرح (PDF)</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-20">
        {lessonsWithNotes.length === 0 ? (
          <div className="glass-card rounded-[2.5rem] p-16 text-center shadow-xl border border-white">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-2xl font-black text-emerald-950 mb-2 font-cairo">لا توجد مذكرات حالياً</h3>
            <p className="text-slate-600 font-semibold">سيتم إضافة المذكرات قريباً لهذه المرحلة من قبل المعلم.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {lessonsWithNotes.map(lesson => (
              <Link key={lesson.id} to={`/level/${levelId}/notes/${lesson.id}`} className="block group">
                <div className="glass-card glass-card-hover rounded-[2.5rem] shadow-xl overflow-hidden border border-white flex flex-col h-full">
                  <div className="h-44 bg-emerald-950 flex items-center justify-center relative p-6">
                    <div className="text-center text-white">
                      <span className="text-4xl mb-2 block">📑</span>
                      <h3 className="text-xl font-black font-cairo line-clamp-2 text-amber-300">{lesson.title}</h3>
                    </div>
                  </div>
                  <div className="p-6 flex-grow flex flex-col justify-between">
                    <p className="text-slate-600 text-sm font-medium line-clamp-2 mb-4">{lesson.description}</p>
                    <div className="flex items-center justify-between text-emerald-950 font-extrabold text-sm pt-4 border-t border-emerald-950/10">
                      <span>عرض المذكرة</span>
                      <span className="bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full text-xs">
                        {lesson.pdfFiles?.length || (lesson.pdfUrl ? 1 : 0)} ملفات
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const NoteViewerPage: React.FC = () => {
  const { levelId, lessonId } = useParams<{ levelId: string; lessonId: string }>();
  const { levels } = useContentStore();
  const level = levels.find(l => l.id === levelId);
  const lesson = level?.lessons?.find(les => les.id === lessonId);

  if (!level || !lesson) return <div className="p-20 text-center font-bold text-2xl text-emerald-950">المحتوى غير موجود.</div>;

  return (
    <div className="min-h-screen pb-32 relative z-10 text-right" dir="rtl">
      <div className="arabic-gradient pt-20 pb-28 text-white text-center px-4">
        <Link to={`/level/${levelId}/notes`} className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-amber-300 px-5 py-2 rounded-full font-bold text-sm transition-all mb-4">
          ← العودة قائمة المذكرات
        </Link>
        <h1 className="text-3xl sm:text-4xl font-black mb-2 font-cairo">{lesson.title}</h1>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-12">
        <NoteLessonCard lesson={lesson} levelId={level.id} />
      </div>
    </div>
  );
};

const VideoPlayerPage: React.FC = () => {
  const { levelId, lessonId } = useParams<{ levelId: string; lessonId: string }>();
  const { levels } = useContentStore();
  const level = levels.find(l => l.id === levelId);
  const lesson = level?.lessons?.find(les => les.id === lessonId);

  if (!level || !lesson) return <div className="p-20 text-center font-bold text-2xl text-emerald-950">الدرس غير موجود.</div>;

  return (
    <div className="min-h-screen pb-32 relative z-10">
      <div className="arabic-gradient pt-20 pb-28 text-white text-center px-4">
        <Link to={`/level/${levelId}/courses`} className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-amber-300 px-5 py-2 rounded-full font-bold text-sm transition-all mb-4">
          ← العودة لقائمة الفيديوهات
        </Link>
        <h1 className="text-3xl sm:text-4xl font-black mb-2 font-cairo">{lesson.title}</h1>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-12">
        <VideoLessonCard lesson={lesson} levelId={level.id} />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen flex flex-col relative bg-[#f7f9f8] bg-ambient-light">
        <Navbar />
        <main className="flex-grow">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/level/:levelId/courses" element={<AuthenticatedRoute role="student"><CoursesPage /></AuthenticatedRoute>} />
              <Route path="/level/:levelId/videos/:lessonId" element={<AuthenticatedRoute role="student"><VideoPlayerPage /></AuthenticatedRoute>} />
              <Route path="/level/:levelId/videos" element={<AuthenticatedRoute role="student"><CoursesPage /></AuthenticatedRoute>} />
              <Route path="/level/:levelId/notes" element={<AuthenticatedRoute role="student"><NotesPlaylistPage /></AuthenticatedRoute>} />
              <Route path="/level/:levelId/notes/:lessonId" element={<AuthenticatedRoute role="student"><NoteViewerPage /></AuthenticatedRoute>} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/admin" element={<AuthenticatedRoute role="admin"><AdminDashboard /></AuthenticatedRoute>} />
              <Route path="/admin/exams" element={<AuthenticatedRoute role="admin"><AdminExams /></AuthenticatedRoute>} />
              <Route path="/admin/exam-results" element={<AuthenticatedRoute role="admin"><AdminExamResults /></AuthenticatedRoute>} />
              <Route path="/exams" element={<AuthenticatedRoute role="student"><StudentExams /></AuthenticatedRoute>} />
              <Route path="/exam/:examId" element={<AuthenticatedRoute role="student"><StudentExamPage /></AuthenticatedRoute>} />
              <Route path="/student-login" element={<StudentLogin />} />
              <Route path="/login" element={<LoginSelection />} />
              <Route path="/admin/students" element={<AuthenticatedRoute role="admin"><StudentManagement /></AuthenticatedRoute>} />
            </Routes>
          </ErrorBoundary>
        </main>

        {/* Footer */}
        <footer className="bg-[#031714] text-slate-300 py-16 px-4 relative z-10 border-t border-emerald-900/30">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 items-center text-center md:text-right">
            <div>
              <div className="flex items-center gap-3 justify-center md:justify-start mb-3">
                
                <h3 className="text-white text-2xl font-black font-cairo">الأستاذ أحمد رفعت</h3>
              </div>
              <p className="text-slate-400 text-sm font-semibold">رحلتك ونحو إتقان والتفوق في اللغة العربية تضمن نتائجك العالية.</p>
            </div>

            <div className="flex justify-center gap-4">
              <a
                href="https://www.facebook.com/share/18EimSRbRB/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all text-white shadow-md border border-white/10"
                title="فيسبوك"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
              </a>
              <a
                href="https://youtube.com/@amrmohsenhassan?si=oaRiOSRqDWX68W-L"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all text-white shadow-md border border-white/10"
                title="يوتيوب"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
              </a>
              <a
                href="https://wa.me/201211143632"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all text-white shadow-md border border-white/10"
                title="واتساب"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
              </a>
            </div>

            <div className="text-xs text-slate-400 font-semibold">
              &copy; {new Date().getFullYear()} جميع الحقوق محفوظة لمنصة الأستاذ أحمد رفعت
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
};

const AuthenticatedRoute: React.FC<{ role: 'admin' | 'student'; children: React.ReactNode }> = ({ role, children }) => {
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (role === 'admin') {
      const isAdminLoggedIn = sessionStorage.getItem('admin_authenticated') === 'true';
      if (isAdminLoggedIn) {
        setAuthorized(true);
        return;
      }
    }

    if (role === 'student') {
      const isStudentLoggedIn = sessionStorage.getItem('student_logged_in') === 'true';
      if (isStudentLoggedIn) {
        setAuthorized(true);
        return;
      }
    }

    return onAuthStateChanged(auth, user => {
      if (!user) {
        setAuthorized(false);
        return;
      }
      void getIdTokenResult(user)
        .then(token => setAuthorized(token.claims.role === role))
        .catch(() => setAuthorized(false));
    });
  }, [role]);

  if (authorized === null) return <div className="min-h-screen" aria-busy="true" />;
  if (!authorized) return <Navigate to={role === 'admin' ? '/admin-login' : '/login'} replace />;
  return <>{children}</>;
};

export default App;
