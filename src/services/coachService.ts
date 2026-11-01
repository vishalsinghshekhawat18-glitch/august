import { CoachDispatch, CoachDispatchType, CoachRating, CoachActionItem, MockTest, WeeklyTask } from '../types';
import { dbService } from './db';
import { getTodayDateString, formatMinutes } from './dateUtils';
import defaultDispatches from '../data/coach_dispatches.json';

class CoachService {
  /**
   * Generates a live, immediate diagnostic debrief whenever a candidate logs a mock test score.
   */
  public generateMockReview(
    mock: MockTest,
    recentMocks: MockTest[] = [],
    examName: string = 'IBPS RRB PO (Officer Scale I)'
  ): CoachDispatch {
    const rawScore = Number(mock.totalScore);
    const maxScore = Number(mock.maxScore || 80);
    const accuracy = Number(mock.accuracyPercent || (mock.attemptedCount > 0 ? (mock.correctCount / mock.attemptedCount) * 100 : 0));
    const incorrect = Number(mock.incorrectCount || 0);
    const attempted = Number(mock.attemptedCount || 0);
    const skipped = Number(mock.skippedCount || Math.max(0, maxScore - attempted));
    const timeTaken = Number(mock.timeTakenMinutes || 45);

    // Negative penalty in IBPS exams is 0.25 per incorrect answer
    const negativePenalty = Number((incorrect * 0.25).toFixed(2));
    const potentialScore = Number((rawScore + negativePenalty).toFixed(2));
    const secPerAttempt = attempted > 0 ? Math.round((timeTaken * 60) / attempted) : 0;
    const pct = Math.round((rawScore / maxScore) * 100);

    // Benchmarking against IBPS RRB PO Prelims typical UR Cutoff ~54 - 58
    const cutoffStandard = 55.0;
    const diff = Number((rawScore - cutoffStandard).toFixed(2));

    let rating: CoachRating = 'on_track';
    let archetypeTitle = '';
    let commentaryBody = '';
    let predictedPercentile = '88th - 92nd percentile';

    if (rawScore >= 60) {
      rating = 'exceptional';
      predictedPercentile = '97th - 99th percentile (Clear Safe Zone)';
      archetypeTitle = 'Dominant Qualifier (Velocity + Precision)';
      commentaryBody = `Exceptional drill performance. At ${rawScore}/${maxScore} (${pct}%), you are operating safely inside the top percentile bracket for ${examName}. Your accuracy of ${accuracy}% demonstrates commanding question filtering. At ${secPerAttempt}s per attempt, your cognitive velocity is sharp.\n\nKey Strategic Directive: Shift your emphasis toward consistency and composure. Ensure your speed in Reasoning puzzles does not drop on calculation-heavy arithmetic shifts.`;
    } else if (accuracy >= 91 && attempted < 64) {
      rating = 'on_track';
      predictedPercentile = '89th - 93rd percentile (Borderline Safe)';
      archetypeTitle = 'Precision Conservative (High Accuracy, Hesitant Pacing)';
      commentaryBody = `High technical discipline observed. Your accuracy of ${accuracy}% is elite—you rarely miss what you attempt. However, leaving ${skipped} questions untouched indicates excessive caution or lingering on multi-step arithmetic.\n\nIf you convert just 5 of those skipped questions into attempts with your customary ${accuracy}% accuracy, your score climbs from ${rawScore} to ~${(rawScore + 4.5).toFixed(1)}, placing you safely in the top decile.`;
    } else if (incorrect >= 8) {
      rating = 'needs_attention';
      predictedPercentile = '80th - 85th percentile (At Risk of Negative Leakage)';
      archetypeTitle = 'Negative Penalty Bleed (Unforced Guesses)';
      commentaryBody = `Crucial diagnostic warning: You sacrificed ${negativePenalty} marks directly to ${incorrect} incorrect attempts. Had you maintained strict guessing discipline and left those questions blank, your score would be ${potentialScore} instead of ${rawScore}.\n\nIn high-stakes banking exams, an incorrect answer is not just -0.25; it is an opportunity loss of 1.25 marks plus the 45 seconds wasted reading it. Enforce a zero-speculation mandate on the next drill.`;
    } else if (rawScore >= 52) {
      rating = 'on_track';
      predictedPercentile = '87th - 91st percentile (Competitive Threshold Zone)';
      archetypeTitle = 'Threshold Striker (On the Cusp of Safe Zone)';
      commentaryBody = `Solid foundation established. At ${rawScore}/${maxScore}, you are hovering right at the competitive cutoff boundary (${diff >= 0 ? `+${diff}` : `${diff}`} vs benchmark 55.0). Your accuracy of ${accuracy}% is viable, with ${secPerAttempt}s spent per attempt.\n\nThe difference between a candidate who barely misses the prelims cutoff and one who clears with a 5-mark cushion is 3 fast arithmetic sets (Approximation, Series, Quadratic) executed in under 3.5 minutes.`;
    } else {
      rating = 'needs_attention';
      predictedPercentile = '70th - 78th percentile (Escalation Required)';
      archetypeTitle = 'Speed & Sectional Imbalance';
      commentaryBody = `Score of ${rawScore}/${maxScore} flags that either time expired before reaching scoring areas in Quantitative Aptitude, or puzzle traps consumed disproportionate mental runway.\n\nDo not get discouraged—early mocks exist to expose inefficiencies safely. We need to restructure your 45-minute allocation: strictly 20 minutes for Reasoning and 25 minutes for Quant.`;
    }

    // Historical comparison if previous mocks exist
    if (recentMocks.length > 0) {
      const prev = recentMocks[0];
      const delta = Number((rawScore - prev.totalScore).toFixed(2));
      commentaryBody += `\n\nTrend Observation: Score is ${delta >= 0 ? `+${delta}` : `${delta}`} points compared to your previous drill (${prev.totalScore}/${prev.maxScore}).`;
    }

    if (negativePenalty > 0) {
      commentaryBody += `\n\nNegative Penalty Audit: You sacrificed -${negativePenalty} marks directly to ${incorrect} incorrect questions. Eliminating unforced slips immediately lifts your score from ${rawScore} to ${potentialScore}.`;
    }

    const actionItems: CoachActionItem[] = [
      {
        id: `act_${Date.now()}_1`,
        title: `Audit the ${incorrect} incorrect questions: classify each as 'Calculation Slip' or 'Concept Gap'`,
        priority: 'high',
        type: 'analysis',
        completed: false,
      },
      {
        id: `act_${Date.now()}_2`,
        title: `Enforce a strict 20m/25m sectional time cap: never allow Reasoning to steal Quant time`,
        priority: 'high',
        type: 'drill',
        completed: false,
      },
      {
        id: `act_${Date.now()}_3`,
        title: `Zero-speculation rule: if not 90% certain of an option within 45s, skip and protect negative marks`,
        priority: 'medium',
        type: 'mindset',
        completed: false,
      },
    ];

    const socraticQuestions = [
      `If you could reclaim the cognitive energy lost on the ${incorrect} incorrect questions, how many clean marks could you have extracted from the ${skipped} skipped questions?`,
      `Which specific question type in this drill consumed more than 90 seconds without yielding a confirmed correct answer?`,
      `Were your errors caused by conceptual doubt, or did rushed calculations under the clock cause the slips?`,
    ];

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const todayStr = getTodayDateString();

    return {
      id: `dispatch_mock_${mock.id}_${Date.now()}`,
      timestamp: now.toISOString(),
      date: todayStr,
      timeStr,
      type: 'mock_review',
      title: `🎯 Live Mock Debrief: ${mock.testName} (${rawScore}/${maxScore})`,
      summary: `${archetypeTitle} • Accuracy: ${accuracy}% • Penalty: -${negativePenalty} marks • ${predictedPercentile}`,
      rating,
      metrics: {
        score: rawScore,
        maxScore,
        accuracyPercent: accuracy,
        negativePenalty,
        predictedPercentile,
        questionsAttempted: attempted,
        timePerQuestionSeconds: secPerAttempt,
      },
      commentary: commentaryBody,
      actionItems,
      socraticQuestion: socraticQuestions[Math.floor(Math.random() * socraticQuestions.length)],
      author: 'Live Coach Engine',
    };
  }

  /**
   * Generates a contextual periodic briefing (Morning Kickoff, Midday Momentum, or Evening Debrief)
   * tailored to the candidate's actual daily progress, streak, revisions, and tasks.
   */
  public generateProgressReview(options: {
    todayFocusedMinutes: number;
    streak: number;
    weeklyActualMinutes: number;
    weeklyTargetHours: number;
    dueRevisionsCount: number;
    recentMocks: MockTest[];
    currentPlanTasks: WeeklyTask[];
    forcedHour?: number;
  }): CoachDispatch {
    const now = new Date();
    const hour = options.forcedHour !== undefined ? options.forcedHour : now.getHours();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const todayStr = getTodayDateString();
    const { todayFocusedMinutes, streak, weeklyActualMinutes, weeklyTargetHours, dueRevisionsCount, recentMocks, currentPlanTasks } = options;

    let type: CoachDispatchType = 'midday_check';
    let title = '';
    let summary = '';
    let commentary = '';
    let rating: CoachRating = 'on_track';
    const actionItems: CoachActionItem[] = [];

    const focusHours = (todayFocusedMinutes / 60).toFixed(1);
    const weeklyHours = (weeklyActualMinutes / 60).toFixed(1);

    if (hour >= 5 && hour < 12) {
      // Morning Kickoff (05:00 - 11:59)
      type = 'morning_kickoff';
      title = `🌅 Morning Strategic Kickoff • ${timeStr}`;
      summary = `Active Streak: Day ${streak} • Target: 3.5h - 4h focused study today • ${dueRevisionsCount} revisions pending`;
      rating = dueRevisionsCount > 2 ? 'needs_attention' : 'on_track';

      commentary = `Good morning. Today is about disciplined momentum. You enter today with an active daily streak of ${streak} day${streak !== 1 ? 's' : ''}.\n\nYour highest leverage move early in the day is clearing spaced repetition intervals before opening new chapters. Memory consolidation happens when retrieval is slightly difficult; do not procrastinate on pending reviews.\n\nPrimary Directive: Secure your first 90-minute deep work block before noon. Treat mock test drills not as evaluations of your intelligence, but as data points calibrating your decision speed.`;

      actionItems.push(
        {
          id: `act_morning_1`,
          title: dueRevisionsCount > 0 ? `Complete ${dueRevisionsCount} pending spaced revision card(s) first` : 'Complete scheduled morning high-leverage study block',
          priority: 'high',
          type: 'revision',
          completed: false,
        },
        {
          id: `act_morning_2`,
          title: 'Protect 45 minutes for a full or sectional mock drill with immediate error audit',
          priority: 'high',
          type: 'drill',
          completed: false,
        }
      );
    } else if (hour >= 12 && hour < 18) {
      // Midday Momentum (12:00 - 17:59)
      type = 'midday_check';
      title = `⚡ Midday Momentum Check • ${timeStr}`;
      summary = `Focused study so far: ${focusHours}h logged today • Pace check toward weekly goal (${weeklyHours}h / ${weeklyTargetHours}h)`;
      rating = todayFocusedMinutes >= 90 ? 'on_track' : todayFocusedMinutes > 0 ? 'needs_attention' : 'critical';

      commentary = `Midday status audit. You have accumulated ${formatMinutes(todayFocusedMinutes)} of focused work today.\n\n${
        todayFocusedMinutes >= 120
          ? `Outstanding discipline! You have already crossed the 2-hour threshold. Take a brief cognitive reset (walk, hydrate) before diving into your next block.`
          : todayFocusedMinutes > 0
          ? `You have laid the groundwork with ${formatMinutes(todayFocusedMinutes)}, but afternoon lethargy is the enemy of competitive attainment. Structure your next 60-minute session with a definite, single topic outcome.`
          : `Zero study minutes recorded so far today. The afternoon is critical—do not let this day slide into zero-attainment. Start right now with a single 25-minute Pomodoro on your #1 priority topic.`
      }\n\nWeekly attainment stands at ${weeklyHours}h against your target of ${weeklyTargetHours}h. Keep the tempo high.`;

      actionItems.push({
        id: `act_midday_1`,
        title: todayFocusedMinutes < 90 ? 'Launch a 45-minute focused study block immediately to secure daily momentum' : 'Review today’s mock diagnostics and drill weak topic sets',
        priority: 'high',
        type: 'drill',
        completed: false,
      });
    } else {
      // Evening Debrief (18:00 - 23:59)
      type = 'evening_debrief';
      title = `🌙 Evening Attainment Debrief • ${timeStr}`;
      summary = `Final Daily Tally: ${focusHours}h focused time • Weekly total: ${weeklyHours}h • Streak intact (${streak} days)`;
      rating = todayFocusedMinutes >= 180 ? 'exceptional' : todayFocusedMinutes >= 90 ? 'on_track' : 'needs_attention';

      commentary = `Evening operational audit. Today concluded with ${formatMinutes(todayFocusedMinutes)} of focused study logged.\n\n${
        todayFocusedMinutes >= 180
          ? `Exemplary performance. Logging over 3 hours of focused effort builds compounding competitive advantage. Your brain synthesizes today's learnings during deep sleep; protect your rest tonight.`
          : todayFocusedMinutes >= 90
          ? `Steady, solid execution today. You honored your study streak and moved the needle forward. Identify tomorrow morning's kickoff topic before shutting down your workstation.`
          : `Today was a lower-volume day (${formatMinutes(todayFocusedMinutes)}). Do not engage in self-blame; simply recognize where time slipped away and set an uncompromising commitment for tomorrow morning.`
      }\n\nKeep your long-term vision clear: IBPS RRB PO Officer Scale I (target 20 Nov 2026) is won day by disciplined day.`;

      actionItems.push({
        id: `act_evening_1`,
        title: 'Review tomorrow’s first priority task so you start with zero decision fatigue',
        priority: 'medium',
        type: 'mindset',
        completed: false,
      });
    }

    const socraticQuestions = [
      `What was the single highest-value action you completed today that directly improves your exam score?`,
      `Where did friction or hesitation slow you down, and how can you simplify that step tomorrow?`,
      `Are you protecting your accuracy discipline, or letting fatigue dictate hurried decisions?`,
    ];

    return {
      id: `dispatch_auto_${type}_${todayStr}_${Date.now()}`,
      timestamp: now.toISOString(),
      date: todayStr,
      timeStr,
      type,
      title,
      summary,
      rating,
      metrics: {
        focusHoursToday: Number(focusHours),
        streakDays: streak,
        accuracyPercent: recentMocks[0]?.accuracyPercent,
        score: recentMocks[0]?.totalScore,
      },
      commentary,
      actionItems,
      socraticQuestion: socraticQuestions[Math.floor(Math.random() * socraticQuestions.length)],
      author: 'Live Coach Engine',
    };
  }

  /**
   * Fetches all coach dispatches, merging static briefings from repository JSON with local IndexedDB dispatches.
   */
  public async getAllDispatches(): Promise<CoachDispatch[]> {
    try {
      // 1. Load local dispatches from IndexedDB
      let localDispatches: CoachDispatch[] = [];
      try {
        localDispatches = await dbService.getAll<CoachDispatch>('coachDispatches');
      } catch (err) {
        console.warn('Could not read local coachDispatches store:', err);
      }

      // 2. Load bundled / remote briefings
      let remoteDispatches: CoachDispatch[] = (defaultDispatches as CoachDispatch[]) || [];
      try {
        if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
          const res = await fetch('./coach_dispatches.json', { cache: 'no-cache' });
          if (res.ok) {
            const json = await res.json();
            if (Array.isArray(json)) {
              remoteDispatches = json;
            }
          }
        }
      } catch (e) {
        // Fall back gracefully to bundled defaultDispatches
      }

      // 3. Deduplicate by id and sort descending by timestamp
      const dispatchMap = new Map<string, CoachDispatch>();
      for (const d of remoteDispatches) {
        if (d && d.id) dispatchMap.set(d.id, d);
      }
      for (const d of localDispatches) {
        if (d && d.id) dispatchMap.set(d.id, d);
      }

      const all = Array.from(dispatchMap.values());
      return all.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    } catch (err) {
      console.error('Failed to load coach dispatches:', err);
      return (defaultDispatches as CoachDispatch[]) || [];
    }
  }

  /**
   * Saves a dispatch into the local database
   */
  public async saveDispatch(dispatch: CoachDispatch): Promise<void> {
    try {
      await dbService.put<CoachDispatch>('coachDispatches', dispatch);
    } catch (err) {
      console.error('Failed to save coach dispatch:', err);
    }
  }

  /**
   * Deletes a dispatch from the local database
   */
  public async deleteDispatch(id: string): Promise<void> {
    try {
      await dbService.delete('coachDispatches', id);
    } catch (err) {
      console.error('Failed to delete coach dispatch:', err);
    }
  }
}

export const coachService = new CoachService();
