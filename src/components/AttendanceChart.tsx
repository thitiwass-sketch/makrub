import React, { useState } from 'react';
import { DailyAnalytics, UserRole } from '../types';

interface AttendanceChartProps {
  data: DailyAnalytics[];
  role: UserRole;
  lateThreshold: number;
}

export const AttendanceChart: React.FC<AttendanceChartProps> = ({
  data,
  role,
  lateThreshold,
}) => {
  const [chartMode, setChartMode] = useState<'late' | 'attendance'>('late');
  const [selectedIndex, setSelectedIndex] = useState<number>(2); // Default highlight Wednesday (peak risk day)

  const activePoint = data[selectedIndex] ?? data[0];
  const maxLateValue = Math.max(
    28,
    lateThreshold + 8,
    ...data.map((d) => Math.max(d.studentLateMin, d.classAvgMin))
  );

  // SVG Coordinate Geometry (ViewBox 640 x 260)
  const svgW = 640;
  const svgH = 260;
  const padLeft = 44;
  const padRight = 24;
  const padTop = 24;
  const padBottom = 38;
  const plotW = svgW - padLeft - padRight;
  const plotH = svgH - padTop - padBottom;

  const colWidth = plotW / Math.max(data.length, 1);

  const yForLate = (val: number) => padTop + plotH - (Math.min(val, maxLateValue) / maxLateValue) * plotH;
  const yForRate = (val: number) => padTop + plotH - (Math.min(Math.max(val, 50), 100) - 50) / 50 * plotH;

  const linePoints = data
    .map((d, i) => {
      const cx = padLeft + colWidth * i + colWidth / 2;
      const cy = chartMode === 'late' ? yForLate(d.classAvgMin) : yForRate(d.attendanceRate);
      return `${cx},${cy}`;
    })
    .join(' ');

  const thresholdY = yForLate(lateThreshold);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-slate-100">
            {chartMode === 'late'
              ? 'สถิติเวลาเข้าชั้นเรียนสายเปรียบเทียบรายวัน'
              : 'อัตราการเข้าเรียนรายวันของกลุ่มเรียน'}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {role === UserRole.STUDENT
              ? 'เปรียบเทียบเวลาสายของคุณ (แท่งสีทอง) กับค่าเฉลี่ยกลุ่มเรียน (เส้นสีฟ้า) และเกณฑ์สุ่มเสี่ยง'
              : 'เปรียบเทียบค่าเฉลี่ยการเข้าสายของนักศึกษาในภาคปฏิบัติการโรงงานเทียบกับเกณฑ์ที่กำหนด'}
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setChartMode('late')}
            className={`min-h-[36px] px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              chartMode === 'late'
                ? 'bg-amber-400 text-slate-950 font-semibold'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            เวลาสาย (นาที)
          </button>
          <button
            type="button"
            onClick={() => setChartMode('attendance')}
            className={`min-h-[36px] px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              chartMode === 'attendance'
                ? 'bg-amber-400 text-slate-950 font-semibold'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            อัตราเข้าเรียน (%)
          </button>
        </div>
      </div>

      {/* Selected Day Interactive Summary Strip */}
      {activePoint && (
        <div className="flex flex-wrap items-center justify-between gap-2 py-3 text-xs text-slate-300 border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-100">วัน{activePoint.day}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            {chartMode === 'late' ? (
              <>
                <span>
                  {role === UserRole.STUDENT ? 'สายของคุณ' : 'สายสูงสุดรายบุคคล'}:{' '}
                  <strong className="font-mono tabular-nums text-amber-400">
                    {activePoint.studentLateMin} นาที
                  </strong>
                </span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span>
                  เฉลี่ยกลุ่มเรียน:{' '}
                  <strong className="font-mono tabular-nums text-sky-400">
                    {activePoint.classAvgMin} นาที
                  </strong>
                </span>
              </>
            ) : (
              <>
                <span>
                  เข้าเรียน:{' '}
                  <strong className="font-mono tabular-nums text-emerald-400">
                    {activePoint.attendanceRate}%
                  </strong>
                </span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span>
                  จำนวนนักศึกษา:{' '}
                  <strong className="font-mono tabular-nums text-sky-400">
                    {activePoint.presentCount}/{activePoint.totalCount} คน
                  </strong>
                </span>
              </>
            )}
          </div>
          <div className="font-mono tabular-nums text-xs">
            {activePoint.studentLateMin > lateThreshold ? (
              <span className="text-rose-400">▲ เกินเกณฑ์สาย ({lateThreshold} นาที)</span>
            ) : (
              <span className="text-emerald-400">● อยู่ในเกณฑ์ปกติ (&le;{lateThreshold} นาที)</span>
            )}
          </div>
        </div>
      )}

      {/* Responsive SVG Chart */}
      <div className="mt-4 w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="w-full h-56 sm:h-64 select-none"
          role="img"
          aria-label="กราฟวิเคราะห์สถิติการเข้าเรียนรายวัน"
        >
          {/* Horizontal Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = padTop + plotH - ratio * plotH;
            const labelVal =
              chartMode === 'late'
                ? Math.round(ratio * maxLateValue)
                : Math.round(50 + ratio * 50);
            return (
              <g key={idx}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={svgW - padRight}
                  y2={y}
                  stroke="#1E293B"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-500 text-[11px] font-mono"
                >
                  {chartMode === 'late' ? `${labelVal}m` : `${labelVal}%`}
                </text>
              </g>
            );
          })}

          {/* Risk Threshold Line in Late Mode */}
          {chartMode === 'late' && (
            <g>
              <line
                x1={padLeft}
                y1={thresholdY}
                x2={svgW - padRight}
                y2={thresholdY}
                stroke="#FB7185"
                strokeWidth="1.5"
                strokeDasharray="5 4"
              />
              <text
                x={svgW - padRight - 4}
                y={thresholdY - 6}
                textAnchor="end"
                className="fill-rose-400 text-[10px] font-medium"
              >
                เกณฑ์สุ่มเสี่ยง ({lateThreshold} นาที)
              </text>
            </g>
          )}

          {/* Bars */}
          {data.map((d, i) => {
            const cx = padLeft + colWidth * i + colWidth / 2;
            const barW = Math.min(42, colWidth * 0.44);
            const barTop =
              chartMode === 'late' ? yForLate(d.studentLateMin) : yForRate(d.attendanceRate);
            const barH = Math.max(4, padTop + plotH - barTop);
            const isSelected = i === selectedIndex;
            const isOverThreshold = chartMode === 'late' && d.studentLateMin > lateThreshold;

            return (
              <g
                key={d.day}
                tabIndex={0}
                role="button"
                aria-label={`วัน${d.day}: ${chartMode === 'late' ? `สาย ${d.studentLateMin} นาที (เกณฑ์ ${lateThreshold} นาที)` : `เข้าเรียน ${d.attendanceRate}%`}`}
                onClick={() => setSelectedIndex(i)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedIndex(i);
                  }
                }}
                onMouseEnter={() => setSelectedIndex(i)}
                className="cursor-pointer focus:outline-none"
              >
                {/* Touch & focus hitbox */}
                <rect
                  x={padLeft + colWidth * i}
                  y={padTop}
                  width={colWidth}
                  height={plotH + padBottom}
                  fill={isSelected ? 'rgba(255,255,255,0.04)' : 'transparent'}
                  stroke={isSelected ? '#FBBF24' : 'transparent'}
                  strokeWidth="1"
                  strokeDasharray={isSelected ? '3 3' : undefined}
                  rx="8"
                />

                <rect
                  x={cx - barW / 2}
                  y={barTop}
                  width={barW}
                  height={barH}
                  rx="6"
                  fill={
                    chartMode === 'late'
                      ? isOverThreshold
                        ? '#FB7185'
                        : '#FBBF24'
                      : '#34D399'
                  }
                  fillOpacity={isSelected ? 1 : 0.78}
                />

                <text
                  x={cx}
                  y={barTop - 7}
                  textAnchor="middle"
                  className="fill-slate-200 text-[11px] font-mono font-semibold"
                >
                  {chartMode === 'late' ? `${d.studentLateMin}m` : `${d.attendanceRate}%`}
                </text>

                <text
                  x={cx}
                  y={svgH - 12}
                  textAnchor="middle"
                  className={`text-[12px] ${
                    isSelected ? 'fill-amber-400 font-semibold' : 'fill-slate-400 font-normal'
                  }`}
                >
                  {d.day}
                </text>
              </g>
            );
          })}

          {/* Overlay Line for Class Average (Late mode) */}
          {chartMode === 'late' && (
            <g className="pointer-events-none">
              <polyline
                fill="none"
                stroke="#38BDF8"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={linePoints}
              />
              {data.map((d, i) => {
                const cx = padLeft + colWidth * i + colWidth / 2;
                const cy = yForLate(d.classAvgMin);
                return (
                  <circle
                    key={d.day}
                    cx={cx}
                    cy={cy}
                    r={i === selectedIndex ? 5 : 3.5}
                    fill="#020617"
                    stroke="#38BDF8"
                    strokeWidth="2.5"
                  />
                );
              })}
            </g>
          )}
        </svg>
      </div>

      {/* Clean Unboxed Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
        {chartMode === 'late' ? (
          <>
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-3 rounded-xs bg-amber-400 inline-block" aria-hidden="true" />
              <span>เวลาสายนักศึกษา (ปกติ)</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-3 rounded-xs bg-rose-400 inline-block" aria-hidden="true" />
              <span>เกินเกณฑ์ {lateThreshold} นาที</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-0.5 bg-sky-400 inline-block" aria-hidden="true" />
              <span>ค่าเฉลี่ยกลุ่มเรียน</span>
            </span>
          </>
        ) : (
          <span>คลิกหรือแตะที่แท่งวันจันทร์–ศุกร์ เพื่อดูรายละเอียดจำนวนนักศึกษาที่เข้าเรียนรายวัน</span>
        )}
      </div>
    </div>
  );
};
