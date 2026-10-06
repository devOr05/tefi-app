import React, { useState } from 'react';
import { useTefi } from '../context/TefiContext';
import { Building2, X, CheckCircle2, Send } from 'lucide-react';

interface JoinStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JoinStoreModal: React.FC<JoinStoreModalProps> = ({ isOpen, onClose }) => {
  const { language, t } = useTefi();
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreCategory, setNewStoreCategory] = useState('');
  const [newStorePhone, setNewStorePhone] = useState('');
  const [newStoreAddress, setNewStoreAddress] = useState('');
  const [newStorePromo, setNewStorePromo] = useState('');
  const [joinSubmitted, setJoinSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim()) return;
    setJoinSubmitted(true);
    setTimeout(() => {
      setJoinSubmitted(false);
      onClose();
      setNewStoreName('');
      setNewStoreCategory('');
      setNewStorePhone('');
      setNewStoreAddress('');
      setNewStorePromo('');
    }, 2200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-sm w-full p-5 text-left shadow-2xl relative border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full bg-gray-100 dark:bg-gray-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-3">
          <Building2 className="w-5 h-5" />
        </div>

        <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
          {t('joinModalTitle')}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-4">
          {t('joinModalDesc')}
        </p>

        {joinSubmitted ? (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-center space-y-2 animate-in zoom-in-95">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
            <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
              {t('joinSuccess')}
            </p>
          </div>
        ) : (
          <form onSubmit={handleJoinSubmit} className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block mb-1">
                {language === 'en' ? 'Store Name' : 'Nombre del Comercio'}
              </label>
              <input
                type="text"
                required
                value={newStoreName}
                onChange={e => setNewStoreName(e.target.value)}
                placeholder={t('storeNamePlaceholder')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  {language === 'en' ? 'Category' : 'Rubro'}
                </label>
                <input
                  type="text"
                  required
                  value={newStoreCategory}
                  onChange={e => setNewStoreCategory(e.target.value)}
                  placeholder={t('categoryPlaceholder')}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  {language === 'en' ? 'Phone / WhatsApp' : 'Teléfono / WhatsApp'}
                </label>
                <input
                  type="text"
                  value={newStorePhone}
                  onChange={e => setNewStorePhone(e.target.value)}
                  placeholder={t('phonePlaceholder')}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block mb-1">
                {language === 'en' ? 'Address / Location' : 'Dirección / Zona'}
              </label>
              <input
                type="text"
                required
                value={newStoreAddress}
                onChange={e => setNewStoreAddress(e.target.value)}
                placeholder={t('addressPlaceholder')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block mb-1">
                {language === 'en' ? 'Promotion for Tefi neighbors (optional)' : 'Promoción para vecinos Tefi (opcional)'}
              </label>
              <input
                type="text"
                value={newStorePromo}
                onChange={e => setNewStorePromo(e.target.value)}
                placeholder={language === 'en' ? 'e.g. 10% OFF on dairy' : 'Ej: 10% de descuento en lácteos'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 mt-1 rounded-2xl gradient-tefi text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer touch-target-accessible"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{t('submitJoin')}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
