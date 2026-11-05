import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  Upload,
  Check,
  User,
  Mail,
  GraduationCap,
  Building,
  Sparkles,
  RefreshCw,
  LogOut,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { AuthUser, UserRole } from '../types';

interface EditProfileModalProps {
  isOpen: boolean;
  currentUser: AuthUser;
  onClose: () => void;
  onSaveProfile: (updatedUser: AuthUser) => void;
  onLogout?: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onSaveProfile,
  onLogout,
}) => {
  const [fullName, setFullName] = useState<string>(currentUser.fullName);
  const [email, setEmail] = useState<string>(currentUser.email || '');
  const [majorOrDept, setMajorOrDept] = useState<string>(
    currentUser.majorOrDept || 'สาขาวิชาอุตสาหกรรมศิลป์ คณะเทคโนโลยีอุตสาหกรรม'
  );
  const [yearLevel, setYearLevel] = useState<string>(
    currentUser.yearLevel || (currentUser.role === UserRole.STUDENT ? 'ชั้นปีที่ 3' : 'อาจารย์ประจำสาขาวิชา')
  );
  const [avatarUrl, setAvatarUrl] = useState<string>(currentUser.avatarUrl || '');
  const [role, setRole] = useState<UserRole>(currentUser.role);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle local file upload (converts to Data URL for instant live preview & state persistence)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('กรุณาเลือกไฟล์รูปภาพที่ถูกต้อง (PNG, JPG, WEBP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('ขนาดไฟล์รูปภาพต้องไม่เกิน 5MB');
      return;
    }

    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetAvatar = () => {
    setAvatarUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMessage('กรุณากรอกชื่อ-นามสกุล ที่แสดงในระบบ');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const updated: AuthUser = {
      ...currentUser,
      fullName: fullName.trim(),
      email: email.trim(),
      majorOrDept: majorOrDept.trim(),
      yearLevel: yearLevel.trim(),
      avatarUrl: avatarUrl.trim(),
      role,
    };

    try {
      // Send update to backend proxy
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });

      if (!res.ok) {
        // Still proceed with local optimistic update
      }
    } catch {
      // Offline fallback
    } finally {
      setIsSaving(false);
      setSaveSuccess(true);
      onSaveProfile(updated);

      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 700);
    }
  };

  // Preset sample avatars for quick testing
  const presetAvatars = [
    {
      name: 'อาจารย์ฐิติวัสส์ (Official)',
      url: '/assets/professor_portrait_sharp.png',
    },
    {
      name: 'สไตล์การ์ตูน AI นักศึกษา',
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    },
    {
      name: 'นักศึกษาชาย วิศวกรรม',
      url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&q=80',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-profile-modal-title"
    >
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 my-auto">
        {/* Header Bar */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="space-y-1">
            <h2
              id="edit-profile-modal-title"
              className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2"
            >
              <span>แก้ไขข้อมูลโปรไฟล์ (Edit Profile)</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 font-medium">
                MaKrubNRRU
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              จัดการชื่อที่แสดง รูปภาพประจำตัว และข้อมูลการติดต่อในระบบ
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่างแก้ไขโปรไฟล์"
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. Avatar Upload & Preview Section */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-slate-950/70 border border-slate-800/90">
            {/* Circular Preview with Neon Highlight */}
            <div className="relative group shrink-0">
              <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full overflow-hidden border-2 border-[#00E599] shadow-[0_0_16px_rgba(0,229,153,0.3)] bg-slate-900 flex items-center justify-center">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={fullName}
                    className="w-full h-full object-cover select-none"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-amber-400 to-amber-600 text-slate-950 font-bold text-2xl flex items-center justify-center select-none">
                    {fullName.slice(0, 2)}
                  </div>
                )}
              </div>

              {/* Quick overlay change button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="อัปโหลดรูปภาพใหม่"
                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
              >
                <Camera className="w-6 h-6" />
              </button>
            </div>

            {/* Upload Buttons & Presets */}
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                >
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>อัปโหลดรูปใหม่</span>
                </button>

                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleResetAvatar}
                    className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-800 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ใช้รูปเริ่มต้น</span>
                  </button>
                )}
              </div>

              {/* Presets */}
              <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                <span className="text-[11px] text-slate-400">รูปตัวอย่าง:</span>
                {presetAvatars.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setAvatarUrl(preset.url)}
                    className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800/80 transition-colors"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Text Input Fields */}
          <div className="space-y-4">
            {/* Display Name */}
            <div>
              <label
                htmlFor="profile-fullname"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                ชื่อ-นามสกุล ที่แสดงในระบบ (Display Name) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="profile-fullname"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="เช่น นายสมชาย ใจดี หรือ ผศ.ฐิติวัสส์ กาญจนพิมาย"
                  className="w-full min-h-[44px] pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-400 transition-colors"
                />
              </div>
            </div>

            {/* Identifier & Role Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  รหัสประจำตัว (Student ID / Staff ID)
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={currentUser.identifier}
                  className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-950/50 border border-slate-800/60 rounded-xl font-mono text-sm text-slate-400 cursor-not-allowed select-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  สิทธิ์ผู้ใช้งาน (Role Switch)
                </label>
                <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setRole(UserRole.STUDENT)}
                    className={`flex-1 min-h-[34px] text-xs font-semibold rounded-lg transition-colors ${
                      role === UserRole.STUDENT
                        ? 'bg-amber-400 text-slate-950 shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    นักศึกษา
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole(UserRole.INSTRUCTOR)}
                    className={`flex-1 min-h-[34px] text-xs font-semibold rounded-lg transition-colors ${
                      role === UserRole.INSTRUCTOR
                        ? 'bg-emerald-400 text-slate-950 shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    อาจารย์ผู้สอน
                  </button>
                </div>
              </div>
            </div>

            {/* Email Contact */}
            <div>
              <label
                htmlFor="profile-email"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                อีเมลติดต่อมหาวิทยาลัย (Email)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="เช่น student@nrru.ac.th"
                  className="w-full min-h-[44px] pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-400 transition-colors"
                />
              </div>
            </div>

            {/* Major & Year Level */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label
                  htmlFor="profile-major"
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  สาขาวิชา / ภาควิชา
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="profile-major"
                    type="text"
                    value={majorOrDept}
                    onChange={(e) => setMajorOrDept(e.target.value)}
                    placeholder="สาขาวิชาอุตสาหกรรมศิลป์"
                    className="w-full min-h-[44px] pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-400 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="profile-year"
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  ระดับชั้นปี / ตำแหน่ง
                </label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="profile-year"
                    type="text"
                    value={yearLevel}
                    onChange={(e) => setYearLevel(e.target.value)}
                    placeholder="ชั้นปีที่ 3 หรือ อาจารย์ประจำ"
                    className="w-full min-h-[44px] pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-400 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>บันทึกการเปลี่ยนแปลงโปรไฟล์เรียบร้อยแล้ว</span>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
            {onLogout ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="w-full sm:w-auto min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>ออกจากระบบ</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 sm:flex-none min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-bold transition-all shadow-md inline-flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>กำลังบันทึก...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>บันทึกการเปลี่ยนแปลง</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
