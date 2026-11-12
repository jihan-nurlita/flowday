/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './presentation/state/AuthContext';
import { FlowProvider, useFlow } from './presentation/state/FlowContext';
import { ResponsiveShell } from './presentation/layouts/ResponsiveShell';
import { DashboardView } from './presentation/views/DashboardView';
import { TasksView } from './presentation/views/TasksView';
import { CalendarView } from './presentation/views/CalendarView';
import { FocusView } from './presentation/views/FocusView';
import { NotesView } from './presentation/views/NotesView';
import { AnalyticsView } from './presentation/views/AnalyticsView';
import { NotificationsView } from './presentation/views/NotificationsView';
import { SettingsView } from './presentation/views/SettingsView';
import { ProfileView } from './presentation/views/ProfileView';

// Auth Views
import { SplashScreen } from './presentation/views/auth/SplashScreen';
import { OnboardingScreen } from './presentation/views/auth/OnboardingScreen';
import { LoginScreen } from './presentation/views/auth/LoginScreen';
import { RegisterScreen } from './presentation/views/auth/RegisterScreen';

const MainViewRouter: React.FC = () => {
  const { activeTab } = useFlow();

  switch (activeTab) {
    case 'dashboard':
      return <DashboardView />;
    case 'tasks':
      return <TasksView />;
    case 'calendar':
      return <CalendarView />;
    case 'focus':
      return <FocusView />;
    case 'notes':
      return <NotesView />;
    case 'analytics':
      return <AnalyticsView />;
    case 'notifications':
      return <NotificationsView />;
    case 'settings':
      return <SettingsView />;
    case 'profile':
      return <ProfileView />;
    default:
      return <DashboardView />;
  }
};

const AppContent: React.FC = () => {
  const { status, onboardingDone, completeOnboarding } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  // 1. Initial Splash Screen (first 1.2s on boot)
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  // 2. Unauthenticated flows (Onboarding -> Login / Register)
  if (status === 'unauthenticated' || status === 'initial' || status === 'error') {
    if (!onboardingDone) {
      return <OnboardingScreen onComplete={completeOnboarding} />;
    }

    if (authView === 'register') {
      return <RegisterScreen onNavigateToLogin={() => setAuthView('login')} />;
    }

    return <LoginScreen onNavigateToRegister={() => setAuthView('register')} />;
  }

  // 3. Authenticated Workspace (Dashboard & Features)
  return (
    <FlowProvider>
      <ResponsiveShell>
        <MainViewRouter />
      </ResponsiveShell>
    </FlowProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
