import React, { useState } from 'react';
import {
  Download,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { Course, Submission, UserRole } from '../types';
import { SubmitWorkModal } from './SubmitWorkModal';

interface SubmissionsViewProps {
  submissions: Submission[];
  courses: Course[];
  role: UserRole;
  onSubmissionsUpdated: (submissions: Submission[]) => void;
}

export const SubmissionsView: React.FC<SubmissionsViewProps> = ({
  submissions,
  courses,
  role,
  onSubmissionsUpdated,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'revision'>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');

  // Student New Submission Modal
  const [isSubmitOpen, setIsSubmitOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Instructor Grading Modal
  const [gradingTarget, setGradingTarget] = useState<Submission | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(18);
  const [gradeStatus, setGradeStatus] = useState<'approved' | 'revision' | 'pending'>('approved');
  const [gradeFeedback, setGradeFeedback] = useState<string>('');

  const roleFiltered = submissions.filter((item) => {
    if (role === UserRole.STUDENT && item.studentId !== '6640508101') {
      return false;
    }
    if (courseFilter !== 'all' && item.courseCode !== courseFilter) {
      return false;
    }
    if (statusFilter !== 'all' && item.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.courseCode.toLowerCase().includes(q) ||
        item.studentName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExportCsv = () => {
    const headers = [
      'ลำดับ',
      'รหัสนักศึกษา',
      'ชื่อ-นามสกุล',
      'รหัสวิชา',
      'ชื่อชิ้นงาน/โครงงาน',
      'วันที่ส่ง',
      'สถานะ',
      'คะแนน',
      'ข้อเสนอแนะผู้สอน',
    ];

    const statusLabel = (s: Submission['status']) =>
      s === 'approved' ? 'อนุมัติผ่านแล้ว' : s === 'revision' ? 'แก้ไขเพิ่มเติม' : 'รอตรวจ';

    const rows = roleFiltered.map((s) => [
      s.id,
      s.studentId,
      `"${s.studentName.replace(/"/g, '""')}"`,
      s.courseCode,
      `"${s.title.replace(/"/g, '""')}"`,
      s.date,
      statusLabel(s.status),
      s.score !== null ? `${s.score}/${s.maxScore}` : `-/${s.maxScore}`,
      `"${s.feedback.replace(/"/g, '""')}"`,
    ]);

    const csvString =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `KrubNRRU_Submissions_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };


  const openGradingModal = (item: Submission) => {
    setGradingTarget(item);
    setGradeScore(item.score ?? 18);
    setGradeStatus(item.status === 'pending' ? 'approved' : item.status);
    setGradeFeedback(item.feedback);
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingTarget) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/submissions/${gradingTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: gradeStatus,
          score: gradeScore,
          feedback: gradeFeedback,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onSubmissionsUpdated(data.submissions);
        setGradingTarget(null);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderStatusText = (status: Submission['status']) => {
    if (status === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>อนุมัติผ่านแล้ว</span>
        </span>
      );
    }
    if (status === 'revision') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-400 whitespace-nowrap">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>แก้ไขเพิ่มเติม</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-sky-400 whitespace-nowrap">
        <Clock className="w-3.5 h-3.5" />
        <span>ส่งแล้ว · รอตรวจ</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Action Toolbar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                role === UserRole.INSTRUCTOR
                  ? 'ค้นหาชื่อชิ้นงาน รหัสวิชา หรือชื่อนักศึกษา...'
                  : 'ค้นหาชื่อโครงงานหรือใบงาน...'
              }
              className="w-full min-h-[44px] pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            aria-label="กรองตามรายวิชา"
            className="min-h-[44px] px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-amber-400"
          >
            <option value="all">ทุกรายวิชา</option>
            {courses.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>

          {/* Segmented Status Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl self-start">
            {(
              [
                { id: 'all', label: 'ทั้งหมด' },
                { id: 'approved', label: 'ผ่านแล้ว' },
                { id: 'pending', label: 'รอตรวจ' },
                { id: 'revision', label: 'แก้ไข' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`min-h-[44px] px-3.5 py-2 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                  statusFilter === tab.id
                    ? 'bg-slate-800 text-amber-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleExportCsv}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs sm:text-sm font-medium text-slate-200 inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>ส่งออก CSV</span>
          </button>

          {role === UserRole.STUDENT && (
            <button
              type="button"
              onClick={() => setIsSubmitOpen(true)}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>ส่งชิ้นงานใหม่</span>
            </button>
          )}
        </div>
      </div>

      {/* Submissions Data Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {roleFiltered.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-base font-medium text-slate-200">
              ไม่พบรายการส่งชิ้นงานหรือโครงงานในหมวดหมู่นี้
            </p>
            <p className="text-xs text-slate-400">
              คุณสามารถเปลี่ยนตัวกรองสถานะ หรือกดปุ่มส่งชิ้นงานใหม่เพื่อบันทึกใบงานเข้าระบบ
            </p>
          </div>
        ) : (
          <>
            {/* Desktop High-Density Table with WCAG Compliance */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse" aria-label="ตารางรายการส่งชิ้นงานและโครงงาน">
                <caption className="sr-only">
                  รายการส่งชิ้นงาน โครงงาน คะแนน และสถานะการประเมินประจำภาคการศึกษา 1/2569
                </caption>
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-semibold text-slate-300">
                    <th scope="col" className="py-3.5 px-5">หัวข้อชิ้นงาน / โครงงาน</th>
                    {role === UserRole.INSTRUCTOR && (
                      <th scope="col" className="py-3.5 px-4">นักศึกษา</th>
                    )}
                    <th scope="col" className="py-3.5 px-4">รายวิชา</th>
                    <th scope="col" className="py-3.5 px-4">วันที่ส่ง</th>
                    <th scope="col" className="py-3.5 px-4">สถานะ</th>
                    <th scope="col" className="py-3.5 px-5 text-right">คะแนน</th>
                    {role === UserRole.INSTRUCTOR && (
                      <th scope="col" className="py-3.5 px-5 text-right">การจัดการ</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-sm">
                  {roleFiltered.map((sub) => (
                    <tr
                      key={sub.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-4 px-5 max-w-md">
                        <p className="font-medium text-slate-100 leading-snug">
                          {sub.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-1 truncate">
                          ไฟล์แนบ: <span className="font-mono">{sub.attachmentRef}</span> · {sub.feedback}
                        </p>
                      </td>
                      {role === UserRole.INSTRUCTOR && (
                        <td className="py-4 px-4 whitespace-nowrap">
                          <p className="text-sm text-slate-200">{sub.studentName}</p>
                          <p className="text-xs font-mono tabular-nums text-slate-500">
                            {sub.studentId}
                          </p>
                        </td>
                      )}
                      <td className="py-4 px-4 whitespace-nowrap font-mono tabular-nums text-xs text-amber-400 font-semibold">
                        {sub.courseCode}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap font-mono tabular-nums text-xs text-slate-300">
                        {sub.date}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        {renderStatusText(sub.status)}
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap text-right font-mono tabular-nums font-semibold text-slate-100">
                        {sub.score !== null ? `${sub.score} / ${sub.maxScore}` : `— / ${sub.maxScore}`}
                      </td>
                      {role === UserRole.INSTRUCTOR && (
                        <td className="py-4 px-5 whitespace-nowrap text-right">
                          <button
                            type="button"
                            onClick={() => openGradingModal(sub)}
                            className="min-h-[36px] px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-amber-400 inline-flex items-center gap-1.5 transition-colors"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            <span>ตรวจให้คะแนน</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Ergonomic Touch List */}
            <div className="md:hidden divide-y divide-slate-800/80">
              {roleFiltered.map((sub) => (
                <div key={sub.id} className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs font-mono tabular-nums text-slate-400">
                    <span>
                      วิชา <strong className="text-amber-400">{sub.courseCode}</strong> · {sub.date}
                    </span>
                    <span className="font-semibold text-slate-100">
                      {sub.score !== null ? `${sub.score}/${sub.maxScore}` : `—/${sub.maxScore}`}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-slate-100 leading-snug">
                    {sub.title}
                  </p>

                  {role === UserRole.INSTRUCTOR && (
                    <p className="text-xs text-slate-300">
                      ผู้ส่ง: {sub.studentName} ({sub.studentId})
                    </p>
                  )}

                  <p className="text-xs text-slate-400">{sub.feedback}</p>

                  <div className="pt-1 flex items-center justify-between gap-3">
                    {renderStatusText(sub.status)}

                    {role === UserRole.INSTRUCTOR && (
                      <button
                        type="button"
                        onClick={() => openGradingModal(sub)}
                        className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-medium text-amber-400"
                      >
                        ตรวจให้คะแนน
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Student Submit New Work Modal / Bottom Sheet */}
      <SubmitWorkModal
        isOpen={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        courses={courses}
        studentName="นายสมชาย ใจดี"
        studentId="6640508101"
        onSubmit={async (data) => {
          const res = await fetch('/api/submissions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          if (res.ok) {
            const resData = await res.json();
            onSubmissionsUpdated(resData.submissions);
          }
        }}
      />

      {/* Instructor Rubric Grading Modal / Bottom Sheet */}
      {gradingTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="grade-work-title"
        >
          <div className="w-full sm:max-w-lg bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl p-6 space-y-5">
            <div className="w-10 h-1.5 bg-slate-700 rounded-full mx-auto sm:hidden" />
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 id="grade-work-title" className="text-lg font-semibold text-slate-100">
                  ตรวจประเมินชิ้นงานและบันทึกคะแนน
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {gradingTarget.studentName} ({gradingTarget.studentId}) · วิชา {gradingTarget.courseCode}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setGradingTarget(null)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                aria-label="ปิดหน้าต่าง"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <p className="text-sm font-medium text-slate-100">{gradingTarget.title}</p>
              <p className="text-xs font-mono text-slate-400 mt-1">
                ไฟล์แนบ: {gradingTarget.attachmentRef}
              </p>
            </div>

            <form onSubmit={handleSaveGrade} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="score-slider" className="text-xs font-medium text-slate-300">
                    คะแนนประเมินรูบริคปฏิบัติการ
                  </label>
                  <span className="text-sm font-mono tabular-nums font-bold text-amber-400">
                    {gradeScore} / {gradingTarget.maxScore} คะแนน
                  </span>
                </div>
                <input
                  id="score-slider"
                  type="range"
                  min={0}
                  max={gradingTarget.maxScore}
                  step={1}
                  value={gradeScore}
                  onChange={(e) => setGradeScore(Number(e.target.value))}
                  className="w-full accent-amber-400"
                />
              </div>

              <div>
                <span className="block text-xs font-medium text-slate-300 mb-1.5">
                  ผลการพิจารณา
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setGradeStatus('approved')}
                    className={`min-h-[42px] px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                      gradeStatus === 'approved'
                        ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    อนุมัติผ่านแล้ว
                  </button>
                  <button
                    type="button"
                    onClick={() => setGradeStatus('revision')}
                    className={`min-h-[42px] px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                      gradeStatus === 'revision'
                        ? 'bg-rose-500/20 border-rose-500/60 text-rose-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    ส่งกลับให้แก้ไขเพิ่มเติม
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  ข้อเสนอแนะจากอาจารย์ผู้สอน
                </label>
                <textarea
                  rows={2}
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setGradingTarget(null)}
                  className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-medium text-slate-200"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-slate-950 text-sm font-semibold"
                >
                  {submitting ? 'กำลังบันทึก...' : 'บันทึกผลคะแนน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
