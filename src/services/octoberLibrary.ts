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

export const OCTOBER_CURRENT_AFFAIRS_SECTIONS: OctoberChapter[] = [
  // Part 1: Static Bank (10 Sections)
  { chapterNumber: 1, title: 'Constitution, Polity and Amendments', part: 'Static Bank' },
  { chapterNumber: 2, title: 'RBI, Monetary Policy and Banking Basics', part: 'Static Bank' },
  { chapterNumber: 3, title: 'GST, Taxation and Budget', part: 'Static Bank' },
  { chapterNumber: 4, title: 'Financial Regulators and Institutions', part: 'Static Bank' },
  { chapterNumber: 5, title: 'Government Committees, Commissions and Reports', part: 'Static Bank' },
  { chapterNumber: 6, title: 'Schemes and Acts with Launch Year and Ministry', part: 'Static Bank' },
  { chapterNumber: 7, title: 'Important Days, Themes and Headquarters', part: 'Static Bank' },
  { chapterNumber: 8, title: 'Older Important Current Affairs', part: 'Static Bank' },
  { chapterNumber: 9, title: 'Summary Tables (key numbers and dates)', part: 'Static Bank' },
  { chapterNumber: 10, title: 'Revision (168 Recall Questions)', part: 'Static Bank' },

  // Part 2: January–March 2026 (10 Sections)
  { chapterNumber: 11, title: 'ESI, Finance and Business', part: 'January–March 2026' },
  { chapterNumber: 12, title: 'Regulatory Bodies, PIB, Circulars and Notifications', part: 'January–March 2026' },
  { chapterNumber: 13, title: 'International Organisations and Affairs', part: 'January–March 2026' },
  { chapterNumber: 14, title: 'National and State News', part: 'January–March 2026' },
  { chapterNumber: 15, title: 'MoUs, Conferences and Appointments', part: 'January–March 2026' },
  { chapterNumber: 16, title: 'Science, Technology, Defence and Sports', part: 'January–March 2026' },
  { chapterNumber: 17, title: 'Awards, Books, Indices and Rankings', part: 'January–March 2026' },
  { chapterNumber: 18, title: 'Government Schemes and Static Links', part: 'January–March 2026' },
  { chapterNumber: 19, title: 'Summary Tables', part: 'January–March 2026' },
  { chapterNumber: 20, title: 'Revision (75 Recall Questions)', part: 'January–March 2026' },
];

export interface ParsedOctoberUnit {
  order: number;
  name: string;
  part: string;
  anchorId: string;
  notes: string;
}

export interface TopicGroupInfo {
  groupKey: string;
  groupTitle: string;
  displayName: string;
}

/**
 * Extracts grouping/file information from a topic (e.g. [Static], [Jan–Mar 2026], or anchor in notes).
 */
export function extractTopicGroup(topic: Topic): TopicGroupInfo | null {
  const match = topic.name.match(/^\[(.*?)\]\s*(.*)$/);
  if (match) {
    const rawKey = match[1].trim();
    const cleanName = match[2].trim();
    let title = rawKey;
    const low = rawKey.toLowerCase();
    if (low === 'static' || low.includes('static')) {
      title = 'Static Bank';
    } else if (low.includes('jan') && low.includes('mar')) {
      title = 'January–March 2026';
    } else if (low.includes('apr') && low.includes('jun')) {
      title = 'April–June 2026';
    } else if (low.includes('apr')) {
      title = 'April 2026';
    } else if (low.includes('jul') && low.includes('sep')) {
      title = 'July–September 2026';
    } else if (low.includes('oct') && low.includes('dec')) {
      title = 'October–December 2026';
    }
    return {
      groupKey: rawKey,
      groupTitle: title,
      displayName: cleanName,
    };
  }

  // Fallback: check topic.notes anchor
  if (topic.notes) {
    if (topic.notes.includes('#static-')) {
      return { groupKey: 'Static', groupTitle: 'Static Bank', displayName: topic.name };
    }
    if (topic.notes.includes('#jan-mar-')) {
      return { groupKey: 'Jan–Mar 2026', groupTitle: 'January–March 2026', displayName: topic.name };
    }
    if (topic.notes.includes('#apr-') || topic.notes.includes('april')) {
      return { groupKey: 'Apr 2026', groupTitle: 'April 2026', displayName: topic.name };
    }
  }

  return null;
}

export interface TopicGroup {
  key: string;
  title: string;
  topics: Topic[];
}

/**
 * Groups topics into distinct parts/files (e.g. Static Bank, Jan–Mar 2026, Apr–Jun 2026)
 * If no group prefixes exist, returns a single group representing all chapters.
 */
export function groupTopicsByPart(topics: Topic[]): TopicGroup[] {
  const groupsMap = new Map<string, { title: string; topics: Topic[] }>();
  let hasAnyGroup = false;

  for (const topic of topics) {
    const groupInfo = extractTopicGroup(topic);
    if (groupInfo) {
      hasAnyGroup = true;
      if (!groupsMap.has(groupInfo.groupKey)) {
        groupsMap.set(groupInfo.groupKey, { title: groupInfo.groupTitle, topics: [] });
      }
      groupsMap.get(groupInfo.groupKey)!.topics.push(topic);
    } else {
      const generalKey = 'General';
      if (!groupsMap.has(generalKey)) {
        groupsMap.set(generalKey, { title: 'General Sections', topics: [] });
      }
      groupsMap.get(generalKey)!.topics.push(topic);
    }
  }

  if (!hasAnyGroup) {
    return [{ key: 'all', title: 'All Chapters', topics }];
  }

  return Array.from(groupsMap.entries()).map(([key, value]) => ({
    key,
    title: value.title,
    topics: value.topics,
  }));
}

/**
 * Dynamically parse any October Library book HTML into parts and sections/chapters.
 * Handles multiple parts (e.g. Static Bank, January–March 2026, April–June 2026)
 * and single-level chapters (e.g. Economics).
 */
export function parseOctoberHtml(html: string, slug: string, baseReaderUrl: string): ParsedOctoberUnit[] {
  const units: ParsedOctoberUnit[] = [];
  const cleanBase = baseReaderUrl.split('#')[0];

  const hasParts = /<h1\s+class="rd-part"/i.test(html);

  if (hasParts) {
    const rawParts = html.split(/<h1\s+class="rd-part"/i);
    for (let i = 1; i < rawParts.length; i++) {
      const chunk = '<h1 class="rd-part"' + rawParts[i];
      const h1Match = chunk.match(/<h1[^>]*id="([^"]+)"[^>]*data-toc="([^"]+)"[^>]*>([\s\S]*?)<\/h1>/i);
      const partToc = h1Match ? h1Match[2].trim() : `Part ${i}`;

      let partShort = partToc;
      if (partToc.toLowerCase().includes('january–march') || partToc.toLowerCase().includes('jan-mar')) {
        partShort = 'Jan–Mar 2026';
      } else if (partToc.toLowerCase().includes('static')) {
        partShort = 'Static';
      } else if (partToc.toLowerCase().includes('april–june') || partToc.toLowerCase().includes('apr-jun')) {
        partShort = 'Apr–Jun 2026';
      } else if (partToc.toLowerCase().includes('april') || partToc.toLowerCase().includes('apr')) {
        partShort = 'Apr 2026';
      } else if (partToc.toLowerCase().includes('july–september') || partToc.toLowerCase().includes('jul-sep')) {
        partShort = 'Jul–Sep 2026';
      } else if (partToc.toLowerCase().includes('october–december') || partToc.toLowerCase().includes('oct-dec')) {
        partShort = 'Oct–Dec 2026';
      }

      const h2Regex = /<h2[^>]*id="([^"]+)"[^>]*data-toc="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/gi;
      let h2Match;
      let sOrder = 1;
      while ((h2Match = h2Regex.exec(chunk)) !== null) {
        const sId = h2Match[1];
        const sToc = h2Match[2].trim();
        const cleanTitle = sToc.replace(/^\d+\.\s*/, '');
        const directUrl = `${cleanBase}#${sId}`;

        units.push({
          order: units.length + 1,
          name: `[${partShort}] Section ${sOrder}: ${cleanTitle}`,
          part: partToc,
          anchorId: sId,
          notes: directUrl,
        });
        sOrder++;
      }
    }
  } else {
    // Single-level chapters without rd-part (Economics)
    const h2Regex = /<h2[^>]*class="[^"]*rd-chapter[^"]*"[^>]*id="([^"]+)"[^>]*data-toc="([^"]+)"[^>]*>/gi;
    let h2Match;
    let chNum = 1;
    while ((h2Match = h2Regex.exec(html)) !== null) {
      if (h2Match[0].includes('rd-rev')) continue; // Skip revision quiz duplicates
      const sId = h2Match[1];
      const sToc = h2Match[2].trim();
      const cleanTitle = sToc.replace(/^\d+\.\s*/, '');
      const directUrl = `${cleanBase}#${sId}`;

      units.push({
        order: chNum,
        name: `Chapter ${chNum}: ${cleanTitle}`,
        part: 'Foundations',
        anchorId: sId,
        notes: directUrl,
      });
      chNum++;
    }
  }

  return units;
}

/**
 * Fetch live book content from October Library (or fallback to pre-bundled data)
 */
export async function fetchOctoberBookUnits(slug: string, baseReaderUrl: string): Promise<ParsedOctoberUnit[]> {
  try {
    const primaryUrl = `https://vishalsinghshekhawat18-glitch.github.io/October/books/${slug}/content.html`;
    const res = await fetch(primaryUrl, { cache: 'no-cache' });
    if (res.ok) {
      const html = await res.text();
      const parsed = parseOctoberHtml(html, slug, baseReaderUrl);
      if (parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn(`Failed to live-fetch October book ${slug}, falling back to pre-bundled units:`, err);
  }

  // Pre-bundled fallback
  const cleanBase = baseReaderUrl.split('#')[0];
  if (slug === 'current-affairs') {
    return OCTOBER_CURRENT_AFFAIRS_SECTIONS.map((s, idx) => {
      const isStatic = s.part.includes('Static');
      const sNum = isStatic ? s.chapterNumber : s.chapterNumber - 10;
      const partTag = isStatic ? 'Static' : 'Jan–Mar 2026';
      const anchor = isStatic ? `static-s${sNum}` : `jan-mar-2026-s${sNum}`;
      return {
        order: idx + 1,
        name: `[${partTag}] Section ${sNum}: ${s.title}`,
        part: s.part,
        anchorId: anchor,
        notes: `${cleanBase}#${anchor}`,
      };
    });
  }

  return OCTOBER_ECONOMICS_CHAPTERS.map((ch) => ({
    order: ch.chapterNumber,
    name: `Chapter ${ch.chapterNumber}: ${ch.title}`,
    part: ch.part,
    anchorId: `ch${ch.chapterNumber}`,
    notes: `${cleanBase}#p1-chapter-${ch.chapterNumber}`,
  }));
}

/**
 * Checks if a subject link or name points to October Library and returns the book slug if matched
 */
export function detectOctoberBookSlug(urlOrText?: string, subjectName?: string): string | null {
  if (urlOrText) {
    const match = urlOrText.match(/[?&]book=([a-zA-Z0-9_-]+)/i);
    if (match) return match[1].toLowerCase();
    const low = urlOrText.toLowerCase();
    if (low.includes('current-affairs') || low.includes('current_affairs') || low.includes('currentaffairs')) {
      return 'current-affairs';
    }
    if (low.includes('economics')) return 'economics';
  }
  if (subjectName) {
    const s = subjectName.toLowerCase();
    if (s.includes('current affair') || s.includes('general awareness') || s.includes('ga') || s.includes('current')) {
      return 'current-affairs';
    }
    if (s.includes('econ')) return 'economics';
  }
  return null;
}

export interface OctoberSubjectMeta {
  isOctoberSubject: boolean;
  bookSlug: string | null;
  bookTitle: string;
  expectedUnitsCount: number;
  unitLabel: string; // 'Chapters' | 'Sections'
  hasMismatchedTopics: boolean;
}

/**
 * Determines October metadata, expected unit count (47 for Economics, 20+ for Current Affairs),
 * and checks if mismatched topics were mistakenly imported.
 */
export function getOctoberSubjectMeta(subject: Subject, allTopics: Topic[] = []): OctoberSubjectMeta {
  const slug = detectOctoberBookSlug(subject.description, subject.name);
  if (!slug) {
    return {
      isOctoberSubject: false,
      bookSlug: null,
      bookTitle: subject.name,
      expectedUnitsCount: 0,
      unitLabel: 'Chapters',
      hasMismatchedTopics: false,
    };
  }

  const subjectTopics = allTopics.filter((t) => t.subjectId === subject.id && !t.archived);

  if (slug === 'current-affairs') {
    const hasEconomicsMismatched = subjectTopics.some(
      (t) =>
        t.name.toLowerCase().includes('economic organisation') ||
        t.name.toLowerCase().includes('sectors and goods') ||
        t.id.includes('_oct_econ_')
    );

    return {
      isOctoberSubject: true,
      bookSlug: 'current-affairs',
      bookTitle: 'Current Affairs',
      expectedUnitsCount: 20, // 10 Static Bank + 10 Jan–Mar (plus any future months)
      unitLabel: 'Sections',
      hasMismatchedTopics: hasEconomicsMismatched,
    };
  }

  return {
    isOctoberSubject: true,
    bookSlug: 'economics',
    bookTitle: 'Economics',
    expectedUnitsCount: 47,
    unitLabel: 'Chapters',
    hasMismatchedTopics: false,
  };
}

/**
 * Unified importer and incremental synchronizer for October Library books:
 * - Current Affairs: Dynamically fetches all parts (Static Bank, January–March, and any newly added months/files)
 * - Economics: 47 Chapters across 6 parts
 * Preserves all completed progress on existing topics and adds only new sections!
 */
export async function importOctoberSubjectChapters(
  subject: Subject,
  options?: { baseReaderUrl?: string }
): Promise<{
  importedCount: number;
  totalCount: number;
  bookSlug: string;
  bookTitle: string;
  unitLabel: string;
  topics: Topic[];
}> {
  const slug = detectOctoberBookSlug(subject.description, subject.name) || 'economics';
  const existingTopics = await dbService.getAll<Topic>('topics');
  const subjectTopics = existingTopics.filter((t) => t.subjectId === subject.id);

  const baseReaderUrl =
    options?.baseReaderUrl ||
    subject.description ||
    `https://vishalsinghshekhawat18-glitch.github.io/October/reader.html?book=${slug}`;

  // 1. Fetch live or fallback parsed units (supports Static Bank, Jan-Mar, and any future parts)
  const units = await fetchOctoberBookUnits(slug, baseReaderUrl);
  const isSection = slug === 'current-affairs';
  const unitLabel = isSection ? 'Sections' : 'Chapters';
  const bookTitle = isSection ? 'Current Affairs' : 'Economics';

  // 2. Clean up any mismatched Economics chapters accidentally in Current Affairs
  if (slug === 'current-affairs') {
    const mismatchedEconomicsTopics = subjectTopics.filter(
      (t) =>
        t.name.toLowerCase().includes('economic organisation') ||
        t.name.toLowerCase().includes('sectors and goods') ||
        t.id.includes('_oct_econ_')
    );

    for (const mis of mismatchedEconomicsTopics) {
      await dbService.delete('topics', mis.id);
      for (const examId of subject.examIds) {
        await dbService.delete('topicProgress', `${examId}_${mis.id}`);
      }
    }
  }

  // Refreshed topics after any cleanups
  const refreshedTopics = await dbService.getAll<Topic>('topics');
  const currentSubjectTopics = refreshedTopics.filter((t) => t.subjectId === subject.id);

  const topicsToInsert: Topic[] = [];

  for (const item of units) {
    // Check if topic with matching name or anchor already exists
    const existing = currentSubjectTopics.find(
      (t) =>
        t.name.toLowerCase() === item.name.toLowerCase() ||
        (item.anchorId && t.notes && t.notes.includes(`#${item.anchorId}`))
    );

    if (existing) {
      // If the topic existed previously with an unbracketed name, update name to include part prefix
      if (existing.name !== item.name && item.name.startsWith('[')) {
        existing.name = item.name;
        await dbService.put<Topic>('topics', existing);
      }
    } else {
      topicsToInsert.push({
        id: `top_oct_${slug.replace(/[^a-z0-9]/g, '_')}_${item.order}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`,
        subjectId: subject.id,
        name: item.name,
        order: item.order,
        notes: item.notes,
        archived: false,
      });
    }
  }

  if (topicsToInsert.length > 0) {
    await dbService.putMany<Topic>('topics', topicsToInsert);
  }

  // Initialize TopicProgress for newly inserted units across linked exams
  const targetExamIds = subject.examIds && subject.examIds.length > 0 ? subject.examIds : [];
  for (const t of topicsToInsert) {
    for (const examId of targetExamIds) {
      const progId = `${examId}_${t.id}`;
      const existing = await dbService.get<TopicProgress>('topicProgress', progId);
      if (!existing) {
        await dbService.put<TopicProgress>('topicProgress', {
          id: progId,
          examId,
          topicId: t.id,
          learningStatus: 'not_started',
          practiceStatus: 'not_started',
          revisionStatus: 'not_started',
          manualCompletionPercentage: 0,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }

  const finalTopics = await dbService.getAll<Topic>('topics');
  const finalSubjectTopics = finalTopics
    .filter((t) => t.subjectId === subject.id && !t.archived)
    .sort((a, b) => a.order - b.order);

  return {
    importedCount: topicsToInsert.length,
    totalCount: finalSubjectTopics.length,
    bookSlug: slug,
    bookTitle,
    unitLabel,
    topics: finalSubjectTopics,
  };
}

/**
 * Import all 47 chapters for an Economics subject into the tracker database (backward compatible)
 */
export async function importOctoberEconomicsChapters(
  subjectId: string,
  baseReaderUrl: string = 'https://vishalsinghshekhawat18-glitch.github.io/October/reader.html?book=economics'
): Promise<Topic[]> {
  const sub = await dbService.get<Subject>('subjects', subjectId);
  const subjectObj: Subject = sub || {
    id: subjectId,
    name: 'Economics',
    description: baseReaderUrl,
    examIds: ['comm_ibps_rrb_po'],
    order: 1,
  };
  const result = await importOctoberSubjectChapters(subjectObj, { baseReaderUrl });
  return result.topics;
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
