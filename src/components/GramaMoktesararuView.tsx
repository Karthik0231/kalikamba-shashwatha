import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { repository, STANDARD_GRAMAS } from '../lib/repository';
import { GramaMoktesara } from '../types/database';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import {
  Users,
  Search,
  Plus,
  Upload,
  Download,
  Printer,
  Phone,
  MapPin,
  Edit2,
  Trash2,
  X,
  Tag,
  Grid,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Building,
} from 'lucide-react';

export const GramaMoktesararuView: React.FC = () => {
  const { language, showToast } = useApp();

  const [moktesararu, setMoktesararu] = useState<GramaMoktesara[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrama, setSelectedGrama] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone_primary: '',
    phone_secondary: '',
    grama: 'Barkur (ಬಾರಕೂರು)',
    address: '',
    designation: 'ಗ್ರಾಮ ಮೊಕ್ತೇಸರರು (Village Head)',
    notes: '',
  });

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Grid Print Studio
  const [showGridPrintStudio, setShowGridPrintStudio] = useState(false);
  const [gridCols, setGridCols] = useState<2 | 3 | 4>(3);
  const [printIncludeSecondaryPhone, setPrintIncludeSecondaryPhone] = useState(true);
  const [printIncludeDesignation, setPrintIncludeDesignation] = useState(true);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await repository.getMoktesararu();
      setMoktesararu(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Distinct gramas
  const availableGramas = useMemo(() => {
    const set = new Set<string>(STANDARD_GRAMAS);
    moktesararu.forEach(m => {
      if (m.grama) set.add(m.grama);
    });
    return Array.from(set).sort();
  }, [moktesararu]);

  // Open Form
  const openNewForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      phone_primary: '',
      phone_secondary: '',
      grama: selectedGrama || 'Barkur (ಬಾರಕೂರು)',
      address: '',
      designation: 'ಗ್ರಾಮ ಮೊಕ್ತೇಸರರು (Village Head)',
      notes: '',
    });
    setShowFormModal(true);
  };

  const openEditForm = (item: GramaMoktesara) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      phone_primary: item.phone_primary,
      phone_secondary: item.phone_secondary || '',
      grama: item.grama,
      address: item.address,
      designation: item.designation || '',
      notes: item.notes || '',
    });
    setShowFormModal(true);
  };

  // Submit Save
  const handleSaveMoktesara = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast(language === 'kn' ? 'ದಯವಿಟ್ಟು ಹೆಸರು ನಮೂದಿಸಿ' : 'Name is required', 'error');
      return;
    }
    if (!formData.phone_primary.trim()) {
      showToast(language === 'kn' ? 'ದಯವಿಟ್ಟು ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ' : 'Primary phone is required', 'error');
      return;
    }

    try {
      if (editingId) {
        await repository.updateMoktesara(editingId, {
          name: formData.name,
          phone_primary: formData.phone_primary,
          phone_secondary: formData.phone_secondary || undefined,
          grama: formData.grama,
          address: formData.address,
          designation: formData.designation,
          notes: formData.notes,
        });
        showToast(language === 'kn' ? 'ಮಾಹಿತಿ ನವೀಕರಿಸಲಾಗಿದೆ' : 'Moktesara updated', 'success');
      } else {
        await repository.createMoktesara({
          name: formData.name,
          phone_primary: formData.phone_primary,
          phone_secondary: formData.phone_secondary || undefined,
          grama: formData.grama,
          address: formData.address,
          designation: formData.designation,
          notes: formData.notes,
        });
        showToast(language === 'kn' ? 'ಮೊಕ್ತೇಸರರ ವಿವರ ದಾಖಲಾಗಿದೆ!' : 'Moktesara added!', 'success');
      }
      setShowFormModal(false);
      await loadData();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Operation failed', 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(language === 'kn' ? `${name} ಇವರ ದಾಖಲೆಯನ್ನು ಅಳಿಸಲು ನೀವು ಖಚಿತವಾಗಿರುವಿರಾ?` : `Delete ${name}?`)) {
      await repository.deleteMoktesara(id);
      showToast(language === 'kn' ? 'ದಾಖಲೆಯನ್ನು ಅಳಿಸಲಾಗಿದೆ' : 'Record deleted', 'info');
      await loadData();
    }
  };

  // Filter
  const filteredMoktesararu = useMemo(() => {
    return moktesararu.filter(m => {
      if (selectedGrama && m.grama !== selectedGrama) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const normQ = q.replace(/\D/g, '');
        const matchName = m.name.toLowerCase().includes(q);
        const matchPhone1 = m.phone_primary.includes(normQ || q);
        const matchPhone2 = m.phone_secondary ? m.phone_secondary.includes(normQ || q) : false;
        const matchAddress = m.address.toLowerCase().includes(q);
        const matchGrama = m.grama.toLowerCase().includes(q);
        const matchDesig = m.designation ? m.designation.toLowerCase().includes(q) : false;
        if (!matchName && !matchPhone1 && !matchPhone2 && !matchAddress && !matchGrama && !matchDesig) {
          return false;
        }
      }
      return true;
    });
  }, [moktesararu, selectedGrama, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredMoktesararu.length / pageSize) || 1;
  const paginatedMoktesararu = useMemo(() => {
    const from = (currentPage - 1) * pageSize;
    return filteredMoktesararu.slice(from, from + pageSize);
  }, [filteredMoktesararu, currentPage, pageSize]);

  // Export Excel
  const handleExportExcel = () => {
    const rows = filteredMoktesararu.map(m => ({
      'Name': m.name,
      'Grama / Village': m.grama,
      'Designation': m.designation || '',
      'Primary Phone': m.phone_primary,
      'Secondary Phone': m.phone_secondary || '',
      'Address': m.address,
      'Remarks': m.notes || '',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Grama Moktesararu');
    XLSX.writeFile(wb, `Kalikamba_Grama_Moktesararu_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast(language === 'kn' ? 'ಎಕ್ಸೆಲ್ ಫೈಲ್ ಡೌನ್‌ಲೋಡ್ ಆಗಿದೆ' : 'Excel downloaded', 'success');
  };

  // Bulk Upload File Handler
  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const isCsv = file.name.endsWith('.csv');

    const processRows = async (jsonRows: any[]) => {
      try {
        const items: Omit<GramaMoktesara, 'id' | 'created_at'>[] = [];
        for (const row of jsonRows) {
          const name = row['Name'] || row['ಹೆಸರು'] || row['Moktesara Name'] || Object.values(row)[0];
          const phone1 = String(row['Phone'] || row['Mobile'] || row['ದೂರವಾಣಿ'] || Object.values(row)[1] || '');
          const phone2 = String(row['Alternate Phone'] || row['Secondary Phone'] || row['ಪರ್ಯಾಯ ಫೋನ್'] || '');
          const grama = String(row['Grama'] || row['Village'] || row['ಗ್ರಾಮ'] || 'Barkur (ಬಾರಕೂರು)');
          const address = String(row['Address'] || row['ವಿಳಾಸ'] || '');
          const desig = String(row['Designation'] || row['ಹುದ್ದೆ'] || 'ಗ್ರಾಮ ಮೊಕ್ತೇಸರರು');

          if (name) {
            items.push({
              name: String(name).trim(),
              phone_primary: phone1.trim(),
              phone_secondary: phone2.trim() || undefined,
              grama: grama.trim(),
              address: address.trim(),
              designation: desig.trim(),
              notes: row['Notes'] || row['Remarks'] || '',
            });
          }
        }

        if (items.length > 0) {
          const count = await repository.bulkImportMoktesararu(items);
          showToast(language === 'kn' ? `${count} ಮೊಕ್ತೇಸರರ ದಾಖಲೆಗಳು ಆಮದಾಗಿದೆ!` : `Imported ${count} records!`, 'success');
          setShowUploadModal(false);
          await loadData();
        } else {
          showToast('No valid rows found in file', 'error');
        }
      } catch (err: any) {
        console.error(err);
        showToast('Import error: ' + err.message, 'error');
      } finally {
        setUploading(false);
      }
    };

    const reader = new FileReader();
    if (isCsv) {
      reader.onload = evt => {
        const text = evt.target?.result as string;
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: res => processRows(res.data),
        });
      };
      reader.readAsText(file);
    } else {
      reader.onload = evt => {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        processRows(XLSX.utils.sheet_to_json(ws));
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const triggerGridPrint = () => {
    window.print();
  };


  return (
    <div className="space-y-4">
      {/* PRINT VIEW */}
      <div className="hidden print:block print-sheet text-black font-sans p-4 bg-white w-full">
        <div className="text-center border-b-2 border-black pb-3 mb-4">
          <h1 className="text-xl font-bold">ಶ್ರೀ ಕಾಳಿಕಾಂಬಾ ದೇವಸ್ಥಾನ ಬಾರಕೂರು</h1>
          <h2 className="text-sm font-semibold">ಗ್ರಾಮ ಮೊಕ್ತೇಸರರ ಅಧಿಕೃತ ಸಂಪರ್ಕ ಪಟ್ಟಿ / Grama Moktesararu Official Directory</h2>
          <p className="text-xs text-gray-700">Total: {filteredMoktesararu.length} Village Representatives | Printed: {new Date().toLocaleDateString('en-IN')}</p>
        </div>
        <div className={`grid gap-2.5 w-full ${gridCols === 2 ? 'grid-cols-2' : gridCols === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
          {filteredMoktesararu.map(m => (
            <div key={m.id} className="border border-gray-400 p-2.5 rounded flex flex-col justify-between min-h-[95px] break-inside-avoid text-xs">
              <div>
                <div className="flex items-center justify-between border-b border-gray-200 pb-0.5 mb-1 text-[10px] text-gray-600 font-bold">
                  <span>{m.grama}</span>
                  {printIncludeDesignation && <span>{m.designation || 'ಮೊಕ್ತೇಸರರು'}</span>}
                </div>
                <div className="font-bold text-sm text-black leading-tight">{m.name}</div>
                <div className="text-gray-800 text-[11px] leading-snug mt-1">{m.address}</div>
                <div className="text-[10px] text-gray-700 mt-1">Mob: {m.phone_primary}{printIncludeSecondaryPhone && m.phone_secondary ? ` / ${m.phone_secondary}` : ''}</div>
              </div>
              <div className="text-[8px] text-gray-400 text-right italic pt-0.5 border-t border-gray-100 mt-1">Sri Kalikamba Temple Barkur</div>
            </div>
          ))}
        </div>
      </div>

      {/* TOP BAR */}
      <div className="flex flex-wrap items-start justify-between gap-4 no-print">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            {language === 'kn' ? 'ಗ್ರಾಮ ಮೊಕ್ತೇಸರರ ಪಟ್ಟಿ' : 'Grama Moktesararu (Village Heads)'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {language === 'kn' ? 'ಅಧಿಕೃತ ಗ್ರಾಮ ಪ್ರತಿನಿಧಿಗಳ ಸಂಪರ್ಕ ಡೈರೆಕ್ಟರಿ' : 'Official directory of village heads, contacts & addresses'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={openNewForm} className="btn-primary">
            <Plus className="w-3.5 h-3.5" />
            <span>{language === 'kn' ? 'ಹೊಸ ಮೊಕ್ತೇಸರರು' : 'Add Moktesara'}</span>
          </button>
          <button onClick={() => setShowGridPrintStudio(true)} className="btn-secondary" title="Grid Print Studio">
            <Grid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{language === 'kn' ? 'ಗ್ರಿಡ್ ಪ್ರಿಂಟ್' : 'Print Grid'}</span>
          </button>
          <button onClick={() => setShowUploadModal(true)} className="btn-secondary" title="Bulk upload"><Upload className="w-3.5 h-3.5" /></button>
          <button onClick={handleExportExcel} className="btn-secondary" title="Export Excel"><Download className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="section-card p-4 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
          <div className="sm:col-span-6 relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder={language === 'kn' ? 'ಮೊಕ್ತೇಸರರ ಹೆಸರು, ಗ್ರಾಮ, ಫೋನ್...' : 'Search name, village, phone, designation...'}
              className="filter-input pl-9 pr-8"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="sm:col-span-4">
            <select value={selectedGrama} onChange={e => { setSelectedGrama(e.target.value); setCurrentPage(1); }} className="filter-input">
              <option value="">All Gramas / ಎಲ್ಲಾ ಗ್ರಾಮಗಳು</option>
              {availableGramas.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2 flex justify-end">
            {(searchQuery || selectedGrama) && (
              <button onClick={() => { setSearchQuery(''); setSelectedGrama(''); setCurrentPage(1); }} className="btn-ghost !text-rose-600 dark:!text-rose-400">
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-0.5 no-print">
        <span>
          <strong className="text-slate-800 dark:text-slate-100">{filteredMoktesararu.length}</strong> village representatives
        </span>
        {selectedGrama && (
          <span className="font-semibold text-emerald-700 dark:text-emerald-400">Filtering: {selectedGrama}</span>
        )}
      </div>

      {/* TABLE */}
      <div className="section-card overflow-hidden no-print">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Grama / Village</th>
                <th>Name</th>
                <th>Primary Phone</th>
                <th>Secondary Phone</th>
                <th>Designation</th>
                <th>Address</th>
                <th className="!text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-14 !text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                      <span>Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedMoktesararu.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 !text-center">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No village heads found</p>
                    <p className="text-slate-400 mt-1">Try clearing your search or add a new village representative.</p>
                  </td>
                </tr>
              ) : (
                paginatedMoktesararu.map(m => (
                  <tr key={m.id}>
                    <td>
                      <span className="badge badge-slate whitespace-nowrap">{m.grama}</span>
                    </td>
                    <td>
                      <div className="font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">{m.name}</div>
                      {m.notes && <div className="text-[11px] text-slate-500 mt-0.5">{m.notes}</div>}
                    </td>
                    <td>
                      <a href={`tel:${m.phone_primary}`} className="text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1.5 font-medium whitespace-nowrap">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="tabular-nums">{m.phone_primary}</span>
                      </a>
                    </td>
                    <td>
                      {m.phone_secondary ? (
                        <a href={`tel:${m.phone_secondary}`} className="hover:underline text-slate-600 dark:text-slate-400 tabular-nums whitespace-nowrap">{m.phone_secondary}</a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td>
                      <span className="text-slate-700 dark:text-slate-300 whitespace-nowrap">{m.designation || 'ಗ್ರಾಮ ಮೊಕ್ತೇಸರರು'}</span>
                    </td>
                    <td className="max-w-[200px]">
                      <span className="truncate block text-slate-600 dark:text-slate-400" title={m.address}>{m.address}</span>
                    </td>
                    <td className="!text-center">
                      <div className="inline-flex items-center gap-0.5">
                        <button onClick={() => openEditForm(m)} className="btn-ghost !px-2 !py-1.5" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(m.id, m.name)} className="btn-ghost !px-2 !py-1.5 !text-rose-500 hover:!bg-rose-50 dark:hover:!bg-rose-950/30" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <span>Rows:</span>
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} className="filter-input !w-auto !py-1 !px-2">
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span>
              <strong className="text-slate-800 dark:text-slate-100">{filteredMoktesararu.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</strong>
              {' – '}
              <strong className="text-slate-800 dark:text-slate-100">{Math.min(currentPage * pageSize, filteredMoktesararu.length)}</strong>
              {' of '}
              <strong className="text-slate-800 dark:text-slate-100">{filteredMoktesararu.length}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)} className="btn-secondary !px-3 !py-1.5 disabled:opacity-40">
              <ChevronLeft className="w-3.5 h-3.5" /><span>Prev</span>
            </button>
            <span className="px-2 font-semibold">{currentPage} / {totalPages}</span>
            <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="btn-secondary !px-3 !py-1.5 disabled:opacity-40">
              <span>Next</span><ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* GRID PRINT STUDIO MODAL */}
      {showGridPrintStudio && (
        <div className="modal-overlay no-print">
          <div className="modal-panel max-w-4xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Grid className="w-4 h-4 text-amber-600" />
                  {language === 'kn' ? 'ಮೊಕ್ತೇಸರರ ಗ್ರಿಡ್ ಪ್ರಿಂಟ್ ಸ್ಟುಡಿಯೋ' : 'Grama Moktesararu Grid Print Studio'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Print official contact cards in 2, 3, or 4 column grid</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={triggerGridPrint} className="btn-primary"><Printer className="w-3.5 h-3.5" /><span>Print Now</span></button>
                <button onClick={() => setShowGridPrintStudio(false)} className="btn-ghost"><X className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="form-label !mb-0">Columns:</span>
                <div className="flex gap-1">
                  {[2,3,4].map(c => (
                    <button key={c} onClick={() => setGridCols(c as any)} className={`px-4 py-2 rounded-lg font-semibold text-xs transition-colors ${gridCols === c ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>{c} Cols</button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4 font-medium text-slate-700 dark:text-slate-300">
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input type="checkbox" checked={printIncludeSecondaryPhone} onChange={e => setPrintIncludeSecondaryPhone(e.target.checked)} className="rounded text-emerald-600" />
                  <span>Secondary Phone</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input type="checkbox" checked={printIncludeDesignation} onChange={e => setPrintIncludeDesignation(e.target.checked)} className="rounded text-emerald-600" />
                  <span>Designation</span>
                </label>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-slate-100 dark:bg-slate-950">
              <div className={`grid gap-2.5 ${gridCols === 2 ? 'grid-cols-2' : gridCols === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
                {filteredMoktesararu.slice(0, 12).map(m => (
                  <div key={m.id} className="bg-white text-black p-2.5 rounded border border-gray-300 flex flex-col justify-between text-xs min-h-[90px]">
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-gray-500 font-bold border-b border-gray-100 pb-0.5 mb-1">
                        <span>{m.grama}</span>
                        {printIncludeDesignation && <span>{m.designation || 'ಮೊಕ್ತೇಸರರು'}</span>}
                      </div>
                      <div className="font-bold text-sm">{m.name}</div>
                      <div className="text-gray-700 text-[11px] leading-snug mt-0.5">{m.address}</div>
                      <div className="text-[10px] text-gray-700 mt-1">Ph: {m.phone_primary}{printIncludeSecondaryPhone && m.phone_secondary ? ` / ${m.phone_secondary}` : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT MOKTESARA MODAL */}
      {showFormModal && (
        <div className="modal-overlay no-print">
          <div className="modal-panel max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {editingId ? (language === 'kn' ? 'ಮೊಕ್ತೇಸರರ ವಿವರ ತಿದ್ದುಪಡಿ' : 'Edit Moktesara Details') : (language === 'kn' ? 'ಹೊಸ ಗ್ರಾಮ ಮೊಕ್ತೇಸರರ ನೋಂದಣಿ' : 'Add Village Representative')}
              </h3>
              <button onClick={() => setShowFormModal(false)} className="btn-ghost !px-2"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveMoktesara} className="p-5 space-y-3.5">
              <div>
                <label className="form-label">Name (ಹೆಸರು) <span className="text-rose-500 normal-case">*</span></label>
                <input type="text" required placeholder="e.g. ಶಂಕರ ಆಚಾರ್ಯ / Shankara Acharya" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="form-input" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Primary Phone <span className="text-rose-500 normal-case">*</span></label>
                  <input type="tel" required value={formData.phone_primary} onChange={e => setFormData({ ...formData, phone_primary: e.target.value })} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Secondary Phone</label>
                  <input type="tel" placeholder="Optional" value={formData.phone_secondary} onChange={e => setFormData({ ...formData, phone_secondary: e.target.value })} className="form-input" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Grama (ಗ್ರಾಮ) <span className="text-rose-500 normal-case">*</span></label>
                  <select value={formData.grama} onChange={e => setFormData({ ...formData, grama: e.target.value })} className="form-input">
                    {availableGramas.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Designation</label>
                  <input type="text" value={formData.designation} onChange={e => setFormData({ ...formData, designation: e.target.value })} className="form-input" />
                </div>
              </div>

              <div>
                <label className="form-label">Address (ವಿಳಾಸ)</label>
                <textarea rows={2} placeholder="Street, Landmark, Pincode" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="form-input resize-none" />
              </div>

              <div>
                <label className="form-label">Notes / Remarks</label>
                <input type="text" placeholder="Additional responsibility..." value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="form-input" />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setShowFormModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editingId ? 'Save Changes' : 'Save Moktesara'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK UPLOAD MODAL */}
      {showUploadModal && (
        <div className="modal-overlay no-print">
          <div className="modal-panel max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Bulk Upload Moktesararu</h3>
              <button onClick={() => setShowUploadModal(false)} className="btn-ghost !px-2"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5">
              <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl space-y-3 text-center">
                <Upload className="w-8 h-8 mx-auto text-slate-400" />
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Select .xlsx or .csv file</p>
                  <p className="text-xs text-slate-500 mt-1">Columns: Name, Primary Phone, Secondary Phone, Grama, Address, Designation</p>
                </div>
                <label className="btn-primary cursor-pointer">
                  <span>{uploading ? 'Processing...' : 'Browse File'}</span>
                  <input type="file" accept=".csv, .xlsx, .xls" disabled={uploading} onChange={handleBulkUpload} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
