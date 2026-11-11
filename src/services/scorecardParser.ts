/**
 * src/services/scorecardParser.ts
 * Smart Optical & Text Parser for Exam Mock Test Scorecards
 * Supports Oliveboard, Smartkeeda, Testbook, PracticeMock, and raw tabular text.
 */

import Tesseract from 'tesseract.js';

export interface ParsedSubjectScore {
  subjectName: string;
  score: number;
  maxScore: number;
  accuracyPercent?: number;
  correctCount?: number;
  incorrectCount?: number;
  skippedCount?: number;
  timeMinutes?: number;
  percentile?: number;
  cutoff?: number;
}

export interface ParsedScorecard {
  platform?: string;
  testName?: string;
  examId?: string;
  testDate?: string;
  totalScore: number;
  maxScore: number;
  attemptedCount: number;
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
  accuracyPercent: number;
  timeTakenMinutes: number;
  percentile?: number;
  rank?: number;
  totalCandidates?: number;
  cutoffMarks?: number;
  subjectScores?: ParsedSubjectScore[];
  notes?: string;
}

/**
 * Runs true client-side optical character recognition (OCR) on an image file or blob
 */
export async function recognizeScorecardImage(
  imageSource: File | Blob | string,
  onProgress?: (percent: number, status: string) => void
): Promise<{ parsed: ParsedScorecard | null; rawText: string }> {
  try {
    onProgress?.(10, 'Initializing OCR worker...');
    const {
      data: { text },
    } = await Tesseract.recognize(imageSource, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          const pct = Math.min(95, Math.round(15 + m.progress * 80));
          onProgress?.(pct, `Scanning image with OCR (${Math.round(m.progress * 100)}%)...`);
        }
      },
    });

    onProgress?.(100, 'Scorecard text extracted successfully.');
    const parsed = parseScorecardText(text);
    return { parsed, rawText: text };
  } catch (err) {
    console.error('OCR recognition error:', err);
    return { parsed: null, rawText: '' };
  }
}

/**
 * Parses raw text extracted via OCR or copied directly from portal result pages
 */
export function parseScorecardText(rawText: string): ParsedScorecard | null {
  if (!rawText || !rawText.trim()) return null;

  const text = rawText.replace(/\r\n/g, '\n');

  // 1. Platform detection
  let platform = 'Mock Platform';
  if (/olive\s*board/i.test(text)) platform = 'Oliveboard';
  else if (/smartkeeda/i.test(text)) platform = 'Smartkeeda';
  else if (/testbook/i.test(text)) platform = 'Testbook';
  else if (/practicemock|practice\s*mock/i.test(text)) platform = 'PracticeMock';
  else if (/adda247/i.test(text)) platform = 'Adda247';
  else if (/guidely/i.test(text)) platform = 'Guidely';

  // 2. Exam detection
  let examId = 'comm_ibps_rrb_po';
  let testName = `${platform} Mock Test`;

  if (/rrb\s*po|officer\s*scale\s*i/i.test(text)) {
    examId = 'comm_ibps_rrb_po';
    testName = `${platform} RRB PO Prelims Mock`;
  } else if (/rrb\s*clerk|office\s*assistant/i.test(text)) {
    examId = 'comm_ibps_rrb_clerk';
    testName = `${platform} RRB Clerk Prelims Mock`;
  } else if (/ibps\s*po/i.test(text)) {
    examId = 'comm_ibps_po';
    testName = `${platform} IBPS PO Mock`;
  } else if (/nicl\s*ao/i.test(text)) {
    examId = 'comm_nicl_ao';
    testName = `${platform} NICL AO Mock`;
  } else if (/uiic\s*ao/i.test(text)) {
    examId = 'comm_uiic_ao';
    testName = `${platform} UIIC AO Mock`;
  } else if (/rvunl|rvpnl|electrical/i.test(text)) {
    examId = 'comm_rvunl_je';
    testName = `${platform} RVUNL JE Electrical Mock`;
  }

  // Look for specific test title strings (e.g. "Mock Test - 02", "Full Length RRB PO Pre #1")
  const titleMatch =
    text.match(/(?:Full\s+Length\s+[^\n\r]+|Mock\s+Test\s*[-#]?\s*[0-9]+|Live\s+Mock\s*[-#]?\s*[0-9]+)/i);
  if (titleMatch) {
    testName = `${platform} ${titleMatch[0].trim()}`;
  }

  // 3. Score & Maximum Score
  let totalScore = 0;
  let maxScore = 80; // default for RRB PO Pre

  const scoreMatch =
    text.match(/(?:Your\s*Score|Total\s*Score|Score|Marks\s*Scored|Your\s*Marks)[:\s]*([0-9.]+)\s*(?:\/|of)\s*([0-9.]+)/i) ||
    text.match(/([0-9.]+)\s*\/\s*(80|100|200)/);

  if (scoreMatch) {
    totalScore = parseFloat(scoreMatch[1]);
    maxScore = parseFloat(scoreMatch[2]);
  } else {
    const singleScoreMatch = text.match(/(?:Your\s*Score|Score|Your\s*Marks)[:\s]*([0-9.]+)/i);
    if (singleScoreMatch) {
      totalScore = parseFloat(singleScoreMatch[1]);
    }
  }

  // 4. Cutoff Marks
  let cutoffMarks: number | undefined;
  const cutoffMatch = text.match(/Cut\s*[-]?\s*off(?:\s*Marks)?[:\s]*([0-9.]+)(?:\s*(?:\/|of)\s*([0-9.]+))?/i);
  if (cutoffMatch) {
    cutoffMarks = parseFloat(cutoffMatch[1]);
  }

  // 5. Accuracy Percent
  let accuracyPercent = 0;
  const accuracyMatch = text.match(/Accuracy[:\s]*([0-9.]+)%?/i);
  if (accuracyMatch) {
    accuracyPercent = parseFloat(accuracyMatch[1]);
  }

  // 6. Percentile
  let percentile: number | undefined;
  const percentileMatch =
    text.match(/Percentile[:\s]*([0-9.]+)%?/i) ||
    text.match(/([0-9.]+)%ile/i);
  if (percentileMatch) {
    percentile = parseFloat(percentileMatch[1]);
  }

  // 7. Rank & Total Test Takers
  let rank: number | undefined;
  let totalCandidates: number | undefined;
  const rankMatch =
    text.match(/(?:All\s*India\s*Rank|Your\s*Rank|Rank)[:\s]*#?([0-9,]+)(?:\s*(?:\/|of|Out of)\s*([0-9,]+))?/i);
  if (rankMatch) {
    rank = parseInt(rankMatch[1].replace(/,/g, ''), 10);
    if (rankMatch[2]) {
      totalCandidates = parseInt(rankMatch[2].replace(/,/g, ''), 10);
    }
  }

  // 8. Time Taken (in minutes)
  let timeTakenMinutes = 45;
  const minsSecMatch = text.match(/Time(?:\s*taken)?[:\s]*([0-9]+)\s*Mins?(?:\s*([0-9]+)\s*Sec)?/i);
  if (minsSecMatch) {
    timeTakenMinutes = parseInt(minsSecMatch[1], 10);
  } else {
    const clockMatch = text.match(/Time(?:\s*taken)?[:\s]*(?:([0-9]+):)?([0-9]+):([0-9]+)/i);
    if (clockMatch) {
      const hrs = clockMatch[1] ? parseInt(clockMatch[1], 10) : 0;
      const mins = parseInt(clockMatch[2], 10);
      timeTakenMinutes = hrs * 60 + mins;
    }
  }

  // 9. Question Breakdown (Attempted, Correct, Incorrect, Skipped)
  let correctCount = 0;
  let incorrectCount = 0;
  let skippedCount = 0;
  let attemptedCount = 0;

  // Oliveboard or generic explicit counts
  const correctMatch = text.match(/(?:Correct|Right)[:\s]*([0-9]+)/i);
  if (correctMatch) correctCount = parseInt(correctMatch[1], 10);

  const incorrectMatch = text.match(/(?:Incorrect|Wrong)[:\s]*([0-9]+)/i);
  if (incorrectMatch) incorrectCount = parseInt(incorrectMatch[1], 10);

  const skippedMatch = text.match(/(?:Unattempted|Skipped|Left)[:\s]*([0-9]+)/i);
  if (skippedMatch) skippedCount = parseInt(skippedMatch[1], 10);

  const attemptedMatch = text.match(/(?:Attempted|Attempts)[:\s]*([0-9]+)/i);
  if (attemptedMatch) attemptedCount = parseInt(attemptedMatch[1], 10);

  // Overall table row (Smartkeeda / Testbook format)
  const overallRowMatch = text.match(/Overall\s+([0-9]+)\s+([0-9]+)\s+([0-9]+)\s+([0-9]+)/i);
  if (overallRowMatch) {
    maxScore = parseInt(overallRowMatch[1], 10);
    correctCount = parseInt(overallRowMatch[2], 10);
    incorrectCount = parseInt(overallRowMatch[3], 10);
    skippedCount = parseInt(overallRowMatch[4], 10);
    attemptedCount = correctCount + incorrectCount;
  }

  if (attemptedCount === 0 && (correctCount > 0 || incorrectCount > 0)) {
    attemptedCount = correctCount + incorrectCount;
  }
  if (skippedCount === 0 && maxScore > attemptedCount) {
    skippedCount = Math.max(0, maxScore - attemptedCount);
  }

  if (accuracyPercent === 0 && attemptedCount > 0) {
    accuracyPercent = Number(((correctCount / attemptedCount) * 100).toFixed(2));
  }

  // 10. Section Scores
  const subjectScores: ParsedSubjectScore[] = [];

  // Reasoning section
  const reasoningMatch =
    text.match(/Reasoning(?:\s+Ability|\s+Aptitude)?[:\s]*([0-9.]+)\s*(?:\/|of)\s*([0-9.]+)/i) ||
    text.match(/Reasoning(?:\s+Aptitude)?\s+([0-9]+)\s+([0-9]+)\s+([0-9]+)\s+([0-9]+)\s*(?:([0-9]+)\s*Mins)?\s*([0-9.]+)?\s*([0-9.]+)\/([0-9.]+)/i);

  if (reasoningMatch) {
    if (reasoningMatch[7] && reasoningMatch[8]) {
      subjectScores.push({
        subjectName: 'Reasoning Aptitude',
        score: parseFloat(reasoningMatch[7]),
        maxScore: parseFloat(reasoningMatch[8]),
        correctCount: parseInt(reasoningMatch[2], 10),
        incorrectCount: parseInt(reasoningMatch[3], 10),
        skippedCount: parseInt(reasoningMatch[4], 10),
        timeMinutes: reasoningMatch[5] ? parseInt(reasoningMatch[5], 10) : undefined,
        cutoff: reasoningMatch[6] ? parseFloat(reasoningMatch[6]) : undefined,
      });
    } else if (reasoningMatch[1] && reasoningMatch[2]) {
      subjectScores.push({
        subjectName: 'Reasoning Ability',
        score: parseFloat(reasoningMatch[1]),
        maxScore: parseFloat(reasoningMatch[2]),
      });
    }
  }

  // Quantitative section
  const quantMatch =
    text.match(/Quant(?:itative)?(?:\s+Ability|\s+Aptitude)?[:\s]*([0-9.]+)\s*(?:\/|of)\s*([0-9.]+)/i) ||
    text.match(/Quant(?:itative)?(?:\s+Aptitude)?\s+([0-9]+)\s+([0-9]+)\s+([0-9]+)\s+([0-9]+)\s*(?:([0-9]+)\s*Mins)?\s*([0-9.]+)?\s*([0-9.]+)\/([0-9.]+)/i);

  if (quantMatch) {
    if (quantMatch[7] && quantMatch[8]) {
      subjectScores.push({
        subjectName: 'Quantitative Aptitude',
        score: parseFloat(quantMatch[7]),
        maxScore: parseFloat(quantMatch[8]),
        correctCount: parseInt(quantMatch[2], 10),
        incorrectCount: parseInt(quantMatch[3], 10),
        skippedCount: parseInt(quantMatch[4], 10),
        timeMinutes: quantMatch[5] ? parseInt(quantMatch[5], 10) : undefined,
        cutoff: quantMatch[6] ? parseFloat(quantMatch[6]) : undefined,
      });
    } else if (quantMatch[1] && quantMatch[2]) {
      subjectScores.push({
        subjectName: 'Quantitative Aptitude',
        score: parseFloat(quantMatch[1]),
        maxScore: parseFloat(quantMatch[2]),
      });
    }
  }

  // Diagnostic summary note
  const notesParts: string[] = [];
  if (rank && totalCandidates) {
    notesParts.push(`Rank: #${rank.toLocaleString()}/${totalCandidates.toLocaleString()}`);
  } else if (rank) {
    notesParts.push(`Rank: #${rank.toLocaleString()}`);
  }
  if (percentile) {
    notesParts.push(`Percentile: ${percentile}%`);
  }
  if (cutoffMarks !== undefined) {
    const diff = Number((totalScore - cutoffMarks).toFixed(2));
    notesParts.push(`Cutoff: ${cutoffMarks}/${maxScore} (${diff >= 0 ? `+${diff}` : `${diff}`})`);
  }
  if (subjectScores.length > 0) {
    notesParts.push(
      subjectScores.map((s) => `${s.subjectName.split(' ')[0]}: ${s.score}/${s.maxScore}`).join(' • ')
    );
  }

  return {
    platform,
    testName,
    examId,
    testDate: new Date().toISOString().split('T')[0],
    totalScore,
    maxScore,
    attemptedCount,
    correctCount,
    incorrectCount,
    skippedCount,
    accuracyPercent,
    timeTakenMinutes,
    percentile,
    rank,
    totalCandidates,
    cutoffMarks,
    subjectScores,
    notes: notesParts.join(' • '),
  };
}
