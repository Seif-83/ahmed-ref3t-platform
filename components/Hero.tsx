import React from 'react';
import { useContentStore } from '../useContentStore';

const Hero: React.FC = () => {
  const { siteSettings } = useContentStore();

  return (
    <div className="relative overflow-hidden pt-20 pb-32 z-10 bg-transparent">
      <div className="absolute inset-0 arabic-pattern opacity-70"></div>
      <div className="absolute -top-48 -right-24 w-[36rem] h-[36rem] rounded-full bg-emerald-900/10 blur-3xl"></div>
      <div className="absolute -bottom-48 -left-24 w-[36rem] h-[36rem] rounded-full bg-amber-300/20 blur-3xl"></div>
      <div className="absolute right-[8%] top-24 h-24 w-24 rounded-full border border-amber-300/50 animate-arabic-drift"></div>
      <div className="absolute left-[12%] top-40 h-16 w-16 rotate-45 border border-emerald-700/20"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 text-right order-1">
            <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-emerald-900/10 bg-white/75 px-5 py-2 text-sm font-bold text-emerald-800 shadow-sm backdrop-blur">
              <span className="arabic-ornament h-7 w-7"></span>
              <span>منصة تعليم اللغة العربية</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-black text-emerald-950 leading-tight mb-8">
              <span className="block mb-4 text-emerald-900">العربية تفتح لك أبوابها مع</span>
              <span className="block arabic-gradient bg-clip-text text-transparent">أحمد رفعت</span>
            </h1>
            <p className="mt-8 text-2xl text-emerald-950/70 leading-relaxed max-w-2xl font-medium">
              دروس عربية مبسطة، تمارين تفاعلية، ومتابعة دقيقة لكل طالب في رحلة تعلم اللغة العربية.
            </p>
            <div className="mt-12 flex flex-wrap gap-6 justify-center lg:justify-start">
              <a href="https://wa.me/201211143632" className="px-12 py-5 arabic-gradient text-white text-xl font-bold rounded-[2rem] shadow-2xl shadow-emerald-900/25 hover:scale-105 transition-all flex items-center gap-3">
                <span>تواصل مع معلم العربية</span>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 relative order-2">
            <div className="absolute -inset-4 rotate-2 rounded-[3.5rem] border border-amber-300/50 bg-amber-100/30"></div>
            <div className="relative mx-auto w-full rounded-[3rem] shadow-2xl overflow-hidden ring-12 ring-white/50 backdrop-blur-sm">
              <img
                className="w-full object-cover aspect-video lg:aspect-square"
                src={siteSettings.heroImage}
                alt="تعلم اللغة العربية"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/70 via-transparent to-transparent"></div>
              <div className="absolute bottom-5 right-5 end-5 rounded-2xl border border-white/25 bg-white/15 px-5 py-3 text-white backdrop-blur-md">
                <p className="text-xs font-bold tracking-wide text-amber-200">دروسك المعاصرة</p>
                <p className="text-lg font-black">تقدمك يبدأ من هنا</p>
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-3xl shadow-2xl animate-arabic-drift hidden md:block">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-amber-100 text-2xl">📖</div>
                <div>
                  <div className="text-sm font-bold text-emerald-950">دروس تفاعلية</div>
                  <div className="text-xs text-emerald-700">فهم عربي أصيل لكلمة واحدة</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
