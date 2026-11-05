import React, { useState } from 'react';
import {
  BarChart3,
  BookOpen,
  QrCode,
  FolderCheck,
  User,
} from 'lucide-react';
import { ActiveTab } from '../types';

export interface BottomNavBarProps {
  activeTab?: ActiveTab;
  onTabChange?: (tab: ActiveTab) => void;
  onOpenProfile?: () => void;
  className?: string;
}

export interface NavItemConfig {
  id: ActiveTab;
  label: string;
  mobileLabel: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  isFab?: boolean;
}

export const navItems5: NavItemConfig[] = [
  {
    id: ActiveTab.DASHBOARD,
    label: 'ภาพรวมวิเคราะห์',
    mobileLabel: 'ภาพรวม',
    icon: BarChart3,
  },
  {
    id: ActiveTab.COURSES,
    label: 'รายวิชา',
    mobileLabel: 'รายวิชา',
    icon: BookOpen,
  },
  {
    id: ActiveTab.QR_CHECKIN,
    label: 'เช็คชื่อ QR',
    mobileLabel: 'เช็คชื่อ QR',
    icon: QrCode,
    isFab: true,
  },
  {
    id: ActiveTab.SUBMISSIONS,
    label: 'โครงงานและชิ้นงาน',
    mobileLabel: 'ชิ้นงาน',
    icon: FolderCheck,
  },
  {
    id: ActiveTab.PROFILE,
    label: 'ข้อมูลโปรไฟล์',
    mobileLabel: 'โปรไฟล์',
    icon: User,
  },
];

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab: controlledActiveTab,
  onTabChange,
  onOpenProfile,
  className = '',
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState<ActiveTab>(
    controlledActiveTab ?? ActiveTab.DASHBOARD
  );

  const currentTab = controlledActiveTab ?? internalActiveTab;

  const handleSelectTab = (tabId: ActiveTab) => {
    setInternalActiveTab(tabId);
    if (tabId === ActiveTab.PROFILE && onOpenProfile) {
      onOpenProfile();
    }
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  return (
    <aside
      aria-label="แถบเมนูด้านล่างสำหรับมือถือ"
      className={`md:hidden fixed bottom-4 sm:bottom-6 inset-x-2.5 sm:inset-x-6 z-40 max-w-[420px] mx-auto pointer-events-none mb-[env(safe-area-inset-bottom,0px)] ${className}`}
    >
      <nav
        role="navigation"
        aria-label="เมนูหลักแถบล่าง"
        className="relative pointer-events-auto bg-[#0D1117]/92 backdrop-blur-xl border border-slate-800/90 rounded-[28px] shadow-[0_12px_44px_rgba(0,0,0,0.75)] px-2 pt-1 pb-1.5 grid grid-cols-5 items-center"
      >
        {/* 3. Smooth Notch Curve Cutout with Soft Neon-Cyan (#00FFCC / #00E5FF) Glow */}
        <div
          className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-[88px] h-[22px] pointer-events-none select-none z-10"
          aria-hidden="true"
        >
          {/* Subtle neon-cyan ambient glow behind notch */}
          <div className="absolute inset-0 w-full h-full bg-[#00FFCC]/15 blur-sm rounded-full -top-1" />
          <svg
            viewBox="0 0 88 22"
            fill="none"
            className="w-full h-full overflow-visible drop-shadow-[0_-2px_6px_rgba(0,255,204,0.25)]"
          >
            {/* Dark background fill to mask the straight top border */}
            <path
              d="M 0,0 C 16,0 20,20 44,20 C 68,20 72,0 88,0 Z"
              fill="#0D1117"
            />
            {/* Seamless organic cradle outline with neon cyan glow */}
            <path
              d="M 0,0 C 16,0 20,20 44,20 C 68,20 72,0 88,0"
              stroke="#00E5FF"
              strokeOpacity="0.4"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Symmetrical 2 - 1 - 2 Navigation Items Grid */}
        {navItems5.map((item, index) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          // Item 3: Center Elevated Floating Action Button (FAB - เช็คชื่อ QR)
          if (item.isFab) {
            return (
              <div
                key={item.id}
                className="relative flex flex-col items-center justify-between h-[64px] group"
              >
                {/* Neon Cyan/Green Multi-Layer Ambient Glow (#00FFCC / #00E5FF) */}
                <div
                  className={`absolute -top-7 w-16 h-16 rounded-full transition-all duration-300 pointer-events-none ${
                    isActive
                      ? 'bg-gradient-to-tr from-[#00FFCC] to-[#00E5FF] opacity-50 blur-lg scale-110'
                      : 'bg-gradient-to-tr from-[#00FFCC] to-[#00E5FF] opacity-30 group-hover:opacity-45 blur-md'
                  }`}
                  aria-hidden="true"
                />

                {/* Center Elevated Circular Button (FAB) */}
                <button
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative z-20 -mt-6 w-[54px] h-[54px] rounded-full flex items-center justify-center transition-all duration-300 border-[3px] border-[#0D1117] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00FFCC] ${
                    isActive
                      ? 'bg-gradient-to-tr from-[#00E599] via-[#00FFCC] to-[#00E5FF] text-slate-950 shadow-[0_0_26px_rgba(0,255,204,0.75),0_4px_16px_rgba(0,229,255,0.45)] scale-105'
                      : 'bg-gradient-to-tr from-[#00E599] via-[#00FFCC] to-[#00E5FF] text-slate-950 shadow-[0_4px_18px_rgba(0,255,204,0.5)] hover:shadow-[0_0_24px_rgba(0,255,204,0.7)] hover:scale-105'
                  }`}
                >
                  <Icon className="w-6 h-6 stroke-[2.4]" aria-hidden="true" />
                </button>

                {/* Standardized Horizontal Baseline Label */}
                <div className="h-4 flex items-center justify-center">
                  <span
                    className={`text-[10px] sm:text-[11px] tracking-tight leading-none transition-colors whitespace-nowrap ${
                      isActive
                        ? 'text-[#00FFCC] font-bold drop-shadow-[0_0_6px_rgba(0,255,204,0.5)]'
                        : 'text-slate-400 font-medium group-hover:text-slate-200'
                    }`}
                  >
                    {item.mobileLabel}
                  </span>
                </div>
              </div>
            );
          }

          // Outer 4 Symmetrical Items (2 Left, 2 Right)
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectTab(item.id)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`min-h-[48px] h-[64px] flex flex-col items-center justify-between py-1.5 px-1 rounded-2xl transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#00FFCC] group ${
                isActive ? 'text-[#00FFCC]' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Unified Icon Height Zone */}
              <div className="h-6 flex items-center justify-center mt-1">
                <Icon
                  strokeWidth={isActive ? 2.4 : 1.8}
                  className={`w-5 h-5 transition-transform ${
                    isActive
                      ? 'scale-110 drop-shadow-[0_0_8px_rgba(0,255,204,0.6)]'
                      : 'group-hover:scale-105'
                  }`}
                  aria-hidden="true"
                />
              </div>

              {/* Standardized Horizontal Baseline Label */}
              <div className="h-4 flex items-center justify-center">
                <span
                  className={`text-[10px] sm:text-[11px] tracking-tight leading-none whitespace-nowrap transition-colors ${
                    isActive
                      ? 'font-bold text-[#00FFCC] drop-shadow-[0_0_6px_rgba(0,255,204,0.4)]'
                      : 'font-medium text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  {item.mobileLabel}
                </span>
              </div>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
