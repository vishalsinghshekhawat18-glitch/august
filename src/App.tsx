import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { DashboardView } from './views/DashboardView';
import { SyllabusView } from './views/SyllabusView';
import { StudyLogsView } from './views/StudyLogsView';
import { PlanningView } from './views/PlanningView';
import { RevisionsView } from './views/RevisionsView';
import { MockTestsView } from './views/MockTestsView';
import { UniversityView } from './views/UniversityView';
import { ReviewsView } from './views/ReviewsView';
import { AnalyticsView } from './views/AnalyticsView';
import { SettingsView } from './views/SettingsView';
import { QuickAddStudyModal } from './components/QuickAddStudyModal';
import { GuidedSetupModal } from './components/GuidedSetupModal';
import { dbService } from './services/db';
import { AppSettings } from './types';

export const App: React.FC = () => {
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState<boolean>(false);
  const [isGuidedSetupOpen, setIsGuidedSetupOpen] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  useEffect(() => {
    async function checkSetup() {
      try {
        const settingsList = await dbService.getAll<AppSettings>('settings');
        const settings = settingsList[0];
        if (settings && !settings.guidedSetupCompleted) {
          setIsGuidedSetupOpen(true);
        }
      } catch (err) {
        console.warn('Initial setup check error:', err);
      } finally {
        setIsInitialized(true);
      }
    }

    checkSetup();
  }, []);

  return (
    <Layout
      activeView={activeView}
      onNavigate={(v) => setActiveView(v)}
      onOpenQuickAdd={() => setIsQuickAddOpen(true)}
    >
      {activeView === 'dashboard' && (
        <DashboardView
          onOpenQuickAdd={() => setIsQuickAddOpen(true)}
          onNavigate={(v) => setActiveView(v)}
        />
      )}
      {activeView === 'syllabus' && <SyllabusView />}
      {activeView === 'logs' && (
        <StudyLogsView onOpenQuickAdd={() => setIsQuickAddOpen(true)} />
      )}
      {activeView === 'planning' && <PlanningView />}
      {activeView === 'revisions' && <RevisionsView />}
      {activeView === 'mocks' && <MockTestsView />}
      {activeView === 'university' && <UniversityView />}
      {activeView === 'reviews' && <ReviewsView />}
      {activeView === 'analytics' && <AnalyticsView />}
      {activeView === 'settings' && <SettingsView />}

      {/* Global Quick Add Study Modal */}
      <QuickAddStudyModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onLogSaved={() => {
          // Trigger a view rerender if on dashboard or logs
          if (activeView === 'dashboard' || activeView === 'logs') {
            setActiveView((prev) => prev);
          }
        }}
      />

      {/* Guided Setup Modal for First-time initialization */}
      <GuidedSetupModal
        isOpen={isGuidedSetupOpen}
        onClose={() => setIsGuidedSetupOpen(false)}
        onSetupComplete={() => {
          setIsGuidedSetupOpen(false);
          setActiveView('dashboard');
        }}
      />
    </Layout>
  );
};

export default App;
