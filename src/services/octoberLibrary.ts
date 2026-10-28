import { Topic, Subject, TopicProgress, StudyLog } from '../types';
import { dbService } from './db';
import { syncTopicProgressAcrossExams, scheduleSpacedRevisionCycle } from './smartPacing';

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
