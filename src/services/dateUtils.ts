// Date and time utilities for Asia/Kolkata midnight-to-midnight study tracking

export function getTodayDateString(timeZone = 'Asia/Kolkata'): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  } catch {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  }
}

export function formatMinutes(minutes: number): string {
  if (!minutes || minutes <= 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatHoursDecimal(minutes: number): string {
  if (!minutes || minutes <= 0) return '0.0h';
  return `${(minutes / 60).toFixed(1)}h`;
}

// Returns the Monday (YYYY-MM-DD) and Sunday (YYYY-MM-DD) for a given date
export function getWeekBounds(dateStr: string): { monday: string; sunday: string; days: string[] } {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  
  // getDay(): 0 is Sunday, 1 is Monday, ... 6 is Saturday
  const dayOfWeek = date.getUTCDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const mondayDate = new Date(date);
  mondayDate.setUTCDate(date.getUTCDate() + diffToMonday);
  
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const current = new Date(mondayDate);
    current.setUTCDate(mondayDate.getUTCDate() + i);
    days.push(current.toISOString().slice(0, 10));
  }
  
  return {
    monday: days[0],
    sunday: days[6],
    days,
  };
}

export function getNextWeekBounds(dateStr: string): { monday: string; sunday: string } {
  const currentBounds = getWeekBounds(dateStr);
  const [y, m, d] = currentBounds.monday.split('-').map(Number);
  const nextMonday = new Date(Date.UTC(y, m - 1, d + 7, 12, 0, 0));
  const nextSunday = new Date(Date.UTC(y, m - 1, d + 13, 12, 0, 0));
  return {
    monday: nextMonday.toISOString().slice(0, 10),
    sunday: nextSunday.toISOString().slice(0, 10),
  };
}

export function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA + 'T00:00:00Z');
  const b = new Date(dateB + 'T00:00:00Z');
  const diffMs = b.getTime() - a.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days, 12, 0, 0));
  return dt.toISOString().slice(0, 10);
}

// Calculate study streak based on days with actual focused study > 0 minutes
export function calculateStudyStreak(studyDates: string[], todayStr: string): { currentStreak: number; bestStreak: number } {
  if (!studyDates || studyDates.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  const uniqueSortedDates = Array.from(new Set(studyDates)).sort();
  
  // Calculate best streak historically
  let best = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;

  for (const dStr of uniqueSortedDates) {
    const curDate = new Date(dStr + 'T00:00:00Z');
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const diff = Math.round((curDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 1) {
        tempStreak++;
      } else if (diff > 1) {
        tempStreak = 1;
      }
    }
    if (tempStreak > best) best = tempStreak;
    prevDate = curDate;
  }

  // Calculate current streak ending today or yesterday
  const dateSet = new Set(uniqueSortedDates);
  const yesterdayStr = addDays(todayStr, -1);
  
  let current = 0;
  let checkDate = dateSet.has(todayStr) ? todayStr : (dateSet.has(yesterdayStr) ? yesterdayStr : null);

  while (checkDate && dateSet.has(checkDate)) {
    current++;
    checkDate = addDays(checkDate, -1);
  }

  return {
    currentStreak: current,
    bestStreak: Math.max(best, current),
  };
}

export interface UpcomingReminder {
  id: string;
  title: string;
  targetDate: string;
  daysRemaining: number;
  type: 'exam' | 'university';
  urgency: 'critical' | 'warning' | 'info';
  statusLabel: string;
}

export function getUpcomingReminders(
  exams: { id: string; name: string; targetDate?: string; dateStatus: string }[],
  universityItems: { id: string; title: string; deadline?: string; status: string }[],
  todayStr: string
): UpcomingReminder[] {
  const reminders: UpcomingReminder[] = [];

  for (const exam of exams) {
    if (exam.targetDate) {
      const diff = daysBetween(todayStr, exam.targetDate);
      if (diff >= 0 && diff <= 30) {
        let urgency: 'critical' | 'warning' | 'info' = 'info';
        if (diff <= 1) urgency = 'critical';
        else if (diff <= 3) urgency = 'critical';
        else if (diff <= 7) urgency = 'warning';

        reminders.push({
          id: `exam_${exam.id}`,
          title: `${exam.name} Examination`,
          targetDate: exam.targetDate,
          daysRemaining: diff,
          type: 'exam',
          urgency,
          statusLabel: `${diff === 0 ? 'Today' : `${diff} day${diff > 1 ? 's' : ''} left`} (${exam.dateStatus})`,
        });
      }
    }
  }

  for (const item of universityItems) {
    if (item.deadline && item.status !== 'completed' && item.status !== 'submitted') {
      const diff = daysBetween(todayStr, item.deadline);
      if (diff >= 0 && diff <= 30) {
        let urgency: 'critical' | 'warning' | 'info' = 'info';
        if (diff <= 1) urgency = 'critical';
        else if (diff <= 3) urgency = 'critical';
        else if (diff <= 7) urgency = 'warning';

        reminders.push({
          id: `univ_${item.id}`,
          title: item.title,
          targetDate: item.deadline,
          daysRemaining: diff,
          type: 'university',
          urgency,
          statusLabel: `${diff === 0 ? 'Due Today' : `${diff} day${diff > 1 ? 's' : ''} remaining`}`,
        });
      }
    }
  }

  return reminders.sort((a, b) => a.daysRemaining - b.daysRemaining);
}
