import React from 'react';
import { useTefi } from '../context/TefiContext';
import { BUILD, commitUrl, versionLabel } from '../version';

// Versión de la app que tiene abierta este dispositivo. Está en todas las pantallas: en el encabezado y en la
// de primer uso. Lleva al commit en GitHub, que es exactamente el código que se está viendo
export const VersionTag: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { language, tr } = useTefi();
  const label = versionLabel(BUILD, language);
  const url = commitUrl(BUILD);
  const title = tr('Version of the app open on this device', 'Versión de la app abierta en este dispositivo');
  const classes = `font-mono text-[9px] sm:text-[10px] leading-none text-gray-500 dark:text-gray-400 ${className}`;

  if (!url) {
    return (
      <span data-testid="tefi-version" title={title} className={classes}>
        {label}
      </span>
    );
  }

  return (
    <a
      data-testid="tefi-version"
      href={url}
      target="_blank"
      rel="noreferrer"
      title={`${title}. ${tr('Opens its commit on GitHub.', 'Abre su commit en GitHub.')}`}
      className={`${classes} hover:text-emerald-700 dark:hover:text-emerald-400 hover:underline underline-offset-2`}
    >
      {label}
    </a>
  );
};
