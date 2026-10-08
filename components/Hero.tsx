import React from 'react';
import { useContentStore } from '../useContentStore';

const Hero: React.FC = () => {
  const { siteSettings } = useContentStore();

  const handleScrollToLevels = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const levelsSection = document.getElementById('levels');
    if (levelsSection) {
      levelsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="relative overflow-hidden py-16 lg:py-24 z-10">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 rounded-full bg-emerald-600/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-10 -left-20 w-96 h-96 rounded-full bg-amber-500/10 blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Text content side */}
          <div className="lg:col-span-7 text-right order-1">
            {/* Top Pill Badge */}
            <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-emerald-800/15 bg-white/80 px-4 py-2 text-sm font-bold text-emerald-950 shadow-sm backdrop-blur-md">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <span className="font-alexandria font-semibold text-emerald-900">منصة تعليم اللغة العربية المعتمدة</span>
              <span className="bg-emerald-100 text-emerald-850 px-2.5 py-0.5 rounded-full text-xs font-bold">2025/2026</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-4xl font-black text-emerald-950 leading-snug sm:leading-relaxed mb-6 font-cairo">
              <span className="block mb-3 text-emerald-950 font-black">
                العربية تفتح لك أبواب التميز مع
              </span>
              <span className="inline-block text-amber-400 font-black relative">
                <span className="gold-gradient-text">الأستاذ أحمد رفعت</span>
              </span>
            </h1>

            {/* Description */}
            <p className="mt-4 text-base sm:text-lg lg:text-xl text-slate-700 leading-relaxed max-w-2xl font-semibold">
              شرح مبسط وشامل لمناهج اللغة العربية، تدريبات تفاعلية مستمرة، ومتابعة دقيقة تضمن لك أعلى الدرجات في النحو، البلاغة، والقراءة.
            </p>

            {/* Action Buttons */}
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-start items-stretch sm:items-center">
              <a
                href="https://wa.me/201211143632"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 arabic-gradient text-white text-base sm:text-lg font-bold rounded-2xl shadow-xl shadow-emerald-950/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 border border-emerald-400/20 group text-center"
              >
                <span>💬 تواصل عبر الواتساب</span>
              </a>

              <button
                type="button"
                onClick={handleScrollToLevels}
                className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-white/90 hover:bg-white text-emerald-950 text-base sm:text-lg font-bold rounded-2xl shadow-sm border border-emerald-950/10 hover:border-emerald-950/30 transition-all duration-300 flex items-center justify-center gap-2 text-center active:scale-[0.98] cursor-pointer"
              >
                <span>📖 استعرض المراحل الدراسية</span>
              </button>
            </div>

            {/* Key Feature Stats Pills */}
            <div className="mt-10 sm:mt-12 pt-6 sm:pt-8 border-t border-emerald-950/10 grid grid-cols-3 gap-2 sm:gap-4 max-w-lg">
              <div className="flex flex-col text-right">
                <span className="text-xl sm:text-2xl font-black text-emerald-950 font-alexandria mb-1">100%</span>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-600">شرح مبسط وواضح</span>
              </div>
              <div className="flex flex-col text-right border-r border-emerald-950/10 pr-2 sm:pr-4">
                <span className="text-xl sm:text-2xl font-black text-amber-700 font-alexandria mb-1">تفاعلي</span>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-600">اختبارات إلكترونية</span>
              </div>
              <div className="flex flex-col text-right border-r border-emerald-950/10 pr-2 sm:pr-4">
                <span className="text-xl sm:text-2xl font-black text-emerald-950 font-alexandria mb-1">مذكرات</span>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-600">ملخصات PDF شاملة</span>
              </div>
            </div>
          </div>

          {/* Teacher Image / Visual Display */}
          <div className="lg:col-span-5 relative order-2 mt-4 lg:mt-0">
            {/* Golden Frame Accent Glow */}
            <div className="absolute -inset-3 rotate-2 rounded-[3rem] bg-gradient-to-tr from-amber-400/30 via-emerald-600/25 to-amber-300/40 blur-md pointer-events-none"></div>

            {/* Flexible Portrait Card Container */}
            <div className="relative mx-auto w-full max-w-sm sm:max-w-md lg:max-w-none aspect-[4/5] rounded-[2.5rem] shadow-2xl overflow-hidden border-4 border-white bg-emerald-950 group">
              <img
                className="w-full h-full object-cover object-top sm:object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                src={siteSettings.heroImage}
                alt="الأستاذ أحمد رفعت - معلم اللغة العربية"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/85 via-emerald-950/10 to-transparent"></div>

              
            </div>

            {/* Floating Info Pill 1 */}
            <div className="absolute -bottom-4 -right-2 sm:-bottom-6 sm:-right-6 bg-white/95 backdrop-blur-md p-3 sm:p-4 rounded-2xl shadow-xl border border-emerald-900/10 flex items-center gap-2.5 sm:gap-3 animate-float-slow z-20">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl gold-gradient text-emerald-950 font-bold flex items-center justify-center text-lg sm:text-xl shadow-md flex-shrink-0">
                🏆
              </div>
              <div className="text-right">
                <div className="text-xs sm:text-sm font-bold text-emerald-950">تفوق في الإعراب والنحو</div>
                <div className="text-[10px] sm:text-xs font-medium text-emerald-700">أساليب ميسرة للفهم السريع</div>
              </div>
            </div>

            {/* Floating Info Pill 2 */}
            <div className="absolute -top-4 -left-2 sm:-top-6 sm:-left-6 bg-white/95 backdrop-blur-md p-2.5 sm:p-3.5 rounded-2xl shadow-xl border border-emerald-900/10 flex items-center gap-2.5 sm:gap-3 z-20">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-100 text-emerald-900 font-bold flex items-center justify-center text-sm sm:text-base flex-shrink-0">
                ✍️
              </div>
              <div className="text-right">
                <div className="text-xs font-extrabold text-emerald-950">متابعة مستمرة</div>
                <div className="text-[10px] sm:text-[11px] font-semibold text-amber-700">لكافة المستويات</div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default Hero;
