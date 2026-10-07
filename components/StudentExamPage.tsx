import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExamStore } from '../useExamStore';
import { Exam } from '../types';

/* ─── Countdown Timer hook ───────────────────────────────────────── */
function useCountdown(totalSeconds: number | null, onExpire: () => void) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const expiredRef = useRef(false);

  useEffect(() => {
    if (totalSeconds === null || totalSeconds <= 0) return;
    setSecondsLeft(totalSeconds);
    expiredRef.current = false;
  }, [totalSeconds]);

  useEffect(() => {
    if (secondsLeft === null) return;
    if (secondsLeft <= 0) {
      if (!expiredRef.current) {
        expiredRef.current = true;
        onExpire();
      }
      return;
    }
    const id = setTimeout(() => setSecondsLeft(s => (s !== null ? s - 1 : null)), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft, onExpire]);

  return secondsLeft;
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const StudentExamPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const { exams, submitResult } = useExamStore();
  const navigate = useNavigate();

  const exam: Exam | undefined = exams.find(e => e.id === examId);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [autoSubmitted, setAutoSubmitted] = useState(false);

  useEffect(() => {
    if (!exam?.questions) return;
    const init: Record<string, any> = {};
    exam.questions.forEach(q => (init[q.id] = q.type === 'mcq' ? null : ''));
    setAnswers(init);
  }, [examId, exam]);

  const handleSubmit = useCallback(
    async (isAuto = false, currentAnswers?: Record<string, any>) => {
      if (submitting || score !== null) return;
      setSubmitting(true);
      if (isAuto) setAutoSubmitted(true);

      const usedAnswers = currentAnswers ?? answers;

      try {
        const answersArr: { questionId: string; answer: string | number }[] = [];

        (exam!.questions || []).forEach(q => {
          const ans = usedAnswers[q.id];
          if (q.type === 'mcq') {
            answersArr.push({ questionId: q.id, answer: String(ans ?? '') });
          } else {
            answersArr.push({ questionId: q.id, answer: String(ans ?? '') });
          }
        });

        const studentPhone = sessionStorage.getItem('student_phone') || null;
        const studentName = sessionStorage.getItem('student_name') || null;

        const result = await submitResult({
          examId: exam!.id,
          studentPhone,
          studentName,
          answers: answersArr,
          score: 0,
          maxScore: 0,
        });
        setScore(result.score ?? 0);
      } catch (err) {
        console.error(err);
        alert('فشل إرسال النتيجة');
      } finally {
        setSubmitting(false);
      }
    },
    [answers, exam, score, submitting, submitResult]
  );

  const answersRef = useRef(answers);
  useEffect(() => { answersRef.current = answers; }, [answers]);

  const onTimerExpire = useCallback(() => {
    handleSubmit(true, answersRef.current);
  }, [handleSubmit]);

  const totalSeconds = exam?.timeLimitMinutes ? exam.timeLimitMinutes * 60 : null;
  const secondsLeft = useCountdown(score !== null ? null : totalSeconds, onTimerExpire);

  const handleChange = (qid: string, val: any) => setAnswers(a => ({ ...a, [qid]: val }));

  if (!exam) {
    return <div className="p-20 text-center font-bold text-2xl text-emerald-950">الاختبار غير موجود.</div>;
  }

  const maxScore = (exam.questions || []).reduce((s, q) => s + (q.points ?? 1), 0);

  const timerUrgent = secondsLeft !== null && secondsLeft <= 60;
  const timerWarning = secondsLeft !== null && secondsLeft <= 180 && secondsLeft > 60;

  return (
    <div className="min-h-screen pb-24 relative z-10">
      {/* Header Banner */}
      <div className="arabic-gradient pt-20 pb-32 text-white text-center px-4 relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <h1 className="text-3xl md:text-5xl font-black mb-3 font-cairo">{exam.title}</h1>
          {exam.description && <p className="text-amber-300 text-lg font-medium">{exam.description}</p>}

          {/* Countdown Timer */}
          {secondsLeft !== null && score === null && (
            <div className={`
              inline-flex items-center gap-3 mt-6 px-6 py-3 rounded-2xl font-black text-2xl shadow-xl
              transition-all duration-500 border border-white/20
              ${timerUrgent ? 'bg-red-600 animate-pulse text-white' : timerWarning ? 'gold-gradient text-emerald-950' : 'bg-white/20 text-white backdrop-blur'}
            `}>
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span dir="ltr">{formatTime(secondsLeft)}</span>
            </div>
          )}

          {!exam.timeLimitMinutes && (
            <div className="inline-block mt-6 bg-white/10 px-4 py-2 rounded-full text-sm font-bold text-amber-300 backdrop-blur">
              ⏳ لا يوجد حد زمني لهذا الاختبار
            </div>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-16 relative z-10">
        {score === null ? (
          <>
            {autoSubmitted && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-center text-red-700 font-bold">
                ⏰ انتهى الوقت! تم إرسال إجاباتك تلقائياً.
              </div>
            )}

            <div className="glass-card p-6 md:p-8 rounded-[2.5rem] border border-white shadow-2xl space-y-8">
              {(exam.questions || []).map((q, idx) => {
                const answered = answers[q.id] !== null && answers[q.id] !== undefined && answers[q.id] !== '';
                return (
                  <div key={q.id} className="pb-8 border-b border-emerald-950/10 last:border-b-0">
                    <div className="flex items-start gap-3 mb-5">
                      <span className={`flex-shrink-0 w-9 h-9 rounded-2xl flex items-center justify-center text-sm font-black transition-colors
                        ${answered ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-900'}`}>
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        {(!q.promptType || q.promptType === 'text') && (
                          <h4 className="font-extrabold text-xl text-emerald-950 leading-relaxed font-cairo">{q.prompt}</h4>
                        )}
                        {q.promptType === 'image' && q.promptImageUrl && (
                          <>
                            {q.prompt && <p className="font-extrabold text-xl text-emerald-950 mb-3 font-cairo">{q.prompt}</p>}
                            <div className="mb-4 flex justify-center">
                              <img src={q.promptImageUrl} alt={`سؤال ${idx + 1}`}
                                className="max-w-full max-h-72 rounded-2xl border shadow-md" />
                            </div>
                          </>
                        )}
                        <div className="text-xs font-bold text-amber-700 mt-1">
                          درجة السؤال: {q.points ?? 1}
                        </div>
                      </div>
                    </div>

                    {q.type === 'mcq' && (
                      <div className="space-y-3 mr-0 sm:mr-12">
                        {q.options?.map((opt, i) => (
                          <label key={i}
                            className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all font-semibold text-base
                              ${String(answers[q.id]) === String(i)
                                ? 'bg-emerald-50/90 border-emerald-600 text-emerald-950 shadow-sm'
                                : 'bg-white/80 border-emerald-950/10 hover:bg-emerald-50/50 text-slate-700'}`}
                          >
                            <input
                              type="radio"
                              name={q.id}
                              checked={String(answers[q.id]) === String(i)}
                              onChange={() => handleChange(q.id, i)}
                              className="accent-emerald-700 w-5 h-5"
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {q.type !== 'mcq' && (
                      <textarea
                        className="w-full p-4 border border-emerald-950/15 rounded-2xl mr-0 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none resize-none font-medium text-emerald-950 bg-white"
                        rows={3}
                        placeholder="اكتب إجابتك بالتفصيل هنا..."
                        value={answers[q.id] ?? ''}
                        onChange={e => handleChange(q.id, e.target.value)}
                      />
                    )}
                  </div>
                );
              })}

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={submitting}
                  className="flex-1 py-4 arabic-gradient text-white rounded-2xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-60 shadow-md"
                >
                  {submitting ? '⏳ جاري الإرسال...' : '✅ إرسال الإجابات والنتيجة'}
                </button>
                <button
                  onClick={() => navigate(-1)}
                  className="px-6 py-4 bg-white border border-emerald-950/15 text-slate-700 hover:bg-emerald-50 rounded-2xl font-bold transition-all text-base"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Result Card */
          <div className="glass-card p-10 rounded-[2.5rem] border border-white shadow-2xl text-center animate-fade-in">
            {autoSubmitted && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 font-bold text-sm">
                ⏰ تم الإرسال تلقائياً بعد انتهاء وقت الاختبار
              </div>
            )}
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-3xl font-black text-emerald-950 mb-2 font-cairo">أحسنت! اكتمل الاختبار</h3>
            <p className="text-slate-600 font-semibold mb-6">تم تسجيل إجاباتك بنجاح ونقلها للمعلم.</p>

            <div className="inline-block bg-emerald-50 border border-emerald-200 rounded-3xl px-12 py-8 mb-8 shadow-sm">
              <div className="text-6xl font-black text-emerald-950 font-alexandria mb-1">{score}</div>
              <div className="text-slate-600 font-bold text-base">من إجمالي {maxScore} درجة</div>
              <div className="mt-4 w-64 bg-emerald-200 rounded-full h-3 mx-auto overflow-hidden">
                <div
                  className="gold-gradient h-3 rounded-full transition-all duration-700"
                  style={{ width: `${maxScore > 0 ? Math.round((score / maxScore) * 100) : 0}%` }}
                />
              </div>
              <div className="text-base text-amber-700 font-black mt-3">
                النسبة المئوية: {maxScore > 0 ? Math.round((score / maxScore) * 100) : 0}%
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/')}
                className="px-8 py-3.5 arabic-gradient text-white rounded-2xl font-bold shadow-md hover:shadow-lg transition-all"
              >
                العودة للرئيسية
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentExamPage;
