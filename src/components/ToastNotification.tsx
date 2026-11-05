import React from 'react';
import { CheckCircle2, Clock, X } from 'lucide-react';

export interface ToastData {
  id: string;
  courseCode: string;
  courseName: string;
  studentName: string;
  timestamp: string;
  status: 'on_time' | 'late';
  lateMinutes?: number;
}

interface ToastNotificationProps {
  toast: ToastData | null;
  onDismiss: () => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  toast,
  onDismiss,
}) => {
  if (!toast) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-20 md:bottom-6 right-4 left-4 sm:left-auto sm:w-96 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="bg-slate-900 border border-amber-400/80 rounded-2xl p-4 shadow-xl shadow-black/50 backdrop-blur-md flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" aria-hidden="true" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-amber-400 font-mono tabular-nums">
              เช็คชื่อสำเร็จ · {toast.courseCode}
            </p>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="ปิดการแจ้งเตือน"
              className="text-slate-400 hover:text-slate-200 min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm font-semibold text-slate-100 truncate mt-0.5">
            {toast.courseName}
          </p>

          <p className="text-xs text-slate-300 mt-1">
            ผู้เรียน: <span className="font-medium text-slate-100">{toast.studentName}</span>
          </p>

          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1 font-mono tabular-nums text-slate-200">
              <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              {toast.timestamp} น.
            </span>
            <span aria-hidden="true">·</span>
            <span
              className={
                toast.status === 'on_time'
                  ? 'text-emerald-400 font-medium'
                  : 'text-amber-400 font-medium'
              }
            >
              {toast.status === 'on_time'
                ? 'เข้าเรียนตรงเวลา'
                : `สาย ${toast.lateMinutes} นาที`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
