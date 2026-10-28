import { Commitment, Subject, Topic, TopicProgress, RevisionRecord, WeeklyPlan, WeeklyTask, LearningStatus } from '../types';
import { dbService } from './db';
import { addDays, getTodayDateString, getWeekBounds, getNextWeekBounds } from './dateUtils';

// 1. Spaced Repetition Intervals (1 day, 3 days, 7 days, 21 days)
export const DEFAULT_SPACED_INTERVALS = [1, 3, 7, 21];

/**
 * Automatically schedule a full spaced repetition cycle for a studied topic
 */
export async function scheduleSpacedRevisionCycle(
  examId: string,
  subjectId: string,
  topicId: string,
  basisDate: string = getTodayDateString(),
  intervals: number[] = DEFAULT_SPACED_INTERVALS
): Promise<RevisionRecord[]> {
  const records: RevisionRecord[] = intervals.map((interval) => ({
    id: `rev_${Date.now()}_${interval}_${Math.random().toString(36).substring(2, 6)}`,
    examId,
    subjectId,
    topicId,
    basisDate,
    intervalDays: interval,
    scheduledDate: addDays(basisDate, interval),
    status: 'due',
    createdAt: new Date().toISOString(),
  }));

  await dbService.putMany<RevisionRecord>('revisions', records);
  return records;
}

/**
 * Synchronize topic progress across all examinations that share this subject
 */
export async function syncTopicProgressAcrossExams(
  subject: Subject,
  topicId: string,
  learningStatus: LearningStatus = 'in_progress',
  completionPercentage: number = 50,
  studiedDate: string = getTodayDateString()
): Promise<TopicProgress[]> {
  const updatedList: TopicProgress[] = [];
  const targetExamIds = subject.examIds && subject.examIds.length > 0 ? subject.examIds : [];

  for (const examId of targetExamIds) {
    const progressId = `${examId}_${topicId}`;
    const existing = await dbService.get<TopicProgress>('topicProgress', progressId);

    const prog: TopicProgress = existing || {
      id: progressId,
      examId,
      topicId,
      learningStatus,
      practiceStatus: 'not_started',
      revisionStatus: 'not_started',
      manualCompletionPercentage: completionPercentage,
      updatedAt: new Date().toISOString(),
    };

    prog.learningStatus = learningStatus;
    if (completionPercentage !== undefined) {
      prog.manualCompletionPercentage = Math.max(prog.manualCompletionPercentage || 0, completionPercentage);
    }
    prog.lastStudiedAt = studiedDate;
    prog.updatedAt = new Date().toISOString();

    await dbService.put<TopicProgress>('topicProgress', prog);
    updatedList.push(prog);
  }

  return updatedList;
}

export interface SubjectPacingPlan {
  subjectId: string;
  subjectName: string;
  linkedExams: { id: string; name: string; priority: number; targetDate?: string }[];
  totalTopics: number;
  completedTopics: number;
  remainingTopics: Topic[];
  recommendedChaptersPerWeek: number;
  estimatedWeeksToComplete: number;
  targetCompletionDate: string;
  estimatedDailyMinutes: number;
  weeklySchedule: {
    weekIndex: number;
    weekStartDate: string;
    chapters: Topic[];
  }[];
}

/**
 * Calculate comfortable pacing for remaining chapters of a subject
 * Takes into account higher-priority exam commitments so the user is never overloaded
 */
export function calculateSubjectPacing(
  subject: Subject,
  allTopics: Topic[],
  progressMap: Map<string, TopicProgress>,
  commitments: Commitment[],
  chaptersPerWeekOption?: number
): SubjectPacingPlan {
  const subjectTopics = allTopics
    .filter((t) => t.subjectId === subject.id && !t.archived)
    .sort((a, b) => a.order - b.order);

  const linkedExams = commitments
    .filter((c) => subject.examIds.includes(c.id))
    .sort((a, b) => a.priority - b.priority)
    .map((c) => ({
      id: c.id,
      name: c.name,
      priority: c.priority,
      targetDate: c.targetDate,
    }));

  const primaryExam = linkedExams[0];

  // Determine which topics are completed vs remaining
  const remainingTopics: Topic[] = [];
  let completedCount = 0;

  for (const topic of subjectTopics) {
    // Check progress in any linked exam
    let isCompleted = false;
    for (const exam of linkedExams) {
      const p = progressMap.get(`${exam.id}_${topic.id}`);
      if (p && (p.learningStatus === 'completed' || p.manualCompletionPercentage >= 100)) {
        isCompleted = true;
        break;
      }
    }

    if (isCompleted) {
      completedCount++;
    } else {
      remainingTopics.push(topic);
    }
  }

  // Determine comfortable pace
  // If the subject belongs to a high-priority exam (Priority 1), pace can be 3 chapters/week
  // If secondary/supplementary (Priority 3 or 4), pace is 1-2 chapters/week (~45 mins/day) to prevent crowding out Priority 1
  let chaptersPerWeek = chaptersPerWeekOption || 2;
  if (!chaptersPerWeekOption) {
    if (primaryExam && primaryExam.priority === 1) {
      chaptersPerWeek = 3;
    } else {
      chaptersPerWeek = 2; // Comfortable, steady pace
    }
  }

  const remainingCount = remainingTopics.length;
  const estimatedWeeks = Math.max(1, Math.ceil(remainingCount / chaptersPerWeek));
  const estimatedDays = estimatedWeeks * 7;
  const today = getTodayDateString();
  const targetCompletionDate = addDays(today, estimatedDays);

  // Approximately 45 minutes per chapter study session
  const estimatedDailyMinutes = Math.round((chaptersPerWeek * 60) / 6); // spread over 6 study days

  // Distribute chapters into weekly schedule
  const weeklySchedule: SubjectPacingPlan['weeklySchedule'] = [];
  const currentWeek = getWeekBounds(today);

  for (let w = 0; w < estimatedWeeks; w++) {
    const startIdx = w * chaptersPerWeek;
    const weekChapters = remainingTopics.slice(startIdx, startIdx + chaptersPerWeek);
    const weekStartDate = addDays(currentWeek.monday, w * 7);

    if (weekChapters.length > 0) {
      weeklySchedule.push({
        weekIndex: w + 1,
        weekStartDate,
        chapters: weekChapters,
      });
    }
  }

  return {
    subjectId: subject.id,
    subjectName: subject.name,
    linkedExams,
    totalTopics: subjectTopics.length,
    completedTopics: completedCount,
    remainingTopics,
    recommendedChaptersPerWeek: chaptersPerWeek,
    estimatedWeeksToComplete: estimatedWeeks,
    targetCompletionDate,
    estimatedDailyMinutes,
    weeklySchedule,
  };
}

/**
 * Apply the calculated pacing chapters into the user's WeeklyPlans
 */
export async function applyPacingToWeeklyPlans(
  pacingPlan: SubjectPacingPlan,
  primaryExamId: string
): Promise<{ tasksCreated: number; plansUpdated: number }> {
  let tasksCreated = 0;
  let plansUpdated = 0;

  for (const week of pacingPlan.weeklySchedule) {
    const planId = `week_${week.weekStartDate}`;
    let plan = await dbService.get<WeeklyPlan>('weeklyPlans', planId);

    const weekBounds = getWeekBounds(week.weekStartDate);
    if (!plan) {
      plan = {
        id: planId,
        weekStartDate: weekBounds.monday,
        weekEndDate: weekBounds.sunday,
        targetHours: 25,
        status: 'approved',
        approvedAt: new Date().toISOString(),
        notes: `Weekly schedule including ${pacingPlan.subjectName} pacing`,
        tasks: [],
      };
    }

    const newTasks: WeeklyTask[] = week.chapters.map((chap, idx) => ({
      id: `task_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      weeklyPlanId: plan!.id,
      title: `${pacingPlan.subjectName}: Read ${chap.name}`,
      examId: primaryExamId,
      subjectId: pacingPlan.subjectId,
      topicId: chap.id,
      estimatedMinutes: 60,
      actualMinutes: 0,
      weight: 3,
      status: 'planned',
      progressFraction: 0,
      dueDate: addDays(week.weekStartDate, (idx + 1) * 2),
    }));

    plan.tasks = [...plan.tasks, ...newTasks];
    await dbService.put<WeeklyPlan>('weeklyPlans', plan);

    tasksCreated += newTasks.length;
    plansUpdated++;
  }

  return { tasksCreated, plansUpdated };
}
