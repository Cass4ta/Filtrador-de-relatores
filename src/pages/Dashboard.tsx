import { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import { useNavigate } from 'react-router-dom';
import { LogOut, Search, Filter, Mail, Phone, MapPin, Award, FileUp, UserPlus, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ImportCsvModal from '../components/ImportCsvModal';
import RelatorFormModal from '../components/RelatorFormModal';
import toast from 'react-hot-toast';

// Types matching EXACT column names from Supabase
interface Relator {
  id: number;
  nombre: string;
  rut: string;
  profesion: string;
  categoria: string[] | null;            // "categoria" (singular, array or null)
  "aprobado por gacema": string;         // "SÍ", "NO", "PENDIENTE" (with spaces in column name)
  reuf: string;                          // "SÍ" or "NO" (uppercase, with accent)
  ciudad: string;
  telefono: string;
  email: string;
  procedencia: string;                   // "GACEMA", "WENUSTORE"
  Suspendido: boolean;                   // Capital S, boolean
  eliminado?: boolean;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [relatores, setRelatores] = useState<Relator[]>([]);
  const [filteredRelatores, setFilteredRelatores] = useState<Relator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [relatorToEdit, setRelatorToEdit] = useState<Relator | null>(null);

  const [relatorToDelete, setRelatorToDelete] = useState<Relator | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedReuf, setSelectedReuf] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Extract unique values for filters
  const cities = Array.from(new Set(relatores.map(r => r.ciudad).filter(Boolean))).sort();
  const categories = Array.from(new Set(relatores.flatMap(r => r.categoria || []))).sort();

  useEffect(() => {
    fetchRelatores();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedCity, selectedStatus, selectedReuf, selectedCategory, relatores]);

  const fetchRelatores = async () => {
    setLoading(true);
    
    // MODO MIXTO: Si hay datos en memoria local, usarlos
    const stored = localStorage.getItem('relatores_demo_data');
    if (stored) {
      const data = JSON.parse(stored);
      if (data && data.length > 0) {
        setRelatores(data);
        setFilteredRelatores(data);
        setLoading(false);
        return;
      }
    }

    const { data, error } = await supabase
      .from('relatores_demo')
      .select('*')
      .is('eliminado', false) // Only fetch non-deleted relatores
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error fetching relatores:', error);
      setError('No se pudieron cargar los relatores. Verifica la conexión con Supabase.');
    } else {
      console.log('Data from Supabase:', data?.[0]); // Debug: log first record
      setRelatores(data || []);
      setFilteredRelatores(data || []);
      // Guardar en memoria local por primera vez
      if (data) localStorage.setItem('relatores_demo_data', JSON.stringify(data));
      setError(null);
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let result = relatores;

    // Search by Name or Profession
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(r => 
        r.nombre?.toLowerCase().includes(lowerTerm) || 
        r.profesion?.toLowerCase().includes(lowerTerm)
      );
    }

    // Filter by City
    if (selectedCity) {
      result = result.filter(r => r.ciudad === selectedCity);
    }

    // Filter by REUF — DB values: "SÍ" or "NO" (uppercase, with accent)
    if (selectedReuf) {
      result = result.filter(r => r.reuf === selectedReuf);
    }

    // Filter by Category
    if (selectedCategory) {
      result = result.filter(r => r.categoria?.includes(selectedCategory));
    }

    // Filter by Status
    // DB: "aprobado por gacema" = "SÍ" | "NO" | "PENDIENTE"
    // DB: "Suspendido" = true | false
    if (selectedStatus) {
      if (selectedStatus === 'Suspendido') {
        result = result.filter(r => r.Suspendido === true);
      } else if (selectedStatus === 'Aprobado') {
        result = result.filter(r => r["aprobado por gacema"] === 'SÍ' && !r.Suspendido);
      } else if (selectedStatus === 'Pendiente') {
        result = result.filter(r => r["aprobado por gacema"] === 'PENDIENTE' && !r.Suspendido);
      } else if (selectedStatus === 'No Aprobado') {
        result = result.filter(r => r["aprobado por gacema"] === 'NO');
      }
    }

    setFilteredRelatores(result);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCity('');
    setSelectedStatus('');
    setSelectedReuf('');
    setSelectedCategory('');
  };

  // Helper: check if relator has REUF (DB value is "SÍ")
  const hasReuf = (r: Relator) => r.reuf === 'SÍ';

  // Handle Soft Delete Simulado
  const handleDelete = () => {
    if (!relatorToDelete) return;
    setIsDeleting(true);

    setTimeout(() => {
      const newRelatores = relatores.filter(r => r.id !== relatorToDelete.id);
      setRelatores(newRelatores);
      localStorage.setItem('relatores_demo_data', JSON.stringify(newRelatores));
      
      setIsDeleting(false);
      toast.success('Simulado: Relator eliminado del navegador');
      setRelatorToDelete(null);
    }, 600);
  };

  const handleSaveRelator = (formData: Partial<Relator>) => {
    let newRelatores = [...relatores];
    if (relatorToEdit) {
      newRelatores = newRelatores.map(r => r.id === relatorToEdit.id ? { ...r, ...formData } as Relator : r);
      toast.success('Simulado: Cambios guardados localmente ✨');
    } else {
      const newId = Math.max(...newRelatores.map(r => r.id || 0), 1000) + 1;
      newRelatores.push({ ...formData, id: newId } as Relator);
      toast.success('Simulado: Relator creado localmente ✨');
    }
    setRelatores(newRelatores);
    localStorage.setItem('relatores_demo_data', JSON.stringify(newRelatores));
    setIsFormModalOpen(false);
  };

  const handleImportCsv = (newRows: Partial<Relator>[]) => {
    let currentMaxId = Math.max(...relatores.map(r => r.id || 0), 1000);
    const rowsWithIds = newRows.map(row => {
      currentMaxId++;
      return { ...row, id: currentMaxId } as Relator;
    });
    const newRelatores = [...relatores, ...rowsWithIds];
    setRelatores(newRelatores);
    localStorage.setItem('relatores_demo_data', JSON.stringify(newRelatores));
    toast.success(`Simulado: ${newRows.length} importados localmente ✨`);
    setShowImportModal(false);
  };

  return (
    <div className="min-h-screen bg-[#0f1117] font-sans text-white">
      {/* Navbar */}
      <nav className="bg-[#161822] border-b border-slate-700/50 sticky top-0 z-50 shadow-lg shadow-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-500/20">
                <Filter size={20} />
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">Gestión de Relatores</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => { setRelatorToEdit(null); setIsFormModalOpen(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 rounded-lg transition-colors font-medium text-sm"
              >
                <UserPlus size={16} />
                <span className="hidden sm:inline">Nuevo Relator</span>
              </button>
              
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 text-blue-400 rounded-lg transition-colors font-medium text-sm"
              >
                <FileUp size={16} />
                <span className="hidden sm:inline">Importar CSV</span>
              </button>
              
              <div className="text-sm text-slate-400 hidden sm:block bg-slate-800/50 px-3 py-1.5 rounded-lg">
                <span className="text-blue-400 font-semibold">{filteredRelatores.length}</span> resultados
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all"
                title="Cerrar Sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        {/* Search & Filter Panel */}
        <div className="bg-[#161822] rounded-2xl border border-slate-700/50 p-6 mb-8 shadow-xl shadow-black/10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Search Input */}
            <div className="col-span-1 md:col-span-2 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-500" />
              </div>
              <input
                type="text"
                placeholder="Buscar por nombre o profesión..."
                className="block w-full pl-10 pr-3 py-2.5 bg-[#1e2030] border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* City Filter */}
            <select
              className="block w-full px-3 py-2.5 bg-[#1e2030] border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
            >
              <option value="">Todas las ciudades</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              className="block w-full px-3 py-2.5 bg-[#1e2030] border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="Aprobado">Aprobado</option>
              <option value="Pendiente">Pendiente</option>
              <option value="No Aprobado">No Aprobado</option>
              <option value="Suspendido">Suspendido</option>
            </select>

            {/* REUF Filter */}
            <select
              className="block w-full px-3 py-2.5 bg-[#1e2030] border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              value={selectedReuf}
              onChange={(e) => setSelectedReuf(e.target.value)}
            >
              <option value="">REUF (Todos)</option>
              <option value="SÍ">Con REUF</option>
              <option value="NO">Sin REUF</option>
            </select>
             
             {/* Category Filter */}
             <select
              className="block w-full px-3 py-2.5 bg-[#1e2030] border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Todas las categorías</option>
              {categories.map((cat, idx) => (
                <option key={idx} value={cat}>{cat}</option>
              ))}
            </select>
            
            <button 
                onClick={clearFilters}
                className="col-span-1 md:col-span-2 lg:col-span-2 py-2.5 px-4 bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 rounded-xl font-medium transition-colors text-sm border border-slate-700/50"
            >
                Limpiar Filtros
            </button>
          </div>
        </div>

        {/* Results Grid */}
        {loading ? (
          <div className="flex flex-col justify-center items-center h-64 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="text-slate-500 animate-pulse">Cargando relatores...</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
            <p className="text-red-400 font-medium mb-4">{error}</p>
            <button 
                onClick={fetchRelatores}
                className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
            >
                Reintentar
            </button>
          </div>
        ) : filteredRelatores.length === 0 ? (
          <div className="bg-[#161822] border border-slate-700/50 rounded-2xl p-12 text-center">
             <p className="text-slate-500 text-lg">No se encontraron relatores con los filtros seleccionados.</p>
             <button onClick={clearFilters} className="mt-4 text-blue-400 hover:underline">Limpiar todos los filtros</button>
          </div>
        ) : (
          <motion.div 
            layout 
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-start"
          >
            <AnimatePresence>
              {filteredRelatores.map((relator) => {
                const isExpanded = expandedId === relator.id;
                const isSuspended = relator.Suspendido === true;
                const isApproved = relator["aprobado por gacema"] === 'SÍ';
                
                const statusBadge = isSuspended 
                    ? { text: 'Suspendido', classes: 'bg-red-500/15 text-red-400 border-red-500/30' }
                    : isApproved
                    ? { text: 'Activo', classes: 'bg-blue-500/15 text-blue-400 border-blue-500/30' }
                    : { text: 'Pendiente', classes: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };

                // Card border color based on status
                const cardBorder = isSuspended 
                    ? 'border-red-500/40' 
                    : isApproved 
                    ? 'border-blue-500/40' 
                    : 'border-amber-500/30';

                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    key={relator.id}
                    onClick={() => setExpandedId(isExpanded ? null : relator.id)}
                    className={`bg-[#1a1d2e] rounded-2xl border-2 cursor-pointer overflow-hidden transition-all relative
                        ${isExpanded 
                          ? 'border-blue-500 ring-1 ring-blue-500/30 shadow-lg shadow-blue-500/10' 
                          : `${cardBorder} hover:border-slate-500/60 hover:shadow-lg hover:shadow-black/20`
                        }
                    `}
                  >
                    {/* Card Header (Always Visible) */}
                    <div className="p-5">
                        <div className="flex justify-between items-start mb-3">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statusBadge.classes}`}>
                                {statusBadge.text}
                            </span>
                            {hasReuf(relator) && (
                                <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                                    <Award size={12} /> REUF
                                </span>
                            )}
                        </div>
                        
                        <h3 className="text-lg font-bold text-white mb-1 leading-tight">{relator.nombre}</h3>
                        <p className="text-slate-400 text-sm font-medium mb-3">{relator.profesion}</p>
                        
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                            <MapPin size={16} />
                            <span>{relator.ciudad}</span>
                        </div>
                    </div>

                    {/* Expanded Content */}
                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="bg-[#141625] border-t border-slate-700/50 px-5 pb-5"
                            >
                                <div className="pt-4 space-y-3">
                                    <div className="flex items-center gap-3 text-slate-300">
                                        <div className="w-8 h-8 rounded-full bg-[#1e2030] flex items-center justify-center border border-slate-700">
                                            <Mail size={16} className="text-blue-400" />
                                        </div>
                                        <a href={`mailto:${relator.email}`} className="text-sm hover:text-blue-400 hover:underline transition-colors">
                                            {relator.email}
                                        </a>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-300">
                                        <div className="w-8 h-8 rounded-full bg-[#1e2030] flex items-center justify-center border border-slate-700">
                                            <Phone size={16} className="text-green-400" />
                                        </div>
                                        <span className="text-sm">{relator.telefono}</span>
                                    </div>

                                    {relator.categoria && relator.categoria.length > 0 && (
                                      <div className="pt-2">
                                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Categorías</p>
                                          <div className="flex flex-wrap gap-2">
                                              {relator.categoria.map((cat, idx) => (
                                                  <span key={idx} className="bg-[#1e2030] border border-slate-700 text-slate-300 px-2.5 py-1 rounded-lg text-xs">
                                                      {cat}
                                                  </span>
                                              ))}
                                          </div>
                                      </div>
                                    )}

                                    <div className="pt-4 flex justify-between items-center text-xs text-slate-600 border-t border-slate-700/50 mt-4">
                                        <div className="flex gap-4">
                                            <span className="whitespace-nowrap">RUT: {relator.rut}</span>
                                            <span>Empresa: {relator.procedencia}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setRelatorToEdit(relator);
                                                    setIsFormModalOpen(true);
                                                }}
                                                className="px-3 py-1.5 text-blue-400 hover:text-white hover:bg-blue-600/50 rounded-lg transition-colors border border-blue-500/30 flex items-center gap-2"
                                            >
                                                <Edit2 size={14} />
                                                <span>Editar</span>
                                            </button>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setRelatorToDelete(relator);
                                                }}
                                                className="px-3 py-1.5 text-red-400 hover:text-white hover:bg-red-600 rounded-lg transition-colors border border-red-500/30 flex items-center gap-2"
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      {/* Import CSV Modal */}
      <AnimatePresence>
        {showImportModal && (
          <ImportCsvModal 
            existingRelatores={relatores}
            onClose={() => setShowImportModal(false)}
            onSaveMultiple={handleImportCsv}
          />
        )}
      </AnimatePresence>

      {/* Form Modal (Create / Edit) */}
      <AnimatePresence>
        {isFormModalOpen && (
          <RelatorFormModal 
            relator={relatorToEdit}
            onClose={() => setIsFormModalOpen(false)}
            onSave={handleSaveRelator}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {relatorToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#1a1d2e] border border-red-500/30 w-full max-w-md rounded-2xl shadow-2xl p-6"
            >
                <h3 className="text-xl font-bold text-white mb-2">¿Eliminar a {relatorToDelete.nombre}?</h3>
                <p className="text-slate-400 text-sm mb-6">
                    Esta acción ocultará a este relator de la plataforma. Si necesitas recuperarlo en el futuro, contacta al administrador del sistema.
                </p>
                <div className="flex justify-end gap-3">
                    <button 
                        onClick={() => setRelatorToDelete(null)}
                        className="px-4 py-2 font-medium text-slate-300 hover:bg-slate-700/50 rounded-xl transition-colors"
                        disabled={isDeleting}
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="px-4 py-2 font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50"
                    >
                        {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
                    </button>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
