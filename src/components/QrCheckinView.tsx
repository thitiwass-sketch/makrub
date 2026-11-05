import React, { useEffect, useState, useCallback } from 'react';
import {
  Camera,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Lock,
  Unlock,
  KeyRound,
  ScanLine,
  ShieldCheck,
  Download,
  Printer,
} from 'lucide-react';
import QRCode from 'qrcode';
import {
  AppStateData,
  AttendanceLog,
  Course,
  QrSession,
  StudentRecord,
  UserRole,
} from '../types';
import { DynamicQrSvg } from './NrruVisuals';
import { AutomatedQrVerificationModal } from './AutomatedQrVerificationModal';

interface QrCheckinViewProps {
  state: AppStateData;
  role: UserRole;
  onSessionChange: (session: QrSession) => void;
  onAttendanceUpdated: (
    students: StudentRecord[],
    logs: AttendanceLog[],
    updatedCourse?: Course
  ) => void;
  onCheckInSuccess?: (log: AttendanceLog, course: Course) => void;
}

export const QrCheckinView: React.FC<QrCheckinViewProps> = ({
  state,
  role,
  onSessionChange,
  onAttendanceUpdated,
  onCheckInSuccess,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(15);
  const [manualToken, setManualToken] = useState<string>('');
  const [showManualForm, setShowManualForm] = useState<boolean>(false);
  const [showAutoVerificationModal, setShowAutoVerificationModal] = useState<boolean>(false);
  const [busyAction, setBusyAction] = useState<boolean>(false);
  const [downloadingQr, setDownloadingQr] = useState<boolean>(false);
  const [bannerMsg, setBannerMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const activeCourse =
    state.courses.find((c) => c.code === state.qrSession.courseCode) ??
    state.courses[0];

  const rotateToken = useCallback(
    async (courseCode?: string) => {
      try {
        const res = await fetch('/api/qr-session/rotate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseCode: courseCode ?? state.qrSession.courseCode,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          onSessionChange(data.qrSession);
          setSecondsLeft(15);
        }
      } catch {
        // Keep current token on transient failure
      }
    },
    [state.qrSession.courseCode, onSessionChange]
  );

  // Automatic 15-second Dynamic QR Token rotation when session is open
  useEffect(() => {
    if (!state.qrSession.isOpen) return;

    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          rotateToken();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [state.qrSession.isOpen, rotateToken]);

  const handleSelectCourse = async (newCourseCode: string) => {
    setBannerMsg(null);
    try {
      const res = await fetch('/api/qr-session/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseCode: newCourseCode }),
      });
      if (res.ok) {
        const data = await res.json();
        onSessionChange(data.qrSession);
        setSecondsLeft(15);
      }
    } catch {
      // ignore
    }
  };

  const handleToggleSession = async () => {
    try {
      const res = await fetch('/api/qr-session/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOpen: !state.qrSession.isOpen }),
      });
      if (res.ok) {
        const data = await res.json();
        onSessionChange(data.qrSession);
      }
    } catch {
      // ignore
    }
  };

  const handleThresholdChange = async (minutes: number) => {
    try {
      const res = await fetch('/api/qr-session/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lateThresholdMin: minutes }),
      });
      if (res.ok) {
        const data = await res.json();
        onSessionChange(data.qrSession);
      }
    } catch {
      // ignore
    }
  };

  const handleStudentScanCheckIn = async () => {
    setBusyAction(true);
    setBannerMsg(null);
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: '6640508101',
          courseCode: activeCourse.code,
          method: 'qr_dynamic',
          simulatedLateMin: 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBannerMsg({ type: 'error', text: data.error || 'ไม่สามารถเช็คชื่อได้' });
      } else {
        onAttendanceUpdated(data.students, data.attendanceLogs, data.course);
        onCheckInSuccess?.(data.log, data.course);
        setBannerMsg({
          type: 'success',
          text: `บันทึกการเช็คชื่อวิชา ${activeCourse.code} สำเร็จ เวลา ${data.log.timestamp} น. (ตรงเวลา)`,
        });
      }
    } catch {
      setBannerMsg({ type: 'error', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์' });
    } finally {
      setBusyAction(false);
    }
  };

  const handleManualTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyAction(true);
    setBannerMsg(null);
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: '6640508101',
          courseCode: activeCourse.code,
          tokenInput: manualToken,
          method: 'passcode',
          simulatedLateMin: 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBannerMsg({ type: 'error', text: data.error || 'รหัสไม่ถูกต้อง' });
      } else {
        onAttendanceUpdated(data.students, data.attendanceLogs, data.course);
        onCheckInSuccess?.(data.log, data.course);
        setManualToken('');
        setShowManualForm(false);
        setBannerMsg({
          type: 'success',
          text: `ยืนยันรหัสเช็คชื่อวิชา ${activeCourse.code} สำเร็จ เวลา ${data.log.timestamp} น.`,
        });
      }
    } catch {
      setBannerMsg({ type: 'error', text: 'ไม่สามารถตรวจสอบรหัสเช็คชื่อได้' });
    } finally {
      setBusyAction(false);
    }
  };

  const handleInstructorMarkStudent = async (
    studentId: string,
    status: 'on_time' | 'late' | 'excused'
  ) => {
    try {
      const res = await fetch(`/api/students/${studentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          courseCode: activeCourse.code,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onAttendanceUpdated(data.students, data.attendanceLogs);
      }
    } catch {
      // ignore
    }
  };

  const qrPayload = `KRUBNRRU|${activeCourse.code}|${state.qrSession.token}`;
  const ringCircumference = 2 * Math.PI * 18;
  const ringOffset = ringCircumference * (1 - secondsLeft / 15);

  const courseLogs = state.attendanceLogs.filter(
    (log) => log.courseCode === activeCourse.code
  );

  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) => {
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, width, height, radius);
    } else {
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
    }
  };

  // Download high-resolution print-ready attendance QR poster for classroom use
  const handleDownloadQrImage = async () => {
    try {
      setDownloadingQr(true);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Cannot initialize canvas');

      const width = 1200;
      const height = 1500;
      canvas.width = width;
      canvas.height = height;

      // 1. Clean Crisp White Background for optimal paper printing
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      // 2. Top Header Navy Banner
      ctx.fillStyle = '#0B132B';
      ctx.fillRect(0, 0, width, 220);

      // Gold Accent line
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(0, 214, width, 6);

      // Title & Subtitles
      ctx.fillStyle = '#FBBF24';
      ctx.font = 'bold 34px "Prompt", "IBM Plex Sans Thai", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('มหาวิทยาลัยราชภัฏนครราชสีมา (NRRU)', width / 2, 70);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 44px "Prompt", "IBM Plex Sans Thai", sans-serif';
      ctx.fillText('ใบสแกนเช็คชื่อเข้าชั้นเรียน (Class Attendance QR)', width / 2, 132);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '500 26px "Prompt", "IBM Plex Sans Thai", sans-serif';
      ctx.fillText('สาขาวิชาอุตสาหกรรมศิลป์ · คณะเทคโนโลยีอุตสาหกรรม', width / 2, 182);

      // 3. Course Details Card
      ctx.fillStyle = '#F8FAFC';
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 3;
      ctx.beginPath();
      drawRoundedRect(ctx, 80, 260, width - 160, 210, 24);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 38px "Prompt", "IBM Plex Sans Thai", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${activeCourse.code} : ${activeCourse.name}`, width / 2, 325);

      ctx.fillStyle = '#475569';
      ctx.font = '500 28px "Prompt", "IBM Plex Sans Thai", sans-serif';
      ctx.fillText(`ห้องเรียน/ปฏิบัติการ: ${activeCourse.room}   ·   เวลาเรียน: ${activeCourse.schedule}`, width / 2, 380);

      ctx.fillStyle = '#D97706';
      ctx.font = '600 26px "Prompt", "IBM Plex Sans Thai", sans-serif';
      ctx.fillText(`อาจารย์ผู้สอน: ${activeCourse.instructor || 'อาจารย์ฐิติวัสส์ กาญจนพิมาย'}`, width / 2, 430);

      // 4. Generate High-Resolution QR Code (Large & Sharp for Printing)
      const qrDataUrl = await QRCode.toDataURL(qrPayload, {
        width: 720,
        margin: 1,
        color: {
          dark: '#020617',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H',
      });

      const qrImg = new Image();
      qrImg.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = reject;
        qrImg.src = qrDataUrl;
      });

      // Draw QR Code frame
      const qrSize = 640;
      const qrX = (width - qrSize) / 2;
      const qrY = 510;

      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 4;
      ctx.beginPath();
      drawRoundedRect(ctx, qrX - 20, qrY - 20, qrSize + 40, qrSize + 40, 28);
      ctx.fill();
      ctx.stroke();

      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // Center NRRU Logo Badge
      const badgeSize = 96;
      const badgeX = (width - badgeSize) / 2;
      const badgeY = qrY + (qrSize - badgeSize) / 2;
      ctx.fillStyle = '#0B132B';
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 4;
      ctx.beginPath();
      drawRoundedRect(ctx, badgeX, badgeY, badgeSize, badgeSize, 18);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#F59E0B';
      ctx.font = 'bold 26px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('NRRU', width / 2, badgeY + 56);

      // 5. Token Box & Passcode
      ctx.fillStyle = '#F1F5F9';
      ctx.beginPath();
      drawRoundedRect(ctx, 80, 1200, width - 160, 140, 20);
      ctx.fill();

      ctx.fillStyle = '#64748B';
      ctx.font = '500 24px "Prompt", sans-serif';
      ctx.fillText('รหัส Token ประจำคาบเรียน (หรือกรอกแทนการสแกน):', width / 2, 1245);

      ctx.fillStyle = '#B45309';
      ctx.font = 'bold 44px "JetBrains Mono", monospace';
      ctx.fillText(state.qrSession.token, width / 2, 1305);

      // 6. Footer instructions & Timestamp
      ctx.fillStyle = '#64748B';
      ctx.font = '500 22px "Prompt", sans-serif';
      const printDate = new Date().toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      ctx.fillText(`เอกสารสร้างเมื่อ: ${printDate} น. · ระบบเช็คชื่อ MaKrubNRRU`, width / 2, 1385);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '400 20px "Prompt", sans-serif';
      ctx.fillText('* พิมพ์ภาพนี้ใส่กระดาษ A4 เพื่อให้นักศึกษาสแกนหน้าห้องเรียนหรือโต๊ะปฏิบัติการ *', width / 2, 1425);

      // 7. Trigger Direct Download
      const downloadUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      const fileName = `QR_Attendance_${activeCourse.code}_${state.qrSession.token}.png`;
      downloadLink.href = downloadUrl;
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      setBannerMsg({
        type: 'success',
        text: `ดาวน์โหลดภาพ QR Code (${fileName}) เรียบร้อยแล้ว สามารถนำไฟล์ไปพิมพ์ (Print) ติดหน้าห้องเรียนได้ทันที`,
      });
    } catch (err) {
      console.error('Failed to download QR code image:', err);
      setBannerMsg({
        type: 'error',
        text: 'เกิดข้อผิดพลาดในการดาวน์โหลดภาพ QR Code กรุณาลองใหม่อีกครั้ง',
      });
    } finally {
      setDownloadingQr(false);
    }
  };

  // Browser Print trigger for classroom attendance sheet
  const handlePrintQr = () => {
    QRCode.toDataURL(
      qrPayload,
      {
        width: 500,
        margin: 1,
        color: { dark: '#020617', light: '#FFFFFF' },
        errorCorrectionLevel: 'H',
      },
      (err, url) => {
        if (err || !url) {
          handleDownloadQrImage();
          return;
        }

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          handleDownloadQrImage();
          return;
        }

        printWindow.document.write(`
          <!DOCTYPE html>
          <html lang="th">
          <head>
            <meta charset="utf-8" />
            <title>พิมพ์ QR Code เช็คชื่อ — ${activeCourse.code} ${activeCourse.name}</title>
            <style>
              @page { size: A4 portrait; margin: 12mm; }
              * { box-sizing: border-box; }
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                text-align: center;
                color: #0f172a;
                margin: 0;
                padding: 16px;
                background: #ffffff;
              }
              .header {
                border-bottom: 3px solid #f59e0b;
                padding-bottom: 14px;
                margin-bottom: 20px;
              }
              .univ { font-size: 22px; font-weight: bold; color: #0b132b; }
              .title { font-size: 28px; font-weight: 800; margin: 8px 0; color: #1e293b; }
              .dept { font-size: 16px; color: #64748b; }
              .course-box {
                background: #f8fafc;
                border: 2px solid #cbd5e1;
                border-radius: 16px;
                padding: 18px;
                margin: 20px auto;
                max-width: 560px;
              }
              .course-name { font-size: 24px; font-weight: bold; color: #0f172a; }
              .course-info { font-size: 16px; color: #475569; margin-top: 6px; }
              .qr-container {
                display: inline-block;
                padding: 16px;
                border: 3px solid #cbd5e1;
                border-radius: 24px;
                margin: 20px auto;
                background: #ffffff;
              }
              .qr-img { width: 360px; height: 360px; display: block; margin: 0 auto; }
              .token-box {
                background: #fef3c7;
                border: 2px dashed #f59e0b;
                border-radius: 14px;
                padding: 14px;
                max-width: 440px;
                margin: 18px auto;
              }
              .token-label { font-size: 14px; color: #92400e; font-weight: 600; }
              .token-code { font-size: 36px; font-weight: 800; font-family: monospace; color: #b45309; letter-spacing: 3px; margin-top: 4px; }
              .footer { margin-top: 24px; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="univ">มหาวิทยาลัยราชภัฏนครราชสีมา (NRRU)</div>
              <div class="title">ใบสแกนเช็คชื่อเข้าชั้นเรียน (Class Attendance QR)</div>
              <div class="dept">สาขาวิชาอุตสาหกรรมศิลป์ · คณะเทคโนโลยีอุตสาหกรรม</div>
            </div>
            <div class="course-box">
              <div class="course-name">${activeCourse.code} : ${activeCourse.name}</div>
              <div class="course-info">ห้องเรียน: ${activeCourse.room} &nbsp;|&nbsp; เวลาเรียน: ${activeCourse.schedule}</div>
              <div class="course-info" style="color: #d97706; font-weight: 600;">อาจารย์ผู้สอน: ${activeCourse.instructor || 'อาจารย์ฐิติวัสส์ กาญจนพิมาย'}</div>
            </div>
            <div class="qr-container">
              <img src="${url}" class="qr-img" alt="QR Code" />
            </div>
            <div class="token-box">
              <div class="token-label">รหัส Token ประจำคาบเรียน (หรือกรอกแทนการสแกน):</div>
              <div class="token-code">${state.qrSession.token}</div>
            </div>
            <div class="footer">
              สร้างเมื่อ: ${new Date().toLocaleString('th-TH')} · ระบบเช็คชื่อ MaKrubNRRU · พิมพ์ใส่กระดาษ A4 สำหรับใช้งานในชั้นเรียน
            </div>
            <script>
              window.onload = function() {
                window.print();
              };
            </script>
          </body>
          </html>
        `);
        printWindow.document.close();
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Course Session Selector Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <label
            htmlFor="qr-course-select"
            className="block text-xs font-medium text-slate-400 mb-1"
          >
            เลือกรายวิชาสำหรับเช็คชื่อคาบเรียนปัจจุบัน
          </label>
          <select
            id="qr-course-select"
            value={activeCourse.code}
            onChange={(e) => handleSelectCourse(e.target.value)}
            className="min-h-[44px] w-full md:w-96 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-medium text-slate-100 focus:outline-none focus:border-amber-400"
          >
            {state.courses.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
          <span>สถานที่: <strong className="text-slate-200">{activeCourse.room}</strong></span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">{activeCourse.schedule}</span>
        </div>
      </div>

      {/* Main Split: Dynamic QR Stage (Left) + Role Action / Roster (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Dynamic QR Stage */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center text-center space-y-5">
          <div className="w-full flex items-center justify-between text-xs text-slate-400 pb-3 border-b border-slate-800/80">
            <span className="font-medium text-slate-200">
              {state.qrSession.isOpen ? 'กำลังเปิดรับการสแกนเช็คชื่อ' : 'ปิดรับการเช็คชื่อชั่วคราว'}
            </span>

            {/* SVG Countdown Progress Ring with Screen Reader Accessibility */}
            <div className="inline-flex items-center gap-2">
              <svg className="w-9 h-9 -rotate-90" viewBox="0 0 44 44" aria-hidden="true">
                <circle
                  cx="22"
                  cy="22"
                  r="18"
                  fill="none"
                  stroke="#1E293B"
                  strokeWidth="3.5"
                />
                <circle
                  cx="22"
                  cy="22"
                  r="18"
                  fill="none"
                  stroke={state.qrSession.isOpen ? '#FBBF24' : '#475569'}
                  strokeWidth="3.5"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={state.qrSession.isOpen ? ringOffset : ringCircumference}
                  strokeLinecap="round"
                />
              </svg>
              <div aria-live="off" className="font-mono tabular-nums text-xs font-semibold text-amber-400 w-7 text-left">
                {state.qrSession.isOpen ? `${secondsLeft}s` : '--'}
              </div>
              <span className="sr-only">
                {state.qrSession.isOpen ? `เหลือเวลา ${secondsLeft} วินาทีก่อนเปลี่ยนรหัส QR` : 'ระบบเช็คชื่อปิดอยู่'}
              </span>
            </div>
          </div>

          {/* QR Code Visual */}
          <div className={state.qrSession.isOpen ? 'opacity-100' : 'opacity-30 grayscale'}>
            <DynamicQrSvg value={qrPayload} size={208} />
          </div>

          {/* Quick Download QR Image & Print Buttons for Instructors */}
          {role !== UserRole.STUDENT && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-0.5">
              <button
                type="button"
                onClick={handleDownloadQrImage}
                disabled={downloadingQr}
                className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-amber-300 hover:text-amber-200 font-medium inline-flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:scale-95 disabled:opacity-50"
                title="ดาวน์โหลด QR Code เป็นรูปภาพความละเอียดสูงสำหรับพิมพ์"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>ดาวน์โหลดรูปภาพ QR</span>
              </button>
              <button
                type="button"
                onClick={handlePrintQr}
                className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-slate-100 font-medium inline-flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:scale-95"
                title="พิมพ์ใบ QR Code ขนาด A4 สำหรับห้องเรียน"
              >
                <Printer className="w-3.5 h-3.5 text-slate-400" />
                <span>พิมพ์ใบ A4</span>
              </button>
            </div>
          )}

          <div className="space-y-1">
            <p className="text-xs text-slate-400">รหัส Dynamic Token ปัจจุบัน</p>
            <p className="text-base sm:text-lg font-mono tabular-nums font-bold tracking-wider text-amber-400">
              {state.qrSession.token}
            </p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto pt-1">
              ระบบเปลี่ยนรหัสอัตโนมัติทุก 15 วินาที เพื่อป้องกันการส่งต่อภาพหน้าจอเช็คชื่อแทนกันนอกห้องปฏิบัติการ
            </p>
          </div>

          {role === UserRole.STUDENT ? (
            <div className="w-full space-y-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAutoVerificationModal(true)}
                disabled={!state.qrSession.isOpen}
                className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:opacity-50 text-slate-950 text-sm font-bold inline-flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20"
              >
                <ScanLine className="w-4 h-4 text-slate-950 shrink-0" />
                <span>วิเคราะห์ภาพถ่ายหน้าจออาจารย์อัตโนมัติ (AAVS)</span>
              </button>

              <button
                type="button"
                onClick={handleStudentScanCheckIn}
                disabled={busyAction || !state.qrSession.isOpen}
                className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 disabled:opacity-50 text-slate-200 text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors"
              >
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {busyAction ? 'กำลังบันทึกเวลาเข้าเรียน...' : 'สแกน QR Code แบบด่วน'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowManualForm((v) => !v)}
                className="w-full min-h-[40px] px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800/80 text-xs font-medium text-slate-400 inline-flex items-center justify-center gap-2 transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>กรอกรหัส Token หรือ Passcode แทนกล้อง</span>
              </button>

              {showManualForm && (
                <form onSubmit={handleManualTokenSubmit} className="pt-2 flex gap-2 text-left">
                  <input
                    type="text"
                    required
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value.toUpperCase())}
                    placeholder={`เช่น ${state.qrSession.token}`}
                    className="flex-1 min-h-[44px] px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl font-mono text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="submit"
                    disabled={busyAction}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-amber-400 whitespace-nowrap shrink-0"
                  >
                    ยืนยันรหัส
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="w-full space-y-3 pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setShowAutoVerificationModal(true)}
                className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-xs font-bold text-amber-300 inline-flex items-center justify-center gap-2 transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>ทดสอบระบบตรวจสอบภาพถ่าย QR Code อัตโนมัติ</span>
              </button>

              {/* Classroom Print / Download QR Action Buttons */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleDownloadQrImage}
                  disabled={downloadingQr}
                  className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-[0.98] text-slate-950 text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:opacity-50"
                  aria-label="ดาวน์โหลด QR Code เป็นรูปภาพสำหรับพิมพ์ใช้งานในห้องเรียน"
                >
                  {downloadingQr ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950 shrink-0" />
                      <span>กำลังสร้างภาพความละเอียดสูง...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 text-slate-950 shrink-0" />
                      <span>ดาวน์โหลด QR เป็นรูปภาพ (Download Image)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handlePrintQr}
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 inline-flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:scale-[0.98]"
                  aria-label="พิมพ์ใบเช็คชื่อ QR Code สำหรับชั้นเรียน"
                >
                  <Printer className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>พิมพ์ใบเช็คชื่อประจำคาบ (Print A4)</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => rotateToken()}
                  className="min-h-[44px] px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-200 inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                  <span>สุ่มรหัสใหม่ทันที</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleSession}
                  className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap ${
                    state.qrSession.isOpen
                      ? 'bg-rose-950/40 border-rose-800/70 text-rose-300 hover:bg-rose-950/70'
                      : 'bg-emerald-950/40 border-emerald-800/70 text-emerald-300 hover:bg-emerald-950/70'
                  }`}
                >
                  {state.qrSession.isOpen ? (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>ปิดรับเช็คชื่อ</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3.5 h-3.5" />
                      <span>เปิดรับเช็คชื่อ</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-xs text-slate-400">เกณฑ์ตัดสาย:</span>
                <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg">
                  {[10, 15, 20].map((min) => (
                    <button
                      key={min}
                      type="button"
                      onClick={() => handleThresholdChange(min)}
                      className={`min-h-[32px] px-2.5 py-1 rounded-md text-xs font-mono tabular-nums transition-colors ${
                        state.qrSession.lateThresholdMin === min
                          ? 'bg-amber-400 text-slate-950 font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {min}m
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {bannerMsg && (
            <div
              className={`w-full p-3.5 rounded-xl border text-left text-xs flex items-start gap-2.5 ${
                bannerMsg.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                  : 'bg-rose-950/40 border-rose-800/60 text-rose-200'
              }`}
            >
              {bannerMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <span>{bannerMsg.text}</span>
            </div>
          )}
        </div>

        {/* Right Live Stream & Instructor Roster Control */}
        <div className="lg:col-span-7 space-y-6">
          {role === UserRole.INSTRUCTOR && (
            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-800/80">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-100">
                    จัดการสถานะรายชื่อนักศึกษาประจำคาบ
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    สำหรับอาจารย์ผู้สอนบันทึกสถานะกรณีนักศึกษาแจ้งลาหรือโทรศัพท์ขัดข้อง
                  </p>
                </div>
                <span className="text-xs font-mono tabular-nums text-slate-400">
                  ทั้งหมด {state.students.length} คน
                </span>
              </div>

              <div className="space-y-3">
                {state.students.map((st) => (
                  <div
                    key={st.studentId}
                    className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/60 hover:bg-slate-950/90 border border-slate-800/70 hover:border-slate-700/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-100 truncate">
                          {st.fullName}
                        </p>
                        {st.todayStatus === 'on_time' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            มาตรงเวลา {st.lastCheckInTime ? `(${st.lastCheckInTime})` : ''}
                          </span>
                        )}
                        {st.todayStatus === 'late' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            มาสาย {st.lastCheckInTime ? `(${st.lastCheckInTime})` : ''}
                          </span>
                        )}
                        {st.todayStatus === 'excused' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                            ลาป่วย/ลากิจ
                          </span>
                        )}
                        {st.todayStatus === 'pending' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-900 text-slate-400 border border-slate-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                            ยังไม่เช็คชื่อ
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-mono font-medium text-slate-400 mt-1">
                        รหัส: <span className="text-slate-300 font-semibold">{st.studentId}</span>
                      </p>
                    </div>

                    {/* Compact Modern Segmented Control with Solid Color Highlights */}
                    <div
                      role="group"
                      aria-label={`กำหนดสถานะการเข้าเรียนของ ${st.fullName}`}
                      className="inline-flex items-center p-1 bg-slate-900 border border-slate-800/90 rounded-xl shadow-inner w-full sm:w-auto shrink-0"
                    >
                      {/* 1. ตรงเวลา -> Solid Green #10B981 */}
                      <button
                        type="button"
                        onClick={() => handleInstructorMarkStudent(st.studentId, 'on_time')}
                        aria-pressed={st.todayStatus === 'on_time'}
                        className={`flex-1 sm:flex-none min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs transition-all text-center whitespace-nowrap active:scale-[0.97] ${
                          st.todayStatus === 'on_time'
                            ? 'bg-[#10B981] text-slate-950 font-bold shadow-md'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent font-medium'
                        }`}
                      >
                        ตรงเวลา
                      </button>

                      {/* 2. สาย -> Solid Amber #F59E0B */}
                      <button
                        type="button"
                        onClick={() => handleInstructorMarkStudent(st.studentId, 'late')}
                        aria-pressed={st.todayStatus === 'late'}
                        className={`flex-1 sm:flex-none min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs transition-all text-center whitespace-nowrap active:scale-[0.97] ${
                          st.todayStatus === 'late'
                            ? 'bg-[#F59E0B] text-slate-950 font-bold shadow-md'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent font-medium'
                        }`}
                      >
                        สาย
                      </button>

                      {/* 3. แจ้งลา -> Solid Cyan #06B6D4 */}
                      <button
                        type="button"
                        onClick={() => handleInstructorMarkStudent(st.studentId, 'excused')}
                        aria-pressed={st.todayStatus === 'excused'}
                        className={`flex-1 sm:flex-none min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs transition-all text-center whitespace-nowrap active:scale-[0.97] ${
                          st.todayStatus === 'excused'
                            ? 'bg-[#06B6D4] text-slate-950 font-bold shadow-md'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent font-medium'
                        }`}
                      >
                        แจ้งลา
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Live Chronological Attendance Log */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-100">
                  บันทึกการเช็คชื่อล่าสุดแบบเรียลไทม์
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  รายการยืนยันตัวตนเข้าห้องเรียนวิชา {activeCourse.code} {activeCourse.name}
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums text-amber-400 shrink-0">
                {courseLogs.length} รายการ
              </span>
            </div>

            {courseLogs.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                ยังไม่มีประวัติการเช็คชื่อในรายวิชานี้สำหรับคาบเรียนปัจจุบัน
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {courseLogs.slice(0, 8).map((log) => (
                  <div
                    key={log.id}
                    className="py-3.5 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-100 truncate">
                        {log.studentName}
                      </p>
                      <p className="text-xs text-slate-400 font-mono tabular-nums mt-0.5">
                        {log.studentId} ·{' '}
                        {log.method === 'qr_dynamic'
                          ? 'สแกน Dynamic QR'
                          : log.method === 'passcode'
                          ? 'ยืนยันรหัส Token'
                          : 'บันทึกโดยผู้สอน'}
                      </p>
                    </div>

                    <div className="text-right shrink-0 font-mono tabular-nums">
                      <p className="text-xs font-semibold text-slate-200">
                        {log.timestamp} น.
                      </p>
                      <p
                        className={`text-xs mt-0.5 ${
                          log.status === 'on_time'
                            ? 'text-emerald-400'
                            : log.status === 'excused'
                            ? 'text-sky-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {log.status === 'on_time'
                          ? '● ตรงเวลา'
                          : log.status === 'excused'
                          ? '◆ แจ้งลา'
                          : `▲ สาย ${log.lateMinutes} นาที`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Automated Attendance Verification System (AAVS) Modal */}
      <AutomatedQrVerificationModal
        isOpen={showAutoVerificationModal}
        onClose={() => setShowAutoVerificationModal(false)}
        state={state}
        activeCourse={activeCourse}
        studentId="6640508101"
        onAttendanceVerified={(students, logs, updatedCourse, newLog) => {
          onAttendanceUpdated(students, logs, updatedCourse);
          if (newLog) onCheckInSuccess?.(newLog, activeCourse);
          setBannerMsg({
            type: 'success',
            text: `ระบบตรวจสอบการเข้าเรียนอัตโนมัติ (AAVS): ยืนยันการเช็คชื่อวิชา ${activeCourse.code} สำเร็จ เวลา ${
              newLog?.timestamp || 'เรียลไทม์'
            } น. (สถานะ: ตรงเวลา)`,
          });
        }}
      />
    </div>
  );
};
