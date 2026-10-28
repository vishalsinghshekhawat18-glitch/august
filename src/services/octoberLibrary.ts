import { Topic, Subject, TopicProgress, StudyLog, RevisionRecord } from '../types';
import { dbService } from './db';
import { syncTopicProgressAcrossExams, scheduleSpacedRevisionCycle } from './smartPacing';
import { addDays, getTodayDateString } from './dateUtils';

export interface OctoberChapter {
  chapterNumber: number;
  title: string;
  part: string;
}

export const OCTOBER_ECONOMICS_CHAPTERS: OctoberChapter[] = [
  { chapterNumber: 1, title: 'Economic Organisation and Systems', part: 'Foundations' },
  { chapterNumber: 2, title: 'Sectors and Goods Typology', part: 'Foundations' },
  { chapterNumber: 3, title: 'Demand, Supply and Elasticity', part: 'Foundations' },
  { chapterNumber: 4, title: 'Consumer Behaviour, Production and Costs', part: 'Foundations' },
  { chapterNumber: 5, title: 'Market Structures', part: 'Foundations' },
  { chapterNumber: 6, title: 'National Income Accounting', part: 'Foundations' },
  { chapterNumber: 7, title: 'Growth, Development and Welfare Metrics', part: 'Macroeconomics' },
  { chapterNumber: 8, title: 'Income Determination and the Multiplier', part: 'Macroeconomics' },
  { chapterNumber: 9, title: 'IS-LM and AD-AS', part: 'Macroeconomics' },
  { chapterNumber: 10, title: 'Inflation', part: 'Macroeconomics' },
  { chapterNumber: 11, title: 'Employment, Unemployment and Labour Law', part: 'Macroeconomics' },
  { chapterNumber: 12, title: 'Business Cycles', part: 'Macroeconomics' },
  { chapterNumber: 13, title: 'Stabilisation Policy and the Policy Mix', part: 'Macroeconomics' },
  { chapterNumber: 14, title: 'Nature of Money', part: 'Money, Banking and Financial System' },
  { chapterNumber: 15, title: 'Liquidity Aggregates', part: 'Money, Banking and Financial System' },
  { chapterNumber: 16, title: 'The Reserve Bank of India', part: 'Money, Banking and Financial System' },
  { chapterNumber: 17, title: 'Monetary Policy and Inflation Targeting', part: 'Money, Banking and Financial System' },
  { chapterNumber: 18, title: 'Banking Architecture', part: 'Money, Banking and Financial System' },
  { chapterNumber: 19, title: 'Capital Adequacy, NPAs and IBC', part: 'Money, Banking and Financial System' },
  { chapterNumber: 20, title: 'Financial Markets and Government Securities', part: 'Money, Banking and Financial System' },
  { chapterNumber: 21, title: 'Capital Markets', part: 'Money, Banking and Financial System' },
  { chapterNumber: 22, title: 'Financial Inclusion', part: 'Money, Banking and Financial System' },
  { chapterNumber: 23, title: 'Financial Products: Insurance, Savings and Gold Schemes', part: 'Money, Banking and Financial System' },
  { chapterNumber: 24, title: 'Tax Theory', part: 'Public Finance and Taxation' },
  { chapterNumber: 25, title: 'The Union Budget', part: 'Public Finance and Taxation' },
  { chapterNumber: 26, title: 'Deficits, Debt and the FRBM Act', part: 'Public Finance and Taxation' },
  { chapterNumber: 27, title: 'Taxation Architecture', part: 'Public Finance and Taxation' },
  { chapterNumber: 28, title: 'Goods and Services Tax', part: 'Public Finance and Taxation' },
  { chapterNumber: 29, title: 'Fiscal Federalism and the Finance Commission', part: 'Public Finance and Taxation' },
  { chapterNumber: 30, title: 'Trade Theory', part: 'External Sector' },
  { chapterNumber: 31, title: 'Balance of Payments', part: 'External Sector' },
  { chapterNumber: 32, title: 'Forex, NEER, REER and Convertibility', part: 'External Sector' },
  { chapterNumber: 33, title: 'Trade Policy', part: 'External Sector' },
  { chapterNumber: 34, title: 'FDI and FPI', part: 'External Sector' },
  { chapterNumber: 35, title: 'International Organisations and the WTO', part: 'External Sector' },
  { chapterNumber: 36, title: 'Evolution of the Indian Economy', part: 'Development and Indian Economy' },
  { chapterNumber: 37, title: 'Planning and NITI Aayog', part: 'Development and Indian Economy' },
  { chapterNumber: 38, title: 'Agriculture', part: 'Development and Indian Economy' },
  { chapterNumber: 39, title: 'Industry, MSMEs and Industrial Policy', part: 'Development and Indian Economy' },
  { chapterNumber: 40, title: 'Services and Digital', part: 'Development and Indian Economy' },
  { chapterNumber: 41, title: 'Poverty, Inequality and Human Development', part: 'Development and Indian Economy' },
  { chapterNumber: 42, title: 'Urbanisation and Demography', part: 'Development and Indian Economy' },
  { chapterNumber: 43, title: 'Education and Health', part: 'Development and Indian Economy' },
  { chapterNumber: 44, title: 'Social Structure', part: 'Development and Indian Economy' },
  { chapterNumber: 45, title: 'Environment and Sustainable Development', part: 'Development and Indian Economy' },
  { chapterNumber: 46, title: 'Farming Systems and the Food Economy', part: 'Development and Indian Economy' },
  { chapterNumber: 47, title: 'Infrastructure', part: 'Development and Indian Economy' },
];

/**
 * Checks if a subject link points to October Library and returns the book slug if matched
 */
export function detectOctoberBookSlug(urlOrText?: string): string | null {
  if (!urlOrText) return null;
  const match = urlOrText.match(/[?&]book=([a-zA-Z0-9_-]+)/i);
  if (match) return match[1].toLowerCase();
  if (urlOrText.toLowerCase().includes('economics')) return 'economics';
  return null;
}

/**
 * Import all 47 chapters for an Economics subject into the tracker database
 */
export async function importOctoberEconomicsChapters(
  subjectId: string,
  baseReaderUrl: string = 'https://vishalsinghshekhawat18-glitch.github.io/October/reader.html?book=economics'
): Promise<Topic[]> {
  const existingTopics = await dbService.getAll<Topic>('topics');
  const subjectTopics = existingTopics.filter((t) => t.subjectId === subjectId);

  // If topics already exist with matching names, don't duplicate
  const topicsToInsert: Topic[] = [];

  for (const ch of OCTOBER_ECONOMICS_CHAPTERS) {
    const chapterName = `Chapter ${ch.chapterNumber}: ${ch.title}`;
    const alreadyExists = subjectTopics.some(
      (t) => t.name.toLowerCase() === chapterName.toLowerCase() || t.name.includes(`Chapter ${ch.chapterNumber}`)
    );

    if (!alreadyExists) {
      topicsToInsert.push({
        id: `top_oct_econ_${ch.chapterNumber}_${Date.now().toString(36)}`,
        subjectId,
        name: chapterName,
        order: ch.chapterNumber,
        notes: baseReaderUrl,
        archived: false,
      });
    }
  }

  if (topicsToInsert.length > 0) {
    await dbService.putMany<Topic>('topics', topicsToInsert);
  }

  return [...subjectTopics, ...topicsToInsert].sort((a, b) => a.order - b.order);
}

/**
 * Mark specified chapters as completed on a given date (e.g. yesterday),
 * synchronize across all linked exams, log the focused study session,
 * and automatically schedule the spaced revision cycle (+1d, +3d, +7d, +21d).
 */
export async function markBatchChaptersRead(params: {
  subject: Subject;
  chapterTopicIds: string[];
  date: string; // YYYY-MM-DD
  minutesSpent: number;
  autoScheduleRevision?: boolean;
}): Promise<{
  updatedTopicsCount: number;
  completionPercentage: number;
  remainingChapters: number;
  totalChapters: number;
}> {
  const { subject, chapterTopicIds, date, minutesSpent, autoScheduleRevision = true } = params;

  const allTopics = await dbService.getAll<Topic>('topics');
  const subjectTopics = allTopics.filter((t) => t.subjectId === subject.id && !t.archived);

  // 1. Mark each selected chapter as completed across all linked exams
  for (const topicId of chapterTopicIds) {
    await syncTopicProgressAcrossExams(subject, topicId, 'completed', 100, date);

    if (autoScheduleRevision && subject.examIds.length > 0) {
      await scheduleSpacedRevisionCycle(subject.examIds[0], subject.id, topicId, date);
    }
  }

  // 2. Log Study Session for the specified date
  const readTitles = subjectTopics
    .filter((t) => chapterTopicIds.includes(t.id))
    .map((t) => t.name)
    .join(', ');

  const primaryExamId = subject.examIds[0] || 'comm_ibps_rrb_po';
  const newLog: StudyLog = {
    id: `log_batch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    date,
    timestamp: `${date}T12:00:00.000Z`,
    examId: primaryExamId,
    subjectId: subject.id,
    topicId: chapterTopicIds[0],
    durationMinutes: minutesSpent,
    activityType: 'learning',
    notes: `Read ${chapterTopicIds.length} chapter(s): ${readTitles}`,
    createdAt: new Date().toISOString(),
  };
  await dbService.put<StudyLog>('studyLogs', newLog);

  // 3. Calculate refreshed progress
  const allProg = await dbService.getAll<TopicProgress>('topicProgress');
  const completedIds = new Set<string>();

  for (const t of subjectTopics) {
    for (const examId of subject.examIds) {
      const p = allProg.find((pr) => pr.examId === examId && pr.topicId === t.id);
      if (p && (p.learningStatus === 'completed' || p.manualCompletionPercentage >= 100)) {
        completedIds.add(t.id);
        break;
      }
    }
  }

  const totalChapters = subjectTopics.length;
  const completedCount = completedIds.size;
  const completionPercentage = totalChapters > 0 ? Number(((completedCount / totalChapters) * 100).toFixed(1)) : 0;
  const remainingChapters = Math.max(0, totalChapters - completedCount);

  return {
    updatedTopicsCount: chapterTopicIds.length,
    completionPercentage,
    remainingChapters,
    totalChapters,
  };
}

/**
 * Mark specified chapters as revised on a given date (e.g. yesterday),
 * synchronize topic revisionStatus across all linked exams,
 * complete any due/overdue revision records on or before that date,
 * schedule the next spaced revision cycle (+3d, +7d, +21d),
 * and log a StudyLog entry with activityType: 'revision'.
 */
export async function markBatchChaptersRevised(params: {
  subject: Subject;
  chapterTopicIds: string[];
  date: string; // YYYY-MM-DD
  minutesSpent: number;
  autoScheduleNextCycle?: boolean;
}): Promise<{
  revisedTopicsCount: number;
  nextScheduledDates: string[];
}> {
  const { subject, chapterTopicIds, date, minutesSpent, autoScheduleNextCycle = true } = params;

  const allTopics = await dbService.getAll<Topic>('topics');
  const subjectTopics = allTopics.filter((t) => t.subjectId === subject.id && !t.archived);
  const targetExamIds = subject.examIds && subject.examIds.length > 0 ? subject.examIds : ['comm_ibps_rrb_po'];

  // 1. Update TopicProgress revisionStatus & lastStudiedAt across all linked exams
  for (const topicId of chapterTopicIds) {
    for (const examId of targetExamIds) {
      const progressId = `${examId}_${topicId}`;
      const existing = await dbService.get<TopicProgress>('topicProgress', progressId);
      const prog: TopicProgress = existing || {
        id: progressId,
        examId,
        topicId,
        learningStatus: 'completed',
        practiceStatus: 'not_started',
        revisionStatus: 'completed',
        manualCompletionPercentage: 100,
        updatedAt: new Date().toISOString(),
      };

      prog.revisionStatus = 'completed';
      // Revising a chapter confirms mastery if not previously marked
      if (prog.learningStatus === 'not_started') {
        prog.learningStatus = 'completed';
        prog.manualCompletionPercentage = Math.max(prog.manualCompletionPercentage || 0, 100);
      }
      prog.lastStudiedAt = date;
      prog.updatedAt = new Date().toISOString();

      await dbService.put<TopicProgress>('topicProgress', prog);
    }
  }

  // 2. Mark existing due RevisionRecord items for these topics on or before date as completed
  const allRevisions = await dbService.getAll<RevisionRecord>('revisions');
  const updatedRevisions: RevisionRecord[] = [];
  const perChapterMinutes = Math.max(5, Math.round(minutesSpent / (chapterTopicIds.length || 1)));
  for (const rev of allRevisions) {
    if (chapterTopicIds.includes(rev.topicId) && rev.status !== 'completed' && rev.scheduledDate <= date) {
      updatedRevisions.push({
        ...rev,
        status: 'completed',
        completedAt: date,
        durationMinutes: perChapterMinutes,
      });
    }
  }
  if (updatedRevisions.length > 0) {
    await dbService.putMany<RevisionRecord>('revisions', updatedRevisions);
  }

  // 3. Auto-schedule next retention intervals (+3d, +7d, +21d) starting from `date`
  const nextScheduledDates: string[] = [];
  if (autoScheduleNextCycle && targetExamIds.length > 0) {
    const nextIntervals = [3, 7, 21];
    const recordsToInsert: RevisionRecord[] = [];
    for (const topicId of chapterTopicIds) {
      for (const examId of targetExamIds) {
        for (const interval of nextIntervals) {
          const schedDate = addDays(date, interval);
          nextScheduledDates.push(schedDate);
          recordsToInsert.push({
            id: `rev_nxt_${Date.now()}_${interval}_${Math.random().toString(36).substring(2, 6)}`,
            examId,
            subjectId: subject.id,
            topicId,
            basisDate: date,
            intervalDays: interval,
            scheduledDate: schedDate,
            status: 'due',
            createdAt: new Date().toISOString(),
          });
        }
      }
    }
    if (recordsToInsert.length > 0) {
      await dbService.putMany<RevisionRecord>('revisions', recordsToInsert);
    }
  }

  // 4. Log Revision Study Session
  const revisedTitles = subjectTopics
    .filter((t) => chapterTopicIds.includes(t.id))
    .map((t) => t.name)
    .join(', ');

  const primaryExamId = targetExamIds[0];
  const newLog: StudyLog = {
    id: `log_batch_rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    date,
    timestamp: `${date}T12:00:00.000Z`,
    examId: primaryExamId,
    subjectId: subject.id,
    topicId: chapterTopicIds[0],
    durationMinutes: minutesSpent,
    activityType: 'revision',
    notes: `Revised ${chapterTopicIds.length} chapter(s): ${revisedTitles || 'Chapters'}`,
    createdAt: new Date().toISOString(),
  };
  await dbService.put<StudyLog>('studyLogs', newLog);

  return {
    revisedTopicsCount: chapterTopicIds.length,
    nextScheduledDates: Array.from(new Set(nextScheduledDates)).sort(),
  };
}

/**
 * Complete one or more specific revision records, record the exact time spent,
 * update topic progress across linked exams, auto-schedule next retention interval,
 * and create a focused StudyLog entry.
 */
export async function completeRevisionWithLog(params: {
  revisionIds: string[];
  date: string; // YYYY-MM-DD
  durationMinutes: number;
  autoScheduleNext?: boolean;
  notes?: string;
}): Promise<{
  completedCount: number;
  studyLogId: string;
}> {
  const { revisionIds, date, durationMinutes, autoScheduleNext = true, notes } = params;

  const allRevisions = await dbService.getAll<RevisionRecord>('revisions');
  const targetRevs = allRevisions.filter((r) => revisionIds.includes(r.id));
  if (targetRevs.length === 0) {
    throw new Error('No matching revision records found to complete.');
  }

  const perRevMinutes = Math.max(5, Math.round(durationMinutes / targetRevs.length));

  // 1. Update RevisionRecords with completion date and duration
  const updatedRevs: RevisionRecord[] = [];
  for (const rev of targetRevs) {
    updatedRevs.push({
      ...rev,
      status: 'completed',
      completedAt: date,
      durationMinutes: perRevMinutes,
      notes: notes || rev.notes,
    });
  }
  await dbService.putMany<RevisionRecord>('revisions', updatedRevs);

  // 2. Update TopicProgress for each completed revision
  for (const rev of targetRevs) {
    const key = `${rev.examId}_${rev.topicId}`;
    const existing = await dbService.get<TopicProgress>('topicProgress', key);
    const prog: TopicProgress = existing || {
      id: key,
      examId: rev.examId,
      topicId: rev.topicId,
      learningStatus: 'completed',
      practiceStatus: 'not_started',
      revisionStatus: 'completed',
      manualCompletionPercentage: 100,
      updatedAt: new Date().toISOString(),
    };
    prog.revisionStatus = 'completed';
    if (prog.learningStatus === 'not_started') {
      prog.learningStatus = 'completed';
      prog.manualCompletionPercentage = Math.max(prog.manualCompletionPercentage || 0, 100);
    }
    prog.lastStudiedAt = date;
    prog.updatedAt = new Date().toISOString();
    await dbService.put<TopicProgress>('topicProgress', prog);
  }

  // 3. Auto-schedule next retention interval
  if (autoScheduleNext) {
    const recordsToInsert: RevisionRecord[] = [];
    for (const rev of targetRevs) {
      let nextInterval = 3;
      if (rev.intervalDays === 1) nextInterval = 3;
      else if (rev.intervalDays === 3) nextInterval = 7;
      else if (rev.intervalDays === 7) nextInterval = 21;
      else if (rev.intervalDays >= 21) nextInterval = 30;
      else nextInterval = rev.intervalDays * 2;

      const schedDate = addDays(date, nextInterval);
      recordsToInsert.push({
        id: `rev_nxt_${Date.now()}_${nextInterval}_${Math.random().toString(36).substring(2, 6)}`,
        examId: rev.examId,
        subjectId: rev.subjectId,
        topicId: rev.topicId,
        basisDate: date,
        intervalDays: nextInterval,
        scheduledDate: schedDate,
        status: 'due',
        createdAt: new Date().toISOString(),
      });
    }
    if (recordsToInsert.length > 0) {
      await dbService.putMany<RevisionRecord>('revisions', recordsToInsert);
    }
  }

  // 4. Create focused StudyLog
  const allTopics = await dbService.getAll<Topic>('topics');
  const topicNames = targetRevs
    .map((r) => allTopics.find((t) => t.id === r.topicId)?.name || 'Chapter')
    .join(', ');

  const primaryRev = targetRevs[0];
  const logId = `log_rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newLog: StudyLog = {
    id: logId,
    date,
    timestamp: `${date}T12:00:00.000Z`,
    examId: primaryRev.examId,
    subjectId: primaryRev.subjectId,
    topicId: primaryRev.topicId,
    durationMinutes,
    activityType: 'revision',
    notes: notes || `Revised ${targetRevs.length} chapter(s): ${topicNames}`,
    createdAt: new Date().toISOString(),
  };
  await dbService.put<StudyLog>('studyLogs', newLog);

  return {
    completedCount: targetRevs.length,
    studyLogId: logId,
  };
}

/**
 * Update the time spent on an already completed revision record,
 * and create or update the corresponding StudyLog entry.
 */
export async function updateCompletedRevisionTime(params: {
  revisionId: string;
  durationMinutes: number;
  date?: string;
  notes?: string;
}): Promise<void> {
  const { revisionId, durationMinutes, date, notes } = params;

  const rev = await dbService.get<RevisionRecord>('revisions', revisionId);
  if (!rev) throw new Error('Revision record not found.');

  const effectiveDate = date || rev.completedAt || date || getTodayDateString();
  const updatedRev: RevisionRecord = {
    ...rev,
    status: 'completed',
    completedAt: effectiveDate,
    durationMinutes,
    notes: notes || rev.notes,
  };
  await dbService.put<RevisionRecord>('revisions', updatedRev);

  // Check if study log already exists for this revision
  const logs = await dbService.getAll<StudyLog>('studyLogs');
  const existingLog = logs.find(
    (l) => l.topicId === rev.topicId && l.activityType === 'revision' && l.date === effectiveDate
  );

  if (existingLog) {
    existingLog.durationMinutes = durationMinutes;
    if (notes) existingLog.notes = notes;
    await dbService.put<StudyLog>('studyLogs', existingLog);
  } else {
    const allTopics = await dbService.getAll<Topic>('topics');
    const topic = allTopics.find((t) => t.id === rev.topicId);
    const newLog: StudyLog = {
      id: `log_rev_upd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date: effectiveDate,
      timestamp: `${effectiveDate}T12:00:00.000Z`,
      examId: rev.examId,
      subjectId: rev.subjectId,
      topicId: rev.topicId,
      durationMinutes,
      activityType: 'revision',
      notes: notes || `Revised: ${topic?.name || 'Chapter'}`,
      createdAt: new Date().toISOString(),
    };
    await dbService.put<StudyLog>('studyLogs', newLog);
  }
}
