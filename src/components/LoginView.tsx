import React, { useState } from 'react';
import {
  GraduationCap,
  ShieldCheck,
  Lock,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  Camera,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { AuthUser, SocialProvider, UserRole } from '../types';
import { NrruCrest } from './NrruVisuals';

interface LoginViewProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.STUDENT);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingProvider, setLoadingProvider] = useState<SocialProvider | 'manual' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Student First-Time Binding State
  const [showStudentBindingModal, setShowStudentBindingModal] = useState<boolean>(false);
  const [pendingProvider, setPendingProvider] = useState<SocialProvider>('google');
  const [studentIdInput, setStudentIdInput] = useState<string>('6640508101');
  const [studentNameInput, setStudentNameInput] = useState<string>('นายสมชาย ใจดี');
  const [isScanningForm, setIsScanningForm] = useState<boolean>(false);
  const [scannedResult, setScannedResult] = useState<{
    student_id?: string;
    full_name?: string;
    faculty?: string;
    major?: string;
    academic_year?: string;
    section?: string;
  } | null>(null);
  const formFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileScan = async (file: File) => {
    setIsScanningForm(true);
    setErrorMessage(null);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const res = await fetch('/api/ai/scan-student-form', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: base64,
              mimeType: file.type || 'image/png',
            }),
          });
          if (res.ok) {
            const data = await res.json();
            setScannedResult(data);
            if (data.student_id) setStudentIdInput(data.student_id);
            if (data.full_name) setStudentNameInput(data.full_name);
          }
        } finally {
          setIsScanningForm(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setIsScanningForm(false);
    }
  };

  // Instructor Custom Email
  const [instructorEmail, setInstructorEmail] = useState<string>('thitiwas.k@nrru.ac.th');

  const handleSocialLogin = async (provider: SocialProvider) => {
    setErrorMessage(null);
    setIsLoading(true);
    setLoadingProvider(provider);

    // Simulate realistic OAuth handshake latency (300ms)
    await new Promise((resolve) => setTimeout(resolve, 350));

    if (selectedRole === UserRole.INSTRUCTOR) {
      if (provider !== 'google') {
        setIsLoading(false);
        setLoadingProvider(null);
        setErrorMessage('ตามระเบียบรักษาความปลอดภัยของมหาวิทยาลัย อาจารย์ผู้สอนต้องเข้าสู่ระบบผ่าน Google Workspace โดเมน @nrru.ac.th เท่านั้น');
        return;
      }

      // Check institutional domain
      if (!instructorEmail.toLowerCase().endsWith('@nrru.ac.th')) {
        setIsLoading(false);
        setLoadingProvider(null);
        setErrorMessage('อีเมลผู้สอนต้องลงท้ายด้วย @nrru.ac.th เท่านั้นเพื่อยืนยันสิทธิ์บริหารวิชา');
        return;
      }

      const instructorUser: AuthUser = {
        id: 'INS-01',
        role: UserRole.INSTRUCTOR,
        fullName: 'ผศ.ฐิติวัสส์ กาญจนพิมาย',
        identifier: instructorEmail,
        email: instructorEmail,
        majorOrDept: 'สาขาวิชาอุตสาหกรรมศิลป์ คณะเทคโนโลยีอุตสาหกรรม',
        provider: 'google',
      };

      setIsLoading(false);
      setLoadingProvider(null);
      onLoginSuccess(instructorUser);
    } else {
      // Student login: If not yet bound or user requests, open account binding step
      setPendingProvider(provider);
      setShowStudentBindingModal(true);
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  const handleCompleteStudentBinding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentIdInput.trim() || studentIdInput.trim().length < 8) {
      setErrorMessage('กรุณาระบุรหัสนักศึกษา 10 หลักให้ถูกต้อง');
      return;
    }

    const studentUser: AuthUser = {
      id: `STU-${studentIdInput}`,
      role: UserRole.STUDENT,
      fullName: studentNameInput || 'นายสมชาย ใจดี',
      identifier: studentIdInput,
      email: `${studentIdInput}@student.nrru.ac.th`,
      majorOrDept: 'สาขาวิชาอุตสาหกรรมศิลป์',
      yearLevel: 'ชั้นปีที่ 3',
      provider: pendingProvider,
    };

    setShowStudentBindingModal(false);
    onLoginSuccess(studentUser);
  };

  const handleQuickDemoLogin = (role: UserRole) => {
    if (role === UserRole.STUDENT) {
      onLoginSuccess({
        id: 'STU-6640508101',
        role: UserRole.STUDENT,
        fullName: 'นายสมชาย ใจดี',
        identifier: '6640508101',
        email: '6640508101@student.nrru.ac.th',
        majorOrDept: 'สาขาวิชาอุตสาหกรรมศิลป์',
        yearLevel: 'ชั้นปีที่ 3',
        provider: 'line',
      });
    } else {
      onLoginSuccess({
        id: 'INS-01',
        role: UserRole.INSTRUCTOR,
        fullName: 'ผศ.ฐิติวัสส์ กาญจนพิมาย',
        identifier: 'thitiwas.k@nrru.ac.th',
        email: 'thitiwas.k@nrru.ac.th',
        majorOrDept: 'สาขาวิชาอุตสาหกรรมศิลป์ คณะเทคโนโลยีอุตสาหกรรม',
        provider: 'google',
      });
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-8 px-4 sm:px-6">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
            <NrruCrest className="w-14 h-14" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">
              เข้าสู่ระบบ MaKrubNRRU
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              ระบบเช็คชื่อ Dynamic QR และวิเคราะห์การเรียน คณะเทคโนโลยีอุตสาหกรรม NRRU
            </p>
          </div>
        </div>

        {/* Role Selector Tabs (Zero-Pill segmented control) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-1.5 flex gap-1 shadow-sm">
          <button
            type="button"
            onClick={() => {
              setSelectedRole(UserRole.STUDENT);
              setErrorMessage(null);
            }}
            className={`flex-1 min-h-[46px] rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all ${
              selectedRole === UserRole.STUDENT
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>นักศึกษา (Student)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole(UserRole.INSTRUCTOR);
              setErrorMessage(null);
            }}
            className={`flex-1 min-h-[46px] rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all ${
              selectedRole === UserRole.INSTRUCTOR
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>อาจารย์ผู้สอน (Instructor)</span>
          </button>
        </div>

        {/* Main Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 space-y-5 shadow-lg">
          {selectedRole === UserRole.STUDENT ? (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-sm font-semibold text-slate-100">
                  เลือกช่องทาง Social Login สำหรับนักศึกษา
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  เชื่อมต่อด้วยบัญชีที่ใช้งานสะดวกบนโทรศัพท์มือถือ เพื่อรับการแจ้งเตือนสิทธิ์สอบ
                </p>
              </div>

              {/* LINE Login Button (Primary on Thai mobile) */}
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleSocialLogin('line')}
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-[#06C755] hover:bg-[#05b34c] text-white font-semibold text-sm inline-flex items-center justify-center gap-3 transition-colors shadow-sm disabled:opacity-60"
              >
                {/* Official LINE SVG Icon */}
                <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M19.365 9.864c0-4.062-4.195-7.364-9.365-7.364s-9.365 3.302-9.365 7.364c0 3.639 3.256 6.699 7.653 7.243.298.065.703.197.805.453.092.23.06.59.03.822l-.128.775c-.039.23-.182.9.79.491.972-.408 5.251-3.092 7.165-5.295 1.551-1.742 2.415-3.045 2.415-4.489zm-13.435 2.115h-1.259a.455.455 0 0 1-.455-.455v-3.32c0-.251.204-.455.455-.455h1.259c.251 0 .455.204.455.455s-.204.455-.455.455h-.804v.975h.804c.251 0 .455.204.455.455s-.204.455-.455.455h-.804v.975h.804c.251 0 .455.204.455.455s-.204.46-.455.46zm2.348 0h-.455a.455.455 0 0 1-.455-.455v-3.32c0-.251.204-.455.455-.455s.455.204.455.455v3.32c0 .251-.204.455-.455.455zm3.766 0h-.455a.455.455 0 0 1-.455-.455v-1.895l-1.398 2.179a.454.454 0 0 1-.383.209.455.455 0 0 1-.455-.455v-3.32c0-.251.204-.455.455-.455s.455.204.455.455v1.895l1.398-2.179a.455.455 0 0 1 .783.318v3.32a.455.455 0 0 1-.445.428zm3.018-.975h-.804v-.975h.804c.251 0 .455.204.455.455s-.204.455-.455.455zm.455-1.885c0 .251-.204.455-.455.455h-.804v-.91h.804c.251 0 .455.204.455.455zm0 2.86a.455.455 0 0 1-.455.455h-1.259a.455.455 0 0 1-.455-.455v-3.32c0-.251.204-.455.455-.455h1.259c.251 0 .455.204.455.455s-.204.455-.455.455h-.804v.975h.804c.251 0 .455.204.455.455z"/>
                </svg>
                <span>
                  {loadingProvider === 'line' ? 'กำลังเชื่อมต่อ LINE...' : 'เข้าสู่ระบบด้วย LINE'}
                </span>
              </button>

              {/* Google Login Button */}
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleSocialLogin('google')}
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-100 font-semibold text-sm inline-flex items-center justify-center gap-3 transition-colors disabled:opacity-60"
              >
                {/* Official Google Color SVG */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>
                  {loadingProvider === 'google' ? 'กำลังเชื่อมต่อ Google...' : 'เข้าสู่ระบบด้วย Google'}
                </span>
              </button>

              {/* Facebook Login Button */}
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleSocialLogin('facebook')}
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-semibold text-sm inline-flex items-center justify-center gap-3 transition-colors shadow-sm disabled:opacity-60"
              >
                <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>
                  {loadingProvider === 'facebook' ? 'กำลังเชื่อมต่อ Facebook...' : 'เข้าสู่ระบบด้วย Facebook'}
                </span>
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin(UserRole.STUDENT)}
                  className="text-xs text-amber-400 hover:text-amber-300 font-medium inline-flex items-center gap-1 underline underline-offset-4"
                >
                  <span>เข้าสู่ระบบทันทีแบบด่วน (นายสมชาย ใจดี · 6640508101)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold">
                  <Lock className="w-3.5 h-3.5" />
                  <span>มาตรการความปลอดภัยระดับสถาบัน (Enterprise RBAC)</span>
                </div>
                <h2 className="text-sm font-semibold text-slate-100 mt-1">
                  การยืนยันตัวตนสำหรับอาจารย์ประจำรายวิชา
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  อนุญาตเฉพาะบัญชีอีเมล Google Workspace ของมหาวิทยาลัยราชภัฏนครราชสีมา (@nrru.ac.th) เท่านั้น
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  อีเมลคณาจารย์ (@nrru.ac.th)
                </label>
                <input
                  type="email"
                  value={instructorEmail}
                  onChange={(e) => setInstructorEmail(e.target.value)}
                  placeholder="thitiwas.k@nrru.ac.th"
                  className="w-full min-h-[46px] px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Single Approved Institutional Method */}
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleSocialLogin('google')}
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
              >
                <ShieldCheck className="w-5 h-5 text-slate-950 shrink-0" />
                <span>
                  {loadingProvider === 'google' ? 'กำลังยืนยันสิทธิ์ NRRU...' : 'เข้าสู่ระบบด้วย Google (@nrru.ac.th)'}
                </span>
              </button>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  อาจารย์ผู้สอนจะได้รับสิทธิ์เปิดห้อง Dynamic QR Code, กำหนดเกณฑ์ตัดสาย และตรวจประเมินคะแนนโครงงาน
                </span>
              </div>

              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin(UserRole.INSTRUCTOR)}
                  className="text-xs text-amber-400 hover:text-amber-300 font-medium inline-flex items-center gap-1 underline underline-offset-4"
                >
                  <span>เข้าสู่ระบบทันทีแบบด่วน (ผศ.ฐิติวัสส์ กาญจนพิมาย)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {errorMessage && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800 text-xs text-rose-200 flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-500">
          ความปลอดภัยข้อมูลส่วนบุคคลตามมาตรฐาน PDPA · มหาวิทยาลัยราชภัฏนครราชสีมา
        </p>
      </div>

      {/* Student First-Time Social Account Binding Modal */}
      {showStudentBindingModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div className="w-full sm:max-w-md bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl p-6 space-y-5">
            <div className="w-10 h-1.5 bg-slate-700 rounded-full mx-auto sm:hidden" />
            <div>
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                <GraduationCap className="w-4 h-4" />
                <span>ยืนยันข้อมูลครั้งแรก (Account Binding)</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mt-1">
                ผูกบัญชี {pendingProvider.toUpperCase()} กับรหัสนักศึกษา
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                เพื่อป้องกันการสแกน QR Code เช็คชื่อแทนกัน กรุณาระบุรหัสนักศึกษา NRRU ของท่าน
              </p>
            </div>

            <form onSubmit={handleCompleteStudentBinding} className="space-y-4">
              {/* Gemini Multimodal OCR Form Scanner */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>สแกนข้อมูลจากฟอร์ม / บัตรนักศึกษา</span>
                  </span>
                  <span className="text-[10px] text-amber-400 font-mono tracking-wider">Gemini 2.5 Flash</span>
                </div>

                <input
                  ref={formFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileScan(e.target.files[0]);
                    }
                  }}
                />

                <button
                  type="button"
                  disabled={isScanningForm}
                  onClick={() => formFileInputRef.current?.click()}
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-dashed border-slate-700 hover:border-amber-400 bg-slate-900/60 hover:bg-amber-400/5 text-xs text-slate-300 hover:text-amber-300 transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  {isScanningForm ? (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                      <span>Gemini กำลังอ่านข้อมูลรูปภาพ...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 text-amber-400" />
                      <span>อัปโหลดรูปภาพฟอร์มประวัติ (Auto-Fill)</span>
                    </>
                  )}
                </button>

                {scannedResult && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5 leading-snug">
                      <p className="font-semibold text-emerald-200">
                        ดึงข้อมูลสำเร็จ: {scannedResult.faculty || 'คณะเทคโนโลยีอุตสาหกรรม'}
                      </p>
                      <p className="text-emerald-400/80">
                        {scannedResult.major || 'สาขาวิชาอุตสาหกรรมศิลป์'} · {scannedResult.academic_year || 'ชั้นปีที่ 3'} {scannedResult.section ? `(${scannedResult.section})` : ''}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  รหัสนักศึกษา 10 หลัก
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={studentIdInput}
                  onChange={(e) => setStudentIdInput(e.target.value)}
                  placeholder="เช่น 6640508101"
                  className="w-full min-h-[46px] px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 font-mono text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  ชื่อ-นามสกุล นักศึกษา
                </label>
                <input
                  type="text"
                  required
                  value={studentNameInput}
                  onChange={(e) => setStudentNameInput(e.target.value)}
                  placeholder="เช่น นายสมชาย ใจดี"
                  className="w-full min-h-[46px] px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStudentBindingModal(false)}
                  className="flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-semibold"
                >
                  ยืนยันและเข้าสู่ระบบ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
