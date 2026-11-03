import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  AlertCircle,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { UniversityCourse, UniversityItem, UniversityItemType, UniversityItemStatus, StudyLog } from '../types';
import { dbService } from '../services/db';
import { formatMinutes, formatHoursDecimal, getTodayDateString, daysBetween } from '../services/dateUtils';

export const VMOU_MA_ECONOMICS_COURSES: UniversityCourse[] = [
  { id: 'vmou_maec_01', code: 'MAEC-01', name: 'Economic Theory - I (आर्थिक सिद्धांत - I)', semester: 1, credits: 8 },
  { id: 'vmou_maec_02', code: 'MAEC-02', name: 'Economic Theory - II (आर्थिक सिद्धांत - II)', semester: 1, credits: 8 },
  { id: 'vmou_maec_03', code: 'MAEC-03', name: 'Public Economics (सार्वजनिक अर्थशास्त्र)', semester: 2, credits: 8 },
  { id: 'vmou_maec_04', code: 'MAEC-04', name: 'Quantitative Methods (परिमाणात्मक विधियां)', semester: 2, credits: 8 },
  { id: 'vmou_md_01', code: 'MD 01', name: 'Business Environment (व्यावसायिक वातावरण)', semester: 2, credits: 4 },
  { id: 'vmou_md_02', code: 'MD 02', name: 'Writing for Mass Media (जनसंचार माध्यमों के लिए लेखन)', semester: 2, credits: 4 },
  { id: 'vmou_md_03', code: 'MD 03', name: 'Society: Structure and Problems (समाज: संरचना एवं समस्याएं)', semester: 2, credits: 4 },
];

export const DEFAULT_VMOU_ASSIGNMENTS: UniversityItem[] = [
  {
    id: 'univ_item_maec_01_assign',
    courseId: 'vmou_maec_01',
    title: 'MAEC-01 Internal Assignment: Economic Theory - I',
    type: 'assignment',
    deadline: '2026-11-15',
    status: 'pending',
    studyMinutesSpent: 0,
    notes: '20 Marks total. Handwritten. Section A (4 qns × 1m, max 30 words), Section B (2 qns × 4m, max 200 words), Section C (1 qn × 8m, max 500 words). Submit to Regional Centre before 15th.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'univ_item_maec_02_assign',
    courseId: 'vmou_maec_02',
    title: 'MAEC-02 Internal Assignment: Economic Theory - II',
    type: 'assignment',
    deadline: '2026-11-15',
    status: 'pending',
    studyMinutesSpent: 0,
    notes: '20 Marks total. Handwritten. Section A (4 qns × 1m, max 30 words), Section B (2 qns × 4m, max 200 words), Section C (1 qn × 8m, max 500 words). Submit to Regional Centre before 15th.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'univ_item_maec_03_assign',
    courseId: 'vmou_maec_03',
    title: 'MAEC-03 Internal Assignment: Public Economics',
    type: 'assignment',
    deadline: '2026-11-15',
    status: 'pending',
    studyMinutesSpent: 0,
    notes: '20 Marks total. Handwritten. Section A (4 qns × 1m, max 30 words), Section B (2 qns × 4m, max 200 words), Section C (1 qn × 8m, max 500 words). Submit to Regional Centre before 15th.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'univ_item_maec_04_assign',
    courseId: 'vmou_maec_04',
    title: 'MAEC-04 Internal Assignment: Quantitative Methods',
    type: 'assignment',
    deadline: '2026-11-15',
    status: 'pending',
    studyMinutesSpent: 0,
    notes: '20 Marks total. Handwritten. Section A (4 qns × 1m, max 30 words), Section B (2 qns × 4m, max 200 words), Section C (1 qn × 8m, max 500 words). Submit to Regional Centre before 15th.',
    createdAt: new Date().toISOString(),
  },
];

export const UniversityView: React.FC = () => {
  const [todayStr, setTodayStr] = useState<string>(getTodayDateString());
  const [courses, setCourses] = useState<UniversityCourse[]>([]);
  const [items, setItems] = useState<UniversityItem[]>([]);
  const [studyLogs, setStudyLogs] = useState<StudyLog[]>([]);

  // Item form modal
  const [isAddItemOpen, setIsAddItemOpen] = useState<boolean>(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [itemTitle, setItemTitle] = useState<string>('');
  const [itemType, setItemType] = useState<UniversityItemType>('assignment');
  const [itemDeadline, setItemDeadline] = useState<string>('');
  const [itemNotes, setItemNotes] = useState<string>('');

  // Course form modal
  const [isAddCourseOpen, setIsAddCourseOpen] = useState<boolean>(false);
  const [courseCode, setCourseCode] = useState<string>('');
  const [courseName, setCourseName] = useState<string>('');
  const [courseSemester, setCourseSemester] = useState<number>(1);
  const [courseCredits, setCourseCredits] = useState<number>(8);

  // Log writing session modal
  const [loggingWritingItem, setLoggingWritingItem] = useState<UniversityItem | null>(null);
  const [writingMinutes, setWritingMinutes] = useState<number>(60);
  const [writingDate, setWritingDate] = useState<string>(getTodayDateString());
  const [writingNotes, setWritingNotes] = useState<string>('');

  const loadData = async () => {
    try {
      const today = getTodayDateString();
      setTodayStr(today);

      const [cList, iList, lList] = await Promise.all([
        dbService.getAll<UniversityCourse>('universityCourses'),
        dbService.getAll<UniversityItem>('universityItems'),
        dbService.getAll<StudyLog>('studyLogs'),
      ]);

      let finalCourses = cList;
      let finalItems = iList;

      // Auto-seed VMOU M.A. Economics official courses and assignments if empty
      if (cList.length === 0) {
        await dbService.putMany<UniversityCourse>('universityCourses', VMOU_MA_ECONOMICS_COURSES);
        finalCourses = await dbService.getAll<UniversityCourse>('universityCourses');
        if (iList.length === 0) {
          await dbService.putMany<UniversityItem>('universityItems', DEFAULT_VMOU_ASSIGNMENTS);
          finalItems = await dbService.getAll<UniversityItem>('universityItems');
        }
      }

      setCourses(finalCourses);
      if (finalCourses.length > 0 && !selectedCourseId) {
        setSelectedCourseId(finalCourses[0].id);
      }

      setItems(finalItems.sort((a, b) => (a.deadline || '').localeCompare(b.deadline || '')));
      setStudyLogs(lList.filter((l) => l.examId === 'comm_vmou_ma_eco'));
    } catch (err) {
      console.error('Error loading university data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Total VMOU study minutes
  const totalVmouMinutes = studyLogs.reduce((acc, l) => acc + (l.durationMinutes || 0), 0);

  // Load Starter Courses
  const handleLoadStarterCourses = async () => {
    try {
      await dbService.putMany<UniversityCourse>('universityCourses', VMOU_MA_ECONOMICS_COURSES);
      loadData();
    } catch (err) {
      console.error('Failed to load starter courses:', err);
    }
  };

  // Pre-seed 4 Official VMOU Assignments (Nov 15 Deadline)
  const handleSeedVmouAssignments = async () => {
    try {
      await dbService.putMany<UniversityCourse>('universityCourses', VMOU_MA_ECONOMICS_COURSES);
      const existingItems = await dbService.getAll<UniversityItem>('universityItems');
      for (const it of DEFAULT_VMOU_ASSIGNMENTS) {
        if (!existingItems.some((e) => e.id === it.id || (e.courseId === it.courseId && e.type === 'assignment'))) {
          await dbService.put<UniversityItem>('universityItems', it);
        }
      }
      await loadData();
    } catch (err) {
      console.error('Failed to seed VMOU assignments:', err);
    }
  };

  // Save Writing Log
  const handleSaveWritingLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggingWritingItem) return;

    const course = courseMap.get(loggingWritingItem.courseId);
    const courseCodeStr = course ? course.code : 'VMOU';
    const mins = Math.max(5, Number(writingMinutes) || 60);

    // 1. Create StudyLog under comm_vmou_ma_eco
    const newLog: StudyLog = {
      id: `log_univ_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date: writingDate,
      timestamp: new Date().toISOString(),
      examId: 'comm_vmou_ma_eco',
      subjectId: loggingWritingItem.courseId,
      durationMinutes: mins,
      activityType: 'learning',
      notes: `Assignment Writing: ${courseCodeStr} — ${loggingWritingItem.title}${writingNotes ? ` • ${writingNotes.trim()}` : ''}`,
      createdAt: new Date().toISOString(),
    };
    await dbService.put<StudyLog>('studyLogs', newLog);

    // 2. Increment studyMinutesSpent and set status to 'in_progress' if pending
    const updatedItem: UniversityItem = {
      ...loggingWritingItem,
      studyMinutesSpent: (loggingWritingItem.studyMinutesSpent || 0) + mins,
      status: loggingWritingItem.status === 'pending' ? 'in_progress' : loggingWritingItem.status,
    };
    await dbService.put<UniversityItem>('universityItems', updatedItem);

    setLoggingWritingItem(null);
    setWritingNotes('');
    await loadData();
  };

  // Add Custom Course
  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseCode.trim() || !courseName.trim()) return;

    try {
      const newCourse: UniversityCourse = {
        id: `course_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        code: courseCode.trim().toUpperCase(),
        name: courseName.trim(),
        semester: Number(courseSemester),
        credits: Number(courseCredits),
      };

      await dbService.put<UniversityCourse>('universityCourses', newCourse);
      setIsAddCourseOpen(false);
      setCourseCode('');
      setCourseName('');
      loadData();
    } catch (err) {
      console.error('Failed to add course:', err);
    }
  };

  // Delete Course
  const handleDeleteCourse = async (courseId: string, courseCodeStr: string) => {
    if (!confirm(`Are you sure you want to delete course ${courseCodeStr}? Any associated items will remain in history.`)) return;
    try {
      await dbService.delete('universityCourses', courseId);
      loadData();
    } catch (err) {
      console.error('Failed to delete course:', err);
    }
  };

  // Add Item
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitle.trim() || !selectedCourseId) return;

    try {
      const newItem: UniversityItem = {
        id: `univ_item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        courseId: selectedCourseId,
        title: itemTitle.trim(),
        type: itemType,
        deadline: itemDeadline || undefined,
        status: 'pending',
        studyMinutesSpent: 0,
        notes: itemNotes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      await dbService.put<UniversityItem>('universityItems', newItem);
      setIsAddItemOpen(false);
      setItemTitle('');
      setItemNotes('');
      loadData();
    } catch (err) {
      console.error('Failed to add university item:', err);
    }
  };

  // Delete Item
  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to remove this academic task?')) return;
    try {
      await dbService.delete('universityItems', itemId);
      loadData();
    } catch (err) {
      console.error('Failed to delete university item:', err);
    }
  };

  // Update Item Status
  const handleUpdateStatus = async (item: UniversityItem, status: UniversityItemStatus) => {
    try {
      const updated = { ...item, status };
      await dbService.put<UniversityItem>('universityItems', updated);
      loadData();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const courseMap = new Map(courses.map((c) => [c.id, c]));

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">VMOU Kota — Masters in Economics</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Course modules • Internal assignment deadlines • Term-end exam schedules
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href="https://www.vmou.ac.in"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold border border-slate-200 transition-colors flex items-center gap-1.5"
          >
            <span>VMOU Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={handleSeedVmouAssignments}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold border border-emerald-200 transition-colors flex items-center gap-1.5 shadow-2xs"
            title="Pre-populate MAEC-01 to MAEC-04 assignments with Nov 15 deadline"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Seed 4 Assignments</span>
          </button>

          <button
            onClick={() => setIsAddCourseOpen(true)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Course</span>
          </button>

          <button
            onClick={() => {
              if (courses.length === 0) {
                alert('Please add at least one course module before adding an assignment.');
                setIsAddCourseOpen(true);
                return;
              }
              setIsAddItemOpen(true);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Assignment / Item</span>
          </button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500">Total VMOU Study Time</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{formatHoursDecimal(totalVmouMinutes)}</div>
          <span className="text-[11px] text-slate-400">({formatMinutes(totalVmouMinutes)} focused study)</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500">Course Modules</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{courses.length} Courses</div>
          <span className="text-[11px] text-slate-400">Customizable &amp; Removable</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500">Pending Assignments</span>
          <div className="text-2xl font-bold text-emerald-700 mt-1">
            {items.filter((i) => i.status === 'pending').length}
          </div>
          <span className="text-[11px] text-slate-400">
            {items.filter((i) => i.status === 'submitted').length} submitted to university
          </span>
        </div>
      </div>

      {/* Add Course Modal */}
      {isAddCourseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Add Academic Course Module</h3>
            <form onSubmit={handleAddCourse} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Course Code</label>
                  <input
                    type="text"
                    placeholder="e.g. MEC-01"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Semester</label>
                  <select
                    value={courseSemester}
                    onChange={(e) => setCourseSemester(parseInt(e.target.value, 10))}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value={1}>Semester 1</option>
                    <option value={2}>Semester 2</option>
                    <option value={3}>Semester 3</option>
                    <option value={4}>Semester 4</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Course Name</label>
                <input
                  type="text"
                  placeholder="e.g. Microeconomic Analysis"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Credits</label>
                <input
                  type="number"
                  value={courseCredits}
                  onChange={(e) => setCourseCredits(parseInt(e.target.value, 10) || 8)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddCourseOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium shadow-sm"
                >
                  Save Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {isAddItemOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Add Academic Task / Assignment</h3>
            <form onSubmit={handleAddItem} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Course</label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                  required
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code}: {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Item Title</label>
                <input
                  type="text"
                  placeholder="e.g. MEC-01 Internal Assignment Question 1-5"
                  value={itemTitle}
                  onChange={(e) => setItemTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Item Type</label>
                  <select
                    value={itemType}
                    onChange={(e) => setItemType(e.target.value as UniversityItemType)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="assignment">Internal Assignment</option>
                    <option value="lecture">Lecture / SLM Chapter</option>
                    <option value="exam">Term-End Exam</option>
                    <option value="reading">Reference Reading</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Submission Deadline</label>
                  <input
                    type="date"
                    value={itemDeadline}
                    onChange={(e) => setItemDeadline(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Notes / Guidelines</label>
                <textarea
                  rows={2}
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                  placeholder="Handwritten submission or regional centre delivery notes."
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddItemOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium shadow-sm"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* University Assignments & Deadlines */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Academic Tasks &amp; Deadlines ({items.length})</h3>
          <span className="text-xs text-slate-400">VMOU Kota Academic Calendar</span>
        </div>

        <div className="divide-y divide-slate-100">
          {items.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
              No assignments or deadlines logged yet. Click &quot;Add Assignment / Item&quot; to begin.
            </div>
          ) : (
            items.map((item) => {
              const course = courseMap.get(item.courseId);
              const daysLeft = item.deadline ? daysBetween(todayStr, item.deadline) : null;

              return (
                <div
                  key={item.id}
                  className="p-4 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                        {item.type}
                      </span>
                      <span className="text-xs font-semibold text-slate-900">{item.title}</span>
                      {course && <span className="text-xs text-slate-500">({course.code})</span>}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                      {course && <span>{course.name}</span>}
                      {item.deadline && (
                        <>
                          <span>•</span>
                          <span className="text-slate-600 font-medium">Deadline: {item.deadline}</span>
                          {daysLeft !== null && (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                daysLeft <= 3
                                  ? 'bg-rose-100 text-rose-700'
                                  : daysLeft <= 7
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {daysLeft === 0 ? 'Due Today' : `${daysLeft} days remaining`}
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {/* Time logged & Log Writing Time button */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => {
                          setLoggingWritingItem(item);
                          setWritingMinutes(60);
                          setWritingDate(todayStr);
                          setWritingNotes(`Drafting answers for ${item.title}`);
                        }}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors active:scale-95 cursor-pointer shadow-2xs"
                        title="Log study / handwriting hours for this assignment"
                      >
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>+ Log Writing Time</span>
                      </button>

                      {item.studyMinutesSpent > 0 ? (
                        <span className="text-[11px] font-medium text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{formatMinutes(item.studyMinutesSpent)} written</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">0m written</span>
                      )}
                    </div>

                    {item.notes && (
                      <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-2 max-w-2xl leading-relaxed">
                        {item.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={item.status}
                      onChange={(e) => handleUpdateStatus(item, e.target.value as UniversityItemStatus)}
                      className={`text-[11px] px-2 py-1 rounded-md border font-medium focus:outline-none ${
                        item.status === 'submitted' || item.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : item.status === 'in_progress'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="submitted">Submitted to University</option>
                      <option value="completed">Completed / Evaluated</option>
                    </select>

                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 text-slate-300 hover:text-rose-600 rounded transition-colors"
                      title="Remove task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Course Modules Reference & Management */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Configured Course Modules ({courses.length})</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Official VMOU M.A. Economics syllabus modules and electives.
            </p>
          </div>

          {courses.length === 0 && (
            <button
              onClick={handleLoadStarterCourses}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-200 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load VMOU M.A. Starter Template</span>
            </button>
          )}
        </div>

        {courses.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl">
            <BookOpen className="w-7 h-7 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500">No course modules configured yet.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Click &quot;Add Course&quot; to define your own courses, or load the official VMOU starter template.
            </p>
            <div className="flex justify-center gap-2 mt-3">
              <button
                onClick={() => setIsAddCourseOpen(true)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium"
              >
                + Add Custom Course
              </button>
              <button
                onClick={handleLoadStarterCourses}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium"
              >
                Load Starter Template (MAEC 01-04)
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {courses.map((c) => (
              <div key={c.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start justify-between gap-2 group">
                <div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                    {c.code}
                  </span>
                  <h4 className="text-xs font-semibold text-slate-800 mt-1">{c.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Semester {c.semester} • {c.credits} Credits</p>
                </div>
                <button
                  onClick={() => handleDeleteCourse(c.id, c.code)}
                  className="text-slate-300 hover:text-rose-600 p-1 rounded transition-colors"
                  title="Remove this course module"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Log Writing Time Modal */}
      {loggingWritingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Log Assignment Writing Time</h3>
                <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">
                  {loggingWritingItem.title}
                </p>
              </div>
              <button
                onClick={() => setLoggingWritingItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveWritingLog} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Session Date</label>
                  <input
                    type="date"
                    value={writingDate}
                    onChange={(e) => setWritingDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Time Spent (Minutes)</label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={writingMinutes}
                    onChange={(e) => setWritingMinutes(parseInt(e.target.value, 10) || 0)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                    required
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-400">Quick Select:</span>
                {[30, 45, 60, 90, 120].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setWritingMinutes(m)}
                    className={`text-[11px] px-2.5 py-1 rounded-md border font-medium transition-colors ${
                      writingMinutes === m
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {m >= 60 ? `${m / 60}h` : `${m}m`}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Writing Notes / Questions Drafted</label>
                <input
                  type="text"
                  placeholder="e.g. Completed Section A (4 questions) & Section B question 2"
                  value={writingNotes}
                  onChange={(e) => setWritingNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-lg text-xs text-emerald-900 leading-relaxed">
                💡 This session automatically counts toward <strong>Today&apos;s Focused Study</strong>, your weekly attainment goal, and tracks cumulative writing time on this assignment.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setLoggingWritingItem(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium shadow-sm"
                >
                  Save Writing Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
