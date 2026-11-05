import React from 'react';
import { Sparkles, MessageCircle, Mail, Phone } from 'lucide-react';

interface TeacherProfileBannerProps {
  className?: string;
  onOpenContact?: () => void;
}

export const TeacherProfileBanner: React.FC<TeacherProfileBannerProps> = ({
  className = '',
  onOpenContact,
}) => {
  return (
    <div
      aria-label="ข้อมูลอาจารย์ผู้สอนประจำรายวิชา"
      className={`bg-[#0A1124] border border-[#162038] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 sm:gap-5 shadow-sm ${className}`}
    >
      {/* Profile portrait with thin single-line neon-green circular ring */}
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0">
        <img
          src="/assets/professor_portrait_sharp.png"
          alt="อาจารย์ฐิติวัสส์ กาญจนพิมาย"
          className="w-full h-full object-cover rounded-full border-[1.5px] border-[#00E599] select-none"
        />
      </div>

      {/* Thai Name & Affiliation Hierarchy */}
      <div className="min-w-0 flex-1 text-center sm:text-left space-y-1">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
          <p className="text-xs sm:text-sm font-semibold text-[#00E599] tracking-wide">
            อาจารย์ผู้สอนประจำรายวิชา
          </p>
          <span className="hidden sm:inline text-slate-700">·</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 font-medium hidden sm:inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ห้องปฏิบัติการ อาคาร 14
          </span>
        </div>

        <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight leading-tight">
          อาจารย์ฐิติวัสส์ กาญจนพิมาย
        </h2>

        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          สาขาวิชาอุตสาหกรรมศิลป์ · คณะเทคโนโลยีอุตสาหกรรม · มหาวิทยาลัยราชภัฏนครราชสีมา
        </p>
      </div>

      {/* Quick Action / Contact Info */}
      {onOpenContact && (
        <button
          type="button"
          onClick={onOpenContact}
          className="min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700/80 inline-flex items-center gap-2 transition-all shrink-0 active:scale-95"
        >
          <MessageCircle className="w-4 h-4 text-emerald-400" />
          <span>ช่องทางติดต่อ</span>
        </button>
      )}
    </div>
  );
};
