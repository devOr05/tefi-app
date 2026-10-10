import React, { useEffect, useRef } from 'react';
import { useTefi } from '../context/TefiContext';
import { AlertTriangle, HelpCircle } from 'lucide-react';

// Pregunta de confirmación con el estilo de la app, en lugar del cuadro "confirm" del navegador
export const ConfirmDialog: React.FC = () => {
  const { confirmRequest, answerConfirm, tr } = useTefi();
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const confirmRef = useRef<HTMLButtonElement | null>(null);
  const isDanger = confirmRequest?.tone === 'danger';

  useEffect(() => {
    if (!confirmRequest) return;
    // En una acción que no se puede deshacer, Enter no tiene que confirmarla sin querer
    (isDanger ? cancelRef : confirmRef).current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') answerConfirm(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirmRequest, isDanger, answerConfirm]);

  if (!confirmRequest) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in overflow-y-auto"
      onClick={() => answerConfirm(false)}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="tefi-confirm-title"
        aria-describedby="tefi-confirm-message"
        onClick={event => event.stopPropagation()}
        className="bg-white dark:bg-gray-900 rounded-3xl max-w-sm w-full p-5 text-center shadow-2xl border border-gray-100 dark:border-gray-800 my-auto"
      >
        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center mx-auto mb-2 ${
            isDanger
              ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300'
              : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
          }`}
        >
          {isDanger ? <AlertTriangle className="w-6 h-6" /> : <HelpCircle className="w-6 h-6" />}
        </div>

        <h3 id="tefi-confirm-title" className="text-base font-black text-gray-900 dark:text-white">
          {confirmRequest.title}
        </h3>
        <p id="tefi-confirm-message" className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
          {confirmRequest.message}
        </p>

        <div className="grid grid-cols-2 gap-2 mt-4">
          <button
            ref={cancelRef}
            onClick={() => answerConfirm(false)}
            className="py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs transition-colors cursor-pointer"
          >
            {tr('Cancel', 'Cancelar')}
          </button>
          <button
            ref={confirmRef}
            onClick={() => answerConfirm(true)}
            className={`py-3 rounded-2xl text-white font-black text-xs shadow-md active:scale-98 transition-transform cursor-pointer ${
              isDanger ? 'bg-amber-600 hover:bg-amber-700' : 'gradient-tefi'
            }`}
          >
            {confirmRequest.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
