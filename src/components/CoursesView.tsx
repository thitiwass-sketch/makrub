import React, { useState } from 'react';
import {
  Search,
  Plus,
  KeyRound,
  QrCode,
  X,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  SlidersHorizontal,
  Trash2,
  Edit3,
  Users,
} from 'lucide-react';
import { ActiveTab, Course, UserRole } from '../types';
import { InstructorContactCard } from './InstructorContactCard';
import { RegistrarScheduleModal } from './RegistrarScheduleModal';
import { CourseManagementModal } from './CourseManagementModal';

interface CoursesViewProps {
  courses: Course[];
  role: UserRole;
  onCoursesUpdated: (courses: Course[]) => void;
  onOpenQrForCourse: (tab: ActiveTab, courseCode: string) => void;
}

export const CoursesView: React.FC<CoursesViewProps> = ({
  courses,
  role,
  onCoursesUpdated,
  onOpenQrForCourse,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'enrolled' | 'risk'>('all');

  // In-Course Management Modal (Students, Sessions, Co-instructors, Materials)
  const [selectedManageCourse, setSelectedManageCourse] = useState<Course | null>(null);

  // Quick Delete Course Modal
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  // Edit Course Modal
  const [courseToEdit, setCourseToEdit] = useState<Course | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editEnglishName, setEditEnglishName] = useState<string>('');
  const [editSchedule, setEditSchedule] = useState<string>('');
  const [editRoom, setEditRoom] = useState<string>('');
  const [editPasscode, setEditPasscode] = useState<string>('');
  const [editSection, setEditSection] = useState<string>('P1');
  const [editCredits, setEditCredits] = useState<number>(3);
  const [editError, setEditError] = useState<string | null>(null);

  // Join Passcode Modal (Student)
  const [isJoinOpen, setIsJoinOpen] = useState<boolean>(false);
  const [passcodeInput, setPasscodeInput] = useState<string>('');
  const [joinFeedback, setJoinFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // NRRU Registrar Modal
  const [isRegistrarModalOpen, setIsRegistrarModalOpen] = useState<boolean>(false);

  // Create Course Modal (Instructor)
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [newCode, setNewCode] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newEnglishName, setNewEnglishName] = useState<string>('');
  const [newSection, setNewSection] = useState<string>('P1');
  const [newSchedule, setNewSchedule] = useState<string>('พุธ 13:00 – 16:00 น.');
  const [newRoom, setNewRoom] = useState<string>('อาคาร 14 ห้อง 14.02.04');
  const [newCredits, setNewCredits] = useState<number>(3);
  const [newPasscode, setNewPasscode] = useState<string>('');
  const [createError, setCreateError] = useState<string | null>(null);

  const availableToJoin = courses.filter((c) => !c.enrolled);

  const filteredCourses = courses.filter((course) => {
    const matchesQuery =
      course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.room.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesQuery) return false;

    if (filterStatus === 'enrolled') {
      return course.enrolled;
    }
    if (filterStatus === 'risk') {
      return course.attendanceRate < 86 || course.absentCount >= 2;
    }
    if (role === UserRole.STUDENT && !searchQuery) {
      return course.enrolled;
    }
    return true;
  });

  const handleOpenEdit = (course: Course) => {
    setCourseToEdit(course);
    setEditName(course.name);
    setEditEnglishName(course.englishName || '');
    setEditSchedule(course.schedule);
    setEditRoom(course.room);
    setEditPasscode(course.passcode);
    setEditSection(course.section || 'P1');
    setEditCredits(course.credits || 3);
    setEditError(null);
  };

  const handleSaveEditCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseToEdit) return;
    setSubmitting(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/courses/${courseToEdit.code}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          englishName: editEnglishName,
          schedule: editSchedule,
          room: editRoom,
          passcode: editPasscode,
          section: editSection,
          credits: editCredits,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error || 'ไม่สามารถแก้ไขข้อมูลรายวิชาได้');
      } else {
        onCoursesUpdated(data.courses);
        setCourseToEdit(null);
      }
    } catch {
      setEditError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmQuickDelete = async () => {
    if (!courseToDelete) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/courses/${courseToDelete.code}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        onCoursesUpdated(data.courses);
        setCourseToDelete(null);
      }
    } catch {
      // fallback
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinByPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setJoinFeedback(null);
    try {
      const res = await fetch('/api/courses/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: passcodeInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        setJoinFeedback({ type: 'err', text: data.error || 'ไม่สามารถเข้าร่วมรายวิชาได้' });
      } else {
        onCoursesUpdated(data.courses);
        setJoinFeedback({
          type: 'ok',
          text: data.alreadyEnrolled
            ? `คุณลงทะเบียนในวิชา ${data.course.code} ${data.course.name} อยู่แล้ว`
            : `เข้าร่วมวิชา ${data.course.code} ${data.course.name} สำเร็จเรียบร้อย`,
        });
        setPasscodeInput('');
      }
    } catch {
      setJoinFeedback({ type: 'err', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setCreateError(null);
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCode,
          name: newName,
          englishName: newEnglishName,
          section: newSection,
          schedule: newSchedule,
          room: newRoom,
          credits: newCredits,
          passcode: newPasscode,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || 'ไม่สามารถสร้างรายวิชาได้');
      } else {
        onCoursesUpdated(data.courses);
        setNewCode('');
        setNewName('');
        setNewEnglishName('');
        setNewPasscode('');
        setIsCreateOpen(false);
      }
    } catch {
      setCreateError('เกิดข้อผิดพลาดในการบันทึกรายวิชาใหม่');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search, Segmented Filter, and Primary Role Action */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหารหัสวิชา ชื่อวิชา หรืออาคารเรียน..."
              className="w-full min-h-[44px] pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl self-start">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`min-h-[44px] px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:scale-95 ${
                filterStatus === 'all'
                  ? 'bg-slate-800 text-slate-100 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {role === UserRole.STUDENT ? 'วิชาของฉัน' : 'ทุกรายวิชา'}
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('risk')}
              className={`min-h-[44px] px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:scale-95 ${
                filterStatus === 'risk'
                  ? 'bg-slate-800 text-amber-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              เฝ้าระวังสิทธิ์สอบ
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsRegistrarModalOpen(true)}
            title="ตารางสอนสำนักทะเบียน (reg.nrru.ac.th)"
            className="min-h-[44px] px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-400 text-slate-200 text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 shadow-xs"
          >
            <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
            <span>ตารางสอน</span>
          </button>

          {role === UserRole.STUDENT ? (
            <button
              type="button"
              onClick={() => {
                setJoinFeedback(null);
                setIsJoinOpen(true);
              }}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
            >
              <KeyRound className="w-4 h-4" />
              <span>เข้าร่วมด้วย Passcode</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setCreateError(null);
                setIsCreateOpen(true);
              }}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>เปิดรายวิชาใหม่</span>
            </button>
          )}
        </div>
      </div>


      {/* Courses Responsive Grid */}
      {filteredCourses.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
          <p className="text-base font-medium text-slate-200">ไม่พบรายวิชาที่ตรงกับเงื่อนไขการค้นหา</p>
          <p className="text-xs text-slate-400">
            ตรวจสอบรหัสวิชาอีกครั้ง หรือกดล้างตัวกรองเพื่อดูรายวิชาทั้งหมดในภาคการศึกษา 1/2569
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setFilterStatus('all');
            }}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-100"
          >
            แสดงรายวิชาทั้งหมด
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCourses.map((course) => {
            const isRisk = course.attendanceRate < 86 || course.absentCount >= 2;
            const studentsCount = course.students ? course.students.length : 0;
            const sessionsCount = course.sessions ? course.sessions.length : 0;

            return (
              <article
                key={course.code}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-colors shadow-xs"
              >
                <div>
                  {/* Header info */}
                  <div className="flex items-center justify-between gap-2 text-xs font-mono tabular-nums text-slate-400">
                    <span>
                      รหัส <strong className="text-amber-400 font-bold">{course.code}</strong> (หมู่ {course.section || 'P1'}) · {course.credits} หน่วยกิต
                    </span>
                    <span>ภาคเรียน {course.semester}</span>
                  </div>

                  <h3 className="mt-2 text-base sm:text-lg font-semibold text-slate-100 leading-snug">
                    {course.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{course.englishName}</p>

                  {/* Instructor quick badges */}
                  {role === UserRole.INSTRUCTOR && (
                    <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-800/60 text-[11px] text-slate-300">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 font-mono">
                        <Users className="w-3 h-3 text-amber-400" />
                        <span>นักศึกษา {studentsCount} คน</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 font-mono">
                        <Calendar className="w-3 h-3 text-amber-400" />
                        <span>{sessionsCount} คาบเรียน</span>
                      </span>
                      {course.coInstructors && course.coInstructors.length > 0 && (
                        <span className="text-[10px] text-slate-400 truncate">
                          + ผู้สอนร่วม {course.coInstructors.length} ท่าน
                        </span>
                      )}
                    </div>
                  )}

                  <dl className="mt-3.5 space-y-1.5 text-xs text-slate-300">
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-500 shrink-0">อาจารย์ผู้สอน</dt>
                      <dd className="text-right truncate">{course.instructor}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-500 shrink-0">วันและเวลา</dt>
                      <dd className="text-right font-mono tabular-nums">{course.schedule}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-500 shrink-0">สถานที่เรียน</dt>
                      <dd className="text-right truncate">{course.room}</dd>
                    </div>
                    {role === UserRole.INSTRUCTOR && (
                      <div className="flex justify-between gap-2">
                        <dt className="text-slate-500 shrink-0">รหัส Passcode</dt>
                        <dd className="text-right font-mono tabular-nums text-amber-400 font-semibold">
                          {course.passcode}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      อัตราเข้าเรียน:{' '}
                      <strong className="font-mono tabular-nums text-slate-100">
                        {course.attendanceRate}%
                      </strong>
                    </span>
                    {isRisk ? (
                      <span className="inline-flex items-center gap-1 font-medium text-amber-400">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>สุ่มเสี่ยง (ขาด {course.absentCount}/3)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-medium text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>ปกติ (มีสิทธิ์สอบ)</span>
                      </span>
                    )}
                  </div>

                  {role === UserRole.INSTRUCTOR ? (
                    <div className="space-y-2">
                      {/* Primary In-Course Management Button */}
                      <button
                        type="button"
                        onClick={() => setSelectedManageCourse(course)}
                        className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-semibold inline-flex items-center justify-center gap-2 transition-all whitespace-nowrap shadow-xs active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                      >
                        <SlidersHorizontal className="w-4 h-4 text-slate-950" />
                        <span>จัดการในรายวิชา (นักศึกษา/คาบเรียน)</span>
                      </button>

                      {/* Sub-actions row: QR, Edit, Delete */}
                      <div className="grid grid-cols-12 gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenQrForCourse(ActiveTab.QR_CHECKIN, course.code)}
                          className="col-span-8 min-h-[44px] px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-200 inline-flex items-center justify-center gap-1.5 transition-all whitespace-nowrap active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                        >
                          <QrCode className="w-3.5 h-3.5 text-amber-400" />
                          <span>เปิด QR เช็คชื่อ</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(course)}
                          title="แก้ไขข้อมูลรายวิชา"
                          aria-label={`แก้ไขข้อมูลรายวิชา ${course.code}`}
                          className="col-span-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-amber-400 transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setCourseToDelete(course)}
                          title="ลบรายวิชานี้"
                          aria-label={`ลบรายวิชา ${course.code}`}
                          className="col-span-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-950 hover:bg-rose-950/50 border border-slate-800 hover:border-rose-800 text-slate-400 hover:text-rose-300 transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOpenQrForCourse(ActiveTab.QR_CHECKIN, course.code)}
                      className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-200 inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                    >
                      <QrCode className="w-4 h-4 text-amber-400" />
                      <span>ไปที่หน้าเช็คชื่อวิชานี้</span>
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Instructor Contact Section for Students */}
      {role === UserRole.STUDENT && (
        <div className="pt-2">
          <InstructorContactCard showTitle={true} />
        </div>
      )}

      {/* Student Join Passcode Sheet / Modal */}
      {isJoinOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="join-course-title"
        >
          <div className="w-full sm:max-w-md bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl p-6 space-y-5">
            <div className="w-10 h-1.5 bg-slate-700 rounded-full mx-auto sm:hidden" />
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 id="join-course-title" className="text-lg font-semibold text-slate-100">
                  เข้าร่วมรายวิชาด้วย Passcode
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  กรอกรหัสเข้าร่วมชั้นเรียนที่ได้รับจากอาจารย์ผู้สอนประจำวิชา
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsJoinOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                aria-label="ปิดหน้าต่าง"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {availableToJoin.length > 0 && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <p className="text-xs text-slate-400">
                  รายวิชาที่เปิดรับลงทะเบียนเพิ่มในภาคเรียนนี้ (แตะเพื่อกรอกรหัสอัตโนมัติ):
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableToJoin.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setPasscodeInput(c.passcode)}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-amber-400 transition-colors"
                    >
                      {c.passcode} ({c.code})
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleJoinByPasscode} className="space-y-4">
              <div>
                <label htmlFor="passcode-field" className="block text-xs font-medium text-slate-300 mb-1.5">
                  รหัส Passcode ประจำวิชา
                </label>
                <input
                  id="passcode-field"
                  type="text"
                  required
                  value={passcodeInput}
                  onChange={(e) => setPasscodeInput(e.target.value.toUpperCase())}
                  placeholder="เช่น CAD2569 หรือ WOOD2569"
                  className="w-full min-h-[46px] px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
                />
              </div>

              {joinFeedback && (
                <p
                  className={`text-xs p-3 rounded-xl border ${
                    joinFeedback.type === 'ok'
                      ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                  }`}
                >
                  {joinFeedback.text}
                </p>
              )}

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsJoinOpen(false)}
                  className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-medium text-slate-200"
                >
                  ปิดหน้าต่าง
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-slate-950 text-sm font-semibold"
                >
                  {submitting ? 'กำลังตรวจสอบ...' : 'ยืนยันเข้าร่วม'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Instructor Create New Course Sheet / Modal */}
      {isCreateOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-course-title"
        >
          <div className="w-full sm:max-w-lg bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl p-6 space-y-5">
            <div className="w-10 h-1.5 bg-slate-700 rounded-full mx-auto sm:hidden" />
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 id="create-course-title" className="text-lg font-semibold text-slate-100">
                  เปิดรายวิชาใหม่ในภาคเรียน 1/2569
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  สร้างห้องเรียนและรหัส Passcode สำหรับให้นักศึกษาลงทะเบียนเช็คชื่อ
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                aria-label="ปิดหน้าต่าง"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    รหัสวิชา (6 หลัก)
                  </label>
                  <input
                    type="text"
                    required
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="เช่น 508420"
                    className="w-full min-h-[44px] px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    หมู่เรียน (Section)
                  </label>
                  <input
                    type="text"
                    value={newSection}
                    onChange={(e) => setNewSection(e.target.value)}
                    placeholder="เช่น P1"
                    className="w-full min-h-[44px] px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    หน่วยกิต
                  </label>
                  <select
                    value={newCredits}
                    onChange={(e) => setNewCredits(Number(e.target.value))}
                    className="w-full min-h-[44px] px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                  >
                    <option value={1}>1 หน่วยกิต</option>
                    <option value={2}>2 หน่วยกิต</option>
                    <option value={3}>3 หน่วยกิต</option>
                    <option value={4}>4 หน่วยกิต</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  ชื่อรายวิชา (ภาษาไทย)
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="เช่น เทคโนโลยีเครื่องจักรกลอัตโนมัติ CNC"
                  className="w-full min-h-[44px] px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  ชื่อภาษาอังกฤษ (ถ้ามี)
                </label>
                <input
                  type="text"
                  value={newEnglishName}
                  onChange={(e) => setNewEnglishName(e.target.value)}
                  placeholder="เช่น Automated CNC Machinery Technology"
                  className="w-full min-h-[44px] px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    ตารางเรียน
                  </label>
                  <input
                    type="text"
                    required
                    value={newSchedule}
                    onChange={(e) => setNewSchedule(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    ห้องปฏิบัติการ / อาคาร
                  </label>
                  <input
                    type="text"
                    required
                    value={newRoom}
                    onChange={(e) => setNewRoom(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  รหัสเข้าร่วม (Passcode) สำหรับนักศึกษา
                </label>
                <input
                  type="text"
                  value={newPasscode}
                  onChange={(e) => setNewPasscode(e.target.value.toUpperCase())}
                  placeholder="เช่น CNC420 (หากไม่ระบุระบบจะสร้างอัตโนมัติ)"
                  className="w-full min-h-[44px] px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              {createError && (
                <p className="text-xs p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300">
                  {createError}
                </p>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-medium text-slate-200"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-slate-950 text-sm font-semibold"
                >
                  {submitting ? 'กำลังบันทึก...' : 'บันทึกรายวิชา'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {courseToEdit && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-course-title"
        >
          <div className="w-full sm:max-w-lg bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl p-6 space-y-5">
            <div className="w-10 h-1.5 bg-slate-700 rounded-full mx-auto sm:hidden" />
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 id="edit-course-title" className="text-lg font-semibold text-slate-100">
                  แก้ไขข้อมูลรายวิชา {courseToEdit.code}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  ปรับปรุงชื่อวิชา ตารางเรียน ห้องเรียน หรือ Passcode
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCourseToEdit(null)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                aria-label="ปิดหน้าต่าง"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  ชื่อรายวิชา (ภาษาไทย)
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  ชื่อภาษาอังกฤษ
                </label>
                <input
                  type="text"
                  value={editEnglishName}
                  onChange={(e) => setEditEnglishName(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    ตารางเรียน
                  </label>
                  <input
                    type="text"
                    required
                    value={editSchedule}
                    onChange={(e) => setEditSchedule(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    ห้องปฏิบัติการ / อาคาร
                  </label>
                  <input
                    type="text"
                    required
                    value={editRoom}
                    onChange={(e) => setEditRoom(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    หมู่เรียน (Section)
                  </label>
                  <input
                    type="text"
                    value={editSection}
                    onChange={(e) => setEditSection(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    หน่วยกิต
                  </label>
                  <select
                    value={editCredits}
                    onChange={(e) => setEditCredits(Number(e.target.value))}
                    className="w-full min-h-[44px] px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                  >
                    <option value={1}>1 หน่วยกิต</option>
                    <option value={2}>2 หน่วยกิต</option>
                    <option value={3}>3 หน่วยกิต</option>
                    <option value={4}>4 หน่วยกิต</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Passcode
                  </label>
                  <input
                    type="text"
                    value={editPasscode}
                    onChange={(e) => setEditPasscode(e.target.value.toUpperCase())}
                    className="w-full min-h-[44px] px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-sm text-amber-400 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {editError && (
                <p className="text-xs p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300">
                  {editError}
                </p>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCourseToEdit(null)}
                  className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-medium text-slate-200"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-slate-950 text-sm font-semibold"
                >
                  {submitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Delete Confirmation Modal */}
      {courseToDelete && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-delete-title"
        >
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 id="quick-delete-title" className="text-base font-bold text-slate-100">
                  ยืนยันการลบรายวิชา {courseToDelete.code}
                </h3>
                <p className="text-xs text-slate-400">
                  คุณแน่ใจหรือไม่ว่าต้องการลบวิชา{' '}
                  <strong className="text-slate-200">
                    {courseToDelete.code} {courseToDelete.name}
                  </strong>{' '}
                  ออกจากระบบ? ข้อมูลนักศึกษาในวิชาและคาบเรียนทั้งหมดจะถูกลบออก
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1">
              <div>อาจารย์ผู้สอน: {courseToDelete.instructor}</div>
              <div>สถานที่เรียน: {courseToDelete.room}</div>
              <div>ตารางเรียน: {courseToDelete.schedule}</div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCourseToDelete(null)}
                className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmQuickDelete}
                disabled={submitting}
                className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>{submitting ? 'กำลังลบ...' : 'ยืนยันลบวิชานี้'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive In-Course Management Modal (Students, Sessions, Co-instructors, Materials) */}
      {selectedManageCourse && (
        <CourseManagementModal
          course={selectedManageCourse}
          isOpen={true}
          onClose={() => setSelectedManageCourse(null)}
          onCourseUpdated={(updatedCourse, allCourses) => {
            setSelectedManageCourse(updatedCourse);
            onCoursesUpdated(allCourses);
          }}
          onCourseDeleted={(_deletedCode, allCourses) => {
            setSelectedManageCourse(null);
            onCoursesUpdated(allCourses);
          }}
        />
      )}

      {/* NRRU Registrar Timetable & Import Modal */}
      <RegistrarScheduleModal
        isOpen={isRegistrarModalOpen}
        onClose={() => setIsRegistrarModalOpen(false)}
        role={role}
        onCoursesUpdated={onCoursesUpdated}
        currentCourses={courses}
      />
    </div>
  );
};

