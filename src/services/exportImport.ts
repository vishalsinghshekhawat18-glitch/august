// Data portability: JSON application package import/export & structured CSV exports
import { ApplicationDataPackage, Commitment, Subject, Topic, TopicProgress, StudyLog, WeeklyPlan, RevisionRecord, MockTest, MistakeEntry, UniversityCourse, UniversityItem } from '../types';
import { dbService } from './db';

// Helper to escape CSV cell
function escapeCSV(val: unknown): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

// Download file helper
export function triggerFileDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 1. Full JSON export
export async function exportApplicationDataPackage(): Promise<void> {
  const pkg = await dbService.exportFullPackage();
  const jsonStr = JSON.stringify(pkg, null, 2);
  const dateStr = new Date().toISOString().slice(0, 10);
  triggerFileDownload(jsonStr, `august-exam-tracker-backup-${dateStr}.json`, 'application/json');
}

// Validation result for package preview
export interface ImportPreview {
  valid: boolean;
  errors: string[];
  version: number;
  exportedAt: string;
  counts: {
    commitments: number;
    subjects: number;
    topics: number;
    studyLogs: number;
    weeklyPlans: number;
    revisions: number;
    mockTests: number;
    mistakes: number;
    universityItems: number;
  };
}

export function validateDataPackage(raw: unknown): ImportPreview {
  const errors: string[] = [];
  if (!raw || typeof raw !== 'object') {
    return { valid: false, errors: ['Selected file does not contain a valid JSON object.'], version: 0, exportedAt: '', counts: { commitments: 0, subjects: 0, topics: 0, studyLogs: 0, weeklyPlans: 0, revisions: 0, mockTests: 0, mistakes: 0, universityItems: 0 } };
  }

  const pkg = raw as Partial<ApplicationDataPackage>;
  if (pkg.app !== 'PersonalExamTracker') {
    errors.push('File header mismatch: This file is not an official Personal Exam Tracker backup.');
  }

  if (!pkg.data || typeof pkg.data !== 'object') {
    errors.push('Corrupted data package: Missing root data payload.');
    return { valid: false, errors, version: pkg.version || 1, exportedAt: pkg.exportedAt || '', counts: { commitments: 0, subjects: 0, topics: 0, studyLogs: 0, weeklyPlans: 0, revisions: 0, mockTests: 0, mistakes: 0, universityItems: 0 } };
  }

  const d = pkg.data;
  const counts = {
    commitments: Array.isArray(d.commitments) ? d.commitments.length : 0,
    subjects: Array.isArray(d.subjects) ? d.subjects.length : 0,
    topics: Array.isArray(d.topics) ? d.topics.length : 0,
    studyLogs: Array.isArray(d.studyLogs) ? d.studyLogs.length : 0,
    weeklyPlans: Array.isArray(d.weeklyPlans) ? d.weeklyPlans.length : 0,
    revisions: Array.isArray(d.revisions) ? d.revisions.length : 0,
    mockTests: Array.isArray(d.mockTests) ? d.mockTests.length : 0,
    mistakes: Array.isArray(d.mistakes) ? d.mistakes.length : 0,
    universityItems: Array.isArray(d.universityItems) ? d.universityItems.length : 0,
  };

  return {
    valid: errors.length === 0,
    errors,
    version: pkg.version || 1,
    exportedAt: pkg.exportedAt || 'Unknown',
    counts,
  };
}

// 2. Structured CSV Exports

export async function exportStudyLogsCSV(): Promise<void> {
  const [logs, commitments, subjects, topics] = await Promise.all([
    dbService.getAll<StudyLog>('studyLogs'),
    dbService.getAll<Commitment>('commitments'),
    dbService.getAll<Subject>('subjects'),
    dbService.getAll<Topic>('topics'),
  ]);

  const examMap = new Map(commitments.map((c) => [c.id, c.name]));
  const subMap = new Map(subjects.map((s) => [s.id, s.name]));
  const topMap = new Map(topics.map((t) => [t.id, t.name]));

  const headers = ['Log ID', 'Date', 'Examination', 'Subject', 'Topic', 'Duration Minutes', 'Activity Type', 'Notes', 'Created At'];
  const rows = logs.map((l) => [
    escapeCSV(l.id),
    escapeCSV(l.date),
    escapeCSV(examMap.get(l.examId) || l.examId),
    escapeCSV(subMap.get(l.subjectId) || l.subjectId),
    escapeCSV(l.topicId ? (topMap.get(l.topicId) || l.topicId) : ''),
    escapeCSV(l.durationMinutes),
    escapeCSV(l.activityType),
    escapeCSV(l.notes || ''),
    escapeCSV(l.createdAt),
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  triggerFileDownload(csv, `august-study-logs-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
}

export async function exportSyllabusCSV(): Promise<void> {
  const [commitments, subjects, topics, progressList] = await Promise.all([
    dbService.getAll<Commitment>('commitments'),
    dbService.getAll<Subject>('subjects'),
    dbService.getAll<Topic>('topics'),
    dbService.getAll<TopicProgress>('topicProgress'),
  ]);

  const examMap = new Map(commitments.map((c) => [c.id, c.name]));
  const subMap = new Map(subjects.map((s) => [s.id, s]));
  const progressMap = new Map(progressList.map((p) => [`${p.examId}_${p.topicId}`, p]));

  const headers = [
    'Examination ID',
    'Examination Name',
    'Subject Name',
    'Topic ID',
    'Topic Name',
    'Learning Status',
    'Practice Status',
    'Questions Solved',
    'Practice Accuracy %',
    'Revision Status',
    'Manual Completion %',
    'Last Studied Date',
  ];

  const rows: string[][] = [];

  for (const topic of topics) {
    const subject = subMap.get(topic.subjectId);
    if (!subject) continue;

    for (const examId of subject.examIds) {
      const examName = examMap.get(examId) || examId;
      const prog = progressMap.get(`${examId}_${topic.id}`);

      rows.push([
        escapeCSV(examId),
        escapeCSV(examName),
        escapeCSV(subject.name),
        escapeCSV(topic.id),
        escapeCSV(topic.name),
        escapeCSV(prog?.learningStatus || 'not_started'),
        escapeCSV(prog?.practiceStatus || 'not_started'),
        escapeCSV(prog?.practiceQuestionsSolved || 0),
        escapeCSV(prog?.practiceAccuracyPercent || 0),
        escapeCSV(prog?.revisionStatus || 'not_started'),
        escapeCSV(prog?.manualCompletionPercentage || 0),
        escapeCSV(prog?.lastStudiedAt || ''),
      ]);
    }
  }

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  triggerFileDownload(csv, `august-syllabus-progress-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
}

export async function exportMockTestsCSV(): Promise<void> {
  const [mocks, commitments] = await Promise.all([
    dbService.getAll<MockTest>('mockTests'),
    dbService.getAll<Commitment>('commitments'),
  ]);
  const examMap = new Map(commitments.map((c) => [c.id, c.name]));

  const headers = [
    'Mock ID',
    'Date',
    'Examination',
    'Test Name',
    'Total Score',
    'Max Score',
    'Accuracy %',
    'Correct',
    'Incorrect',
    'Skipped',
    'Attempted',
    'Time Taken Mins',
    'Notes',
  ];

  const rows = mocks.map((m) => [
    escapeCSV(m.id),
    escapeCSV(m.date),
    escapeCSV(examMap.get(m.examId) || m.examId),
    escapeCSV(m.testName),
    escapeCSV(m.totalScore),
    escapeCSV(m.maxScore),
    escapeCSV(m.accuracyPercent),
    escapeCSV(m.correctCount),
    escapeCSV(m.incorrectCount),
    escapeCSV(m.skippedCount),
    escapeCSV(m.attemptedCount),
    escapeCSV(m.timeTakenMinutes),
    escapeCSV(m.notes || ''),
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  triggerFileDownload(csv, `august-mock-tests-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
}

export async function exportMistakesCSV(): Promise<void> {
  const [mistakes, commitments, subjects, topics] = await Promise.all([
    dbService.getAll<MistakeEntry>('mistakes'),
    dbService.getAll<Commitment>('commitments'),
    dbService.getAll<Subject>('subjects'),
    dbService.getAll<Topic>('topics'),
  ]);
  const examMap = new Map(commitments.map((c) => [c.id, c.name]));
  const subMap = new Map(subjects.map((s) => [s.id, s.name]));
  const topMap = new Map(topics.map((t) => [t.id, t.name]));

  const headers = ['Mistake ID', 'Examination', 'Subject', 'Topic', 'Error Type', 'Question Snippet', 'Solution Notes', 'Resolved Status', 'Created At'];
  const rows = mistakes.map((m) => [
    escapeCSV(m.id),
    escapeCSV(examMap.get(m.examId) || m.examId),
    escapeCSV(m.subjectId ? (subMap.get(m.subjectId) || m.subjectId) : ''),
    escapeCSV(m.topicId ? (topMap.get(m.topicId) || m.topicId) : ''),
    escapeCSV(m.errorType),
    escapeCSV(m.questionSnippet),
    escapeCSV(m.solutionNotes),
    escapeCSV(m.resolved ? 'Resolved' : 'Active Weak Area'),
    escapeCSV(m.createdAt),
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  triggerFileDownload(csv, `august-mistakes-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
}

export async function exportRevisionsCSV(): Promise<void> {
  const [revisions, commitments, subjects, topics] = await Promise.all([
    dbService.getAll<RevisionRecord>('revisions'),
    dbService.getAll<Commitment>('commitments'),
    dbService.getAll<Subject>('subjects'),
    dbService.getAll<Topic>('topics'),
  ]);
  const examMap = new Map(commitments.map((c) => [c.id, c.name]));
  const subMap = new Map(subjects.map((s) => [s.id, s.name]));
  const topMap = new Map(topics.map((t) => [t.id, t.name]));

  const headers = ['Revision ID', 'Examination', 'Subject', 'Topic', 'Basis Date', 'Interval Days', 'Scheduled Date', 'Status', 'Completed Date', 'Notes'];
  const rows = revisions.map((r) => [
    escapeCSV(r.id),
    escapeCSV(examMap.get(r.examId) || r.examId),
    escapeCSV(subMap.get(r.subjectId) || r.subjectId),
    escapeCSV(topMap.get(r.topicId) || r.topicId),
    escapeCSV(r.basisDate),
    escapeCSV(r.intervalDays),
    escapeCSV(r.scheduledDate),
    escapeCSV(r.status),
    escapeCSV(r.completedAt || ''),
    escapeCSV(r.notes || ''),
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  triggerFileDownload(csv, `august-revisions-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
}
