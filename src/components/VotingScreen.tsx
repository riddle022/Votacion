import { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase, VoteOption } from '../lib/supabase';

interface VotingScreenProps {
  onBack: () => void;
  onAdminLogin: () => void;
}

export function VotingScreen({ onBack, onAdminLogin }: VotingScreenProps) {
  const { language, setLanguage, t } = useLanguage();
  const [options, setOptions] = useState<VoteOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    const { data, error } = await supabase
      .from('vote_options')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (data) {
      setOptions(data);
    }
    if (error) {
      console.error('Error loading options:', error);
    }
  };

  const handleVoteClick = async (optionId: string) => {
    setSelectedOption(optionId);
    setLoading(true);
    setError('');

    const { error } = await supabase
      .from('votes')
      .insert({ vote_option_id: optionId });

    if (error) {
      setError(t.errorSubmitting);
      setLoading(false);
      setSelectedOption(null);
      return;
    }

    setLoading(false);
    setSubmitted(true);
  };

  const handleVoteAgain = () => {
    setSubmitted(false);
    setSelectedOption(null);
    setError('');
  };

  // Auto-reset after 3 seconds when vote is submitted
  useEffect(() => {
    if (submitted) {
      const timer = setTimeout(() => {
        handleVoteAgain();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [submitted]);

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <img
            src="/Cellshop Duty Free - Logotipo (Vertical, branco).png"
            alt="Cellshop Duty Free"
            className="mx-auto mb-8 h-40 object-contain drop-shadow-2xl"
          />

          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-12">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>

            <h2 className="text-4xl font-bold text-blue-700 mb-4">{t.thankYou}</h2>
            <p className="text-gray-600 text-lg">{t.thankYouMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex flex-col p-4 md:p-6">
      <div className="flex flex-col max-w-4xl mx-auto w-full h-full">
        <div className="relative flex items-center justify-center mb-4 md:mb-6 flex-shrink-0">
          <img
            src="/Cellshop Duty Free - Logotipo (Vertical, branco).png"
            alt="Cellshop Duty Free"
            className="h-24 md:h-32 object-contain drop-shadow-2xl cursor-pointer transition-transform hover:scale-105 active:scale-95"
            onDoubleClick={onAdminLogin}
          />

          <div className="absolute right-0 top-0 flex gap-2">
            <button
              onClick={() => setLanguage('es')}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all duration-300 ${language === 'es'
                ? 'bg-white text-blue-700 shadow-lg scale-105'
                : 'bg-white/20 text-white hover:bg-white/30'
                }`}
            >
              ES
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all duration-300 ${language === 'en'
                ? 'bg-white text-blue-700 shadow-lg scale-105'
                : 'bg-white/20 text-white hover:bg-white/30'
                }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('pt')}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all duration-300 ${language === 'pt'
                ? 'bg-white text-blue-700 shadow-lg scale-105'
                : 'bg-white/20 text-white hover:bg-white/30'
                }`}
            >
              PT
            </button>
          </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-white mb-4 md:mb-6 text-center drop-shadow-lg flex-shrink-0">
          {t.whereDidYouMeet}
        </h1>

        <div className="bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl p-4 md:p-6 flex-1 flex flex-col border border-white/20 min-h-0">
          <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
            {options.map((option) => {
              const text = option[`text_${language}` as keyof VoteOption] as string;
              return (
                <button
                  key={option.id}
                  onClick={() => handleVoteClick(option.id)}
                  disabled={loading}
                  className={`w-full p-6 rounded-2xl font-bold text-lg md:text-xl text-left transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg border-2 group ${selectedOption === option.id && loading
                    ? 'bg-blue-600 border-blue-400 text-white shadow-blue-900/30'
                    : 'bg-white border-transparent text-gray-700 hover:bg-blue-50 hover:border-blue-200 hover:shadow-xl'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full border-4 flex-shrink-0 flex items-center justify-center transition-colors duration-300 ${selectedOption === option.id && loading
                      ? 'border-white bg-white'
                      : 'border-gray-300 group-hover:border-blue-400'
                      }`}>
                      {selectedOption === option.id && loading && (
                        <div className="w-4 h-4 rounded-full bg-blue-600 animate-pulse"></div>
                      )}
                    </div>
                    <span className="flex-1">{text}</span>
                    {selectedOption === option.id && loading && (
                      <span className="ml-auto text-sm animate-pulse">Processing...</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-100/90 border border-red-200 rounded-xl text-red-700 text-center font-medium backdrop-blur-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
