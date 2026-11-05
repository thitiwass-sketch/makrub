import React, { useState } from 'react';
import { UserCheck, Clock, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { AttendanceLog, StudentRecord } from '../types';

interface StudentAttendanceListProps {
  students: StudentRecord[];
  courseCode: string;
  courseName?: string;
  onAttendanceUpdated?: (students: StudentRecord[], attendanceLogs: AttendanceLog[]) => void;
  className?: string;
}

export const StudentAttendanceList: React.FC<StudentAttendanceListProps> = ({
  students: initialStudents,
  courseCode,
  courseName,
  onAttendanceUpdated,
  className = '',
}) => {
  const [students, setStudents] = useState<StudentRecord[]>(initialStudents);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Sync internal state if prop updates
  React.useEffect(() => {
    setStudents(initialStudents);
  }, [initialStudents]);

  // Real mockFetch/API handler with automatic timestamp generation
  const handleMarkStatus = async (
    studentId: string,
    status: 'on_time' | 'late' | 'excused'
  ) => {
    setLoadingId(studentId);

    // Compute formatted real timestamp (HH:mm:ss)
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const realTimestamp = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    // Optimistically update local state immediately
    const updatedLocal = students.map((s) => {
      if (s.studentId !== studentId) return s;
      return {
        ...s,
        todayStatus: status,
        lastCheckInTime: realTimestamp,
      };
    });
    setStudents(updatedLocal);

    try {
      // Backend API call
      const res = await fetch(`/api/students/${studentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          courseCode,
          timestamp: realTimestamp,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.students && data.attendanceLogs && onAttendanceUpdated) {
          onAttendanceUpdated(data.students, data.attendanceLogs);
        }
      }
    } catch {
      // Keep optimistic update active if offline
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <section
      aria-label="ระบบเช็คชื่อนักศึกษารายบุคคล"
      className={`bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-800/80">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            <span>จัดการสถานะเช็คชื่อนักศึกษา</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            วิชา {courseCode} {courseName ? `· ${courseName}` : ''} (แตะเพื่อเปลี่ยนสถานะแบบเรียลไทม์)
          </p>
        </div>
        <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-400">
          ทั้งหมด {students.length} คน
        </span>
      </div>

      <div className="space-y-3">
        {students.map((st) => {
          const isUpdating = loadingId === st.studentId;

          return (
            <div
              key={st.studentId}
              className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/70 hover:bg-slate-950 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-xs"
            >
              {/* Student Identity and Real-time Status Badge */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-100 tracking-tight truncate">
                    {st.fullName}
                  </p>

                  {/* Status Badge with High Contrast */}
                  {st.todayStatus === 'on_time' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
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

                  {(!st.todayStatus || st.todayStatus === 'pending') && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-900 text-slate-400 border border-slate-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                      ยังไม่เช็คชื่อ
                    </span>
                  )}
                </div>

                <p className="text-xs font-mono font-medium text-slate-400 mt-1 flex items-center gap-2">
                  <span>รหัส: <strong className="text-slate-200">{st.studentId}</strong></span>
                  <span aria-hidden="true" className="text-slate-700">·</span>
                  <span className="text-slate-400">เข้าเรียน {st.attendanceRate}%</span>
                  {!st.examEligible && (
                    <span className="text-rose-400 font-semibold inline-flex items-center gap-0.5">
                      <ShieldAlert className="w-3 h-3" />
                      เสี่ยงหมดสิทธิ์สอบ
                    </span>
                  )}
                </p>
              </div>

              {/* Solid Color Segmented Control */}
              <div
                role="group"
                aria-label={`กำหนดสถานะการเข้าเรียนของ ${st.fullName}`}
                className="inline-flex items-center p-1 bg-slate-900 border border-slate-800/90 rounded-xl shadow-inner w-full sm:w-auto shrink-0"
              >
                {/* 1. ตรงเวลา -> Solid Green #10B981 */}
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleMarkStatus(st.studentId, 'on_time')}
                  aria-pressed={st.todayStatus === 'on_time'}
                  className={`flex-1 sm:flex-none min-h-[44px] px-3.5 py-2 rounded-lg text-xs transition-all text-center whitespace-nowrap active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981] ${
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
                  disabled={isUpdating}
                  onClick={() => handleMarkStatus(st.studentId, 'late')}
                  aria-pressed={st.todayStatus === 'late'}
                  className={`flex-1 sm:flex-none min-h-[44px] px-3.5 py-2 rounded-lg text-xs transition-all text-center whitespace-nowrap active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] ${
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
                  disabled={isUpdating}
                  onClick={() => handleMarkStatus(st.studentId, 'excused')}
                  aria-pressed={st.todayStatus === 'excused'}
                  className={`flex-1 sm:flex-none min-h-[44px] px-3.5 py-2 rounded-lg text-xs transition-all text-center whitespace-nowrap active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4] ${
                    st.todayStatus === 'excused'
                      ? 'bg-[#06B6D4] text-slate-950 font-bold shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent font-medium'
                  }`}
                >
                  แจ้งลา
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
