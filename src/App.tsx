import { useState } from 'react';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageSelector } from './components/LanguageSelector';
import { VotingScreen } from './components/VotingScreen';
import { LoginScreen } from './components/admin/LoginScreen';
import { AdminPanel } from './components/admin/AdminPanel';

function AppContent() {
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  if (isAdminMode) {
    if (!user) {
      return <LoginScreen />;
    }
    return <AdminPanel onExitAdmin={() => setIsAdminMode(false)} />;
  }

  if (showLanguageSelector) {
    return (
      <div>

        <LanguageSelector onLanguageSelected={() => setShowLanguageSelector(false)} />
      </div>
    );
  }

  return (
    <VotingScreen
      onBack={() => setShowLanguageSelector(true)}
      onAdminLogin={() => setIsAdminMode(true)}
    />
  );
}

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
