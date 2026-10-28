// All domain models for Personal Exam Tracker

export type ExamType = 'competitive' | 'university';

export type DateVerificationStatus = 'confirmed' | 'provisional' | 'unverified';

export interface Commitment {
  id: string;
  name: string;
  code: string;
  type: ExamType;
  priority: number; // 1 = highest
  targetDate?: string; // YYYY-MM-DD
  dateStatus: DateVerificationStatus;
  dateSourceUrl?: string;
  dateVerificationDate?: string;
  description: string;
  officialNotificationUrl?: string;
  eligibilityNotes?: string;
  createdAt: string;
}

export interface Subject {
  id: string;
  name: string;
  code?: string;
  examIds: string[]; // Supports sharing across exams
  order: number;
  description?: string;
}

export interface Topic {
  id: string;
  subjectId: string;
  name: string;
  order: number;
  notes?: string;
  archived?: boolean;
  totalCards?: number; // Total number of cards/questions/items (e.g. 64)
  cardLabel?: string; // 'cards' | 'questions' | 'tables'
}

export interface Subtopic {
  id: string;
  topicId: string;
  name: string;
  order: number;
}

export type LearningStatus = 'not_started' | 'in_progress' | 'completed' | 'needs_restudy';
export type PracticeStatus = 'not_started' | 'in_progress' | 'completed';
export type RevisionProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface TopicProgress {
  id: string; // Composite: `${examId}_${topicId}` to guarantee examination-specific progress
  examId: string;
  topicId: string;
  learningStatus: LearningStatus;
  practiceStatus: PracticeStatus;
  practiceQuestionsSolved?: number;
  practiceAccuracyPercent?: number;
  revisionStatus: RevisionProgressStatus;
  manualCompletionPercentage: number; // 0 to 100
  completedCards?: number; // Number of cards read so far (e.g. 10 out of 64)
  lastStudiedAt?: string;
  updatedAt: string;
}

export type ActivityType =
  | 'learning'
  | 'revision'
  | 'question_practice'
  | 'mock_test'
  | 'mistake_analysis'
  | 'university_coursework'
  | 'other';

export interface StudyLog {
  id: string;
  date: string; // YYYY-MM-DD (Asia/Kolkata local midnight-to-midnight)
  timestamp: string; // ISO string
  examId: string;
  subjectId: string;
  topicId?: string;
  subtopicId?: string;
  durationMinutes: number; // strictly focused time
  activityType: ActivityType;
  notes?: string;
  createdAt: string;
}

export type TaskStatus =
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'deferred'
  | 'reduced'
  | 'dropped';

export interface WeeklyTask {
  id: string;
  weeklyPlanId: string;
  title: string;
  examId: string;
  subjectId?: string;
  topicId?: string;
  estimatedMinutes: number;
  actualMinutes?: number;
  weight: number; // 1 to 5 (editable)
  status: TaskStatus;
  progressFraction: number; // 0.0 to 1.0
  resolutionNotes?: string; // Reason for defer / reduce / drop
  dueDate?: string;
}

export interface WeeklyPlan {
  id: string; // e.g. "week_2026-10-26"
  weekStartDate: string; // Monday (YYYY-MM-DD)
  weekEndDate: string; // Sunday (YYYY-MM-DD)
  targetHours: number;
  status: 'proposed' | 'approved' | 'completed';
  approvedAt?: string;
  notes?: string;
  capacityNotes?: string;
  tasks: WeeklyTask[];
}

export type RevisionInterval = 1 | 3 | 7 | 14 | 30 | number;
export type RevisionStatus = 'due' | 'completed' | 'skipped' | 'rescheduled';

export interface RevisionRecord {
  id: string;
  examId: string;
  subjectId: string;
  topicId: string;
  basisDate: string; // YYYY-MM-DD
  intervalDays: RevisionInterval;
  scheduledDate: string; // YYYY-MM-DD
  status: RevisionStatus;
  completedAt?: string;
  durationMinutes?: number;
  rescheduledTo?: string;
  notes?: string;
  createdAt: string;
}

export type ErrorType =
  | 'conceptual'
  | 'calculation'
  | 'time_pressure'
  | 'misread'
  | 'guesswork'
  | 'other';

export interface MistakeEntry {
  id: string;
  mockTestId?: string;
  examId: string;
  subjectId?: string;
  topicId?: string;
  questionSnippet: string;
  errorType: ErrorType;
  solutionNotes: string;
  resolved: boolean;
  createdAt: string;
}

export interface SubjectMockScore {
  subjectName: string;
  score: number;
  maxScore: number;
  accuracyPercent?: number;
}

export interface MockTest {
  id: string;
  examId: string;
  testName: string;
  date: string; // YYYY-MM-DD
  totalScore: number;
  maxScore: number;
  accuracyPercent: number;
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
  attemptedCount: number;
  timeTakenMinutes: number;
  subjectScores?: SubjectMockScore[];
  notes?: string;
  createdAt: string;
}

export type UniversityItemType = 'lecture' | 'assignment' | 'exam' | 'reading';
export type UniversityItemStatus = 'pending' | 'in_progress' | 'submitted' | 'completed';

export interface UniversityCourse {
  id: string;
  code: string;
  name: string;
  semester: number;
  credits?: number;
  description?: string;
}

export interface UniversityItem {
  id: string;
  courseId: string;
  title: string;
  type: UniversityItemType;
  deadline?: string; // YYYY-MM-DD
  status: UniversityItemStatus;
  studyMinutesSpent: number;
  notes?: string;
  createdAt: string;
}

export interface DailyReview {
  id: string;
  date: string; // YYYY-MM-DD
  completedSummary: string;
  actualMinutes: number;
  blockers?: string;
  tomorrowPriorities: string[];
  createdAt: string;
}

export interface WeeklyReview {
  id: string;
  weekStartDate: string; // YYYY-MM-DD
  reflection: string;
  plannedHours: number;
  actualHours: number;
  weightedCompletionPercent: number;
  mockTrendsSummary?: string;
  strengths: string;
  weaknesses: string;
  approvedNextWeekPlanId?: string;
  createdAt: string;
}

export interface AppSettings {
  id: 'global_settings';
  dateOfBirth: string; // 1996-10-31
  timeZone: string; // Asia/Kolkata
  lastUsedExamId?: string;
  lastUsedSubjectId?: string;
  lastUsedActivityType?: ActivityType;
  guidedSetupCompleted: boolean;
  schemaVersion: number;
  updatedAt: string;
}

// Data Package for Full Export / Import
export interface ApplicationDataPackage {
  app: 'PersonalExamTracker';
  version: number;
  exportedAt: string;
  data: {
    commitments: Commitment[];
    subjects: Subject[];
    topics: Topic[];
    subtopics: Subtopic[];
    topicProgress: TopicProgress[];
    studyLogs: StudyLog[];
    weeklyPlans: WeeklyPlan[];
    revisions: RevisionRecord[];
    mockTests: MockTest[];
    mistakes: MistakeEntry[];
    universityCourses: UniversityCourse[];
    universityItems: UniversityItem[];
    dailyReviews: DailyReview[];
    weeklyReviews: WeeklyReview[];
    settings: AppSettings;
  };
}
