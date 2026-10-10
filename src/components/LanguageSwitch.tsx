import React from 'react';
import { useTefi } from '../context/TefiContext';
import { Language } from '../i18n/translations';

// Banderas dibujadas en SVG: los emojis de bandera no se ven en todos los sistemas (Windows muestra "AR" / "US")
const ArgentinaFlag: React.FC = () => (
  <svg viewBox="0 0 39 26" className="w-[22px] h-[15px] rounded-[2px] block" aria-hidden="true">
    <rect width="39" height="26" fill="#74ACDF" />
    <rect y="8.67" width="39" height="8.67" fill="#FFFFFF" />
    <circle cx="19.5" cy="13" r="2.7" fill="#F6B40E" stroke="#85340A" strokeWidth="0.35" />
  </svg>
);

const UsaFlag: React.FC = () => (
  <svg viewBox="0 0 39 26" className="w-[22px] h-[15px] rounded-[2px] block" aria-hidden="true">
    <rect width="39" height="26" fill="#B22234" />
    {[1, 3, 5, 7, 9, 11].map(stripe => (
      <rect key={stripe} y={stripe * 2} width="39" height="2" fill="#FFFFFF" />
    ))}
    <rect width="16" height="14" fill="#3C3B6E" />
    {[2.5, 5.5, 8.5, 11.5].map(y =>
      [2.5, 6.2, 9.8, 13.5].map(x => <circle key={`${x}-${y}`} cx={x} cy={y} r="0.85" fill="#FFFFFF" />)
    )}
  </svg>
);

const OPTIONS: { language: Language; label: string; Flag: React.FC }[] = [
  { language: 'es', label: 'Español', Flag: ArgentinaFlag },
  { language: 'en', label: 'English', Flag: UsaFlag }
];

export const LanguageSwitch: React.FC = () => {
  const { language, setLanguage, tr } = useTefi();

  return (
    <div
      role="group"
      aria-label={tr('Language', 'Idioma')}
      className="flex items-center gap-0.5 p-0.5 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shrink-0 shadow-2xs"
    >
      {OPTIONS.map(({ language: option, label, Flag }) => (
        <button
          key={option}
          onClick={() => setLanguage(option)}
          aria-label={label}
          aria-pressed={language === option}
          title={label}
          className={`p-1 rounded-lg transition-all cursor-pointer active:scale-95 ${
            language === option
              ? 'bg-white dark:bg-gray-600 shadow-2xs ring-1 ring-emerald-500'
              : 'opacity-45 hover:opacity-90'
          }`}
        >
          <Flag />
        </button>
      ))}
    </div>
  );
};
