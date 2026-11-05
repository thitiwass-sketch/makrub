import React, { useState, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { PieChart as PieIcon, Users, Clock, AlertTriangle, CheckCircle2, UserX } from 'lucide-react';
import { AppStateData, UserRole } from '../types';

interface AttendancePieChartProps {
  state: AppStateData;
  role: UserRole;
  className?: string;
}

interface ChartDataItem {
  name: string;
  value: number;
  color: string;
  percentage: number;
  description: string;
}

export const AttendancePieChart: React.FC<AttendancePieChartProps> = ({
  state,
  role,
  className = '',
}) => {
  const [viewScope, setViewScope] = useState<'today' | 'semester'>('today');

  // Compute breakdown for Today's live session
  const todayBreakdown = useMemo(() => {
    const total = state.students.length || 1;
    let onTime = 0;
    let late = 0;
    let absent = 0;
    let excused = 0;

    state.students.forEach((s) => {
      if (s.todayStatus === 'on_time') onTime++;
      else if (s.todayStatus === 'late') late++;
      else if (s.todayStatus === 'excused') excused++;
      else absent++; // 'pending' or not checked-in counts as absent/pending
    });

    return [
      {
        name: 'เข้าเรียนตรงเวลา',
        value: onTime,
        color: '#10B981', // Emerald
        percentage: Math.round((onTime / total) * 100),
        description: 'เช็คชื่อทันตามกำหนดเวลา',
      },
      {
        name: 'เข้าเรียนสาย',
        value: late,
        color: '#F59E0B', // Amber
        percentage: Math.round((late / total) * 100),
        description: `เกินเกณฑ์ ${state.qrSession.lateThresholdMin} นาที`,
      },
      {
        name: 'ขาดเรียน / ยังไม่เช็ค',
        value: absent,
        color: '#EF4444', // Rose / Red
        percentage: Math.round((absent / total) * 100),
        description: 'ยังไม่มีบันทึกการเช็คชื่อในคาบนี้',
      },
      {
        name: 'แจ้งลา (ป่วย/กิจ)',
        value: excused,
        color: '#06B6D4', // Cyan
        percentage: Math.round((excused / total) * 100),
        description: 'มีหลักฐานการลาได้รับอนุมัติ',
      },
    ].filter((item) => item.value > 0);
  }, [state.students, state.qrSession.lateThresholdMin]);

  // Compute breakdown for Semester Overall cumulative attendance
  const semesterBreakdown = useMemo(() => {
    const totalStudents = state.students.length || 1;
    const avgAttendance =
      state.students.reduce((acc, s) => acc + s.attendanceRate, 0) / totalStudents;
    const totalAbsents = state.students.reduce((acc, s) => acc + s.absentCount, 0);
    const atRiskCount = state.students.filter((s) => !s.examEligible || s.absentCount >= 2).length;
    const onTimeStudents = state.students.filter((s) => s.attendanceRate >= 85 && s.absentCount <= 1).length;
    const lateProneStudents = state.students.filter((s) => s.avgLateMin > state.qrSession.lateThresholdMin).length;

    return [
      {
        name: 'เข้าเรียนปกติ (ตรงเวลา)',
        value: onTimeStudents,
        color: '#10B981',
        percentage: Math.round((onTimeStudents / totalStudents) * 100),
        description: 'สิทธิ์สอบปกติ เข้าเรียนสม่ำเสมอ',
      },
      {
        name: 'สายสะสมบ่อย',
        value: lateProneStudents,
        color: '#F59E0B',
        percentage: Math.round((lateProneStudents / totalStudents) * 100),
        description: `เฉลี่ยเกิน ${state.qrSession.lateThresholdMin} นาที`,
      },
      {
        name: 'ขาดเรียนเกินเกณฑ์ / เฝ้าระวัง',
        value: atRiskCount,
        color: '#EF4444',
        percentage: Math.round((atRiskCount / totalStudents) * 100),
        description: 'ขาด 2-3 ครั้ง เสี่ยงหมดสิทธิ์สอบ',
      },
    ].filter((item) => item.value > 0);
  }, [state.students, state.qrSession.lateThresholdMin]);

  const currentData: ChartDataItem[] = viewScope === 'today' ? todayBreakdown : semesterBreakdown;
  const totalCount = currentData.reduce((sum, item) => sum + item.value, 0);

  // Overall attendance rate for center badge
  const overallRate =
    viewScope === 'today'
      ? Math.round(
          (((todayBreakdown.find((d) => d.name === 'เข้าเรียนตรงเวลา')?.value || 0) +
            (todayBreakdown.find((d) => d.name === 'เข้าเรียนสาย')?.value || 0)) /
            (state.students.length || 1)) *
            100
        )
      : (
          state.students.reduce((acc, s) => acc + s.attendanceRate, 0) /
          Math.max(state.students.length, 1)
        ).toFixed(1);

  return (
    <section
      aria-label="สรุปสัดส่วนการเช็คชื่อเข้าเรียนแบบเรียลไทม์"
      className={`bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5 shadow-xs ${className}`}
    >
      {/* Header & Scope Segmented Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-950/70 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <PieIcon className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-100">
              สรุปสถิติการเช็คชื่อเข้าเรียน (Real-Time Attendance)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>
              {viewScope === 'today'
                ? `คาบเรียนปัจจุบัน วิชา ${state.qrSession.courseCode} · รวม ${state.students.length} คน`
                : `สถิติสะสมภาคการศึกษา 1/2569 · รวม ${state.courses.length} รายวิชา`}
            </span>
          </p>
        </div>

        {/* Segmented Control with >=44px Touch Targets */}
        <div
          role="group"
          aria-label="เลือกมุมมองสถิติ"
          className="inline-flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl self-start sm:self-auto"
        >
          <button
            type="button"
            onClick={() => setViewScope('today')}
            className={`min-h-[44px] px-3.5 py-2 text-xs font-semibold rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 active:scale-95 ${
              viewScope === 'today'
                ? 'bg-emerald-400 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            คาบปัจจุบัน
          </button>
          <button
            type="button"
            onClick={() => setViewScope('semester')}
            className={`min-h-[44px] px-3.5 py-2 text-xs font-semibold rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 active:scale-95 ${
              viewScope === 'semester'
                ? 'bg-emerald-400 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            สะสมทั้งภาคเรียน
          </button>
        </div>
      </div>

      {/* Main Visuals Grid: Donut Chart (Left) + Breakdown Cards (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Donut Chart Container */}
        <div className="lg:col-span-5 relative flex items-center justify-center min-h-[240px]">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={currentData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={68}
                outerRadius={95}
                paddingAngle={4}
                stroke="#0f172a"
                strokeWidth={2}
                animationDuration={800}
              >
                {currentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as ChartDataItem;
                    return (
                      <div className="bg-slate-950/95 border border-slate-800 p-3 rounded-xl shadow-xl backdrop-blur-md text-xs space-y-1">
                        <p className="font-bold text-slate-100 flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: data.color }}
                          />
                          <span>{data.name}</span>
                        </p>
                        <p className="font-mono text-slate-300">
                          จำนวน: <strong className="text-white text-sm">{data.value}</strong> คน ({data.percentage}%)
                        </p>
                        <p className="text-[11px] text-slate-400">{data.description}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Donut Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-mono tracking-tight">
              {overallRate}%
            </span>
            <span className="text-[11px] font-medium text-slate-400 mt-0.5">
              {viewScope === 'today' ? 'เข้าเรียนคาบนี้' : 'เข้าเรียนเฉลี่ย'}
            </span>
          </div>
        </div>

        {/* Breakdown Metric Cards Grid */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {currentData.map((item) => (
            <div
              key={item.name}
              className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/90 transition-all flex items-start gap-3"
            >
              <div
                className="w-3.5 h-3.5 rounded-full shrink-0 mt-1 shadow-xs"
                style={{ backgroundColor: item.color }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-200 truncate">
                    {item.name}
                  </p>
                  <span className="font-mono text-sm font-bold text-white shrink-0">
                    {item.value} <span className="text-[11px] font-normal text-slate-400">คน</span>
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="truncate">{item.description}</span>
                  <span className="font-mono font-semibold" style={{ color: item.color }}>
                    {item.percentage}%
                  </span>
                </div>
                {/* Visual Progress Line */}
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
