import React, { useState } from 'react';
import {
  X,
  Users,
  Calendar,
  UserCheck,
  FileText,
  Trash2,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Search,
  ExternalLink,
  Shield,
  BookOpen,
} from 'lucide-react';
import { Course, CourseSession, CourseStudent, CourseMaterial } from '../types';

interface CourseManagementModalProps {
  course: Course;
  isOpen: boolean;
  onClose: () => void;
  onCourseUpdated: (updatedCourse: Course, allCourses: Course[]) => void;
  onCourseDeleted: (deletedCode: string, allCourses: Course[]) => void;
}

export const CourseManagementModal: React.FC<CourseManagementModalProps> = ({
  course,
  isOpen,
  onClose,
  onCourseUpdated,
  onCourseDeleted,
}) => {
  const [activeTab, setActiveTab] = useState<'students' | 'sessions' | 'instructors' | 'materials'>('students');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Search in students
  const [studentSearch, setStudentSearch] = useState<string>('');

  // Add Student Form State
  const [isAddingStudent, setIsAddingStudent] = useState<boolean>(false);
  const [newStudentId, setNewStudentId] = useState<string>('');
  const [newStudentName, setNewStudentName] = useState<string>('');
  const [newStudentMajor, setNewStudentMajor] = useState<string>('อุตสาหกรรมศิลป์');
  const [newStudentYear, setNewStudentYear] = useState<string>('ชั้นปีที่ 3');

  // Add Session Form State
  const [isAddingSession, setIsAddingSession] = useState<boolean>(false);
  const [newSessionTopic, setNewSessionTopic] = useState<string>('');
  const [newSessionDate, setNewSessionDate] = useState<string>('');
  const [newSessionTime, setNewSessionTime] = useState<string>(
    course.schedule.split(' ').slice(1).join(' ') || '09:00 – 12:00 น.'
  );
  const [newSessionRoom, setNewSessionRoom] = useState<string>(course.room || '');
  const [newSessionType, setNewSessionType] = useState<'regular' | 'makeup' | 'lab' | 'exam'>('regular');

  // Add Co-instructor Form State
  const [isAddingCoInstructor, setIsAddingCoInstructor] = useState<boolean>(false);
  const [newCoInstructorName, setNewCoInstructorName] = useState<string>('');

  // Add Material Form State
  const [isAddingMaterial, setIsAddingMaterial] = useState<boolean>(false);
  const [newMaterialTitle, setNewMaterialTitle] = useState<string>('');
  const [newMaterialType, setNewMaterialType] = useState<'slides' | 'lab_sheet' | 'syllabus' | 'link'>('lab_sheet');
  const [newMaterialUrl, setNewMaterialUrl] = useState<string>('');

  // Delete Course Confirmation
  const [isConfirmingDeleteCourse, setIsConfirmingDeleteCourse] = useState<boolean>(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState<string>('');

  if (!isOpen) return null;

  const enrolledStudents: CourseStudent[] = course.students || [];
  const sessions: CourseSession[] = course.sessions || [];
  const coInstructors: string[] = course.coInstructors || [];
  const materials: CourseMaterial[] = course.materials || [];

  const filteredStudents = enrolledStudents.filter(
    (s) =>
      s.fullName.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.studentId.includes(studentSearch) ||
      s.major.toLowerCase().includes(studentSearch.toLowerCase())
  );

  // --- Handlers for Students ---
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentId.trim() || !newStudentName.trim()) {
      setFeedback({ type: 'err', text: 'กรุณากรอกรหัสนักศึกษาและชื่อ-นามสกุล' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/courses/${course.code}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: newStudentId,
          fullName: newStudentName,
          major: newStudentMajor,
          yearLevel: newStudentYear,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'err', text: data.error || 'ไม่สามารถเพิ่มนักศึกษาได้' });
      } else {
        onCourseUpdated(data.course, data.courses);
        setFeedback({ type: 'ok', text: data.message || 'เพิ่มนักศึกษาเรียบร้อย' });
        setNewStudentId('');
        setNewStudentName('');
        setIsAddingStudent(false);
      }
    } catch {
      setFeedback({ type: 'err', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveStudent = async (studentId: string, studentName: string) => {
    if (!confirm(`คุณต้องการลบ ${studentName} (${studentId}) ออกจากรายวิชานี้หรือไม่?`)) return;

    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/courses/${course.code}/students/${studentId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'err', text: data.error || 'ไม่สามารถลบนักศึกษาได้' });
      } else {
        onCourseUpdated(data.course, data.courses);
        setFeedback({ type: 'ok', text: data.message || 'ลบนักศึกษาออกจากวิชาเรียบร้อย' });
      }
    } catch {
      setFeedback({ type: 'err', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์' });
    } finally {
      setSubmitting(false);
    }
  };

  // --- Handlers for Sessions ---
  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionTopic.trim() || !newSessionDate.trim()) {
      setFeedback({ type: 'err', text: 'กรุณาระบุหัวข้อการสอนและวันที่เรียน' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/courses/${course.code}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: newSessionTopic,
          date: newSessionDate,
          time: newSessionTime,
          room: newSessionRoom,
          type: newSessionType,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'err', text: data.error || 'ไม่สามารถเพิ่มคาบเรียนได้' });
      } else {
        onCourseUpdated(data.course, data.courses);
        setFeedback({ type: 'ok', text: data.message || 'เพิ่มคาบเรียนเรียบร้อย' });
        setNewSessionTopic('');
        setNewSessionDate('');
        setIsAddingSession(false);
      }
    } catch {
      setFeedback({ type: 'err', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveSession = async (sessionId: string, sessionNum: number, topic: string) => {
    if (!confirm(`คุณต้องการลบคาบเรียนที่ ${sessionNum} (${topic}) หรือไม่?`)) return;

    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/courses/${course.code}/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'err', text: data.error || 'ไม่สามารถลบคาบเรียนได้' });
      } else {
        onCourseUpdated(data.course, data.courses);
        setFeedback({ type: 'ok', text: data.message || 'ลบคาบเรียนเรียบร้อย' });
      }
    } catch {
      setFeedback({ type: 'err', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์' });
    } finally {
      setSubmitting(false);
    }
  };

  // --- Handlers for Co-Instructors ---
  const handleAddCoInstructor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoInstructorName.trim()) {
      setFeedback({ type: 'err', text: 'กรุณาระบุชื่ออาจารย์ผู้สอนร่วม' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/courses/${course.code}/co-instructors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCoInstructorName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'err', text: data.error || 'ไม่สามารถเพิ่มอาจารย์ร่วมได้' });
      } else {
        onCourseUpdated(data.course, data.courses);
        setFeedback({ type: 'ok', text: data.message || 'เพิ่มอาจารย์ร่วมเรียบร้อย' });
        setNewCoInstructorName('');
        setIsAddingCoInstructor(false);
      }
    } catch {
      setFeedback({ type: 'err', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveCoInstructor = async (name: string) => {
    if (!confirm(`คุณต้องการลบอาจารย์ ${name} ออกจากการเป็นผู้สอนร่วมในวิชานี้หรือไม่?`)) return;

    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/courses/${course.code}/co-instructors/${encodeURIComponent(name)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'err', text: data.error || 'ไม่สามารถลบอาจารย์ร่วมได้' });
      } else {
        onCourseUpdated(data.course, data.courses);
        setFeedback({ type: 'ok', text: data.message || 'ลบอาจารย์ร่วมเรียบร้อย' });
      }
    } catch {
      setFeedback({ type: 'err', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์' });
    } finally {
      setSubmitting(false);
    }
  };

  // --- Handlers for Materials ---
  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterialTitle.trim()) {
      setFeedback({ type: 'err', text: 'กรุณากรอกชื่อเอกสาร/สื่อการสอน' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/courses/${course.code}/materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newMaterialTitle,
          type: newMaterialType,
          url: newMaterialUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'err', text: data.error || 'ไม่สามารถเพิ่มเอกสารได้' });
      } else {
        onCourseUpdated(data.course, data.courses);
        setFeedback({ type: 'ok', text: data.message || 'เพิ่มเอกสารในรายวิชาเรียบร้อย' });
        setNewMaterialTitle('');
        setNewMaterialUrl('');
        setIsAddingMaterial(false);
      }
    } catch {
      setFeedback({ type: 'err', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMaterial = async (matId: string, title: string) => {
    if (!confirm(`คุณต้องการลบเอกสาร '${title}' หรือไม่?`)) return;

    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/courses/${course.code}/materials/${matId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'err', text: data.error || 'ไม่สามารถลบเอกสารได้' });
      } else {
        onCourseUpdated(data.course, data.courses);
        setFeedback({ type: 'ok', text: data.message || 'ลบเอกสารเรียบร้อย' });
      }
    } catch {
      setFeedback({ type: 'err', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์' });
    } finally {
      setSubmitting(false);
    }
  };

  // --- Handler for Deleting ENTIRE Course ---
  const handleDeleteCourse = async () => {
    if (deleteConfirmText.trim() !== course.code) {
      setFeedback({ type: 'err', text: `กรุณาพิมพ์รหัสวิชา '${course.code}' ให้ถูกต้องเพื่อยืนยันการลบ` });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/courses/${course.code}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'err', text: data.error || 'ไม่สามารถลบรายวิชาได้' });
      } else {
        onCourseDeleted(course.code, data.courses);
        onClose();
      }
    } catch {
      setFeedback({ type: 'err', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="course-mgmt-title"
    >
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-6 my-auto shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800/80 pb-4 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md bg-amber-400/10 border border-amber-400/30 text-amber-400 font-mono text-xs font-semibold">
                {course.code}
              </span>
              <span className="text-xs text-slate-400">หมู่เรียน {course.section || 'P1'}</span>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-xs text-slate-400">{course.credits} หน่วยกิต</span>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-xs text-slate-400">ภาคเรียน {course.semester}</span>
            </div>
            <h2 id="course-mgmt-title" className="text-lg sm:text-xl font-bold text-slate-100 leading-snug">
              จัดการในรายวิชา: {course.name}
            </h2>
            <p className="text-xs text-slate-400">{course.englishName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors shrink-0"
            aria-label="ปิดหน้าต่างจัดการรายวิชา"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick summary stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>นักศึกษาในวิชา</span>
            </div>
            <div className="text-lg font-bold font-mono text-slate-100">
              {enrolledStudents.length} <span className="text-xs font-normal text-slate-400">คน</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>คาบเรียนทั้งหมด</span>
            </div>
            <div className="text-lg font-bold font-mono text-slate-100">
              {sessions.length} <span className="text-xs font-normal text-slate-400">คาบ</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>ผู้สอนร่วม</span>
            </div>
            <div className="text-lg font-bold font-mono text-slate-100">
              {coInstructors.length} <span className="text-xs font-normal text-slate-400">ท่าน</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>อัตราเข้าเรียน</span>
            </div>
            <div className="text-lg font-bold font-mono text-slate-100">
              {course.attendanceRate}%
            </div>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {feedback && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 shrink-0 ${
              feedback.type === 'ok'
                ? 'bg-emerald-950/50 border-emerald-800/80 text-emerald-200'
                : 'bg-rose-950/50 border-rose-800/80 text-rose-200'
            }`}
          >
            <span>{feedback.text}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tab Buttons (Zero-pill segmented) */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('students');
              setFeedback(null);
            }}
            className={`min-h-[38px] px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 shrink-0 ${
              activeTab === 'students'
                ? 'bg-slate-800 text-amber-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>นักศึกษาในวิชา ({enrolledStudents.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('sessions');
              setFeedback(null);
            }}
            className={`min-h-[38px] px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 shrink-0 ${
              activeTab === 'sessions'
                ? 'bg-slate-800 text-amber-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>ตารางคาบเรียน / ชดเชย ({sessions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('instructors');
              setFeedback(null);
            }}
            className={`min-h-[38px] px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 shrink-0 ${
              activeTab === 'instructors'
                ? 'bg-slate-800 text-amber-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>อาจารย์ผู้สอนร่วม ({coInstructors.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('materials');
              setFeedback(null);
            }}
            className={`min-h-[38px] px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 shrink-0 ${
              activeTab === 'materials'
                ? 'bg-slate-800 text-amber-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>สื่อและเอกสาร ({materials.length})</span>
          </button>
        </div>

        {/* Tab Content Area (Scrollable) */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* TAB 1: ENROLLED STUDENTS */}
          {activeTab === 'students' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="ค้นหารหัสนักศึกษา หรือชื่อ-สกุล..."
                    className="w-full min-h-[38px] pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddingStudent((prev) => !prev)}
                  className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-semibold inline-flex items-center justify-center gap-1.5 self-start transition-colors whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingStudent ? 'ปิดฟอร์ม' : 'เพิ่มนักศึกษาในวิชา'}</span>
                </button>
              </div>

              {/* Add Student Form */}
              {isAddingStudent && (
                <form
                  onSubmit={handleAddStudent}
                  className="p-4 rounded-2xl bg-slate-950 border border-amber-400/40 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" />
                      <span>เพิ่มนักศึกษาเข้าสู่รายวิชา {course.code}</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsAddingStudent(false)}
                      className="text-slate-400 hover:text-slate-200 text-xs"
                    >
                      ยกเลิก
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        รหัสนักศึกษา (10 หลัก)
                      </label>
                      <input
                        type="text"
                        required
                        value={newStudentId}
                        onChange={(e) => setNewStudentId(e.target.value)}
                        placeholder="เช่น 6640508107"
                        className="w-full min-h-[38px] px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl font-mono text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        ชื่อ-นามสกุล นักศึกษา
                      </label>
                      <input
                        type="text"
                        required
                        value={newStudentName}
                        onChange={(e) => setNewStudentName(e.target.value)}
                        placeholder="เช่น นายธนากร สุขเกษม"
                        className="w-full min-h-[38px] px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">สาขาวิชา</label>
                      <input
                        type="text"
                        value={newStudentMajor}
                        onChange={(e) => setNewStudentMajor(e.target.value)}
                        className="w-full min-h-[38px] px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">ชั้นปี</label>
                      <select
                        value={newStudentYear}
                        onChange={(e) => setNewStudentYear(e.target.value)}
                        className="w-full min-h-[38px] px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                      >
                        <option value="ชั้นปีที่ 1">ชั้นปีที่ 1</option>
                        <option value="ชั้นปีที่ 2">ชั้นปีที่ 2</option>
                        <option value="ชั้นปีที่ 3">ชั้นปีที่ 3</option>
                        <option value="ชั้นปีที่ 4">ชั้นปีที่ 4</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="min-h-[38px] px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 text-xs font-semibold"
                    >
                      {submitting ? 'กำลังบันทึก...' : 'บันทึกเพิ่มนักศึกษา'}
                    </button>
                  </div>
                </form>
              )}

              {/* Students List */}
              {filteredStudents.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/40 border border-slate-800 rounded-2xl space-y-2">
                  <p className="text-xs text-slate-400">ยังไม่มีรายชื่อนักศึกษาในรายวิชานี้ หรือไม่ตรงกับการค้นหา</p>
                  <p className="text-[11px] text-slate-500">
                    อาจารย์สามารถกดปุ่ม "เพิ่มนักศึกษาในวิชา" ด้านบน เพื่อเพิ่มรายชื่อนักศึกษาได้ทันที
                  </p>
                </div>
              ) : (
                <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/40">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-medium">
                          <th className="py-2.5 px-3">ลำดับ</th>
                          <th className="py-2.5 px-3">รหัสนักศึกษา</th>
                          <th className="py-2.5 px-3">ชื่อ-นามสกุล</th>
                          <th className="py-2.5 px-3">สาขาวิชา / ชั้นปี</th>
                          <th className="py-2.5 px-3 text-center">เข้าเรียน (%)</th>
                          <th className="py-2.5 px-3 text-center">ขาดสะสม</th>
                          <th className="py-2.5 px-3 text-center">สิทธิ์สอบ</th>
                          <th className="py-2.5 px-3 text-right">จัดการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {filteredStudents.map((st, idx) => (
                          <tr key={st.studentId} className="hover:bg-slate-900/50 transition-colors">
                            <td className="py-2.5 px-3 font-mono text-slate-500 text-center w-10">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-medium text-amber-400">
                              {st.studentId}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-slate-100">{st.fullName}</td>
                            <td className="py-2.5 px-3 text-slate-400">
                              {st.major} ({st.yearLevel})
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono tabular-nums text-slate-200">
                              {st.attendanceRate}%
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono tabular-nums">
                              <span className={st.absentCount >= 3 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                                {st.absentCount} / 3
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {st.examEligible ? (
                                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>ปกติ</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-medium">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>หมดสิทธิ์</span>
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveStudent(st.studentId, st.fullName)}
                                disabled={submitting}
                                title="ลบนักศึกษาออกจากรายวิชานี้"
                                className="min-h-[32px] px-2.5 py-1 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-950/60 border border-transparent hover:border-rose-800 transition-colors inline-flex items-center gap-1 text-[11px]"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">ลบออก</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SESSIONS & MAKE-UP */}
          {activeTab === 'sessions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-slate-400">
                  จัดการคาบเรียนปกติ คาบชดเชย และคาบปฏิบัติการประจำวิชา {course.code}
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddingSession((prev) => !prev)}
                  className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingSession ? 'ปิดฟอร์ม' : 'เพิ่มคาบเรียน / นัดชดเชย'}</span>
                </button>
              </div>

              {/* Add Session Form */}
              {isAddingSession && (
                <form
                  onSubmit={handleAddSession}
                  className="p-4 rounded-2xl bg-slate-950 border border-amber-400/40 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" />
                      <span>เพิ่มคาบเรียนใหม่ / นัดคาบชดเชย</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsAddingSession(false)}
                      className="text-slate-400 hover:text-slate-200 text-xs"
                    >
                      ยกเลิก
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      หัวข้อบทเรียน / ปฏิบัติการ
                    </label>
                    <input
                      type="text"
                      required
                      value={newSessionTopic}
                      onChange={(e) => setNewSessionTopic(e.target.value)}
                      placeholder="เช่น ปฏิบัติการงานกลึงเกลียวสามเหลี่ยมมาตรฐาน ISO ใบงานที่ 4"
                      className="w-full min-h-[38px] px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        วันที่เรียน (เช่น 22 ก.ค. 2569)
                      </label>
                      <input
                        type="text"
                        required
                        value={newSessionDate}
                        onChange={(e) => setNewSessionDate(e.target.value)}
                        placeholder="22 ก.ค. 2569"
                        className="w-full min-h-[38px] px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">เวลา</label>
                      <input
                        type="text"
                        required
                        value={newSessionTime}
                        onChange={(e) => setNewSessionTime(e.target.value)}
                        className="w-full min-h-[38px] px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        ประเภทคาบเรียน
                      </label>
                      <select
                        value={newSessionType}
                        onChange={(e) =>
                          setNewSessionType(e.target.value as 'regular' | 'makeup' | 'lab' | 'exam')
                        }
                        className="w-full min-h-[38px] px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                      >
                        <option value="regular">คาบเรียนปกติ</option>
                        <option value="makeup">คาบชดเชย (Make-up)</option>
                        <option value="lab">ปฏิบัติการโรงงาน (Lab)</option>
                        <option value="exam">สอบวัดผล (Exam)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      ห้องเรียน / สถานที่
                    </label>
                    <input
                      type="text"
                      value={newSessionRoom}
                      onChange={(e) => setNewSessionRoom(e.target.value)}
                      placeholder={course.room}
                      className="w-full min-h-[38px] px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="min-h-[38px] px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 text-xs font-semibold"
                    >
                      {submitting ? 'กำลังบันทึก...' : 'บันทึกคาบเรียน'}
                    </button>
                  </div>
                </form>
              )}

              {/* Sessions List */}
              {sessions.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/40 border border-slate-800 rounded-2xl space-y-2">
                  <p className="text-xs text-slate-400">ยังไม่มีรายการคาบเรียนในวิชานี้</p>
                  <p className="text-[11px] text-slate-500">
                    อาจารย์สามารถกด "เพิ่มคาบเรียน / นัดชดเชย" เพื่อเพิ่มกำหนดการสอน
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {sessions.map((ses) => (
                    <div
                      key={ses.id}
                      className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-amber-400">
                            คาบที่ {ses.sessionNumber}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                              ses.type === 'makeup'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : ses.type === 'lab'
                                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                : ses.type === 'exam'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {ses.type === 'makeup'
                              ? 'คาบชดเชย'
                              : ses.type === 'lab'
                              ? 'ปฏิบัติการ'
                              : ses.type === 'exam'
                              ? 'สอบวัดผล'
                              : 'คาบปกติ'}
                          </span>
                          <span className="text-xs text-slate-500">·</span>
                          <span className="text-xs text-slate-300 flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {ses.date} ({ses.time})
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm font-medium text-slate-100">{ses.topic}</p>
                        {ses.room && (
                          <p className="text-[11px] text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            {ses.room}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveSession(ses.id, ses.sessionNumber, ses.topic)}
                          disabled={submitting}
                          title="ลบคาบเรียนนี้"
                          className="min-h-[34px] px-3 py-1.5 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-950/60 border border-transparent hover:border-rose-800 text-xs inline-flex items-center gap-1.5 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>ลบคาบ</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CO-INSTRUCTORS */}
          {activeTab === 'instructors' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-slate-400">
                  รายชื่ออาจารย์ผู้รับผิดชอบและอาจารย์ผู้สอนร่วมในรายวิชา {course.code}
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddingCoInstructor((prev) => !prev)}
                  className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingCoInstructor ? 'ปิดฟอร์ม' : 'เพิ่มอาจารย์ผู้สอนร่วม'}</span>
                </button>
              </div>

              {/* Lead Instructor Info Card */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      อาจารย์ผู้สอนหลัก (Lead Instructor)
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-100">{course.instructor}</h4>
                  <p className="text-xs text-slate-400">
                    สาขาวิชาอุตสาหกรรมศิลป์ คณะเทคโนโลยีอุตสาหกรรม มรภ.นครราชสีมา
                  </p>
                </div>
                <Shield className="w-5 h-5 text-amber-400 shrink-0" />
              </div>

              {/* Add Co-Instructor Form */}
              {isAddingCoInstructor && (
                <form
                  onSubmit={handleAddCoInstructor}
                  className="p-4 rounded-2xl bg-slate-950 border border-amber-400/40 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" />
                      <span>เพิ่มอาจารย์ผู้สอนร่วม / ผู้ช่วยสอน</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsAddingCoInstructor(false)}
                      className="text-slate-400 hover:text-slate-200 text-xs"
                    >
                      ยกเลิก
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      ชื่อ-นามสกุล อาจารย์ผู้สอนร่วม
                    </label>
                    <input
                      type="text"
                      required
                      value={newCoInstructorName}
                      onChange={(e) => setNewCoInstructorName(e.target.value)}
                      placeholder="เช่น อ.อนุสรณ์ ป้องภัย หรือ ผศ.ดร.สมบัติ ยิ้มละมัย"
                      className="w-full min-h-[38px] px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">เลือกเร็ว:</span>
                    {['อ.อนุสรณ์ ป้องภัย', 'อ.สิทธิชัย เกิดศิลป์', 'ผศ.ดร.สมบัติ ยิ้มละมัย'].map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setNewCoInstructorName(name)}
                        className="text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-300"
                      >
                        {name}
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="min-h-[38px] px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 text-xs font-semibold"
                    >
                      {submitting ? 'กำลังบันทึก...' : 'บันทึกอาจารย์ร่วม'}
                    </button>
                  </div>
                </form>
              )}

              {/* Co-Instructors List */}
              <div className="space-y-2">
                <h5 className="text-xs font-medium text-slate-400">อาจารย์ผู้สอนร่วมที่ได้รับมอบหมาย:</h5>
                {coInstructors.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl">
                    ยังไม่มีอาจารย์ผู้สอนร่วมในรายวิชานี้ (อาจารย์หลักดูแลคนเดียว)
                  </p>
                ) : (
                  coInstructors.map((instructorName) => (
                    <div
                      key={instructorName}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <UserCheck className="w-4 h-4 text-slate-400" />
                        <span className="text-xs sm:text-sm font-medium text-slate-200">
                          {instructorName}
                        </span>
                        <span className="text-[10px] text-slate-500">(ผู้สอนร่วม)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCoInstructor(instructorName)}
                        disabled={submitting}
                        title="ลบอาจารย์ร่วมออกจากวิชานี้"
                        className="min-h-[32px] px-2.5 py-1 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-950/60 border border-transparent hover:border-rose-800 text-xs inline-flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>ลบออก</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: MATERIALS */}
          {activeTab === 'materials' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-slate-400">
                  ประมวลรายวิชา (มคอ.3) ใบงานปฏิบัติการ และสไลด์การสอนประจำวิชา {course.code}
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddingMaterial((prev) => !prev)}
                  className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingMaterial ? 'ปิดฟอร์ม' : 'เพิ่มเอกสาร / ใบงาน'}</span>
                </button>
              </div>

              {/* Add Material Form */}
              {isAddingMaterial && (
                <form
                  onSubmit={handleAddMaterial}
                  className="p-4 rounded-2xl bg-slate-950 border border-amber-400/40 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" />
                      <span>เพิ่มเอกสาร / ใบงานในรายวิชา</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsAddingMaterial(false)}
                      className="text-slate-400 hover:text-slate-200 text-xs"
                    >
                      ยกเลิก
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      ชื่อเอกสาร / หัวข้อใบงาน
                    </label>
                    <input
                      type="text"
                      required
                      value={newMaterialTitle}
                      onChange={(e) => setNewMaterialTitle(e.target.value)}
                      placeholder="เช่น ใบงานที่ 5: การกลึงเกลียวและสว่านเจาะนำศูนย์"
                      className="w-full min-h-[38px] px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        ประเภทเอกสาร
                      </label>
                      <select
                        value={newMaterialType}
                        onChange={(e) =>
                          setNewMaterialType(e.target.value as 'slides' | 'lab_sheet' | 'syllabus' | 'link')
                        }
                        className="w-full min-h-[38px] px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                      >
                        <option value="lab_sheet">ใบงานปฏิบัติการ (Lab Sheet)</option>
                        <option value="syllabus">ประมวลรายวิชา (มคอ.3)</option>
                        <option value="slides">สไลด์การสอน (Lecture Slides)</option>
                        <option value="link">ลิงก์ภายนอก / Google Drive</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        ลิงก์ไฟล์ / URL (ถ้ามี)
                      </label>
                      <input
                        type="text"
                        value={newMaterialUrl}
                        onChange={(e) => setNewMaterialUrl(e.target.value)}
                        placeholder="https://drive.google.com/..."
                        className="w-full min-h-[38px] px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="min-h-[38px] px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 text-xs font-semibold"
                    >
                      {submitting ? 'กำลังบันทึก...' : 'บันทึกเอกสาร'}
                    </button>
                  </div>
                </form>
              )}

              {/* Materials List */}
              {materials.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/40 border border-slate-800 rounded-2xl space-y-2">
                  <p className="text-xs text-slate-400">ยังไม่มีเอกสารในรายวิชานี้</p>
                  <p className="text-[11px] text-slate-500">
                    อาจารย์สามารถกด "เพิ่มเอกสาร / ใบงาน" เพื่ออัปโหลดหรือแนบลิงก์สำหรับนักศึกษา
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {materials.map((mat) => (
                    <div
                      key={mat.id}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-xs sm:text-sm font-medium text-slate-200">
                            {mat.title}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            {mat.type === 'syllabus'
                              ? 'มคอ.3'
                              : mat.type === 'lab_sheet'
                              ? 'ใบงานแล็บ'
                              : mat.type === 'slides'
                              ? 'สไลด์'
                              : 'ลิงก์'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">อัปเดตเมื่อ: {mat.updatedAt}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {mat.url && (
                          <a
                            href={mat.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-h-[32px] px-2.5 py-1 rounded-lg text-slate-300 hover:text-amber-400 hover:bg-slate-800 text-xs inline-flex items-center gap-1 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>เปิด</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveMaterial(mat.id, mat.title)}
                          disabled={submitting}
                          title="ลบเอกสารนี้"
                          className="min-h-[32px] px-2.5 py-1 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-950/60 border border-transparent hover:border-rose-800 text-xs inline-flex items-center gap-1 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>ลบ</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* DANGER ZONE: DELETE ENTIRE COURSE */}
          <div className="mt-8 pt-6 border-t border-rose-950/80">
            <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-900/40 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-semibold text-rose-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>ลบรายวิชานี้ออกจากระบบ (Danger Zone)</span>
                  </h4>
                  <p className="text-[11px] text-rose-300/70">
                    การลบรายวิชา {course.code} ({course.name}) จะลบข้อมูลนักศึกษาในวิชา กำหนดการคาบเรียน
                    และประวัติการเช็คชื่อทั้งหมดออกจากระบบอย่างถาวร
                  </p>
                </div>

                {!isConfirmingDeleteCourse && (
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDeleteCourse(true)}
                    className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-rose-600/30 hover:bg-rose-600 text-rose-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors border border-rose-700/60 whitespace-nowrap shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ลบรายวิชา</span>
                  </button>
                )}
              </div>

              {isConfirmingDeleteCourse && (
                <div className="pt-3 border-t border-rose-900/40 space-y-3">
                  <p className="text-xs text-rose-200">
                    โปรดยืนยันการลบโดยพิมพ์รหัสวิชา{' '}
                    <strong className="font-mono text-amber-400">{course.code}</strong> ในช่องด้านล่าง:
                  </p>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value.trim())}
                      placeholder={`พิมพ์ ${course.code} เพื่อยืนยัน`}
                      className="min-h-[38px] px-3 py-1.5 bg-slate-950 border border-rose-800 rounded-xl font-mono text-xs text-rose-100 placeholder:text-slate-600 focus:outline-none focus:border-rose-400 flex-1"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsConfirmingDeleteCourse(false);
                          setDeleteConfirmText('');
                        }}
                        className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteCourse}
                        disabled={submitting || deleteConfirmText !== course.code}
                        className="min-h-[38px] px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{submitting ? 'กำลังลบ...' : 'ยืนยันลบรายวิชาถาวร'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
