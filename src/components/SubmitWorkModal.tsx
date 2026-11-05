import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  Trash2,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { Course } from '../types';

interface SubmitWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  studentName?: string;
  studentId?: string;
  onSubmit: (data: {
    title: string;
    courseCode: string;
    attachmentRef: string;
    notes: string;
  }) => Promise<void>;
}

export const SubmitWorkModal: React.FC<SubmitWorkModalProps> = ({
  isOpen,
  onClose,
  courses,
  studentName = 'นายสมชาย ใจดี',
  studentId = '6640508101',
  onSubmit,
}) => {
  const [selectedCourseCode, setSelectedCourseCode] = useState<string>(
    courses[0]?.code ?? '508117'
  );
  const [title, setTitle] = useState<string>('');
  const [submissionType, setSubmissionType] = useState<'upload' | 'drive'>('upload');

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Google Drive State
  const [driveUrl, setDriveUrl] = useState<string>('');

  // Additional Notes
  const [notes, setNotes] = useState<string>('');

  // Form Validation & Submitting State
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const MAX_FILE_SIZE_MB = 50;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  const handleFileChange = (file: File | null) => {
    setValidationError(null);
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setValidationError(`ขนาดไฟล์เกินขีดจำกัด ${MAX_FILE_SIZE_MB}MB (ไฟล์ของคุณ: ${(file.size / (1024 * 1024)).toFixed(1)}MB)`);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!title.trim()) {
      setValidationError('กรุณาระบุชื่อใบงานหรือหัวข้อโครงงาน');
      return;
    }

    let attachmentRef = '';
    if (submissionType === 'upload') {
      if (!selectedFile) {
        setValidationError('กรุณาเลือกไฟล์แนบรายงานหรือใบงานของคุณ');
        return;
      }
      attachmentRef = selectedFile.name;
    } else {
      if (!driveUrl.trim()) {
        setValidationError('กรุณาระบุลิงก์ Google Drive หรือคลาวด์จัดเก็บเอกสาร');
        return;
      }
      if (!driveUrl.startsWith('http://') && !driveUrl.startsWith('https://')) {
        setValidationError('ลิงก์ Google Drive ต้องขึ้นต้นด้วย https://');
        return;
      }
      attachmentRef = driveUrl.trim();
    }

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        courseCode: selectedCourseCode,
        attachmentRef,
        notes: notes.trim(),
      });
      onClose();
    } catch {
      setValidationError('เกิดข้อผิดพลาดในการส่งงาน กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-work-title"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
    >
      <div className="w-full sm:max-w-lg bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl p-6 sm:p-7 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Mobile Drag Indicator */}
        <div className="w-10 h-1.5 bg-slate-700 rounded-full mx-auto sm:hidden" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="submit-work-title" className="text-lg sm:text-xl font-bold tracking-tight text-slate-100">
              ส่งใบงานหรือโครงงานประจำรายวิชา
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              ผู้ส่ง: <span className="text-slate-200 font-medium">{studentName}</span> (รหัสนักศึกษา <span className="font-mono tabular-nums text-amber-400">{studentId}</span>)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Select Course Dropdown */}
          <div>
            <label htmlFor="course-select-input" className="block text-xs font-semibold text-slate-300 mb-1.5">
              เลือกรายวิชา
            </label>
            <select
              id="course-select-input"
              value={selectedCourseCode}
              onChange={(e) => setSelectedCourseCode(e.target.value)}
              className="w-full min-h-[46px] px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-medium text-slate-100 focus:outline-none focus:border-amber-400 transition-colors"
            >
              {courses
                .filter((c) => c.enrolled)
                .map((course) => (
                  <option key={course.code} value={course.code}>
                    {course.code} — {course.name}
                  </option>
                ))}
            </select>
          </div>

          {/* 2. Title / Topic Input */}
          <div>
            <label htmlFor="topic-title-input" className="block text-xs font-semibold text-slate-300 mb-1.5">
              ชื่อใบงาน / หัวข้อโครงงาน
            </label>
            <input
              id="topic-title-input"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น รายงานปฏิบัติการกลึงเกลียวมาตรฐาน ISO ใบงานที่ 4"
              className="w-full min-h-[46px] px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          {/* 3. File Submission Section (Tab / Radio Toggle) */}
          <div className="space-y-2.5">
            <label className="block text-xs font-semibold text-slate-300">
              รูปแบบการส่งไฟล์ผลงาน / ชิ้นงาน
            </label>

            {/* Toggle Segmented Control */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setSubmissionType('upload');
                  setValidationError(null);
                }}
                className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-2 transition-all ${
                  submissionType === 'upload'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                <UploadCloud className="w-4 h-4" />
                <span>อัปโหลดไฟล์ (File Upload)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSubmissionType('drive');
                  setValidationError(null);
                }}
                className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-2 transition-all ${
                  submissionType === 'drive'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                {/* Google Drive Tri-color Icon */}
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 87.3 78" aria-hidden="true">
                  <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                  <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
                  <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.5l5.85 10.15z" fill="#ea4335"/>
                  <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                  <path d="m57.4 1.2-13.75 23.8 13.75 23.8h27.5c0-1.55-.4-3.1-1.2-4.5l-21.8-37.8c-.8-1.4-1.95-2.5-3.3-3.3z" fill="#ffba00"/>
                  <path d="m73.55 76.8h-46.1l-13.75-23.8h56.05z" fill="#2684fc"/>
                </svg>
                <span>ลิงก์ Google Drive</span>
              </button>
            </div>

            {/* Option A: Drag & Drop File Upload Box */}
            {submissionType === 'upload' && (
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                  accept=".pdf,.doc,.docx,.zip,.rar,.dwg,.step,.stp,.dxf,.png,.jpg"
                />

                {!selectedFile ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-amber-400 bg-amber-400/10'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-amber-400">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-200">
                      คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      รองรับ PDF, Word, ZIP, DWG, 3D CAD (STEP) ขนาดสูงสุด 50MB
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0 text-amber-400">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-100 truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs font-mono tabular-nums text-slate-400 mt-0.5">
                          {formatFileSize(selectedFile.size)} · พร้อมสำหรับการอัปโหลด
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      aria-label="ลบไฟล์ที่เลือก"
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Option B: Google Drive URL Field */}
            {submissionType === 'drive' && (
              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="url"
                    value={driveUrl}
                    onChange={(e) => setDriveUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/..."
                    className="w-full min-h-[46px] pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                {/* Orange Warning Banner (as specified in prompt) */}
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 leading-relaxed">
                    <p className="font-semibold text-amber-300">
                      โปรดตรวจสอบการเปิดสิทธิ์ลิงก์เป็น &ldquo;Anyone with link can view&rdquo;
                    </p>
                    <p className="text-amber-400/80">
                      เพื่อให้ผู้สอนสามารถเข้าดูไฟล์และตรวจประเมินคะแนนได้โดยไม่ต้องส่งคำขอสิทธิ์เพิ่มเติม
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. Additional Notes to Instructor */}
          <div>
            <label htmlFor="notes-textarea" className="block text-xs font-semibold text-slate-300 mb-1.5">
              รายละเอียดเพิ่มเติมถึงอาจารย์ผู้สอน
            </label>
            <textarea
              id="notes-textarea"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ระบุสรุปผลการทดลอง ปัญหาที่พบ หรือจุดที่ขอรับคำปรึกษา..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          {/* Validation Error Message */}
          {validationError && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-xs text-rose-300 flex items-start gap-2"
            >
              <Info className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {/* 5. Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 min-h-[46px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 min-h-[46px] px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-slate-950 text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              {submitting ? (
                <span>กำลังส่งงาน...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>ยืนยันการส่งงาน</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
