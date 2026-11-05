import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  BarChart3,
  BookOpen,
  QrCode,
  FolderCheck,
  GraduationCap,
  ShieldCheck,
  Wifi,
  WifiOff,
  Sun,
  Moon,
  LogOut,
  Type,
  RefreshCw,
  Check,
} from 'lucide-react';
import {
  ActiveTab,
  AppStateData,
  AttendanceLog,
  AuthUser,
  Course,
  QrSession,
  StudentRecord,
  Submission,
  UserRole,
} from './types';
import { NrruCrest } from './components/NrruVisuals';
import { DashboardView } from './components/DashboardView';
import { CoursesView } from './components/CoursesView';
import { QrCheckinView } from './components/QrCheckinView';
import { SubmissionsView } from './components/SubmissionsView';
import { ToastNotification, ToastData } from './components/ToastNotification';
import { LoginView } from './components/LoginView';
import { BottomNavBar } from './components/BottomNavBar';
import { EditProfileModal } from './components/EditProfileModal';

export default function App() {
  // Session State: Initialized with a default demo student or can be logged out
  const [currentUser, setCurrentUser] = useState<AuthUser | null>({
    id: 'STU-6640508101',
    role: UserRole.STUDENT,
    fullName: 'นายสมชาย ใจดี',
    identifier: '6640508101',
    email: '6640508101@student.nrru.ac.th',
    majorOrDept: 'สาขาวิชาอุตสาหกรรมศิลป์',
    yearLevel: 'ชั้นปีที่ 3',
    provider: 'line',
  });

  const [isEditProfileOpen, setIsEditProfileOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>(ActiveTab.DASHBOARD);
  const [appState, setAppState] = useState<AppStateData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeToast, setActiveToast] = useState<ToastData | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return true;
  });
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
      ? navigator.onLine
      : true
  );
  const [currentFont, setCurrentFont] = useState<'prompt' | 'ibm' | 'sarabun'>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('makrub_font');
      if (saved === 'prompt' || saved === 'ibm' || saved === 'sarabun') {
        return saved;
      }
    }
    return 'prompt';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-font', currentFont);
    try {
      localStorage.setItem('makrub_font', currentFont);
    } catch {
      // ignore storage quota errors
    }
  }, [currentFont]);

  const cycleFont = useCallback(() => {
    setCurrentFont((prev) => {
      if (prev === 'prompt') return 'ibm';
      if (prev === 'ibm') return 'sarabun';
      return 'prompt';
    });
  }, []);

  const role = currentUser ? currentUser.role : UserRole.STUDENT;

  const handleLoginSuccess = useCallback((user: AuthUser) => {
    setCurrentUser(user);
    setActiveTab(ActiveTab.DASHBOARD);
  }, []);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Swipe-to-refresh state and refs
  const [pullDistance, setPullDistance] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [refreshSuccess, setRefreshSuccess] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const isPullingRef = useRef<boolean>(false);
  const mouseStartY = useRef<number | null>(null);

  const PULL_THRESHOLD = 68;
  const MAX_PULL = 110;

  const fetchInitialState = useCallback(async (isSilent: boolean | unknown = false) => {
    const silent = isSilent === true;
    if (!silent) {
      setLoading(true);
    }
    setLoadError(null);
    try {
      const res = await fetch('/api/state');
      if (!res.ok) {
        throw new Error('ไม่สามารถโหลดข้อมูลระบบได้');
      }
      const data: AppStateData = await res.json();
      setAppState(data);
      return true;
    } catch (err: unknown) {
      setLoadError(
        err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อระบบ'
      );
      return false;
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchInitialState();
  }, [fetchInitialState]);

  // Touch Handlers for Mobile Swipe-to-Refresh
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLElement>) => {
      if (typeof window !== 'undefined' && window.scrollY > 5) return;
      if (isRefreshing) return;
      touchStartY.current = e.touches[0].clientY;
      touchStartX.current = e.touches[0].clientX;
      isPullingRef.current = false;
    },
    [isRefreshing]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLElement>) => {
      if (touchStartY.current === null || touchStartX.current === null || isRefreshing) {
        return;
      }
      if (typeof window !== 'undefined' && window.scrollY > 5) {
        if (pullDistance > 0) setPullDistance(0);
        return;
      }

      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const deltaY = currentY - touchStartY.current;
      const deltaX = Math.abs(currentX - touchStartX.current);

      // Ignore horizontal scrolling gestures
      if (deltaX > deltaY) return;

      if (deltaY > 0) {
        isPullingRef.current = true;
        setIsDragging(true);
        // Diminishing returns curve for realistic mobile pull tension
        const damped = Math.min(Math.pow(deltaY, 0.82) * 1.6, MAX_PULL);
        setPullDistance(damped);
      }
    },
    [isRefreshing, pullDistance]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isPullingRef.current) {
      touchStartY.current = null;
      touchStartX.current = null;
      return;
    }

    touchStartY.current = null;
    touchStartX.current = null;
    isPullingRef.current = false;
    setIsDragging(false);

    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(52); // Keep indicator expanded during fetch

      const success = await fetchInitialState(true);
      if (success) {
        setRefreshSuccess(true);
      }

      setTimeout(() => {
        setIsRefreshing(false);
        setRefreshSuccess(false);
        setPullDistance(0);
      }, 650);
    } else {
      setPullDistance(0);
    }
  }, [fetchInitialState, isRefreshing, pullDistance]);

  // Mouse Drag Fallback for Desktop Testing
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (typeof window !== 'undefined' && window.scrollY > 5) return;
    if (isRefreshing || e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, input, a, select, textarea')) return;
    mouseStartY.current = e.clientY;
    setIsDragging(true);
  }, [isRefreshing]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (mouseStartY.current === null || isRefreshing) return;
    const deltaY = e.clientY - mouseStartY.current;
    if (deltaY > 0) {
      const damped = Math.min(Math.pow(deltaY, 0.82) * 1.6, MAX_PULL);
      setPullDistance(damped);
    }
  }, [isRefreshing]);

  const handleMouseUp = useCallback(async () => {
    if (mouseStartY.current === null) return;
    mouseStartY.current = null;
    setIsDragging(false);

    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(52);
      const success = await fetchInitialState(true);
      if (success) {
        setRefreshSuccess(true);
      }
      setTimeout(() => {
        setIsRefreshing(false);
        setRefreshSuccess(false);
        setPullDistance(0);
      }, 650);
    } else {
      setPullDistance(0);
    }
  }, [fetchInitialState, isRefreshing, pullDistance]);

  const handleNavigate = useCallback(
    async (tab: ActiveTab, courseCode?: string) => {
      setActiveTab(tab);
      if (courseCode && appState) {
        try {
          const res = await fetch('/api/qr-session/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ courseCode }),
          });
          if (res.ok) {
            const data = await res.json();
            setAppState((prev) =>
              prev ? { ...prev, qrSession: data.qrSession } : prev
            );
          }
        } catch {
          // Keep current course code locally if offline
        }
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [appState]
  );

  const handleCoursesUpdated = useCallback((courses: Course[]) => {
    setAppState((prev) => (prev ? { ...prev, courses } : prev));
  }, []);

  const handleSessionChange = useCallback((qrSession: QrSession) => {
    setAppState((prev) => (prev ? { ...prev, qrSession } : prev));
  }, []);

  const handleAttendanceUpdated = useCallback(
    (
      students: StudentRecord[],
      attendanceLogs: AttendanceLog[],
      updatedCourse?: Course
    ) => {
      setAppState((prev) => {
        if (!prev) return prev;
        const nextCourses = updatedCourse
          ? prev.courses.map((c) =>
              c.code === updatedCourse.code ? updatedCourse : c
            )
          : prev.courses;
        return {
          ...prev,
          students,
          attendanceLogs,
          courses: nextCourses,
        };
      });
    },
    []
  );

  const handleSubmissionsUpdated = useCallback((submissions: Submission[]) => {
    setAppState((prev) => (prev ? { ...prev, submissions } : prev));
  }, []);

  const handleCheckInSuccess = useCallback((log: AttendanceLog, course: Course) => {
    const newToast: ToastData = {
      id: log.id,
      courseCode: course.code,
      courseName: course.name,
      studentName: log.studentName,
      timestamp: log.timestamp,
      status: log.status === 'late' ? 'late' : 'on_time',
      lateMinutes: log.lateMinutes,
    };
    setActiveToast(newToast);

    // Auto-dismiss Toast after 5 seconds
    window.setTimeout(() => {
      setActiveToast((current) => (current?.id === newToast.id ? null : current));
    }, 5000);
  }, []);

  const navItems: {
    id: ActiveTab;
    label: string;
    mobileLabel: string;
    icon: React.FC<{ className?: string }>;
  }[] = [
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
    },
    {
      id: ActiveTab.SUBMISSIONS,
      label: 'โครงงานและชิ้นงาน',
      mobileLabel: 'ชิ้นงาน',
      icon: FolderCheck,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-20 md:pb-0">
      {/* WCAG 2.4.1 Bypass Blocks: Skip to Main Content */}
      <a href="#main-content" className="skip-to-content focus:outline-none focus:ring-2 focus:ring-slate-950">
        ข้ามไปยังเนื้อหาหลัก (Skip to Content)
      </a>

      {/* Strict 3-Zone Top Navigation Bar */}
      <header role="banner" className="md:sticky md:top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-8">
          {/* Zone 1: Single Brand Wordmark */}
          <button
            type="button"
            onClick={() => setActiveTab(ActiveTab.DASHBOARD)}
            aria-label="MaKrubNRRU กลับสู่หน้าภาพรวมวิเคราะห์"
            className="text-lg font-bold tracking-tight text-amber-400 hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded min-h-[44px] inline-flex items-center gap-1.5"
          >
            <span>MaKrubNRRU</span>
          </button>

          {/* Zone 2: Clean Single-Line Navigation Links (Only shown when authenticated) */}
          {currentUser ? (
            <nav
              aria-label="เมนูหลัก"
              className="hidden md:flex items-center gap-7 text-sm font-medium"
            >
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`h-14 inline-flex items-center border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'border-amber-400 text-slate-100 font-semibold'
                        : 'border-transparent text-slate-400 hover:text-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          ) : (
            <div className="hidden md:block text-xs text-slate-400">
              ระบบเช็คชื่อ & การส่งงาน คณะเทคโนโลยีอุตสาหกรรม มหาวิทยาลัยราชภัฏนครราชสีมา
            </div>
          )}

          {/* Zone 3: Theme Toggle, Online/Offline Network Status & Primary Action */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Real-time Network Connection Sync Indicator */}
            <div
              role="status"
              aria-live="polite"
              className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${
                isOnline
                  ? 'bg-slate-900 border-slate-800 text-slate-300'
                  : 'bg-rose-950/60 border-rose-800 text-rose-300'
              }`}
              title={
                isOnline
                  ? 'เชื่อมต่อเครือข่ายแล้ว: ข้อมูลการเช็คชื่อซิงก์เรียลไทม์'
                  : 'ไม่มีการเชื่อมต่อเครือข่าย: อยู่ในโหมดออฟไลน์'
              }
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                  <span className="hidden sm:inline">ออนไลน์</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-rose-400 animate-pulse" aria-hidden="true" />
                  <span className="hidden sm:inline">ออฟไลน์</span>
                </>
              )}
            </div>

            {/* High-Contrast Light / Dark Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDarkMode ? 'เปลี่ยนเป็นธีมสว่างคอนทราสต์สูง' : 'เปลี่ยนเป็นธีมมืด'}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-amber-400 hover:border-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              title={isDarkMode ? 'เปิดใช้งานธีมสว่าง' : 'เปิดใช้งานธีมมืด'}
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400" aria-hidden="true" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" aria-hidden="true" />
              )}
            </button>

            {/* Font Design Switcher Button (Compact on Mobile) */}
            <button
              type="button"
              onClick={cycleFont}
              aria-label={`สลับรูปแบบฟอนต์ (ปัจจุบัน: ${
                currentFont === 'prompt' ? 'Prompt' : currentFont === 'ibm' ? 'IBM Plex Sans' : 'Sarabun'
              })`}
              className="hidden sm:flex min-h-[40px] px-2.5 items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-amber-400 hover:border-slate-700 transition-colors focus-visible:outline-none"
              title={`ฟอนต์ปัจจุบัน: ${currentFont}`}
            >
              <Type className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                {currentFont === 'prompt' ? 'Prompt' : currentFont === 'ibm' ? 'IBM' : 'Sarabun'}
              </span>
            </button>

            {/* Primary Action Button: "เปิดห้องเช็คชื่อ" */}
            {currentUser && (
              <button
                type="button"
                onClick={() => setActiveTab(ActiveTab.QR_CHECKIN)}
                aria-label={role === UserRole.STUDENT ? 'ไปยังหน้าเช็คชื่อเข้าเรียน' : 'เปิดห้องเช็คชื่อ'}
                className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-bold transition-all shadow-xs whitespace-nowrap shrink-0 active:scale-95"
              >
                {role === UserRole.STUDENT ? 'เช็คชื่อเข้าเรียน' : 'เปิดห้องเช็คชื่อ'}
              </button>
            )}

            {/* Profile Quick Button - Triggers EditProfileModal */}
            {currentUser && (
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(true)}
                aria-label={`ข้อมูลโปรไฟล์ ${currentUser.fullName} คลิกเพื่อแก้ไขโปรไฟล์หรือเปลี่ยนรูปภาพ`}
                title={`คลิกเพื่อแก้ไขข้อมูลโปรไฟล์หรือเปลี่ยนรูปภาพ (${currentUser.fullName})`}
                className="min-h-[40px] px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:border-emerald-500/50 text-slate-200 inline-flex items-center gap-2 text-xs font-medium transition-all shrink-0 group active:scale-95"
              >
                <div className="w-6 h-6 rounded-full overflow-hidden border border-[#00E599]/60 shadow-[0_0_8px_rgba(0,229,153,0.3)] bg-slate-950 flex items-center justify-center text-[10px] shrink-0 font-bold text-slate-950">
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.fullName}
                      className="w-full h-full object-cover select-none"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-bold">
                      {currentUser.fullName.slice(0, 1)}
                    </div>
                  )}
                </div>
                <span className="hidden sm:inline font-semibold max-w-[120px] truncate group-hover:text-emerald-400 transition-colors">
                  {currentUser.fullName}
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* When NOT Logged In: Render LoginView */}
      {!currentUser ? (
        <main id="main-content" tabIndex={-1} className="flex-1 max-w-7xl w-full mx-auto px-4 focus:outline-none">
          <LoginView onLoginSuccess={handleLoginSuccess} />
        </main>
      ) : (
        <>
          {/* University Workspace Header & User Profile Bar */}
          <section aria-label="ข้อมูลมหาวิทยาลัยและข้อมูลผู้ใช้งาน" className="border-b border-slate-800/80 bg-slate-950">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="flex items-start sm:items-center gap-3.5">
                <NrruCrest className="w-11 h-11 shrink-0 mt-0.5 sm:mt-0" />
                <div className="min-w-0">
                  <p className="text-xs text-slate-400 font-medium">
                    สาขาวิชาอุตสาหกรรมศิลป์ · คณะเทคโนโลยีอุตสาหกรรม มหาวิทยาลัยราชภัฏนครราชสีมา
                  </p>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight mt-0.5 text-balance">
                    {activeTab === ActiveTab.DASHBOARD && 'ระบบติดตามการเข้าเรียนและวิเคราะห์ข้อมูลรายวิชา'}
                    {activeTab === ActiveTab.COURSES && 'การจัดการรายวิชาประจำภาคการศึกษา 1/2569'}
                    {activeTab === ActiveTab.QR_CHECKIN && 'ระบบเช็คชื่อเข้าชั้นเรียน Dynamic QR Code'}
                    {activeTab === ActiveTab.SUBMISSIONS && 'ระบบบริหารจัดการโครงงานและใบงานปฏิบัติการ'}
                  </h1>
                </div>
              </div>

              {/* Logged in User Profile Info & Logout */}
              <div className="flex items-center gap-3 lg:shrink-0">
                <div className="text-xs text-slate-400 sm:text-right">
                  <p className="font-semibold text-slate-200">{currentUser.fullName}</p>
                  <p className="font-mono tabular-nums text-slate-400">
                    {currentUser.identifier} · {currentUser.role === UserRole.STUDENT ? 'นักศึกษา' : 'อาจารย์ผู้สอน'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="ออกจากระบบ"
                  title="ออกจากระบบเพื่อสลับบัญชี (Sign Out)"
                  className="min-h-[44px] min-w-[44px] px-3.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-rose-400 hover:border-rose-900 inline-flex items-center justify-center gap-1.5 text-xs font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">ออกจากระบบ</span>
                </button>
              </div>
            </div>
          </section>

          {/* Main Content Viewport with Swipe-to-Refresh Support */}
          <main
            id="main-content"
            tabIndex={-1}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{
              transform: pullDistance > 0 ? `translate3d(0, ${Math.min(pullDistance * 0.22, 18)}px, 0)` : undefined,
              transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-28 md:pb-8 focus:outline-none relative select-none md:select-auto"
          >
            {/* Swipe-to-Refresh Animated Indicator Area */}
            <div
              role="status"
              aria-live="polite"
              aria-label={
                refreshSuccess
                  ? 'อัปเดตข้อมูลระบบสำเร็จ'
                  : isRefreshing
                  ? 'กำลังซิงก์ข้อมูลระบบล่าสุด'
                  : pullDistance >= PULL_THRESHOLD
                  ? 'ปล่อยนิ้วเพื่ออัปเดตข้อมูล'
                  : 'ดึงลงเพื่อรีเฟรชข้อมูล'
              }
              style={{
                height: pullDistance > 0 ? `${pullDistance}px` : 0,
                opacity: pullDistance > 0 ? Math.min(pullDistance / 35, 1) : 0,
                transition: isDragging ? 'none' : 'height 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease',
              }}
              className="overflow-hidden flex items-center justify-center pointer-events-none -mt-2 mb-2 w-full"
            >
              <div
                className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-full border text-xs font-semibold backdrop-blur-md shadow-lg transition-all duration-200 ${
                  refreshSuccess
                    ? 'bg-slate-900/95 border-emerald-400 text-emerald-300 ring-2 ring-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.35)] scale-105'
                    : isRefreshing
                    ? 'bg-slate-900/95 border-emerald-500/60 text-emerald-300 ring-2 ring-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                    : pullDistance >= PULL_THRESHOLD
                    ? 'bg-slate-900/95 border-cyan-400 text-cyan-300 shadow-[0_0_20px_rgba(0,229,255,0.35)] scale-105'
                    : 'bg-slate-900/80 border-slate-700/80 text-slate-300'
                }`}
              >
                {refreshSuccess ? (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 animate-in zoom-in-75 duration-200" />
                ) : (
                  <RefreshCw
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isRefreshing
                        ? 'animate-spin text-emerald-400'
                        : pullDistance >= PULL_THRESHOLD
                        ? 'text-cyan-300'
                        : 'text-slate-400'
                    }`}
                    style={
                      !isRefreshing
                        ? {
                            transform: `rotate(${Math.min((pullDistance / PULL_THRESHOLD) * 360, 360)}deg)`,
                            transition: isDragging ? 'none' : 'transform 0.2s ease',
                          }
                        : undefined
                    }
                  />
                )}
                <span className="tracking-wide">
                  {refreshSuccess
                    ? 'อัปเดตข้อมูลระบบล่าสุดสำเร็จ'
                    : isRefreshing
                    ? 'กำลังซิงก์ข้อมูลระบบล่าสุด...'
                    : pullDistance >= PULL_THRESHOLD
                    ? 'ปล่อยนิ้วเพื่อรีเฟรชข้อมูล'
                    : 'ดึงลงเพื่อรีเฟรชข้อมูล'}
                </span>
              </div>
            </div>
            {loading && (
              <div className="space-y-6 animate-pulse">
                <div className="h-28 bg-slate-900 border border-slate-800 rounded-2xl" />
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-7 h-80 bg-slate-900 border border-slate-800 rounded-2xl" />
                  <div className="lg:col-span-5 h-80 bg-slate-900 border border-slate-800 rounded-2xl" />
                </div>
              </div>
            )}

            {!loading && loadError && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
                <p className="text-base font-semibold text-rose-300">{loadError}</p>
                <button
                  type="button"
                  onClick={fetchInitialState}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-sm font-semibold"
                >
                  ลองเชื่อมต่ออีกครั้ง
                </button>
              </div>
            )}

            {!loading && !loadError && appState && (
              <>
                {activeTab === ActiveTab.DASHBOARD && (
                  <DashboardView
                    state={appState}
                    role={role}
                    onNavigate={handleNavigate}
                  />
                )}

                {activeTab === ActiveTab.COURSES && (
                  <CoursesView
                    courses={appState.courses}
                    role={role}
                    onCoursesUpdated={handleCoursesUpdated}
                    onOpenQrForCourse={handleNavigate}
                  />
                )}

                {activeTab === ActiveTab.QR_CHECKIN && (
                  <QrCheckinView
                    state={appState}
                    role={role}
                    onSessionChange={handleSessionChange}
                    onAttendanceUpdated={handleAttendanceUpdated}
                    onCheckInSuccess={handleCheckInSuccess}
                  />
                )}

                {activeTab === ActiveTab.SUBMISSIONS && (
                  <SubmissionsView
                    submissions={appState.submissions}
                    courses={appState.courses}
                    role={role}
                    onSubmissionsUpdated={handleSubmissionsUpdated}
                  />
                )}
              </>
            )}
          </main>
        </>
      )}

      {/* Floating Toast Notification for Real-Time Attendance Confirmation */}
      <ToastNotification
        toast={activeToast}
        onDismiss={() => setActiveToast(null)}
      />

      {/* Quiet Institutional Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 mb-24 md:mb-0 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            © 2026 MaKrubNRRU · สาขาวิชาอุตสาหกรรมศิลป์ คณะเทคโนโลยีอุตสาหกรรม มหาวิทยาลัยราชภัฏนครราชสีมา
          </p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveTab(ActiveTab.COURSES)}
              className="hover:text-slate-300 transition-colors whitespace-nowrap"
            >
              ตารางเรียนปฏิบัติการ
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setActiveTab(ActiveTab.SUBMISSIONS)}
              className="hover:text-slate-300 transition-colors whitespace-nowrap"
            >
              ส่งโครงงานและใบงาน
            </button>
          </div>
        </div>
      </footer>

      {/* Mobile Floating Thumb-Zone Navigation Dock (Only for Authenticated Users) */}
      {currentUser && (
        <BottomNavBar
          activeTab={activeTab}
          onTabChange={(tab) => {
            if (tab === ActiveTab.PROFILE) {
              setIsEditProfileOpen(true);
            } else {
              setActiveTab(tab);
            }
          }}
          onOpenProfile={() => setIsEditProfileOpen(true)}
        />
      )}

      {/* Edit Profile & Photo Modal */}
      {currentUser && (
        <EditProfileModal
          isOpen={isEditProfileOpen}
          currentUser={currentUser}
          onClose={() => setIsEditProfileOpen(false)}
          onSaveProfile={(updatedUser) => {
            setCurrentUser(updatedUser);
            if (appState) {
              setAppState((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  students: prev.students.map((st) =>
                    st.studentId === updatedUser.identifier
                      ? { ...st, fullName: updatedUser.fullName }
                      : st
                  ),
                };
              });
            }
          }}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
