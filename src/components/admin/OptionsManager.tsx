import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Check, X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase, VoteOption } from '../../lib/supabase';

export function OptionsManager() {
  const { t } = useLanguage();
  const [options, setOptions] = useState<VoteOption[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    text_pt: '',
    text_es: '',
    text_en: '',
    is_active: true,
  });

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    const { data } = await supabase
      .from('vote_options')
      .select('*')
      .order('display_order');

    if (data) setOptions(data);
  };

  const handleSave = async () => {
    if (editingId) {
      await supabase
        .from('vote_options')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingId);
    } else {
      const maxOrder = options.length > 0
        ? Math.max(...options.map(o => o.display_order))
        : 0;

      await supabase
        .from('vote_options')
        .insert({
          ...formData,
          display_order: maxOrder + 1,
        });
    }

    setEditingId(null);
    setIsAdding(false);
    setFormData({ text_pt: '', text_es: '', text_en: '', is_active: true });
    loadOptions();
  };

  const handleEdit = (option: VoteOption) => {
    setEditingId(option.id);
    setFormData({
      text_pt: option.text_pt,
      text_es: option.text_es,
      text_en: option.text_en,
      is_active: option.is_active,
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm(t.confirmDelete)) {
      await supabase.from('vote_options').delete().eq('id', id);
      loadOptions();
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({ text_pt: '', text_es: '', text_en: '', is_active: true });
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800">{t.voteOptions}</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all"
        >
          <Plus className="w-5 h-5" />
          {t.addOption}
        </button>
      </div>

      {(isAdding || editingId) && (
        <div className="mb-8 p-6 bg-blue-50 rounded-xl border-2 border-blue-200">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Português
              </label>
              <input
                type="text"
                value={formData.text_pt}
                onChange={(e) => setFormData({ ...formData, text_pt: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Español
              </label>
              <input
                type="text"
                value={formData.text_es}
                onChange={(e) => setFormData({ ...formData, text_es: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                English
              </label>
              <input
                type="text"
                value={formData.text_en}
                onChange={(e) => setFormData({ ...formData, text_en: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <label className="text-sm font-semibold text-gray-700">
                {t.active}
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-all"
              >
                <Check className="w-5 h-5" />
                {t.save}
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-700 transition-all"
              >
                <X className="w-5 h-5" />
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {options.map((option) => (
          <div
            key={option.id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all"
          >
            <div className="flex-1">
              <div className="font-semibold text-gray-800">{option.text_pt}</div>
              <div className="text-sm text-gray-600 mt-1">
                ES: {option.text_es} | EN: {option.text_en}
              </div>
              <div className="mt-2">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    option.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {option.is_active ? t.active : t.inactive}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(option)}
                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
              >
                <Edit className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleDelete(option.id)}
                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
