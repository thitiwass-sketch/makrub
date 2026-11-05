export enum UserRole {
  STUDENT = 'student',
  INSTRUCTOR = 'instructor',
}

export enum ActiveTab {
  DASHBOARD = 'dashboard',
  COURSES = 'courses',
  QR_CHECKIN = 'qr_checkin',
  SUBMISSIONS = 'submissions',
  PROFILE = 'profile',
}

export interface DailyAnalytics {
  day: string;
  shortDay: string;
  studentLateMin: number;
  classAvgMin: number;
  threshold: number;
  attendanceRate: number;
  presentCount: number;
  totalCount: number;
}

export interface CourseSession {
  id: string;
  sessionNumber: number;
  date: string;
  time: string;
  room?: string;
  topic: string;
  type: 'regular' | 'makeup' | 'lab' | 'exam';
  status: 'upcoming' | 'completed' | 'cancelled';
}

export interface CourseStudent {
  studentId: string;
  fullName: string;
  yearLevel: string;
  major: string;
  attendanceRate: number;
  absentCount: number;
  examEligible: boolean;
  todayStatus?: 'on_time' | 'late' | 'pending' | 'excused';
}

export interface CourseMaterial {
  id: string;
  title: string;
  type: 'slides' | 'lab_sheet' | 'syllabus' | 'link';
  url?: string;
  updatedAt: string;
}

export interface Course {
  code: string;
  name: string;
  englishName: string;
  schedule: string;
  room: string;
  instructor: string;
  coInstructors?: string[];
  passcode: string;
  enrolled: boolean;
  attendanceRate: number;
  absentCount: number;
  maxAbsentQuota: number;
  credits: number;
  semester: string;
  section?: string;
  students?: CourseStudent[];
  sessions?: CourseSession[];
  materials?: CourseMaterial[];
}

export interface StudentRecord {
  studentId: string;
  fullName: string;
  yearLevel: string;
  major: string;
  attendanceRate: number;
  avgLateMin: number;
  absentCount: number;
  examEligible: boolean;
  todayStatus: 'on_time' | 'late' | 'pending' | 'excused';
  lastCheckInTime: string | null;
}

export interface AttendanceLog {
  id: string;
  courseCode: string;
  courseName: string;
  studentId: string;
  studentName: string;
  timestamp: string;
  lateMinutes: number;
  status: 'on_time' | 'late' | 'excused';
  method: 'qr_dynamic' | 'passcode' | 'instructor_manual' | 'ai_screen_verification';
}

export interface ScreenAnalysisInfo {
  isScreenCapture: boolean;
  displayMedium: string;
  screenReflectionDetected: boolean;
  antiSpoofingScore: number;
  confidence: number;
  ambientLight: string;
  perspectiveDistortion: string;
}

export interface AutomatedVerificationResult {
  status: 'VERIFIED_SUCCESS' | 'TOKEN_EXPIRED' | 'INVALID_QR' | 'TAMPER_DETECTED' | 'SESSION_CLOSED';
  verificationId: string;
  decodedPayload: string;
  extractedCourseCode: string;
  courseName: string;
  instructorName: string;
  extractedToken: string;
  tokenMatched: boolean;
  tokenAgeSeconds: number;
  screenAnalysis: ScreenAnalysisInfo;
  student: {
    studentId: string;
    fullName: string;
    major: string;
    academicYear: string;
  };
  attendanceRecord?: {
    timestamp: string;
    status: 'on_time' | 'late';
    statusLabel: string;
    lateMinutes: number;
  };
  summaryMessage: string;
  log?: AttendanceLog;
  students?: StudentRecord[];
  attendanceLogs?: AttendanceLog[];
  course?: Course;
}

export interface Submission {
  id: number;
  studentId: string;
  studentName: string;
  title: string;
  courseCode: string;
  courseName: string;
  date: string;
  status: 'approved' | 'pending' | 'revision';
  score: number | null;
  maxScore: number;
  attachmentRef: string;
  feedback: string;
}

export interface QrSession {
  courseCode: string;
  token: string;
  isOpen: boolean;
  lateThresholdMin: number;
  classStartTime: string;
  updatedAt: string;
}

export interface AiInsightResult {
  source: 'gemini' | 'computed';
  highlightMetric: string;
  behaviorOverview: string;
  riskFactors: string;
  actionableRecommendations: string;
}

export interface AppStateData {
  analytics: DailyAnalytics[];
  courses: Course[];
  students: StudentRecord[];
  attendanceLogs: AttendanceLog[];
  submissions: Submission[];
  qrSession: QrSession;
}

export type SocialProvider = 'google' | 'line' | 'facebook';

export interface AuthUser {
  id: string;
  role: UserRole;
  fullName: string;
  identifier: string; // Student ID (6640508101) or Staff Email (thitiwas@nrru.ac.th)
  email?: string;
  majorOrDept: string;
  yearLevel?: string;
  provider: SocialProvider | 'password';
  avatarUrl?: string;
}

export interface RegistrarCourseItem {
  code: string;
  name: string;
  englishName: string;
  section: string;
  schedule: string;
  day?: string;
  room: string;
  instructor: string;
  credits: number;
  semester: string;
  acadYear: string;
  isImported?: boolean;
}

export interface RegistrarScheduleResponse {
  success: boolean;
  source: 'live_nrru_registrar' | 'verified_nrru_registrar_catalog';
  registrarUrl: string;
  directScheduleUrl: string;
  instructor: {
    name: string;
    englishName: string;
    code: string;
    officerId: string;
    email: string;
    faculty: string;
    major: string;
  };
  acadYear: string;
  semester: string;
  courses: RegistrarCourseItem[];
  lastSynced: string;
  note?: string;
}

