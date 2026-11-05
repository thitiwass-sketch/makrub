import React, { useState } from 'react';
import { RefreshCw, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  ActiveTab,
  AiInsightResult,
  AppStateData,
  UserRole,
} from '../types';
import { AttendanceChart } from './AttendanceChart';
import { InstructorContactCard } from './InstructorContactCard';
import { AttendancePieChart } from './AttendancePieChart';
import { StudentAttendanceList } from './StudentAttendanceList';

interface DashboardViewProps {
  state: AppStateData;
  role: UserRole;
  onNavigate: (tab: ActiveTab, courseCode?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  state,
  role,
  onNavigate,
}) => {
  const [insight, setInsight] = useState<AiInsightResult | null>(null);
  const [loadingInsight, setLoadingInsight] = useState<boolean>(false);
  const [insightError, setInsightError] = useState<string | null>(null);

  const currentStudent =
    state.students.find((s) => s.studentId === '6640508101') ?? state.students[0];
  const enrolledCourses = state.courses.filter((c) => c.enrolled);
  const studentSubs = state.submissions.filter((s) => s.studentId === '6640508101');
  const approvedStudentSubs = studentSubs.filter((s) => s.status === 'approved').length;
  const pendingStudentSubs = studentSubs.filter((s) => s.status === 'pending').length;

  const avgDeptAttendance = (
    state.students.reduce((sum, s) => sum + s.attendanceRate, 0) /
    Math.max(state.students.length, 1)
  ).toFixed(1);
  const checkedInTodayCount = state.students.filter(
    (s) => s.todayStatus === 'on_time' || s.todayStatus === 'late' || s.todayStatus === 'excused'
  ).length;
  const atRiskStudents = state.students.filter(
    (s) => !s.examEligible || s.attendanceRate < 85 || s.avgLateMin > state.qrSession.lateThresholdMin
  );
  const pendingAllSubsCount = state.submissions.filter((s) => s.status === 'pending').length;

  const handleAnalyzeInsights = async () => {
    setLoadingInsight(true);
    setInsightError(null);
    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'ไม่สามารถวิเคราะห์ข้อมูลได้ในขณะนี้');
      }
      setInsight(data);
    } catch (err: unknown) {
      setInsightError(
        err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อระบบวิเคราะห์'
      );
    } finally {
      setLoadingInsight(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Full-Width 4-Box KPI Strip (2x2 Grid on Mobile, 4-Col on Desktop) */}
      <section
        aria-label="ตัวชี้วัดภาพรวม"
        className="bg-slate-900 border border-slate-800 rounded-2xl grid grid-cols-2 lg:grid-cols-4 divide-y divide-x sm:divide-y-0 divide-slate-800/80 overflow-hidden shadow-xs"
      >
        {role === UserRole.STUDENT ? (
          <>
            <div className="p-5">
              <p className="text-xs font-semibold text-slate-400 tracking-wide">เข้าเรียนตรงเวลา</p>
              <div className="mt-2 flex items-baseline">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums text-amber-400 font-display">
                  {currentStudent.attendanceRate.toFixed(1)}
                </span>
                <span className="text-xl font-bold text-amber-400/90 ml-0.5 font-display">%</span>
              </div>
              <p className="mt-2 text-xs font-medium text-emerald-400 flex items-center gap-1">
                <span>▲ +2.4%</span>
                <span className="text-emerald-400/80">จากสัปดาห์ก่อนหน้า</span>
              </p>
            </div>

            <div className="p-5">
              <p className="text-xs font-semibold text-slate-400 tracking-wide">เวลาสายเฉลี่ยรายสัปดาห์</p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums text-slate-100 font-display">
                  {currentStudent.avgLateMin}
                </span>
                <span className="text-sm sm:text-base font-semibold text-slate-300">นาที</span>
              </div>
              <p className="mt-2 text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span>ต่ำกว่าเกณฑ์สาย ({state.qrSession.lateThresholdMin} นาที)</span>
              </p>
            </div>

            <div className="p-5">
              <p className="text-xs font-semibold text-slate-400 tracking-wide">สถานะสิทธิ์สอบปลายภาค</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-400">
                  ปกติ
                </span>
                <span className="text-lg sm:text-xl font-bold text-emerald-400/90 tabular-nums font-display">
                  100%
                </span>
              </div>
              <p className="mt-2 text-xs font-medium text-slate-400 tabular-nums">
                ขาดสะสมรวม <span className="font-semibold text-slate-300">{currentStudent.absentCount}</span> / 3 ครั้ง
              </p>
            </div>

            <div className="p-5">
              <p className="text-xs font-semibold text-slate-400 tracking-wide">โครงงานและใบงาน</p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums text-slate-100 font-display">
                  {approvedStudentSubs} <span className="text-slate-500 font-light text-2xl">/</span> {studentSubs.length}
                </span>
                <span className="text-sm sm:text-base font-semibold text-slate-300">ชิ้น</span>
              </div>
              <p className="mt-2 text-xs font-medium text-sky-400 tabular-nums">
                รอผู้สอนตรวจ <span className="font-semibold">{pendingStudentSubs}</span> รายการ
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="p-5">
              <p className="text-xs font-semibold text-slate-400 tracking-wide">อัตราเข้าเรียนรวมสาขา</p>
              <div className="mt-2 flex items-baseline">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums text-amber-400 font-display">
                  {avgDeptAttendance}
                </span>
                <span className="text-xl font-bold text-amber-400/90 ml-0.5 font-display">%</span>
              </div>
              <p className="mt-2 text-xs font-medium text-emerald-400">
                ภาคการศึกษา 1/2569 ({state.courses.length} รายวิชา)
              </p>
            </div>

            <div className="p-5">
              <p className="text-xs font-semibold text-slate-400 tracking-wide">เช็คชื่อคาบเรียนปัจจุบัน</p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums text-slate-100 font-display">
                  {checkedInTodayCount} <span className="text-slate-500 font-light text-2xl">/</span> {state.students.length}
                </span>
                <span className="text-sm sm:text-base font-semibold text-slate-300">คน</span>
              </div>
              <p className="mt-2 text-xs font-medium text-sky-400 tabular-nums">
                วิชา {state.qrSession.courseCode} · {state.qrSession.isOpen ? 'เปิดรับเช็คชื่อ' : 'ปิดชั่วคราว'}
              </p>
            </div>

            <div className="p-5">
              <p className="text-xs font-semibold text-slate-400 tracking-wide">นักศึกษาเฝ้าระวังสิทธิ์สอบ</p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums text-rose-400 font-display">
                  {atRiskStudents.length}
                </span>
                <span className="text-sm sm:text-base font-semibold text-rose-400/90">คน</span>
              </div>
              <p className="mt-2 text-xs font-medium text-slate-400">
                สายเฉลี่ยเกิน {state.qrSession.lateThresholdMin} นาที หรือขาดเรียนสะสม
              </p>
            </div>

            <div className="p-5">
              <p className="text-xs font-semibold text-slate-400 tracking-wide">ชิ้นงานรอตรวจประเมิน</p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums text-slate-100 font-display">
                  {pendingAllSubsCount}
                </span>
                <span className="text-sm sm:text-base font-semibold text-slate-300">ชิ้น</span>
              </div>
              <p className="mt-2 text-xs font-medium text-amber-400">
                จากทั้งหมด {state.submissions.length} รายการส่งงาน
              </p>
            </div>
          </>
        )}
      </section>

      {/* 2. Real-Time Student Attendance Donut Pie Chart Breakdown */}
      <AttendancePieChart state={state} role={role} />

      {/* Main 2-Column Analytical Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7">
          <AttendanceChart
            data={state.analytics}
            role={role}
            lateThreshold={state.qrSession.lateThresholdMin}
          />
        </div>

        {/* Right Contextual Panel: Exam Quota (Student) OR At-Risk Watchlist (Instructor) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col justify-between">
          {role === UserRole.STUDENT ? (
            <div>
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-100">
                    สถานะสิทธิ์สอบรายวิชา
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    โควตาการขาดเรียนสูงสุดไม่เกิน 3 ครั้งต่อรายวิชา (เกณฑ์ NRRU 80%)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate(ActiveTab.COURSES)}
                  className="min-h-[40px] px-3 py-1.5 text-xs font-medium text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <span>ดูทั้งหมด</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-slate-800/80">
                {enrolledCourses.map((course) => {
                  const isRisk = course.attendanceRate < 86 || course.absentCount >= 2;
                  return (
                    <div key={course.code} className="py-3.5 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono tabular-nums">
                          <span className="text-amber-400 font-semibold">{course.code}</span>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">{course.room}</span>
                        </div>
                        <p className="text-sm font-medium text-slate-100 truncate mt-0.5">
                          {course.name}
                        </p>
                        <p className="text-xs text-slate-400 mt-1 font-mono tabular-nums">
                          เข้าเรียน {course.attendanceRate}% · ขาดสะสม {course.absentCount}/{course.maxAbsentQuota} ครั้ง
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        {isRisk ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 whitespace-nowrap">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>เฝ้าระวัง</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 whitespace-nowrap">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>มีสิทธิ์สอบ</span>
                          </span>
                        )}
                        <div className="mt-1.5">
                          <button
                            type="button"
                            onClick={() => onNavigate(ActiveTab.QR_CHECKIN, course.code)}
                            className="min-h-[36px] text-xs font-medium text-slate-300 hover:text-amber-400 underline underline-offset-4 whitespace-nowrap"
                          >
                            เช็คชื่อวิชานี้
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-100">
                    รายชื่อนักศึกษาที่ต้องติดตามเป็นพิเศษ
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    คัดกรองอัตโนมัติจากอัตราเข้าเรียน &lt;85% หรือสายเกินเกณฑ์
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate(ActiveTab.QR_CHECKIN)}
                  className="min-h-[40px] px-3 py-1.5 text-xs font-medium text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <span>จัดการเช็คชื่อ</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2.5">
                {atRiskStudents.map((student) => (
                  <div
                    key={student.studentId}
                    className="p-3 sm:p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-100 truncate">
                        {student.fullName}
                      </p>
                      <p className="text-xs text-slate-400 font-mono tabular-nums mt-0.5">
                        {student.studentId} · เข้าเรียน {student.attendanceRate}% · สายเฉลี่ย {student.avgLateMin} นาที
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {student.examEligible ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                          ▲ ขาด {student.absentCount}/3 ครั้ง
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30 whitespace-nowrap">
                          ✕ เสี่ยงหมดสิทธิ์สอบ
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-3 text-xs text-slate-400">
            <span>อัปเดตข้อมูลล่าสุดจากระบบเช็คชื่อโรงฝึกงาน อาคาร 14</span>
            <button
              type="button"
              onClick={() => onNavigate(ActiveTab.SUBMISSIONS)}
              className="min-h-[36px] text-slate-200 hover:text-amber-400 font-medium whitespace-nowrap shrink-0"
            >
              {role === UserRole.STUDENT ? 'ส่งชิ้นงาน →' : 'ตรวจชิ้นงาน →'}
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Student Attendance Roster with Solid Segmented Control */}
      {role === UserRole.INSTRUCTOR && (
        <StudentAttendanceList
          students={state.students}
          courseCode={state.qrSession.courseCode}
          courseName="วิชาปฏิบัติการโรงงานและการออกแบบ"
        />
      )}

      {/* Instructor Contact Section (LINE Official & Channels) */}
      <InstructorContactCard showTitle={true} isInstructor={role === UserRole.INSTRUCTOR} />

      {/* Server-Side AI Behavioral Analytics Panel (No thick left accent border, clean hairline) */}
      <section aria-labelledby="ai-insights-heading" className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 id="ai-insights-heading" className="text-base sm:text-lg font-semibold text-slate-100">
              การวิเคราะห์แนวโน้มพฤติกรรมการเรียนเชิงลึก
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              สรุปภาพรวมความสม่ำเสมอ ปัจจัยเสี่ยงสิทธิ์สอบ และคำแนะนำเชิงรุกจากข้อมูลจริงในภาคการศึกษา 1/2569
            </p>
          </div>

          <button
            type="button"
            onClick={handleAnalyzeInsights}
            disabled={loadingInsight}
            aria-busy={loadingInsight}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-slate-950 text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <RefreshCw className={`w-4 h-4 ${loadingInsight ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>{loadingInsight ? 'กำลังวิเคราะห์สถิติ...' : 'วิเคราะห์สถิติล่าสุด'}</span>
          </button>
        </div>

        <div aria-live="polite" aria-atomic="true">
          {insightError && (
            <div role="alert" className="mt-4 p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs sm:text-sm text-rose-200">
              {insightError}
            </div>
          )}

          {loadingInsight && (
            <div className="mt-5 pt-5 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3].map((item) => (
                <div key={item} className="space-y-2.5">
                  <div className="h-4 w-36 bg-slate-800 rounded" />
                  <div className="h-3 w-full bg-slate-800/80 rounded" />
                  <div className="h-3 w-5/6 bg-slate-800/80 rounded" />
                </div>
              ))}
            </div>
          )}

          {!loadingInsight && insight && (
            <div className="mt-5 pt-5 border-t border-slate-800 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                <span className="font-mono tabular-nums text-amber-400 font-semibold">
                  สรุปสำคัญ: {insight.highlightMetric}
                </span>
                <span>
                  มุมมองการวิเคราะห์: {role === UserRole.INSTRUCTOR ? 'อาจารย์ผู้สอน' : 'นักศึกษา'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:divide-x md:divide-slate-800">
                <div className="space-y-1.5">
                  <h4 className="text-sm font-semibold text-slate-100">
                    01. ภาพรวมพฤติกรรม
                  </h4>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {insight.behaviorOverview}
                  </p>
                </div>

                <div className="md:pl-6 space-y-1.5">
                  <h4 className="text-sm font-semibold text-slate-100">
                    02. ปัจจัยเสี่ยงและสิทธิ์สอบ
                  </h4>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {insight.riskFactors}
                  </p>
                </div>

                <div className="md:pl-6 space-y-1.5">
                  <h4 className="text-sm font-semibold text-slate-100">
                    03. คำแนะนำเชิงรุก
                  </h4>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {insight.actionableRecommendations}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {!loadingInsight && !insight && !insightError && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 text-xs sm:text-sm text-slate-400 flex flex-wrap items-center justify-between gap-2">
            <span>
              กดปุ่ม &ldquo;วิเคราะห์สถิติล่าสุด&rdquo; เพื่อประมวลผลเวลาสายรายวัน สถานะโควตาการขาดเรียน และงานค้างตรวจในรูปแบบรายงาน 3 หัวข้อ
            </span>
          </div>
        )}
      </section>
    </div>
  );
};
