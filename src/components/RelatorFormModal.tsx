import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save } from 'lucide-react';

interface Relator {
  id?: number;
  nombre: string;
  rut: string;
  profesion: string;
  categoria: string[] | null;
  "aprobado por gacema": string;
  reuf: string;
  ciudad: string;
  telefono: string;
  email: string;
  procedencia: string;
  Suspendido: boolean;
  eliminado?: boolean;
}

interface RelatorFormModalProps {
  relator: Relator | null; // A null relator means "Create mode", object means "Edit mode"
  onClose: () => void;
  onSave: (formData: Partial<Relator>) => void;
}

const CATEGORIES = [
  'ADMINISTRACIÓN', 'COMPUTACIÓN', 'ELÉCTRICA', 'EQUIPOS MOVILES', 
  'HIDRÁULICA', 'METROLOGÍA', 'MINERÍA', 'PROTECCIONES RADIOLÓGICAS', 
  'PSICOLOGÍA', 'QUÍMICA', 'RIGGER', 'SALUD OCUPACIONAL', 
  'SEGURIDAD', 'SOLDADURA'
];

export default function RelatorFormModal({ relator, onClose, onSave }: RelatorFormModalProps) {
  const isEditing = !!relator;
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Relator>>({
    nombre: '',
    rut: '',
    profesion: '',
    ciudad: '',
    telefono: '',
    email: '',
    procedencia: 'GACEMA',
    "aprobado por gacema": 'PENDIENTE',
    reuf: 'NO',
    Suspendido: false,
    categoria: []
  });

  useEffect(() => {
    if (relator) {
      setFormData(relator);
    }
  }, [relator]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => {
      const currentCats = prev.categoria || [];
      if (currentCats.includes(category)) {
        return { ...prev, categoria: currentCats.filter(c => c !== category) };
      } else {
        return { ...prev, categoria: [...currentCats, category] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    setTimeout(() => {
      onSave(formData);
      setSaving(false);
    }, 600); // Simulando carga
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#1a1d2e] border border-slate-700 w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col"
      >
        <div className="flex justify-between items-center p-6 border-b border-slate-700/50 shrink-0 bg-[#161822] rounded-t-2xl">
          <h2 className="text-xl font-bold text-white">
            {isEditing ? 'Editar Relator' : 'Agregar Nuevo Relator'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-2">Datos Personales</h3>
              
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nombre Completo *</label>
                <input required name="nombre" value={formData.nombre} onChange={handleChange} className="w-full bg-[#1e2030] border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
              </div>
              
              <div>
                <label className="block text-xs text-slate-400 mb-1">RUT *</label>
                <input required name="rut" value={formData.rut} onChange={handleChange} placeholder="12.345.678-9" className="w-full bg-[#1e2030] border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
              </div>
              
              <div>
                <label className="block text-xs text-slate-400 mb-1">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-[#1e2030] border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Teléfono</label>
                <input name="telefono" value={formData.telefono} onChange={handleChange} className="w-full bg-[#1e2030] border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-2">Datos Profesionales</h3>
              
              <div>
                <label className="block text-xs text-slate-400 mb-1">Profesión *</label>
                <input required name="profesion" value={formData.profesion} onChange={handleChange} className="w-full bg-[#1e2030] border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none uppercase" />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Ciudad *</label>
                <input required name="ciudad" value={formData.ciudad} onChange={handleChange} className="w-full bg-[#1e2030] border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none uppercase" />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Empresa Proveniente</label>
                <input name="procedencia" value={formData.procedencia} onChange={handleChange} className="w-full bg-[#1e2030] border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none uppercase" />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-700/50 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-4">
               <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-2">Estadísticas y Estados</h3>
               
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Estado Gacema</label>
                    <select name="aprobado por gacema" value={formData["aprobado por gacema"]} onChange={handleChange} className="w-full bg-[#1e2030] border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none">
                      <option value="SÍ">SÍ (Aprobado)</option>
                      <option value="NO">NO (No Aprobado)</option>
                      <option value="PENDIENTE">PENDIENTE</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">REUF</label>
                    <select name="reuf" value={formData.reuf} onChange={handleChange} className="w-full bg-[#1e2030] border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none">
                      <option value="SÍ">SÍ (Con REUF)</option>
                      <option value="NO">NO (Sin REUF)</option>
                    </select>
                  </div>
               </div>

               <div className="pt-2">
                 <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border border-slate-700 bg-[#1e2030] hover:bg-slate-800 transition-colors">
                   <input type="checkbox" name="Suspendido" checked={formData.Suspendido} onChange={handleChange} className="w-4 h-4 rounded bg-slate-700 border-slate-600 focus:ring-red-500 focus:ring-offset-slate-900 accent-red-500" />
                   <span className="text-sm text-red-400 font-medium">Marcado como Suspendido</span>
                 </label>
               </div>
             </div>

             <div>
               <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-2">Categorías</h3>
               <div className="flex flex-wrap gap-2">
                 {CATEGORIES.map(cat => {
                   const isSelected = formData.categoria?.includes(cat);
                   return (
                     <button
                       key={cat}
                       type="button"
                       onClick={() => handleCategoryToggle(cat)}
                       className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${isSelected ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-[#1e2030] border-slate-700 text-slate-400 hover:border-slate-500'}`}
                     >
                       {cat}
                     </button>
                   );
                 })}
               </div>
             </div>
          </div>
        </form>

        <div className="p-6 border-t border-slate-700/50 bg-[#161822] flex justify-end gap-3 shrink-0 rounded-b-2xl">
          <button 
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-medium text-slate-300 hover:bg-slate-700/50 transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <Save size={18} />
            )}
            {saving ? 'Guardando...' : 'Guardar Relator'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
