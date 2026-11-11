/**
 * src/services/scorecardParser.ts
 * Smart Optical & Text Parser for Exam Mock Test Scorecards
 * Supports Smartkeeda, Testbook, Oliveboard, PracticeMock, and raw tabular text.
 */

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

export function parseScorecardText(rawText: string): ParsedScorecard | null {
  if (!rawText || !rawText.trim()) return null;

  const text = rawText.replace(/\r\n/g, '\n');

  // Platform detection
  let platform = 'Mock Platform';
  if (/smartkeeda/i.test(text)) platform = 'Smartkeeda';
  else if (/testbook/i.test(text)) platform = 'Testbook';
  else if (/oliveboard/i.test(text)) platform = 'Oliveboard';
  else if (/practicemock/i.test(text)) platform = 'PracticeMock';
  else if (/adda247/i.test(text)) platform = 'Adda247';

  // Exam detection
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

  // Extract explicit title if found
  const fullLengthMatch = text.match(/Full\s+Length\s+([^\n\r]+)/i);
  if (fullLengthMatch) {
    testName = `${platform} Full Length ${fullLengthMatch[1].trim()}`;
  }

  // Extract Scores (e.g. "Your Marks: 35.25/80" or "Score: 35.25/80")
  let totalScore = 0;
  let maxScore = 80;

  const yourMarksMatch = text.match(/Your\s*Marks[:\s]*([0-9.]+)\s*\/\s*([0-9.]+)/i) ||
                         text.match(/Score[:\s]*([0-9.]+)\s*\/\s*([0-9.]+)/i);
  if (yourMarksMatch) {
    totalScore = parseFloat(yourMarksMatch[1]);
    maxScore = parseFloat(yourMarksMatch[2]);
  } else {
    const singleScoreMatch = text.match(/Your\s*Marks[:\s]*([0-9.]+)/i) || text.match(/Score[:\s]*([0-9.]+)/i);
    if (singleScoreMatch) {
      totalScore = parseFloat(singleScoreMatch[1]);
    }
  }

  // Cutoff marks
  let cutoffMarks: number | undefined;
  const cutoffMatch = text.match(/Cut\s*Off(?:\s*Marks)?[:\s]*([0-9.]+)(?:\s*\/\s*([0-9.]+))?/i);
  if (cutoffMatch) {
    cutoffMarks = parseFloat(cutoffMatch[1]);
  }

  // Accuracy
  let accuracyPercent = 0;
  const accuracyMatch = text.match(/Accuracy[:\s]*([0-9.]+)%?/i);
  if (accuracyMatch) {
    accuracyPercent = parseFloat(accuracyMatch[1]);
  }

  // Percentile
  let percentile: number | undefined;
  const percentileMatch = text.match(/Percentile[:\s]*([0-9.]+)%?/i);
  if (percentileMatch) {
    percentile = parseFloat(percentileMatch[1]);
  }

  // Rank (e.g. "Your Rank #88397 Out of 153003" or "Rank: 88397/153003")
  let rank: number | undefined;
  let totalCandidates: number | undefined;
  const rankMatch = text.match(/Rank[:\s]*#?([0-9,]+)(?:\s*(?:\/|Out of)\s*([0-9,]+))?/i);
  if (rankMatch) {
    rank = parseInt(rankMatch[1].replace(/,/g, ''), 10);
    if (rankMatch[2]) {
      totalCandidates = parseInt(rankMatch[2].replace(/,/g, ''), 10);
    }
  }

  // Time taken (e.g. "Time taken: 00:45:00" or "45 Mins")
  let timeTakenMinutes = 45;
  const timeTakenMatch = text.match(/Time\s*taken[:\s]*(?:([0-9]+):)?([0-9]+):([0-9]+)/i);
  if (timeTakenMatch) {
    const hrs = timeTakenMatch[1] ? parseInt(timeTakenMatch[1], 10) : 0;
    const mins = parseInt(timeTakenMatch[2], 10);
    timeTakenMinutes = hrs * 60 + mins;
  } else {
    const minsMatch = text.match(/([0-9]+)\s*Mins/i);
    if (minsMatch) {
      timeTakenMinutes = parseInt(minsMatch[1], 10);
    }
  }

  // Extract Question Breakdown (Correct, Incorrect, Unattempted)
  let correctCount = 0;
  let incorrectCount = 0;
  let skippedCount = 0;
  let attemptedCount = 0;

  // Check Overall Table Row
  // Example: Overall 80 37 7 36 45 Mins 52 35.25/80 (44.00%) 41.91
  const overallRowMatch = text.match(/Overall\s+([0-9]+)\s+([0-9]+)\s+([0-9]+)\s+([0-9]+)/i);
  if (overallRowMatch) {
    maxScore = parseInt(overallRowMatch[1], 10);
    correctCount = parseInt(overallRowMatch[2], 10);
    incorrectCount = parseInt(overallRowMatch[3], 10);
    skippedCount = parseInt(overallRowMatch[4], 10);
    attemptedCount = correctCount + incorrectCount;
  } else {
    const correctMatch = text.match(/Correct[:\s]*([0-9]+)/i);
    if (correctMatch) correctCount = parseInt(correctMatch[1], 10);

    const incorrectMatch = text.match(/Incorrect[:\s]*([0-9]+)/i);
    if (incorrectMatch) incorrectCount = parseInt(incorrectMatch[1], 10);

    const unattemptedMatch = text.match(/Unattempted[:\s]*([0-9]+)/i) || text.match(/Skipped[:\s]*([0-9]+)/i);
    if (unattemptedMatch) skippedCount = parseInt(unattemptedMatch[1], 10);

    attemptedCount = correctCount + incorrectCount;
    if (skippedCount === 0 && maxScore > attemptedCount) {
      skippedCount = maxScore - attemptedCount;
    }
  }

  if (accuracyPercent === 0 && attemptedCount > 0) {
    accuracyPercent = Number(((correctCount / attemptedCount) * 100).toFixed(2));
  }

  // Section Breakdown parsing
  const subjectScores: ParsedSubjectScore[] = [];

  // Parse Reasoning Aptitude row
  // e.g.: Reasoning Aptitude 40 29 4 7 25 Mins 9.25 28/40
  const reasoningMatch = text.match(/Reasoning(?:\s+Aptitude)?\s+([0-9]+)\s+([0-9]+)\s+([0-9]+)\s+([0-9]+)\s*(?:([0-9]+)\s*Mins)?\s*([0-9.]+)?\s*([0-9.]+)\/([0-9.]+)/i);
  if (reasoningMatch) {
    const rCorrect = parseInt(reasoningMatch[2], 10);
    const rIncorrect = parseInt(reasoningMatch[3], 10);
    const rAttempted = rCorrect + rIncorrect;
    subjectScores.push({
      subjectName: 'Reasoning Aptitude',
      correctCount: rCorrect,
      incorrectCount: rIncorrect,
      skippedCount: parseInt(reasoningMatch[4], 10),
      timeMinutes: reasoningMatch[5] ? parseInt(reasoningMatch[5], 10) : undefined,
      cutoff: reasoningMatch[6] ? parseFloat(reasoningMatch[6]) : undefined,
      score: parseFloat(reasoningMatch[7]),
      maxScore: parseFloat(reasoningMatch[8]),
      accuracyPercent: rAttempted > 0 ? Number(((rCorrect / rAttempted) * 100).toFixed(2)) : 0,
    });
  }

  // Parse Quantitative Aptitude row
  // e.g.: Quantitative Aptitude 40 8 3 29 20 Mins 8 7.25/40
  const quantMatch = text.match(/Quant(?:itative)?(?:\s+Aptitude)?\s+([0-9]+)\s+([0-9]+)\s+([0-9]+)\s+([0-9]+)\s*(?:([0-9]+)\s*Mins)?\s*([0-9.]+)?\s*([0-9.]+)\/([0-9.]+)/i);
  if (quantMatch) {
    const qCorrect = parseInt(quantMatch[2], 10);
    const qIncorrect = parseInt(quantMatch[3], 10);
    const qAttempted = qCorrect + qIncorrect;
    subjectScores.push({
      subjectName: 'Quantitative Aptitude',
      correctCount: qCorrect,
      incorrectCount: qIncorrect,
      skippedCount: parseInt(quantMatch[4], 10),
      timeMinutes: quantMatch[5] ? parseInt(quantMatch[5], 10) : undefined,
      cutoff: quantMatch[6] ? parseFloat(quantMatch[6]) : undefined,
      score: parseFloat(quantMatch[7]),
      maxScore: parseFloat(quantMatch[8]),
      accuracyPercent: qAttempted > 0 ? Number(((qCorrect / qAttempted) * 100).toFixed(2)) : 0,
    });
  }

  // Construct comprehensive diagnostic notes
  const notesParts: string[] = [];
  if (rank && totalCandidates) {
    notesParts.push(`Rank: #${rank.toLocaleString()}/${totalCandidates.toLocaleString()}`);
  }
  if (percentile) {
    notesParts.push(`Percentile: ${percentile}%`);
  }
  if (cutoffMarks !== undefined) {
    const diff = Number((totalScore - cutoffMarks).toFixed(2));
    notesParts.push(`Cutoff: ${cutoffMarks}/${maxScore} (${diff >= 0 ? `+${diff}` : `${diff}`})`);
  }
  if (subjectScores.length > 0) {
    const subSummaries = subjectScores.map((s) => `${s.subjectName.split(' ')[0]}: ${s.score}/${s.maxScore} (${s.accuracyPercent}% acc${s.cutoff !== undefined ? `, Cutoff: ${s.cutoff}` : ''})`);
    notesParts.push(subSummaries.join(' • '));
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
