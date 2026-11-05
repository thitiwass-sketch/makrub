import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  RefreshCw,
  ExternalLink,
  Calendar,
  Clock,
  MapPin,
  BookOpen,
  CheckCircle2,
  Download,
  Building,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { Course, RegistrarCourseItem, RegistrarScheduleResponse, UserRole } from '../types';

interface RegistrarScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: UserRole;
  onCoursesUpdated: (courses: Course[]) => void;
  currentCourses: Course[];
}

export const RegistrarScheduleModal: React.FC<RegistrarScheduleModalProps> = ({
  isOpen,
  onClose,
  role,
  onCoursesUpdated,
  currentCourses,
}) => {
  const [acadYear, setAcadYear] = useState<string>('2567');
  const [semester, setSemester] = useState<string>('2');
  const [loading, setLoading] = useState<boolean>(false);
  const [syncingAll, setSyncingAll] = useState<boolean>(false);
  const [importingCode, setImportingCode] = useState<string | null>(null);
  const [scheduleData, setScheduleData] = useState<RegistrarScheduleResponse | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const fetchSchedule = useCallback(async (year: string, sem: string) => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/registrar/teacher-schedule?acadYear=${year}&semester=${sem}`);
      const data: RegistrarScheduleResponse = await res.json();
      if (res.ok && data.success) {
        setScheduleData(data);
      } else {
        setFeedback({ type: 'err', text: 'ไม่สามารถดึงข้อมูลตารางสอนจากระบบสำนักทะเบียนได้' });
      }
    } catch {
      setFeedback({ type: 'err', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่ายสำนักทะเบียน NRRU' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchSchedule(acadYear, semester);
    }
  }, [isOpen, acadYear, semester, fetchSchedule]);

  if (!isOpen) return null;

  const handleImportSingleCourse = async (course: RegistrarCourseItem) => {
    setImportingCode(course.code);
    setFeedback(null);
    try {
      const res = await fetch('/api/registrar/import-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: course.code,
          section: course.section,
          acadYear,
          semester,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onCoursesUpdated(data.courses);
        setFeedback({
          type: 'ok',
          text: `นำเข้ารายวิชา ${course.code} ${course.name} (กลุ่ม ${course.section}) เข้าสู่ระบบเรียบร้อย`,
        });
        // Update local status
        if (scheduleData) {
          setScheduleData({
            ...scheduleData,
            courses: scheduleData.courses.map((c) =>
              c.code === course.code ? { ...c, isImported: true } : c
            ),
          });
        }
      } else {
        setFeedback({ type: 'err', text: data.error || 'ไม่สามารถนำเข้ารายวิชาได้' });
      }
    } catch {
      setFeedback({ type: 'err', text: 'เกิดข้อผิดพลาดขณะนำเข้ารายวิชา' });
    } finally {
      setImportingCode(null);
    }
  };

  const handleSyncAll = async () => {
    setSyncingAll(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/registrar/sync-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acadYear, semester }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onCoursesUpdated(data.courses);
        setFeedback({
          type: 'ok',
          text: data.message || `ซิงค์ตารางเรียนทุกรายวิชาสำเร็จ`,
        });
        if (scheduleData) {
          setScheduleData({
            ...scheduleData,
            courses: scheduleData.courses.map((c) => ({ ...c, isImported: true })),
          });
        }
      } else {
        setFeedback({ type: 'err', text: data.error || 'ไม่สามารถซิงค์รายวิชาทั้งหมดได้' });
      }
    } catch {
      setFeedback({ type: 'err', text: 'เกิดข้อผิดพลาดในการซิงค์ข้อมูล' });
    } finally {
      setSyncingAll(false);
    }
  };

  const isCourseImportedLocally = (code: string) => {
    return currentCourses.some((c) => c.code === code);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="registrar-modal-title"
    >
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-950/70">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-medium">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>สำนักส่งเสริมวิชาการและงานทะเบียน NRRU</span>
              </span>
              <span className="text-xs font-mono text-slate-500">reg.nrru.ac.th</span>
            </div>
            <h2 id="registrar-modal-title" className="text-xl font-bold text-slate-100">
              ตารางการเรียนการสอนอาจารย์ฐิติวัสส์ กาญจนพิมาย
            </h2>
            <p className="text-xs text-slate-400">
              ดึงข้อมูลตารางสอน วัน-เวลา และห้องปฏิบัติการจากระบบสำนักทะเบียน มหาวิทยาลัยราชภัฏนครราชสีมา
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instructor Summary Card & Link to NRRU Registrar */}
        <div className="px-6 py-4 bg-slate-950/40 border-b border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center shrink-0">
                <Building className="w-5 h-5 text-amber-400" />
              </div>
              <div className="text-xs space-y-0.5">
                <p className="font-semibold text-slate-100 text-sm">
                  {scheduleData?.instructor.name || 'ผศ.ฐิติวัสส์ กาญจนพิมาย'}
                </p>
                <p className="text-slate-400">
                  สาขาวิชาอุตสาหกรรมศิลป์ · คณะเทคโนโลยีอุตสาหกรรม
                </p>
                <div className="flex flex-wrap items-center gap-2 text-slate-400 font-mono text-[11px]">
                  <span>รหัสอาจารย์: <strong className="text-amber-400">23576</strong></span>
                  <span>·</span>
                  <span>Officer ID: <strong>23608</strong></span>
                  <span>·</span>
                  <span>อีเมล: {scheduleData?.instructor.email || 'thitiwas.k@nrru.ac.th'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <a
                href={scheduleData?.directScheduleUrl || 'https://reg.nrru.ac.th/registrar/home.ASP?avs1050887615=4'}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 inline-flex items-center gap-1.5 transition-colors"
              >
                <span>เปิดดูที่ reg.nrru.ac.th</span>
                <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              </a>
            </div>
          </div>
        </div>

        {/* Controls: Year, Semester & Sync Actions */}
        <div className="px-6 py-3.5 bg-slate-900 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-slate-300 font-medium">ปีการศึกษา:</span>
              <select
                value={acadYear}
                onChange={(e) => setAcadYear(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-400"
              >
                <option value="2567">2567 (บันทึกล่าสุด)</option>
                <option value="2569">2569 (ภาคเรียนปัจจุบัน)</option>
                <option value="2566">2566</option>
                <option value="2565">2565</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-300 font-medium">ภาคเรียน:</span>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-400"
              >
                <option value="2">ภาคเรียนที่ 2</option>
                <option value="1">ภาคเรียนที่ 1</option>
                <option value="3">ภาคฤดูร้อน</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => fetchSchedule(acadYear, semester)}
              disabled={loading}
              className="min-h-[34px] px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${loading ? 'animate-spin' : ''}`} />
              <span>ดึงข้อมูลใหม่</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSyncAll}
              disabled={syncingAll || loading}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{syncingAll ? 'กำลังซิงค์...' : 'ซิงค์ทุกรายวิชาเข้า MaKrubNRRU'}</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
              feedback.type === 'ok'
                ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                : 'bg-rose-950/40 border-rose-800/80 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{feedback.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="hover:underline text-[11px]"
            >
              ปิด
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Source Status Kicker */}
          {scheduleData && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-300">
                  {scheduleData.source === 'live_nrru_registrar' ? (
                    <strong className="text-emerald-400 font-medium">
                      เชื่อมต่อสดสำเร็จจากสำนักทะเบียน NRRU (Live Sync)
                    </strong>
                  ) : (
                    <strong className="text-amber-400 font-medium">
                      ฐานข้อมูลทางการสำนักทะเบียน มรภ.นครราชสีมา (Verified Catalog)
                    </strong>
                  )}
                </span>
              </div>
              <span className="text-slate-500 font-mono text-[11px]">
                {scheduleData.note || `ภาคเรียน ${semester}/${acadYear}`}
              </span>
            </div>
          )}

          {/* Courses List */}
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
              <p className="text-sm font-medium text-slate-200">
                กำลังติดต่อระบบสำนักทะเบียน NRRU (reg.nrru.ac.th)...
              </p>
              <p className="text-xs text-slate-400">
                กำลังอ่านตารางสอนและห้องปฏิบัติการของอาจารย์ฐิติวัสส์ กาญจนพิมาย
              </p>
            </div>
          ) : scheduleData && scheduleData.courses.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>
                  พบรายวิชาที่สอนทั้งหมด{' '}
                  <strong className="text-amber-400 font-mono">{scheduleData.courses.length}</strong>{' '}
                  รายการในภาคเรียนนี้
                </span>
                <span>คลิกปุ่มนำเข้าเพื่อเพิ่มลงในระบบเช็คชื่อ</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {scheduleData.courses.map((course, idx) => {
                  const imported = isCourseImportedLocally(course.code) || course.isImported;
                  const isProcessing = importingCode === course.code;

                  return (
                    <div
                      key={`${course.code}-${course.section}-${idx}`}
                      className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-sm font-bold text-amber-400">
                            {course.code}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[11px] font-mono text-slate-300">
                              กลุ่ม {course.section}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[11px] font-mono text-slate-300">
                              {course.credits} หน่วยกิต
                            </span>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-slate-100 leading-snug">
                            {course.name}
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">{course.englishName}</p>
                        </div>

                        <div className="space-y-1.5 pt-2 border-t border-slate-900 text-xs text-slate-300">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="font-mono">{course.schedule}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span className="text-slate-300 line-clamp-1">{course.room}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-900">
                        {imported ? (
                          <div className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>มีในระบบแล้ว</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">ยังไม่ได้นำเข้า</span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleImportSingleCourse(course)}
                          disabled={isProcessing}
                          className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                            imported
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                              : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                          }`}
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{isProcessing ? 'กำลังนำเข้า...' : imported ? 'อัปเดตข้อมูล' : 'นำเข้ารายวิชา'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center space-y-2">
              <BookOpen className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-sm font-medium text-slate-300">
                ไม่พบข้อมูลตารางสอนสำหรับภาคเรียน {semester}/{acadYear}
              </p>
              <p className="text-xs text-slate-500">
                ลองเลือกปีการศึกษา 2567 หรือ 2569 เพื่อดูข้อมูลตารางสอนของอาจารย์ฐิติวัสส์
              </p>
            </div>
          )}

          {/* Quick Notice about NRRU Registrar */}
          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-900/40 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-amber-300">
              <Sparkles className="w-4 h-4" />
              <span>การเชื่อมโยงระบบทะเบียนและการเช็คชื่อ MaKrubNRRU</span>
            </div>
            <p className="text-amber-200/80 leading-relaxed">
              เมื่อกดนำเข้ารายวิชา ระบบจะสร้างวิชานั้นใน MaKrubNRRU โดยอัตโนมัติพร้อมกำหนดรหัส Passcode สำหรับให้นักศึกษาในสาขาวิชาอุตสาหกรรมศิลป์เข้าร่วม และเปิดให้สร้าง Dynamic QR Code เช็คชื่อตามห้องปฏิบัติการและคาบเรียนจริงได้ทันที
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            มหาวิทยาลัยราชภัฏนครราชสีมา · NRRU Registrar
          </span>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-100 transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
