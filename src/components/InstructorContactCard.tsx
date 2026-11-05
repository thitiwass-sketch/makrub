import React, { useState, useEffect } from 'react';
import {
  Mail,
  Phone,
  Copy,
  Check,
  ExternalLink,
  X,
  MessageCircle,
  QrCode,
  Sparkles,
  Clock,
  MapPin,
  Download,
  Share2,
  ArrowLeft,
} from 'lucide-react';

export const INSTRUCTOR_INFO = {
  name: 'อาจารย์ฐิติวัสส์ กาญจนพิมาย',
  roleTag: 'อาจารย์ผู้สอนประจำรายวิชา',
  department: 'สาขาวิชาอุตสาหกรรมศิลป์ · คณะเทคโนโลยีอุตสาหกรรม · มหาวิทยาลัยราชภัฏนครราชสีมา',
  email: 'Thitiwas.k@nrru.ac.th',
  phone: '0803779487',
  displayPhone: '080-377-9487',
  lineId: 'ewjquMRGIP',
  lineAddUrl: 'https://line.me/ti/p/ewjquMRGIP',
  lineQrImage: '/assets/aistudio/Line_iD_bb4d586a.png',
  office: 'อาคาร 14 ชั้น 2 ห้องปฏิบัติการ คณะเทคโนโลยีอุตสาหกรรม',
  officeHours: 'จันทร์ – ศุกร์ 08:30 – 16:30 น. (วันและเวลาราชการ)',
};

interface LineContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LineContactModal: React.FC<LineContactModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(INSTRUCTOR_INFO.lineAddUrl);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="line-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#0F172A] border border-slate-800 rounded-3xl max-w-sm w-full max-h-[92dvh] flex flex-col shadow-2xl relative overflow-hidden my-auto">
        {/* Sticky Top Navigation Bar: Close / Return to Main */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-[#0F172A]/95 backdrop-blur-sm shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-medium inline-flex items-center gap-1.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 active:scale-95"
            aria-label="กลับไปหน้าหลัก"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>กลับหน้าหลัก</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง QR Code LINE และกลับหน้าหลัก"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-4 sm:p-5 text-center overflow-y-auto overscroll-contain space-y-3.5 flex-1">
          {/* LINE Icon Header */}
          <div className="w-12 h-12 rounded-2xl bg-[#06C755]/15 border border-[#06C755]/40 text-[#06C755] flex items-center justify-center mx-auto shadow-sm">
            <MessageCircle className="w-6 h-6 fill-[#06C755]/20" />
          </div>

          <div>
            <h3 id="line-modal-title" className="text-lg sm:text-xl font-bold text-slate-100">
              LINE อาจารย์ผู้สอน
            </h3>
            <p className="text-sm text-emerald-400 font-semibold mt-0.5">
              {INSTRUCTOR_INFO.name}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              สาขาวิชาอุตสาหกรรมศิลป์ คณะเทคโนโลยีอุตสาหกรรม
            </p>
          </div>

          {/* Official Real LINE QR Code Image */}
          <div className="p-3 bg-white rounded-2xl inline-block shadow-lg border-2 border-emerald-500/30">
            <img
              src={INSTRUCTOR_INFO.lineQrImage}
              alt="LINE QR Code อาจารย์ฐิติวัสส์ กาญจนพิมาย"
              className="w-40 h-40 sm:w-48 sm:h-48 mx-auto object-contain select-none"
              loading="eager"
            />
          </div>

          <p className="text-xs text-slate-300 leading-relaxed px-1">
            ใช้กล้องมือถือหรือแอปพลิเคชัน LINE สแกน QR Code เพื่อเพิ่มเพื่อนและติดต่อโดยตรง
          </p>

          {/* LINE Add Link & Copy Box */}
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
            <span className="text-slate-400 truncate max-w-[160px] text-left font-mono pl-1">
              line.me/ti/p/ewjquMRGIP
            </span>
            <button
              type="button"
              onClick={handleCopyLink}
              aria-label="คัดลอกลิงก์ LINE อาจารย์"
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium inline-flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 shrink-0 min-h-[36px]"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">คัดลอกแล้ว</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>คัดลอกลิงก์</span>
                </>
              )}
            </button>
          </div>

          {/* Direct Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <a
              href={INSTRUCTOR_INFO.lineAddUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] px-3 py-2 rounded-xl bg-[#06C755] hover:bg-[#05a847] text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-1.5 transition-all shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 active:scale-95"
            >
              <ExternalLink className="w-4 h-4 shrink-0" />
              <span>เปิดแอป LINE</span>
            </a>

            <a
              href={INSTRUCTOR_INFO.lineQrImage}
              download="Line_QR_Ajarn_Thitiwas.png"
              className="min-h-[44px] px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-1.5 transition-colors border border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 active:scale-95"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>บันทึก QR</span>
            </a>
          </div>

          {/* Consultation hours notice */}
          <div className="text-left text-xs text-slate-400 space-y-1 border-t border-slate-800/80 pt-2.5">
            <div className="flex items-start gap-2">
              <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>ตอบข้อความในวันและเวลาราชการ (08:30 – 16:30 น.)</span>
            </div>
            <div className="flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>กรุณาแจ้ง รหัสนักศึกษา, ชื่อ-สกุล และรายวิชาทุกครั้ง</span>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Dedicated Exit Button: ปิดการใช้งาน / กลับไปหน้าหลัก */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-[#0B132B] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-100 text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all border border-slate-700 shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 active:scale-98"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>ปิดการใช้งาน / กลับไปหน้าหลัก</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface InstructorContactCardProps {
  className?: string;
  showTitle?: boolean;
  isInstructor?: boolean;
}

export const InstructorContactCard: React.FC<InstructorContactCardProps> = ({
  className = '',
  showTitle = false,
  isInstructor = false,
}) => {
  const [copiedItem, setCopiedItem] = useState<'email' | 'phone' | 'line' | null>(null);
  const [isLineModalOpen, setIsLineModalOpen] = useState<boolean>(false);

  const handleCopy = (text: string, type: 'email' | 'phone' | 'line') => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedItem(type);
    setTimeout(() => {
      setCopiedItem(null);
    }, 2500);
  };

  return (
    <section
      aria-labelledby="instructor-contact-heading"
      className={`space-y-4 ${className}`}
    >
      {showTitle && (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2
              id="instructor-contact-heading"
              className="text-base sm:text-lg font-bold text-slate-100 flex flex-wrap items-center gap-2"
            >
              <span>ช่องทางติดต่ออาจารย์ผู้สอน</span>
              <span aria-hidden="true" className="text-slate-600 font-normal">·</span>
              <span className="text-xs text-emerald-400 font-medium tracking-wide">
                LINE Official & ข้อมูลติดต่อ
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              ติดต่อสอบถามเกณฑ์การเข้าเรียน สิทธิ์สอบ การลากิจ/ลาป่วย การส่งโครงงาน หรือกรณีมีเหตุฉุกเฉิน
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsLineModalOpen(true)}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#06C755]/15 hover:bg-[#06C755]/25 border border-[#06C755]/40 text-[#06C755] text-xs font-semibold inline-flex items-center gap-2 transition-all shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06C755]"
          >
            <MessageCircle className="w-4 h-4 fill-[#06C755]/20" />
            <span>สแกน LINE อาจารย์</span>
          </button>
        </div>
      )}

      {/* 1. Header Profile Card */}
      <div className="bg-[#0A1124] border border-[#162038] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 shadow-sm text-center sm:text-left">
        {/* Circular profile photo with sleek thin single-line neon-green ring */}
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0">
          <img
            src="/assets/professor_portrait_sharp.png"
            alt={INSTRUCTOR_INFO.name}
            className="w-full h-full object-cover rounded-full border-[1.5px] border-[#00E599] select-none"
          />
          <div
            className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0A1124]"
            title="อาจารย์ประจำสาขาพร้อมให้คำปรึกษา"
          />
        </div>

        {/* Name and Affiliation Details */}
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs sm:text-sm font-medium text-[#00E599] tracking-wide">
            {INSTRUCTOR_INFO.roleTag}
          </p>
          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight">
            {INSTRUCTOR_INFO.name}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            {INSTRUCTOR_INFO.department}
          </p>
          <p className="text-xs text-slate-500 pt-0.5">
            {INSTRUCTOR_INFO.office}
          </p>
        </div>
      </div>

      {/* 2. Three Action Contact Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: LINE อาจารย์ (Official LINE QR Code) */}
        <div className="bg-slate-900 border border-[#06C755]/30 hover:border-[#06C755]/60 rounded-2xl p-5 flex flex-col justify-between shadow-sm transition-all duration-200 group relative overflow-hidden">
          {/* Subtle gradient highlight */}
          <div className="absolute top-0 right-0 w-28 h-28 bg-[#06C755]/5 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#06C755]/15 border border-[#06C755]/40 flex items-center justify-center text-[#06C755] shrink-0 group-hover:scale-105 transition-transform">
                    <MessageCircle className="w-4 h-4 fill-[#06C755]/20" />
                  </div>
                  <span className="text-xs font-semibold text-[#06C755] tracking-wide">
                    LINE อาจารย์ผู้สอน
                  </span>
                </div>
                <h4 className="text-base sm:text-lg font-bold text-slate-100 mt-2.5 truncate font-mono">
                  LINE Official
                </h4>
              </div>

              {/* Real Official LINE QR Code Thumbnail Button */}
              <button
                type="button"
                onClick={() => setIsLineModalOpen(true)}
                title="คลิกเพื่อดู LINE QR Code ขนาดใหญ่"
                aria-label="เปิด QR Code LINE ขนาดเต็ม"
                className="w-14 h-14 p-1 rounded-xl bg-white border-2 border-[#06C755]/50 hover:border-[#06C755] shadow-sm shrink-0 transition-transform hover:scale-105 cursor-pointer flex items-center justify-center overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06C755] relative"
              >
                <img
                  src={INSTRUCTOR_INFO.lineQrImage}
                  alt="LINE QR Code Thumbnail"
                  className="w-full h-full object-contain"
                />
              </button>
            </div>

            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              สแกน QR Code เพื่อเพิ่มเพื่อนใน LINE ทันที หรือกดปุ่มด้านล่าง
            </p>
          </div>

          {/* Unified Action Button System */}
          <div className="mt-5 flex items-center gap-2">
            <a
              href={INSTRUCTOR_INFO.lineAddUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#06C755]/50 bg-[#06C755]/15 hover:bg-[#06C755]/30 text-[#06C755] text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06C755] shadow-sm text-center"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span>เพิ่มเพื่อน LINE</span>
            </a>

            <button
              type="button"
              onClick={() => setIsLineModalOpen(true)}
              aria-label="เปิด QR Code LINE เต็มหน้าจอ"
              title="เปิด QR Code ขนาดใหญ่"
              className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl border border-slate-700 bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-medium inline-flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06C755] relative shrink-0 shadow-sm"
            >
              <QrCode className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        </div>

        {/* Card 2: อีเมล (EMAIL) */}
        <div className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 flex flex-col justify-between shadow-sm transition-all duration-200 group">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-950/70 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-amber-400 tracking-wide">
                  อีเมล (EMAIL)
                </span>
              </div>
            </div>

            <h4 className="text-base sm:text-lg font-bold text-slate-100 mt-2.5 font-mono break-all leading-snug">
              {INSTRUCTOR_INFO.email}
            </h4>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              ส่งเอกสารราชการ รายงานวิชา หรือแบบร่างโครงงาน
            </p>
          </div>

          {/* Unified Action Button System */}
          <div className="mt-5 flex items-center gap-2">
            <a
              href={`mailto:${INSTRUCTOR_INFO.email}?subject=[MaKrubNRRU]%20ติดต่ออาจารย์ผู้สอน%20(แจ้งรหัสนักศึกษาและรายวิชา)`}
              className="flex-1 min-h-[44px] px-3.5 py-2.5 rounded-xl border border-amber-500/40 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 text-center shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span>ส่งเมล</span>
            </a>

            <button
              type="button"
              onClick={() => handleCopy(INSTRUCTOR_INFO.email, 'email')}
              aria-label="คัดลอกที่อยู่อีเมลอาจารย์"
              title={copiedItem === 'email' ? 'คัดลอกแล้ว!' : 'คัดลอกอีเมล'}
              className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl border border-slate-700 bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-medium inline-flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 relative shrink-0 shadow-sm"
            >
              {copiedItem === 'email' ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4 text-slate-300" />
              )}
              {copiedItem === 'email' && (
                <span className="absolute -top-8 right-0 bg-emerald-600 text-white text-[10px] font-medium py-1 px-2 rounded-md shadow-md whitespace-nowrap animate-in fade-in">
                  คัดลอกแล้ว!
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Card 3: เบอร์โทรศัพท์ติดต่อ */}
        <div className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 flex flex-col justify-between shadow-sm transition-all duration-200 group">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-950/70 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 group-hover:scale-105 transition-transform">
                  <Phone className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-indigo-400 tracking-wide">
                  เบอร์โทรศัพท์ติดต่อ
                </span>
              </div>
            </div>

            <h4 className="text-base sm:text-lg font-bold text-slate-100 mt-2.5 font-mono tabular-nums tracking-wider">
              {INSTRUCTOR_INFO.displayPhone}
            </h4>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              ติดต่อด่วนในวันและเวลาราชการ (08:30 – 16:30 น.)
            </p>
          </div>

          {/* Unified Action Button System */}
          <div className="mt-5 flex items-center gap-2">
            <a
              href={`tel:${INSTRUCTOR_INFO.phone}`}
              className="flex-1 min-h-[44px] px-3.5 py-2.5 rounded-xl border border-indigo-500/40 bg-indigo-950/50 hover:bg-indigo-900/70 text-indigo-200 text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 text-center shadow-sm"
            >
              <Phone className="w-3.5 h-3.5 shrink-0" />
              <span>โทรออก</span>
            </a>

            <button
              type="button"
              onClick={() => handleCopy(INSTRUCTOR_INFO.displayPhone, 'phone')}
              aria-label="คัดลอกเบอร์โทรศัพท์อาจารย์"
              title={copiedItem === 'phone' ? 'คัดลอกแล้ว!' : 'คัดลอกเบอร์โทร'}
              className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl border border-slate-700 bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-medium inline-flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 relative shrink-0 shadow-sm"
            >
              {copiedItem === 'phone' ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4 text-slate-300" />
              )}
              {copiedItem === 'phone' && (
                <span className="absolute -top-8 right-0 bg-emerald-600 text-white text-[10px] font-medium py-1 px-2 rounded-md shadow-md whitespace-nowrap animate-in fade-in">
                  คัดลอกแล้ว!
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Bottom Notice Banner */}
      <div className="bg-slate-900/90 border border-emerald-800/40 rounded-2xl p-4 sm:p-5 text-xs sm:text-sm text-slate-200 leading-relaxed shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="space-y-2 flex-1 min-w-0">
            <p>
              <span className="font-semibold text-emerald-400">
                คำแนะนำการติดต่อผู้สอน:
              </span>{' '}
              กรุณาแจ้ง <strong className="text-amber-300 font-semibold">รหัสนักศึกษา</strong>,{' '}
              <strong className="text-amber-300 font-semibold">ชื่อ–นามสกุล</strong> และ{' '}
              <strong className="text-amber-300 font-semibold">รหัสวิชาเรียน</strong>{' '}
              ทุกครั้งเมื่อติดต่อผ่านทาง LINE เพื่อความสะดวกรวดเร็วในการตรวจสอบข้อมูล
            </p>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2 text-xs text-slate-400">
              <span>ตารางการเรียนการสอนและห้องปฏิบัติการ: ตรวจสอบหรือดึงข้อมูลได้จากระบบสำนักทะเบียน NRRU</span>
              <a
                href="https://reg.nrru.ac.th/registrar/home.ASP?avs1050887615=4"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-medium underline underline-offset-2"
              >
                <span>reg.nrru.ac.th</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Modal */}
      <LineContactModal
        isOpen={isLineModalOpen}
        onClose={() => setIsLineModalOpen(false)}
      />
    </section>
  );
};
