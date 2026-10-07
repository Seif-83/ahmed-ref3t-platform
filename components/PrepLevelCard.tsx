import React from 'react';
import { Link } from 'react-router-dom';
import { PrepData } from '../types';

interface Props {
  data: PrepData;
  isStudentLoggedIn: boolean;
}

const PrepLevelCard: React.FC<Props> = ({ data, isStudentLoggedIn }) => {
  return (
    <div className="group glass-card glass-card-hover rounded-[2.5rem] overflow-hidden flex flex-col h-full border border-white/80 shadow-xl transition-all duration-300">
      
      {/* Card Image Banner */}
      <div className="aspect-[16/9] relative overflow-hidden bg-emerald-950">
        <img
          src={data.image}
          alt={data.titleAr}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out opacity-90 group-hover:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-emerald-950/20 to-transparent"></div>
        
        {/* Stage Badge */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-black text-emerald-950 shadow-md border border-white/50 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <span>{data.title}</span>
        </div>

        {/* Floating Lesson Counter if available */}
        <div className="absolute bottom-3 right-4 left-4 flex justify-between items-center text-white">
          <span className="text-xs font-bold bg-emerald-950/60 backdrop-blur-md px-3 py-1 rounded-xl border border-white/20">
            📚 {data.lessons?.length || 0} دروس متوفرة
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-7 flex-grow flex flex-col justify-between">
        <div>
          <h3 className="text-2xl font-black text-emerald-950 mb-3 font-cairo tracking-tight group-hover:text-amber-700 transition-colors">
            {data.titleAr}
          </h3>
          <p className="text-slate-600 text-sm leading-relaxed mb-6 font-medium line-clamp-3">
            {data.description}
          </p>
        </div>

        {/* Action Buttons */}
        {isStudentLoggedIn && (
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-emerald-950/10">
          <Link
            to={`/level/${data.id}/courses`}
            className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-emerald-50 text-emerald-900 border border-emerald-200/60 hover:arabic-gradient hover:text-white hover:border-transparent transition-all duration-300 group/btn shadow-sm"
          >
            <div className="flex items-center gap-1.5 font-bold text-sm mb-0.5">
              <span>📹</span>
              <span>الفيديوهات</span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 group-hover/btn:text-amber-300">
              مشاهدة الدروس
            </span>
          </Link>

          <Link
            to={`/level/${data.id}/notes`}
            className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-amber-50 text-amber-900 border border-amber-200/60 hover:gold-gradient hover:text-emerald-950 hover:border-transparent transition-all duration-300 group/btn shadow-sm"
          >
            <div className="flex items-center gap-1.5 font-bold text-sm mb-0.5">
              <span>📚</span>
              <span>المذكرات</span>
            </div>
            <span className="text-[11px] font-semibold text-amber-800 group-hover/btn:text-emerald-950">
              تحميل الـ PDF
            </span>
          </Link>
        </div>
        )}

      </div>
    </div>
  );
};

export default PrepLevelCard;
