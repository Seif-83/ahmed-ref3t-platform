import React from 'react';
import { useContentStore } from '../useContentStore';

const Hero: React.FC = () => {
  const { siteSettings } = useContentStore();

  return (
    <div className="relative overflow-hidden pt-20 pb-32 z-10 bg-transparent">
      {/* Soft Glows */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[40rem] h-[40rem] bg-sky-100 rounded-full blur-[100px] opacity-40"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[30rem] h-[30rem] bg-teal-100 rounded-full blur-[100px] opacity-40"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Text Section (7 Columns on Large Screens) */}
          <div className="lg:col-span-7 text-right order-1">
            <h1 className="text-5xl lg:text-7xl font-black text-gray-900 leading-tight mb-8">
              <span className="block mb-4 text-gray-800">العربية تفتح لك أبوابها مع</span>
              <span className="block science-gradient bg-clip-text text-transparent">أحمد رفعت</span>
            </h1>
            <p className="mt-8 text-2xl text-gray-600 leading-relaxed max-w-2xl font-medium">
              دروس عربية مبسطة، تمارين تفاعلية، ومتابعة دقيقة لكل طالب في رحلة تعلم اللغة العربية.
            </p>
            <div className="mt-12 flex flex-wrap gap-6 justify-center lg:justify-start">
              <a href="https://wa.me/201211143632" className="px-12 py-5 science-gradient text-white text-xl font-bold rounded-[2rem] shadow-2xl shadow-sky-500/40 hover:scale-105 transition-all flex items-center gap-3">
                <span>تواصل مع معلم العربية</span>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </a>
            </div>
          </div>

          {/* Image Section (5 Columns on Large Screens) */}
          <div className="lg:col-span-5 relative order-2">
            <div className="relative mx-auto w-full rounded-[3rem] shadow-2xl overflow-hidden ring-12 ring-white/50 backdrop-blur-sm">
              <img
                className="w-full object-cover aspect-video lg:aspect-square"
                src={siteSettings.heroImage}
                alt="Math Learning"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-sky-900/40 via-transparent to-transparent"></div>
            </div>
            {/* Floating Element */}
            <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-3xl shadow-2xl animate-science-float hidden md:block">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-sky-100 rounded-2xl flex items-center justify-center text-2xl">📐</div>
                <div>
                  <div className="text-sm font-bold text-gray-900">دروس تفاعلية</div>
                  <div className="text-xs text-gray-500">فهم عميق لكل مسألة</div>
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
