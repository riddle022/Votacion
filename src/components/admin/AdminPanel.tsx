import { useState } from 'react';
import { LogOut, Settings, BarChart3 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { OptionsManager } from './OptionsManager';
import { ResultsView } from './ResultsView';

interface AdminPanelProps {
  onExitAdmin: () => void;
}

export function AdminPanel({ onExitAdmin }: AdminPanelProps) {
  const { t } = useLanguage();
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'options' | 'results'>('options');

  const handleLogout = async () => {
    await signOut();
    onExitAdmin();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src="/Cellshop Duty Free - Logotipo (Vertical, branco).png"
                alt="Cellshop Duty Free"
                className="h-16 object-contain"
              />
              <h1 className="text-2xl font-bold">{t.adminPanel}</h1>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              {t.logout}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('options')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === 'options'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
          >
            <Settings className="w-5 h-5" />
            {t.voteOptions}
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === 'results'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
          >
            <BarChart3 className="w-5 h-5" />
            {t.results}
          </button>
        </div>

        {activeTab === 'options' ? <OptionsManager /> : <ResultsView />}
      </div>
    </div>
  );
}
