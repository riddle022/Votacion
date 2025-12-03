import { Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import type { Language } from '../i18n/translations';

interface LanguageSelectorProps {
  onLanguageSelected?: () => void;
}

export function LanguageSelector({ onLanguageSelected }: LanguageSelectorProps) {
  const { language, setLanguage, t } = useLanguage();

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang);
    if (onLanguageSelected) {
      setTimeout(onLanguageSelected, 300);
    }
  };

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'pt', label: t.portuguese, flag: '🇧🇷' },
    { code: 'es', label: t.spanish, flag: '🇪🇸' },
    { code: 'en', label: t.english, flag: '🇺🇸' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-12">
          <img
            src="/Cellshop Duty Free - Logotipo (Vertical, branco).png"
            alt="Cellshop Duty Free"
            className="mx-auto mb-8 h-40 object-contain drop-shadow-2xl"
          />

          <div className="flex items-center justify-center gap-3 mb-8">
            <Globe className="w-8 h-8 text-white" />
            <h1 className="text-3xl font-bold text-white">{t.selectLanguage}</h1>
          </div>
        </div>

        <div className="space-y-4">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageSelect(lang.code)}
              className={`w-full p-6 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 ${
                language === lang.code
                  ? 'bg-white text-blue-700 shadow-2xl'
                  : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'
              }`}
            >
              <span className="text-3xl mr-3">{lang.flag}</span>
              {lang.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
