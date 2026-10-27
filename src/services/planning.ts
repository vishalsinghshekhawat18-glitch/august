// Weekly planning, weighted task completion, capacity analysis, and intelligent plan proposals
import { WeeklyTask, WeeklyPlan, StudyLog, Commitment, TopicProgress, MistakeEntry, UniversityItem } from '../types';
import { getWeekBounds, getNextWeekBounds } from './dateUtils';

// Calculate weighted completion percentage according to official specification:
// Weighted completion = (sum of active task weights * progress fractions) / (sum of active task weights) * 100
// Note: 'dropped' tasks are explicitly excluded from active completion calculation.
export function calculateWeightedCompletion(tasks: WeeklyTask[]): {
  weightedPercent: number;
  activeTaskCount: number;
  completedTaskCount: number;
  totalActiveWeight: number;
} {
  if (!tasks || tasks.length === 0) {
    return { weightedPercent: 0, activeTaskCount: 0, completedTaskCount: 0, totalActiveWeight: 0 };
  }

  // Active tasks exclude dropped tasks
  const activeTasks = tasks.filter((t) => t.status !== 'dropped');
  if (activeTasks.length === 0) {
    return { weightedPercent: 0, activeTaskCount: 0, completedTaskCount: 0, totalActiveWeight: 0 };
  }

  let totalWeight = 0;
  let weightedProgressSum = 0;
  let completedCount = 0;

  for (const t of activeTasks) {
    const weight = Math.max(1, t.weight || 1);
    const progress = t.status === 'completed' ? 1.0 : Math.min(1.0, Math.max(0.0, t.progressFraction || 0));
    
    totalWeight += weight;
    weightedProgressSum += weight * progress;

    if (t.status === 'completed' || progress >= 1.0) {
      completedCount++;
    }
  }

  const weightedPercent = totalWeight > 0 ? (weightedProgressSum / totalWeight) * 100 : 0;

  return {
    weightedPercent: Number(weightedPercent.toFixed(1)),
    activeTaskCount: activeTasks.length,
    completedTaskCount: completedCount,
    totalActiveWeight: totalWeight,
  };
}

// Capacity check to prevent unrealistic hour targets and explain trade-offs
export function analyzeWeeklyCapacity(
  targetHours: number,
  historicalLogs: StudyLog[],
  todayStr: string
): { isOverCapacity: boolean; avgRecentHours: number; recommendation: string } {
  // Compute average weekly hours from past 2-4 weeks
  const fourWeeksAgo = new Date(todayStr + 'T00:00:00Z');
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const fourWeeksAgoStr = fourWeeksAgo.toISOString().slice(0, 10);

  const recentLogs = historicalLogs.filter((l) => l.date >= fourWeeksAgoStr && l.date <= todayStr);
  const totalRecentMinutes = recentLogs.reduce((acc, l) => acc + (l.durationMinutes || 0), 0);
  const avgRecentHours = Number(((totalRecentMinutes / 60) / 4).toFixed(1));

  // If user sets target > 1.5x their historical average or > 45 hours
  const isOverCapacity = (avgRecentHours > 5 && targetHours > avgRecentHours * 1.5) || targetHours > 45;

  let recommendation = 'Capacity looks balanced for focused study without cognitive fatigue.';
  if (isOverCapacity) {
    recommendation = `Target of ${targetHours}h exceeds your recent 4-week average of ${avgRecentHours}h by more than 50%. Consider capping at ${Math.round(Math.max(avgRecentHours * 1.25, 25))}h to prevent burnout and ensure deep focus. Missed hours never become debt.`;
  } else if (targetHours <= 0) {
    recommendation = 'Set a realistic weekly target (e.g. 20-30 hours) to anchor your focus.';
  }

  return {
    isOverCapacity,
    avgRecentHours,
    recommendation,
  };
}

// Propose a Next-Week Plan
export function generateProposedNextWeekPlan(
  todayStr: string,
  commitments: Commitment[],
  topicProgress: TopicProgress[],
  activeMistakes: MistakeEntry[],
  universityItems: UniversityItem[],
  recentLogs: StudyLog[]
): WeeklyPlan {
  const nextBounds = getNextWeekBounds(todayStr);
  const planId = `week_${nextBounds.monday}`;

  // Priority 1: IBPS RRB PO
  // Priority 2: IIBF DBF
  // Priority 3: UPSC APFC
  // Priority 4: VMOU MA Economics
  const tasks: WeeklyTask[] = [];

  // Check university assignments due next week
  const upcomingUnivItems = universityItems.filter(
    (u) => u.deadline && u.deadline >= nextBounds.monday && u.deadline <= nextBounds.sunday && u.status !== 'completed'
  );

  for (const u of upcomingUnivItems) {
    tasks.push({
      id: `task_univ_${u.id}_${Date.now()}`,
      weeklyPlanId: planId,
      title: `VMOU: Complete ${u.title} (Deadline: ${u.deadline})`,
      examId: 'comm_vmou_ma_eco',
      estimatedMinutes: 180,
      weight: 4,
      status: 'planned',
      progressFraction: 0,
      dueDate: u.deadline,
    });
  }

  // Check weak topics from mistakes
  const weakMistakes = activeMistakes.filter((m) => !m.resolved);
  if (weakMistakes.length > 0) {
    tasks.push({
      id: `task_mistakes_${Date.now()}`,
      weeklyPlanId: planId,
      title: `Mistake Analysis & Weak Topic Drill (${weakMistakes.length} flagged areas)`,
      examId: 'comm_ibps_rrb_po',
      estimatedMinutes: 240,
      weight: 4,
      status: 'planned',
      progressFraction: 0,
    });
  }

  // Default core blocks based on exam priorities
  const sortedExams = [...commitments].sort((a, b) => a.priority - b.priority);
  for (const exam of sortedExams) {
    if (exam.type === 'competitive') {
      const weight = exam.priority === 1 ? 5 : (exam.priority === 2 ? 4 : 3);
      tasks.push({
        id: `task_${exam.code}_core_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        weeklyPlanId: planId,
        title: `${exam.name} — Core Concepts & Speed Practice`,
        examId: exam.id,
        estimatedMinutes: exam.priority === 1 ? 600 : 360, // 10h for priority 1, 6h for others
        weight,
        status: 'planned',
        progressFraction: 0,
      });
    }
  }

  // Calculate estimated target hours
  const totalMinutes = tasks.reduce((acc, t) => acc + t.estimatedMinutes, 0);
  const targetHours = Math.round(totalMinutes / 60) || 25;

  return {
    id: planId,
    weekStartDate: nextBounds.monday,
    weekEndDate: nextBounds.sunday,
    targetHours,
    status: 'proposed',
    notes: 'Proposed plan structured around primary exam priority (IBPS RRB PO) with dedicated university deadlines and mistake drills.',
    capacityNotes: `Planned for ${targetHours} hours across Monday to Sunday. Adjust task weights and estimates to fit your actual availability.`,
    tasks,
  };
}
