import React, { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, Filter, Calendar, Tag, ChevronDown } from 'lucide-react';
import { StudyLog, Commitment, Subject, Topic, ActivityType } from '../types';
import { dbService } from '../services/db';
import { formatMinutes, formatHoursDecimal, getTodayDateString } from '../services/dateUtils';

interface StudyLogsViewProps {
  onOpenQuickAdd: () => void;
}

export const StudyLogsView: React.FC<StudyLogsViewProps> = ({ onOpenQuickAdd }) => {
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);

  // Filters
  const [filterExam, setFilterExam] = useState<string>('all');
  const [filterActivity, setFilterActivity] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');

  const loadData = async () => {
    try {
      const [lList, cList, sList, tList] = await Promise.all([
        dbService.getAll<StudyLog>('studyLogs'),
        dbService.getAll<Commitment>('commitments'),
        dbService.getAll<Subject>('subjects'),
        dbService.getAll<Topic>('topics'),
      ]);

      setLogs(lList.sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
      setCommitments(cList);
      setSubjects(sList);
      setTopics(tList);
    } catch (err) {
      console.error('Error loading study logs:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteLog = async (id: string) => {
    if (!confirm('Are you sure you want to delete this study log entry?')) return;
    try {
      await dbService.delete('studyLogs', id);
      setLogs((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      console.error('Failed to delete log:', err);
    }
  };

  // Filtered Logs
  const filteredLogs = logs.filter((l) => {
    if (filterExam !== 'all' && l.examId !== filterExam) return false;
    if (filterActivity !== 'all' && l.activityType !== filterActivity) return false;
    if (filterDate && l.date !== filterDate) return false;
    return true;
  });

  const totalFilteredMinutes = filteredLogs.reduce((acc, l) => acc + (l.durationMinutes || 0), 0);

  const examMap = new Map(commitments.map((c) => [c.id, c.name]));
  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));
  const topicMap = new Map(topics.map((t) => [t.id, t.name]));

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Study History &amp; Logs</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manual focused-time records • Verified calculations • Zero fictitious sessions
          </p>
        </div>

        <button
          onClick={onOpenQuickAdd}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Log Study Session</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Exam Filter */}
          <select
            value={filterExam}
            onChange={(e) => setFilterExam(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Examinations</option>
            {commitments.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Activity Filter */}
          <select
            value={filterActivity}
            onChange={(e) => setFilterActivity(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Activities</option>
            <option value="learning">Core Learning</option>
            <option value="question_practice">Question Practice</option>
            <option value="revision">Revision</option>
            <option value="mock_test">Mock Test</option>
            <option value="mistake_analysis">Mistake Analysis</option>
            <option value="university_coursework">University Study</option>
          </select>

          {/* Date Filter */}
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />

          {(filterExam !== 'all' || filterActivity !== 'all' || filterDate) && (
            <button
              onClick={() => {
                setFilterExam('all');
                setFilterActivity('all');
                setFilterDate('');
              }}
              className="text-slate-400 hover:text-slate-700 text-xs px-2 py-1 underline"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="text-slate-600 font-medium">
          Showing <strong>{filteredLogs.length}</strong> sessions • Total:{' '}
          <strong className="text-indigo-600">{formatHoursDecimal(totalFilteredMinutes)}</strong> (
          {formatMinutes(totalFilteredMinutes)})
        </div>
      </div>

      {/* Logs Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs">No study sessions matching your filter criteria.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map((log) => {
              const examName = examMap.get(log.examId) || log.examId;
              const subjectName = subjectMap.get(log.subjectId) || log.subjectId || 'General';
              const topicName = log.topicId ? (topicMap.get(log.topicId) || log.topicId) : null;

              return (
                <div
                  key={log.id}
                  className="p-4 hover:bg-slate-50/50 transition-colors flex items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100/50 text-indigo-700 flex flex-col items-center justify-center font-bold text-xs shrink-0">
                      <span>{log.durationMinutes}</span>
                      <span className="text-[9px] font-normal text-indigo-500 -mt-1">min</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900">{subjectName}</span>
                        {topicName && <span className="text-xs text-slate-500">› {topicName}</span>}
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">
                          {log.activityType.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="font-medium text-slate-600">{examName}</span>
                        <span>•</span>
                        <span>{log.date}</span>
                      </div>

                      {log.notes && (
                        <p className="text-xs text-slate-600 mt-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          {log.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteLog(log.id)}
                    className="text-slate-300 hover:text-rose-600 p-1 rounded transition-colors"
                    title="Delete log entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
