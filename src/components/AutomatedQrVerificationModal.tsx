import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  X,
  ScanLine,
  Monitor,
  Cpu,
  Eye,
  FileCheck2,
  Sparkles,
} from 'lucide-react';
import {
  AppStateData,
  AttendanceLog,
  Course,
  StudentRecord,
  AutomatedVerificationResult,
} from '../types';

interface AutomatedQrVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppStateData;
  activeCourse: Course;
  studentId?: string;
  onAttendanceVerified: (
    students: StudentRecord[],
    logs: AttendanceLog[],
    updatedCourse?: Course,
    newLog?: AttendanceLog
  ) => void;
}

type TabMode = 'camera' | 'upload' | 'samples';

export const AutomatedQrVerificationModal: React.FC<AutomatedQrVerificationModalProps> = ({
  isOpen,
  onClose,
  state,
  activeCourse,
  studentId = '6640508101',
  onAttendanceVerified,
}) => {
  const [activeTab, setActiveTab] = useState<TabMode>('camera');
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<number>(0);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [result, setResult] = useState<AutomatedVerificationResult | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Analysis steps text for realistic optical processing breakdown
  const analysisSteps = [
    'ตรวจจับพื้นผิวหน้าจอแสดงผล (Optical Screen & Projector Detection)...',
    'วิเคราะห์คลื่นการแสดงผลและ Moiré Pattern (Anti-Spoofing Screen Check)...',
    'ถอดรหัสเมทริกซ์ 2 มิติ (2D QR Matrix Decoding)...',
    'ตรวจสอบความถูกต้องของรหัส Dynamic Token รอบ 15 วินาที...',
    'ยืนยันข้อมูลนักศึกษากับฐานข้อมูลรายวิชาและบันทึกเวลาเข้าเรียน...',
  ];

  // Camera handling
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('อุปกรณ์ไม่รองรับการเปิดกล้องผ่านเบราว์เซอร์');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: unknown) {
      console.warn('Camera access issue:', err);
      setCameraError('ไม่สามารถเข้าถึงกล้องได้ โปรดอนุญาตสิทธิ์การใช้กล้อง หรือเลือกแท็บ "อัปโหลดภาพถ่าย" แทน');
      setCameraActive(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, startCamera, stopCamera]);

  const runVerificationRequest = async (payload: {
    imageBase64?: string;
    simulatedSampleType?: string;
    forcedToken?: string;
  }) => {
    setAnalyzing(true);
    setResult(null);
    setAnalysisStep(0);

    // Progressive visual steps
    for (let step = 0; step < 4; step++) {
      setAnalysisStep(step);
      await new Promise((r) => setTimeout(r, 380));
    }

    try {
      const res = await fetch('/api/ai/verify-screen-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          courseCode: activeCourse.code,
          studentId,
        }),
      });

      setAnalysisStep(4);
      await new Promise((r) => setTimeout(r, 250));

      const data: AutomatedVerificationResult = await res.json();
      setResult(data);

      if (data.status === 'VERIFIED_SUCCESS' && data.students && data.attendanceLogs) {
        onAttendanceVerified(data.students, data.attendanceLogs, data.course, data.log);
      }
    } catch (err: unknown) {
      console.error('Verification error:', err);
      setResult({
        status: 'TAMPER_DETECTED',
        verificationId: `AAVS-ERR-${Date.now().toString(36).toUpperCase()}`,
        decodedPayload: 'ERROR',
        extractedCourseCode: activeCourse.code,
        courseName: activeCourse.name,
        instructorName: activeCourse.instructor,
        extractedToken: 'N/A',
        tokenMatched: false,
        tokenAgeSeconds: 0,
        screenAnalysis: {
          isScreenCapture: false,
          displayMedium: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์',
          screenReflectionDetected: false,
          antiSpoofingScore: 0,
          confidence: 0,
          ambientLight: 'N/A',
          perspectiveDistortion: 'N/A',
        },
        student: {
          studentId,
          fullName: 'นายสมชาย ใจดี',
          major: 'สาขาวิชาอุตสาหกรรมศิลป์',
          academicYear: 'ชั้นปีที่ 3',
        },
        summaryMessage: 'ไม่สามารถติดต่อเซิร์ฟเวอร์เพื่อตรวจสอบภาพถ่าย QR Code ได้ กรุณาลองใหม่อีกครั้ง',
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCaptureFromCamera = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);
    stopCamera();

    runVerificationRequest({ imageBase64: dataUrl });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setCapturedImage(base64);
      runVerificationRequest({ imageBase64: base64 });
    };
    reader.readAsDataURL(file);
  };

  const handleRunSample = (sampleType: 'projector' | 'laptop' | 'expired' | 'tampered') => {
    setCapturedImage(null);
    if (sampleType === 'projector') {
      runVerificationRequest({
        simulatedSampleType: 'projector',
        forcedToken: state.qrSession.token,
      });
    } else if (sampleType === 'laptop') {
      runVerificationRequest({
        simulatedSampleType: 'laptop',
        forcedToken: state.qrSession.token,
      });
    } else if (sampleType === 'expired') {
      runVerificationRequest({
        simulatedSampleType: 'expired_token',
      });
    } else if (sampleType === 'tampered') {
      runVerificationRequest({
        simulatedSampleType: 'tampered',
      });
    }
  };

  const resetVerification = () => {
    setResult(null);
    setCapturedImage(null);
    if (activeTab === 'camera') {
      startCamera();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="aavs-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header with Title & Security Badge */}
        <div className="px-6 py-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
              <ScanLine className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="aavs-title" className="text-base sm:text-lg font-bold text-slate-100">
                  ระบบตรวจสอบการเข้าเรียนอัตโนมัติ
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono">
                  <ShieldCheck className="w-3 h-3" />
                  AAVS v2.5 Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                วิเคราะห์และถอดรหัสภาพถ่าย QR Code จากหน้าจออาจารย์ผู้สอนวิชา {activeCourse.code} {activeCourse.name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่างตรวจสอบ"
            className="w-9 h-9 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-100 flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        {!result && (
          <div className="px-6 pt-4 pb-0 bg-slate-900 border-b border-slate-800/80 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab('camera');
                setCapturedImage(null);
              }}
              className={`pb-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                activeTab === 'camera'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>กล้องถ่ายภาพหน้าจอ</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('upload');
                stopCamera();
              }}
              className={`pb-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                activeTab === 'upload'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>อัปโหลดภาพถ่าย</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('samples');
                stopCamera();
              }}
              className={`pb-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                activeTab === 'samples'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>ภาพตัวอย่างทดสอบ</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6">
          {/* Ongoing Analysis Progress State */}
          {analyzing && (
            <div className="py-12 px-4 flex flex-col items-center text-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-amber-400/10 border border-amber-400/40 flex items-center justify-center text-amber-400 animate-pulse">
                  <Cpu className="w-10 h-10 animate-spin" style={{ animationDuration: '3s' }} />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 animate-ping" />
              </div>

              <div className="space-y-2 max-w-md">
                <h3 className="text-base font-semibold text-slate-100">
                  ระบบกำลังวิเคราะห์ภาพถ่ายหน้าจออาจารย์อัตโนมัติ
                </h3>
                <p className="text-xs text-amber-400 font-mono">
                  {analysisSteps[analysisStep]}
                </p>
              </div>

              {/* Step indicator pills */}
              <div className="w-full max-w-sm bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
                {analysisSteps.map((stepText, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 text-xs transition-opacity ${
                      idx === analysisStep
                        ? 'text-amber-400 font-medium opacity-100'
                        : idx < analysisStep
                        ? 'text-emerald-400 opacity-80'
                        : 'text-slate-500 opacity-40'
                    }`}
                  >
                    {idx < analysisStep ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    ) : idx === analysisStep ? (
                      <RefreshCw className="w-3.5 h-3.5 shrink-0 text-amber-400 animate-spin" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-700 shrink-0" />
                    )}
                    <span className="truncate">{stepText.replace('...', '')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verification Result Display */}
          {!analyzing && result && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Primary Status Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                  result.status === 'VERIFIED_SUCCESS'
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                    : result.status === 'TOKEN_EXPIRED'
                    ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                    : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                }`}
              >
                {result.status === 'VERIFIED_SUCCESS' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                ) : result.status === 'TOKEN_EXPIRED' ? (
                  <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                )}

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-bold text-slate-100">
                      {result.status === 'VERIFIED_SUCCESS' && 'ยืนยันการเช็คชื่อเข้าเรียนสำเร็จ (VERIFIED)'}
                      {result.status === 'TOKEN_EXPIRED' && 'รหัส Dynamic QR หมดอายุ (TOKEN EXPIRED)'}
                      {result.status === 'TAMPER_DETECTED' && 'ตรวจพบความผิดปกติของภาพถ่าย (TAMPER DETECTED)'}
                      {result.status === 'SESSION_CLOSED' && 'คาบเรียนปิดรับเช็คชื่อแล้ว (SESSION CLOSED)'}
                    </h3>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
                      ID: {result.verificationId}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed opacity-90">{result.summaryMessage}</p>
                </div>
              </div>

              {/* Comprehensive Diagnostic Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Card: QR & Token Diagnostics */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-semibold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <ScanLine className="w-3.5 h-3.5 text-amber-400" />
                      ผลการถอดรหัส QR Matrix
                    </span>
                    <span
                      className={`font-mono text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        result.tokenMatched
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {result.tokenMatched ? 'TOKEN VALID' : 'INVALID / EXPIRED'}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <p className="text-slate-500 text-[11px]">Decoded QR Payload</p>
                      <p className="font-mono text-slate-200 text-xs bg-slate-900 p-1.5 rounded-lg border border-slate-800/80 truncate">
                        {result.decodedPayload}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-slate-500 text-[11px]">รหัสวิชา</p>
                        <p className="font-semibold text-slate-200">{result.extractedCourseCode}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-[11px]">Dynamic Token</p>
                        <p className="font-mono font-bold text-amber-400">{result.extractedToken}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <p className="text-slate-500 text-[11px]">อายุรหัสที่สแกน</p>
                        <p className="font-mono text-slate-300">{result.tokenAgeSeconds} วินาที</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-[11px]">เกณฑ์หมุนเวียน</p>
                        <p className="font-mono text-slate-400">15 วินาที/รอบ</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Card: Optical & Anti-Spoofing Screen Analysis */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-semibold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Monitor className="w-3.5 h-3.5 text-amber-400" />
                      การตรวจสอบหน้าจอ (Optical Analysis)
                    </span>
                    <span
                      className={`font-mono text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        result.screenAnalysis.antiSpoofingScore > 80
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      ANTI-SPOOF: {result.screenAnalysis.antiSpoofingScore}%
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <p className="text-slate-500 text-[11px]">สื่อที่ตรวจพบ (Display Medium)</p>
                      <p className="font-medium text-slate-200">{result.screenAnalysis.displayMedium}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-slate-500 text-[11px]">Screen Reflection</p>
                        <p className="text-slate-200 font-mono">
                          {result.screenAnalysis.screenReflectionDetected ? 'ตรวจพบคลื่นจอ' : 'ไม่พบแสงสะท้อน'}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-[11px]">Confidence</p>
                        <p className="font-mono font-semibold text-emerald-400">{result.screenAnalysis.confidence}%</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-slate-500 text-[11px]">สภาพแวดล้อมและมุมมอง</p>
                      <p className="text-slate-400 text-[11px] truncate">{result.screenAnalysis.ambientLight}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Student Attendance Confirmation Stamp */}
              {result.attendanceRecord && (
                <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                      <FileCheck2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-100">
                        {result.student.fullName} ({result.student.studentId})
                      </p>
                      <p className="text-xs text-slate-400">
                        {result.courseName} · บันทึกเวลา {result.attendanceRecord.timestamp} น.
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      ● {result.attendanceRecord.statusLabel}
                    </span>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetVerification}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-xs font-semibold text-slate-300 inline-flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>สแกนภาพอื่นเพิ่มเติม</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold inline-flex items-center justify-center gap-1.5"
                >
                  <span>เสร็จสิ้นและปิดหน้าต่าง</span>
                </button>
              </div>
            </div>
          )}

          {/* Mode 1: Camera Feed */}
          {!analyzing && !result && activeTab === 'camera' && (
            <div className="space-y-4">
              <div className="relative aspect-video max-h-[380px] w-full bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center">
                {cameraActive ? (
                  <>
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />

                    {/* Camera Viewfinder Overlay & Screen Alignment Reticle */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                      <div className="relative w-64 h-64 border-2 border-amber-400/80 rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.25)] flex items-center justify-center">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-bold uppercase tracking-wider">
                          เล็งไปที่หน้าจออาจารย์
                        </div>
                        {/* Corner markers */}
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-amber-300 -translate-x-1 -translate-y-1" />
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-amber-300 translate-x-1 -translate-y-1" />
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-amber-300 -translate-x-1 translate-y-1" />
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-amber-300 translate-x-1 translate-y-1" />
                        <ScanLine className="w-12 h-12 text-amber-400/40 animate-pulse" />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-6 text-center space-y-3">
                    <Camera className="w-12 h-12 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400 max-w-sm">
                      {cameraError || 'กำลังเตรียมความพร้อมของกล้องเพื่อตรวจจับหน้าจออาจารย์...'}
                    </p>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-amber-400 inline-flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>เปิดการใช้งานกล้องอีกครั้ง</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <p className="text-xs text-slate-400 text-center sm:text-left">
                  ส่องกล้องไปยังจอโปรเจกเตอร์หรือคอมพิวเตอร์ของ ผศ.ฐิติวัสส์ ให้ QR Code อยู่ในกรอบสีเหลือง
                </p>

                <button
                  type="button"
                  onClick={handleCaptureFromCamera}
                  disabled={!cameraActive}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors shadow-lg shadow-amber-400/20"
                >
                  <Camera className="w-4 h-4" />
                  <span>ถ่ายภาพหน้าจอเพื่อวิเคราะห์อัตโนมัติ</span>
                </button>
              </div>
            </div>
          )}

          {/* Mode 2: File Upload */}
          {!analyzing && !result && activeTab === 'upload' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="screen-photo-file-input"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-amber-400/60 bg-slate-950/60 hover:bg-slate-950 rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-colors space-y-4"
              >
                {capturedImage ? (
                  <div className="space-y-3">
                    <img
                      src={capturedImage}
                      alt="Captured screen"
                      className="max-h-48 mx-auto rounded-xl border border-slate-700 object-contain"
                    />
                    <p className="text-xs text-emerald-400 font-medium">
                      โหลดภาพถ่ายหน้าจอเรียบร้อยแล้ว กำลังเตรียมส่งวิเคราะห์...
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 mx-auto">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-200">
                        คลิกเพื่อเลือกภาพถ่ายหน้าจอ หรือลากไฟล์มาวางที่นี่
                      </p>
                      <p className="text-xs text-slate-500">
                        รองรับไฟล์ JPG, PNG, WebP ที่ถ่ายจากหน้าจอห้องเรียน (ขนาดไม่เกิน 25MB)
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-xs text-slate-400 flex items-start gap-2.5">
                <Eye className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  ระบบจะตรวจสอบ Optical Screen Reflection และ Moiré Pattern เพื่อป้องกันการส่งต่อภาพหน้าจอเก่าข้ามเวลา
                </span>
              </div>
            </div>
          )}

          {/* Mode 3: Test Samples (Demonstration & Verification Suite) */}
          {!analyzing && !result && activeTab === 'samples' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                เลือกชุดข้อมูลภาพถ่ายจำลองเพื่อทดสอบประสิทธิภาพของระบบตรวจสอบการเข้าเรียนอัตโนมัติ (AAVS Engine):
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleRunSample('projector')}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-400/60 text-left transition-all hover:bg-slate-900/60 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">
                      1. จอโปรเจกเตอร์ห้องปฏิบัติการ
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                      PASS
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    จำลองภาพถ่ายจากโปรเจกเตอร์ห้อง 38.1.04 งานวิศวกรรม 1 รหัสถูกต้อง ตรงเวลา
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleRunSample('laptop')}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-400/60 text-left transition-all hover:bg-slate-900/60 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">
                      2. จอโน้ตบุ๊กอาจารย์ผู้สอน
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                      PASS
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    จำลองภาพถ่ายจากจอโน้ตบุ๊ก ผศ.ฐิติวัสส์ รหัส Dynamic Token ล่าสุด
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleRunSample('expired')}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-400/60 text-left transition-all hover:bg-slate-900/60 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">
                      3. ภาพรหัสเดิมที่หมดอายุแล้ว
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                      EXPIRED
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    ทดสอบการตรวจจับรหัสค้างเก่าที่เกินรอบหมุนเวียน 15 วินาที
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleRunSample('tampered')}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-400/60 text-left transition-all hover:bg-slate-900/60 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">
                      4. ภาพตัดต่อ/ส่งต่อดิจิทัล
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono">
                      SPOOF FAIL
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    ทดสอบระบบ Anti-Spoofing ตรวจจับภาพ Screenshot ที่ไม่ได้ถ่ายจากหน้าจอจริง
                  </p>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
