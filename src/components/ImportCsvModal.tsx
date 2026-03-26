import { useState, useRef } from 'react';
import { X, Upload, Download, CheckCircle, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import { supabase } from '../supabase/client';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface Relator {
  id: number;
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
}

interface ImportCsvModalProps {
  existingRelatores: Relator[];
  onClose: () => void;
  onSaveMultiple: (rows: Partial<Relator>[]) => void;
}

interface ParsedRow {
  nombre?: string;
  rut?: string;
  profesion?: string;
  categoria?: string; 
  "aprobado por gacema"?: string;
  reuf?: string;
  ciudad?: string;
  telefono?: string;
  email?: string;
  procedencia?: string;
  Suspendido?: string;
}

interface ValidatedRow {
  data: Partial<Relator>;
  isValid: boolean;
  errors: string[];
  isDuplicate: boolean;
}

export default function ImportCsvModal({ existingRelatores, onClose, onSaveMultiple }: ImportCsvModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [validating, setValidating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<ValidatedRow[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const headers = [
      'nombre', 'rut', 'profesion', 'categoria', 
      'aprobado por gacema', 'reuf', 'ciudad', 
      'telefono', 'email', 'procedencia', 'Suspendido'
    ];
    const example = [
      'Juan Perez', '12.345.678-9', 'INGENIERO DE MINAS', 'MINERÍA, SEGURIDAD', 
      'SÍ', 'NO', 'ANTOFAGASTA', 
      '987654321', 'juan@ejemplo.cl', 'GACEMA', 'FALSE'
    ];
    
    const csvContent = Papa.unparse([headers, example]);
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'plantilla_relatores.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    if (!selectedFile.name.endsWith('.csv')) {
      setErrorMsg('El archivo debe ser un .csv');
      return;
    }

    setFile(selectedFile);
    setErrorMsg(null);
    setValidating(true);
    setResults(null);

    Papa.parse<ParsedRow>(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        validateData(results.data);
      },
      error: (error) => {
        setErrorMsg('Error leyendo el archivo: ' + error.message);
        setValidating(false);
      }
    });
  };

  const validateData = (parsedData: ParsedRow[]) => {
    const validatedRows: ValidatedRow[] = parsedData.map((row) => {
      const errors: string[] = [];
      let isDuplicate = false;

      // 1. Required fields
      if (!row.nombre) errors.push('Nombre es requerido');
      if (!row.profesion) errors.push('Profesión es requerida');
      if (!row.ciudad) errors.push('Ciudad es requerida');
      
      // 2. Validate enums
      const aprobado = row['aprobado por gacema']?.toUpperCase().trim();
      if (!['SÍ', 'NO', 'PENDIENTE'].includes(aprobado || '')) {
        errors.push('Aprobado debe ser SÍ, NO o PENDIENTE');
      }

      const reuf = row.reuf?.toUpperCase().trim();
      if (!['SÍ', 'NO'].includes(reuf || '')) {
        errors.push('REUF debe ser SÍ o NO');
      }

      // 3. Boolean check
      const suspendidoRaw = row.Suspendido?.toUpperCase().trim();
      if (!['TRUE', 'FALSE'].includes(suspendidoRaw || '')) {
        errors.push('Suspendido debe ser TRUE o FALSE');
      }
      
      const isSuspendido = suspendidoRaw === 'TRUE';

      // 4. Categories structure (comma separated in CSV)
      let categoriasArray: string[] | null = null;
      if (row.categoria) {
        categoriasArray = row.categoria.split(',').map(c => c.trim().toUpperCase()).filter(c => c.length > 0);
      }

      // 5. Duplicates check
      if (row.rut) {
        isDuplicate = existingRelatores.some(r => r.rut === row.rut?.trim());
      } else if (row.nombre) {
        // Fallback duplicate check by name if no RUT
        isDuplicate = existingRelatores.some(r => r.nombre.toLowerCase() === row.nombre?.toLowerCase().trim());
      }

      // Prepared data for insert
      const dataToInsert: Partial<Relator> = {
        nombre: row.nombre?.trim(),
        rut: row.rut?.trim() || '',
        profesion: row.profesion?.toUpperCase().trim(),
        categoria: categoriasArray,
        "aprobado por gacema": aprobado || 'PENDIENTE',
        reuf: reuf || 'NO',
        ciudad: row.ciudad?.toUpperCase().trim(),
        telefono: row.telefono?.trim() || '',
        email: row.email?.trim() || '',
        procedencia: row.procedencia?.toUpperCase().trim() || '',
        Suspendido: isSuspendido
      };

      return {
        data: dataToInsert,
        isValid: errors.length === 0,
        errors,
        isDuplicate
      };
    });

    setResults(validatedRows);
    setValidating(false);
  };

  const handleImport = async () => {
    if (!results) return;

    const rowsToInsert = results
      .filter(r => r.isValid && !r.isDuplicate)
      .map(r => r.data);

    if (rowsToInsert.length === 0) {
      setErrorMsg('No hay filas válidas nuevas para importar.');
      return;
    }

    setUploading(true);
    setErrorMsg(null);

    setTimeout(() => {
      onSaveMultiple(rowsToInsert);
      setUploading(false);
    }, 1000); // Simulando carga
  };

  const validNewRows = results?.filter(r => r.isValid && !r.isDuplicate) || [];
  const invalidRows = results?.filter(r => !r.isValid) || [];
  const duplicateRows = results?.filter(r => r.isValid && r.isDuplicate) || [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#1a1d2e] border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex justify-between items-center p-6 border-b border-slate-700/50">
          <h2 className="text-xl font-bold text-white">Importar Relatores via CSV</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {/* Step 1: Download Template */}
          <div className="mb-8 bg-[#1e2030] p-5 rounded-xl border border-slate-700">
            <h3 className="text-slate-200 font-semibold mb-2">1. Descarga la plantilla</h3>
            <p className="text-slate-400 text-sm mb-4">
              Usa este archivo CSV como base para asegurar que todas las columnas tienen el nombre correcto. 
              Recuerda las reglas: el campo "aprobado por gacema" acepta SÍ, NO, PENDIENTE; "reuf" acepta SÍ, NO y "Suspendido" FALSE, TRUE.
            </p>
            <button 
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-blue-400 rounded-lg transition-colors border border-slate-600 font-medium text-sm"
            >
              <Download size={16} /> Descargar Plantilla CSV
            </button>
          </div>

          {/* Step 2: Upload File */}
          <div className="mb-6">
            <h3 className="text-slate-200 font-semibold mb-3">2. Sube tu archivo completo</h3>
            
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-700 hover:border-blue-500 hover:bg-blue-500/5 rounded-xl transition-all cursor-pointer group"
            >
              <Upload className="w-10 h-10 text-slate-500 group-hover:text-blue-400 mb-3" />
              <p className="text-slate-300 font-medium mb-1">Haz clic para seleccionar un archivo .csv</p>
              {file && <p className="text-green-400 text-sm mt-2 font-medium">Seleccionado: {file.name}</p>}
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex gap-3">
              <AlertCircle className="shrink-0 w-5 h-5" />
              <p>{errorMsg}</p>
            </div>
          )}

          {/* Step 3: Validation Results */}
          {validating && <p className="text-slate-400 text-center py-4">Validando archivo...</p>}
          
          {results && !validating && (
            <div className="bg-[#1e2030] rounded-xl border border-slate-700 overflow-hidden">
              <div className="p-4 border-b border-slate-700 bg-slate-800/30">
                <h3 className="text-slate-200 font-semibold">Resumen de Importación</h3>
              </div>
              
              <div className="p-5 grid grid-cols-3 gap-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-lg text-center">
                  <span className="block text-2xl font-bold text-emerald-400 mb-1">{validNewRows.length}</span>
                  <span className="text-xs text-emerald-500 font-medium uppercase tracking-wider">Válidos Nuevos</span>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg text-center">
                  <span className="block text-2xl font-bold text-amber-400 mb-1">{duplicateRows.length}</span>
                  <span className="text-xs text-amber-500 font-medium uppercase tracking-wider">Duplicados</span>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg text-center">
                  <span className="block text-2xl font-bold text-red-400 mb-1">{invalidRows.length}</span>
                  <span className="text-xs text-red-500 font-medium uppercase tracking-wider">Con Errores</span>
                </div>
              </div>

              {invalidRows.length > 0 && (
                <div className="px-5 pb-5">
                  <h4 className="text-slate-400 text-sm font-semibold mb-2">Detalle de errores (primeros 5):</h4>
                  <ul className="text-sm text-red-400 space-y-2">
                    {invalidRows.slice(0, 5).map((r, i) => (
                      <li key={i} className="bg-red-500/5 p-2 rounded border border-red-500/10">
                        <span className="font-medium text-slate-300">Fila: </span>{r.data.nombre || 'Sin nombre'} - {r.errors.join(', ')}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-700/50 bg-[#161822] flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-medium text-slate-300 hover:bg-slate-700/50 transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleImport}
            disabled={!results || validNewRows.length === 0 || uploading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <CheckCircle size={18} />
            )}
            {uploading ? 'Importando...' : `Importar ${validNewRows.length} Relatores`}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
