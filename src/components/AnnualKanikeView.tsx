import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { repository, STANDARD_GRAMAS, KANIKE_CATEGORIES_PRESET } from '../lib/repository';
import { KanikeItem, GramaMoktesara } from '../types/database';
import * as XLSX from 'xlsx';
import {
  Calendar,
  Search,
  Plus,
  Printer,
  Phone,
  MapPin,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Layers,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Check,
  ChevronDown,
  Receipt,
  Download,
} from 'lucide-react';

export const AnnualKanikeView: React.FC = () => {
  const { language, showToast } = useApp();

  const [items, setItems] = useState<KanikeItem[]>([]);
  const [moktesararuList, setMoktesararuList] = useState<GramaMoktesara[]>([]);
  const [loading, setLoading] = useState(true);

  // Available Years and Events
  const [availableYears, setAvailableYears] = useState<number[]>([2026, 2025, 2024]);
  const [availableEvents, setAvailableEvents] = useState<string[]>([
    'Deepotsava (ದೀಪೋತ್ಸವ)',
    'Prathishta Mahotsava (ಪ್ರತಿಷ್ಠಾ ಮಹೋತ್ಸವ)',
    'Kalakanike (ಕಾಲಕಾಣಿಕೆ)',
    'Rathotsava (ರಥೋತ್ಸವ)',
  ]);

  // Active Selections
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedEvent, setSelectedEvent] = useState<string>('Deepotsava (ದೀಪೋತ್ಸವ)');

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [gramaFilter, setGramaFilter] = useState('');
  const [moktesaraFilter, setMoktesaraFilter] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Add Kanike Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [isCustomCategoryMode, setIsCustomCategoryMode] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');

  // Searchable Dropdown for Moktesara Selection
  const [moktesaraSearchQuery, setMoktesaraSearchQuery] = useState('');
  const [isMoktesaraDropdownOpen, setIsMoktesaraDropdownOpen] = useState(false);
  const moktesaraDropdownRef = useRef<HTMLDivElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    moktesara_id: '',
    moktesara_name: '',
    grama: 'Barkur (ಬಾರಕೂರು)',
    phone: '',
    people_count: '',
    kanike_type: KANIKE_CATEGORIES_PRESET[0],
    amount: '',
    receipt_number: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Custom Event Modal
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [newEventName, setNewEventName] = useState('');

  // Printable Register Sheet Modal
  const [showPrintRegister, setShowPrintRegister] = useState(false);

  // Printable Official Receipt Modal for Moktesara
  const [receiptRecord, setReceiptRecord] = useState<KanikeItem | null>(null);

  // Customizable Receipt Settings
  const [receiptNoteCustom, setReceiptNoteCustom] = useState(
    'ಶ್ರೀ ಕಾಳಿಕಾಂಬಾ ದೇವಿಯ ದೀಪೋತ್ಸವ/ಉತ್ಸವ ನಿಮಿತ್ತ ಊರಿನ ಭಕ್ತರಿಂದ ಸಂಗ್ರಹಿಸಿದ ಕಾಣಿಕೆಯನ್ನು ದೇವಸ್ಥಾನದ ಭಂಡಾರಕ್ಕೆ ಅಧಿಕೃತವಾಗಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ.'
  );
  const [receiptAuthorizedBy, setReceiptAuthorizedBy] = useState('ಆಡಳಿತ ಮಂಡಳಿ / ಕಾರ್ಯದರ್ಶಿ');
  const [receiptShowGrama, setReceiptShowGrama] = useState(true);
  const [receiptShowPeopleCount, setReceiptShowPeopleCount] = useState(true);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moktesaraDropdownRef.current && !moktesaraDropdownRef.current.contains(event.target as Node)) {
        setIsMoktesaraDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch initial data
  const loadData = async () => {
    setLoading(true);
    try {
      const [allItems, allMoktesararu, years, events] = await Promise.all([
        repository.getKanikeItems(),
        repository.getMoktesararu(),
        repository.getAvailableKanikeYears(),
        repository.getAvailableKanikeEvents(),
      ]);
      setItems(allItems);
      setMoktesararuList(allMoktesararu);
      if (years.length > 0) setAvailableYears(years);
      if (events.length > 0) setAvailableEvents(events);
    } catch {
      showToast('ಕಾಣಿಕೆ ವಿವರಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಿಲ್ಲ', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter items by Year and Festival Event
  const eventScopedItems = useMemo(() => {
    return items.filter(it => it.year === selectedYear && it.festival_event === selectedEvent);
  }, [items, selectedYear, selectedEvent]);

  // Computed Grand Totals & Counts
  const { grandTotal, totalPeopleCount, totalBatches } = useMemo(() => {
    let total = 0;
    let people = 0;
    eventScopedItems.forEach(it => {
      total += Number(it.amount) || 0;
      people += Number(it.people_count) || 0;
    });
    return {
      grandTotal: total,
      totalPeopleCount: people,
      totalBatches: eventScopedItems.length,
    };
  }, [eventScopedItems]);

  // Filtered Items for Table Display
  const filteredItems = useMemo(() => {
    return eventScopedItems.filter(item => {
      if (categoryFilter && item.kanike_type !== categoryFilter) return false;
      if (gramaFilter && item.grama !== gramaFilter) return false;
      if (moktesaraFilter && item.moktesara_name !== moktesaraFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesMoktesara = item.moktesara_name.toLowerCase().includes(q);
        const matchesPhone = item.phone?.toLowerCase().includes(q);
        const matchesReceipt = item.receipt_number?.toLowerCase().includes(q);
        const matchesGrama = item.grama.toLowerCase().includes(q);
        if (!matchesMoktesara && !matchesPhone && !matchesReceipt && !matchesGrama) return false;
      }
      return true;
    });
  }, [eventScopedItems, categoryFilter, gramaFilter, moktesaraFilter, searchQuery]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, gramaFilter, moktesaraFilter, selectedYear, selectedEvent, pageSize]);

  // Filter Moktesararu for Searchable Dropdown in Add Modal
  const filteredMoktesararuDropdown = useMemo(() => {
    if (!moktesaraSearchQuery.trim()) return moktesararuList;
    const q = moktesaraSearchQuery.toLowerCase().trim();
    return moktesararuList.filter(
      m => m.name.toLowerCase().includes(q) || m.grama.toLowerCase().includes(q) || m.phone_primary.includes(q)
    );
  }, [moktesararuList, moktesaraSearchQuery]);

  // Select Moktesara from Dropdown
  const handleSelectMoktesara = (m: GramaMoktesara) => {
    setFormData(prev => ({
      ...prev,
      moktesara_id: m.id,
      moktesara_name: m.name,
      grama: m.grama,
      phone: m.phone_primary,
    }));
    setIsMoktesaraDropdownOpen(false);
    setMoktesaraSearchQuery('');
  };

  // Submit Kanike Remittance
  const handleSubmitKanike = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.moktesara_name.trim()) {
      showToast('ದಯವಿಟ್ಟು ಗ್ರಾಮ ಮೊಕ್ತೇಸರರ ಹೆಸರನ್ನು ಆಯ್ಕೆಮಾಡಿ', 'error');
      return;
    }
    const amt = parseFloat(formData.amount);
    if (isNaN(amt) || amt <= 0) {
      showToast('ದಯವಿಟ್ಟು ಮಾನ್ಯ ಸಂಗ್ರಹ ಮೊತ್ತವನ್ನು ನಮೂದಿಸಿ', 'error');
      return;
    }
    const people = parseInt(formData.people_count, 10);
    if (isNaN(people) || people <= 0) {
      showToast('ದಯವಿಟ್ಟು ದೇಣಿಗೆ ನೀಡಿದ ಜನರ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ', 'error');
      return;
    }

    const categoryToSave = isCustomCategoryMode
      ? customCategoryInput.trim() || 'ಇತರ ಕಾಣಿಕೆ (Other)'
      : formData.kanike_type;

    try {
      const generatedReceipt =
        formData.receipt_number.trim() ||
        `MK-${selectedYear}-${Date.now().toString().slice(-4)}`;

      const created = await repository.addKanikeItem({
        year: selectedYear,
        festival_event: selectedEvent,
        moktesara_id: formData.moktesara_id || undefined,
        moktesara_name: formData.moktesara_name.trim(),
        grama: formData.grama,
        phone: formData.phone.trim() || undefined,
        people_count: people,
        kanike_type: categoryToSave,
        amount: amt,
        receipt_number: generatedReceipt,
        date: formData.date || new Date().toISOString().split('T')[0],
        notes: formData.notes.trim() || undefined,
      });

      setItems(prev => [created, ...prev]);
      setShowAddModal(false);
      setFormData({
        moktesara_id: '',
        moktesara_name: '',
        grama: 'Barkur (ಬಾರಕೂರು)',
        phone: '',
        people_count: '',
        kanike_type: KANIKE_CATEGORIES_PRESET[0],
        amount: '',
        receipt_number: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setIsCustomCategoryMode(false);
      setCustomCategoryInput('');
      showToast(`ಮೊಕ್ತೇಸರರ ಕಾಣಿಕೆ ಸಂಗ್ರಹ ದಾಖಲಿಸಲಾಗಿದೆ: ₹${amt.toLocaleString('en-IN')}`, 'success');
    } catch {
      showToast('ಕಾಣಿಕೆ ಸೇರಿಸುವಲ್ಲಿ ದೋಷ ಸಂಭವಿಸಿದೆ', 'error');
    }
  };

  // Delete Kanike Remittance Record
  const handleDeleteKanike = async (id: string, name: string) => {
    if (!window.confirm(`ಖಂಡಿತವಾಗಿ ಈ ದಾಖಲೆಯನ್ನು ಅಳಿಸಬೇಕೇ? (${name})`)) return;
    try {
      await repository.deleteKanikeItem(id);
      setItems(prev => prev.filter(k => k.id !== id));
      showToast('ದಾಖಲೆ ಅಳಿಸಲಾಗಿದೆ', 'success');
    } catch {
      showToast('ಅಳಿಸಲು ಸಾಧ್ಯವಾಗಿಲ್ಲ', 'error');
    }
  };

  // Add Custom Event
  const handleAddNewEvent = () => {
    if (!newEventName.trim()) return;
    const name = newEventName.trim();
    if (!availableEvents.includes(name)) {
      setAvailableEvents(prev => [...prev, name]);
    }
    setSelectedEvent(name);
    setNewEventName('');
    setShowNewEventModal(false);
    showToast(`ಹೊಸ ಉತ್ಸವ ಸೇರಿಸಲಾಗಿದೆ: ${name}`, 'success');
  };

  // Export to Excel
  const handleExportExcel = () => {
    try {
      const dataRows = eventScopedItems.map((item, index) => ({
        'ಕ್ರಮ ಸಂಖ್ಯೆ (Sl No)': index + 1,
        'ವರ್ಷ (Year)': item.year,
        'ಉತ್ಸವ/ಕಾರ್ಯಕ್ರಮ (Festival Event)': item.festival_event,
        'ಗ್ರಾಮ ಮೊಕ್ತೇಸರರ ಹೆಸರು (Grama Moktesara)': item.moktesara_name,
        'ಗ್ರಾಮ (Grama)': item.grama,
        'ಸಂಪರ್ಕ ಸಂಖ್ಯೆ (Phone)': item.phone || '—',
        'ನೀಡಿದ ಜನರ ಸಂಖ್ಯೆ (People Count)': item.people_count,
        'ಕಾಣಿಕೆ ಪ್ರಕಾರ (Kanike Category)': item.kanike_type,
        'ರಸೀದಿ ಸಂಖ್ಯೆ (Receipt No)': item.receipt_number || '—',
        'ದಿನಾಂಕ (Date)': item.date,
        'ಒಟ್ಟು ಸಂಗ್ರಹ ಮೊತ್ತ (Total Amount ₹)': item.amount,
        'ಟಿಪ್ಪಣಿ (Notes)': item.notes || '—',
      }));

      const wb = XLSX.utils.book_new();
      const wsDetails = XLSX.utils.json_to_sheet(dataRows);
      XLSX.utils.book_append_sheet(wb, wsDetails, 'ಮೊಕ್ತೇಸರರ ಸಂಗ್ರಹ ವಿವರ');

      const safeEvent = selectedEvent.replace(/[^a-zA-Z0-9]/g, '_');
      XLSX.writeFile(wb, `Kalikamba_${selectedYear}_${safeEvent}_Moktesararu_Collection.xlsx`);
      showToast('ಎಕ್ಸೆಲ್ ವರದಿ ಯಶಸ್ವಿಯಾಗಿ ಡೌನ್‌ಲೋಡ್ ಆಗಿದೆ', 'success');
    } catch {
      showToast('ಎಕ್ಸೆಲ್ ರಫ್ತು ಮಾಡಲು ಸಾಧ್ಯವಾಗಿಲ್ಲ', 'error');
    }
  };

  // Available unique categories in records for filter
  const uniqueCategories = useMemo(() => {
    const set = new Set<string>(KANIKE_CATEGORIES_PRESET);
    eventScopedItems.forEach(it => set.add(it.kanike_type));
    return Array.from(set);
  }, [eventScopedItems]);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. TOP HEADER & WORKBENCH BAR */}
      <div className="section-card p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {language === 'kn' ? 'ಗ್ರಾಮ ಮೊಕ್ತೇಸರರ ವಾರ್ಷಿಕ ಕಾಣಿಕೆ & ಉತ್ಸವ ಸಂಗ್ರಹ' : 'Grama Moktesararu Festival Collection Ledger'}
              </h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                FY {selectedYear}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {language === 'kn'
                ? 'ಗ್ರಾಮ ಮೊಕ್ತೇಸರರು ಊರಿನ ಜನರಿಂದ ಸಂಗ್ರಹಿಸಿದ ದೀಪೋತ್ಸವ, ಪ್ರತಿಷ್ಠಾ, ಆರತಿ, ಗುರು, ವಿವಾಹ ಕಾಣಿಕೆಗಳ ಅಧಿಕೃತ ಲೆಕ್ಕಪತ್ರ ಹಾಗೂ ಮುದ್ರಿಸಬಹುದಾದ ರಸೀದಿ'
                : 'Official remittances collected by Grama Moktesararu with customizable official printable receipts'}
            </p>
          </div>

          {/* Action Buttons (Full mobile wrapping) */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'kn' ? 'ಸಂಗ್ರಹ ದಾಖಲಿಸಿ' : 'Record Remittance'}</span>
            </button>

            <button onClick={() => setShowPrintRegister(true)} className="btn-secondary">
              <Printer className="w-3.5 h-3.5" />
              <span>{language === 'kn' ? 'ರಿಜಿಸ್ಟರ್ ಮುದ್ರಣ' : 'Print Register'}</span>
            </button>

            <button onClick={handleExportExcel} className="btn-secondary">
              <Download className="w-3.5 h-3.5" />
              <span>{language === 'kn' ? 'ಎಕ್ಸೆಲ್' : 'Export Excel'}</span>
            </button>
          </div>
        </div>

        {/* YEAR & EVENT SELECTORS (Mobile Responsive Grid) */}
        <div className="mt-3.5 pt-3.5 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
          {/* Year Selector */}
          <div className="sm:col-span-3 flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-800">
            <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="text-xs text-slate-500 shrink-0">{language === 'kn' ? 'ವರ್ಷ:' : 'Year:'}</span>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              aria-label={language === 'kn' ? 'ವರ್ಷ ಆಯ್ಕೆ' : 'Select year'}
              className="w-full bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
            >
              {availableYears.map(y => (
                <option key={y} value={y} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  {y} ({language === 'kn' ? `${y} ನೇ ಸಾಲು` : `Financial Year ${y}`})
                </option>
              ))}
            </select>
          </div>

          {/* Festival Event Selector */}
          <div className="sm:col-span-6 flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-800">
            <Layers className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="text-xs text-slate-500 shrink-0">{language === 'kn' ? 'ಉತ್ಸವ:' : 'Festival Event:'}</span>
            <select
              value={selectedEvent}
              onChange={e => setSelectedEvent(e.target.value)}
              aria-label={language === 'kn' ? 'ಉತ್ಸವ ಆಯ್ಕೆ' : 'Select event'}
              className="w-full bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer truncate"
            >
              {availableEvents.map(ev => (
                <option key={ev} value={ev} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  {ev}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Event Trigger */}
          <div className="sm:col-span-3 flex justify-end">
            <button
              onClick={() => setShowNewEventModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-medium transition-colors"
            >
              <Plus className="w-3 h-3 text-slate-500" />
              <span>{language === 'kn' ? 'ಹೊಸ ಉತ್ಸವ ಸೇರಿಸಿ' : 'Add Custom Event'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. METRICS STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="section-card p-4">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{language === 'kn' ? 'ಒಟ್ಟು ಕಾಣಿಕೆ' : 'Total Collection'}</div>
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1 tabular-nums">₹{grandTotal.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-slate-500 mt-0.5 truncate">{selectedYear} • {selectedEvent.split(' ')[0]}</div>
        </div>
        <div className="section-card p-4">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{language === 'kn' ? 'ಒಟ್ಟು ಜನರು' : 'Contributing People'}</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 tabular-nums">{totalPeopleCount.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-500">{language === 'kn' ? 'ಜನ' : 'people'}</span></div>
          <div className="text-[11px] text-slate-500 mt-0.5">{totalBatches} {language === 'kn' ? 'ಸಲ್ಲಿಕೆಗಳು' : 'submissions'}</div>
        </div>
        <div className="section-card p-4">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{language === 'kn' ? 'ಮೊಕ್ತೇಸರರು' : 'Moktesararu'}</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 tabular-nums">{new Set(eventScopedItems.map(it => it.moktesara_name)).size} <span className="text-xs font-normal text-slate-500">{language === 'kn' ? 'ಪ್ರತಿನಿಧಿ' : 'heads'}</span></div>
          <div className="text-[11px] text-slate-500 mt-0.5">{new Set(eventScopedItems.map(it => it.grama)).size} {language === 'kn' ? 'ಗ್ರಾಮ' : 'villages'}</div>
        </div>
        <div className="section-card p-4">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{language === 'kn' ? 'ಲೆಕ್ಕ ತಾಳೆ' : 'Audit'}</div>
          <div className="text-sm font-bold mt-2 flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{language === 'kn' ? '100% ನಿಖರ' : 'Verified'}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">∑ ₹{grandTotal.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* 3. REMITTANCE TABLE */}
      <div className="section-card overflow-hidden">
        {/* Filter Toolbar */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 bg-slate-50 dark:bg-slate-800/40">
          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={language === 'kn' ? 'ಮೊಕ್ತೇಸರರ ಹೆಸರು, ಗ್ರಾಮ, ರಸೀದಿ ನಂ...' : 'Search moktesara, grama, receipt...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-7 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Structured Dropdown Filters */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              aria-label={language === 'kn' ? 'ಕಾಣಿಕೆ ಪ್ರಕಾರ ಫಿಲ್ಟರ್' : 'Filter by category'}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="">{language === 'kn' ? 'ಎಲ್ಲಾ ಕಾಣಿಕೆಗಳು' : 'All Kanike Types'}</option>
              {uniqueCategories.map((c, i) => (
                <option key={i} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Grama Filter */}
            <select
              value={gramaFilter}
              onChange={e => setGramaFilter(e.target.value)}
              aria-label={language === 'kn' ? 'ಗ್ರಾಮ ಫಿಲ್ಟರ್' : 'Filter by grama'}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="">{language === 'kn' ? 'ಎಲ್ಲಾ ಗ್ರಾಮಗಳು' : 'All Gramas'}</option>
              {STANDARD_GRAMAS.map((g, idx) => (
                <option key={idx} value={g}>
                  {g}
                </option>
              ))}
            </select>

            {/* Moktesara Filter */}
            <select
              value={moktesaraFilter}
              onChange={e => setMoktesaraFilter(e.target.value)}
              aria-label={language === 'kn' ? 'ಮೊಕ್ತೇಸರರ ಫಿಲ್ಟರ್' : 'Filter by moktesara'}
              className="col-span-2 sm:col-span-1 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none truncate"
            >
              <option value="">{language === 'kn' ? 'ಎಲ್ಲಾ ಮೊಕ್ತೇಸರರು' : 'All Moktesararu'}</option>
              {Array.from(new Set(eventScopedItems.map(it => it.moktesara_name))).map((mName, idx) => (
                <option key={idx} value={mName}>
                  {mName}
                </option>
              ))}
            </select>

            {/* Reset Filters */}
            {(categoryFilter || gramaFilter || moktesaraFilter || searchQuery) && (
              <button
                onClick={() => {
                  setCategoryFilter('');
                  setGramaFilter('');
                  setMoktesaraFilter('');
                  setSearchQuery('');
                }}
                className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-300 dark:border-slate-700 font-medium"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{language === 'kn' ? 'ರೀಸೆಟ್' : 'Reset'}</span>
              </button>
            )}
          </div>
        </div>

        {/* DESKTOP TABLE VIEW (Hidden on small screens, shown md+) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3 w-10 text-center">#</th>
                <th className="py-2.5 px-3">{language === 'kn' ? 'ಗ್ರಾಮ ಮೊಕ್ತೇಸರರ ಹೆಸರು' : 'Grama Moktesara'}</th>
                <th className="py-2.5 px-3">{language === 'kn' ? 'ಗ್ರಾಮ / ಊರು' : 'Grama / Village'}</th>
                <th className="py-2.5 px-3">{language === 'kn' ? 'ಸಂಪರ್ಕ' : 'Phone'}</th>
                <th className="py-2.5 px-3">{language === 'kn' ? 'ಕಾಣಿಕೆ ಪ್ರಕಾರ' : 'Kanike Category'}</th>
                <th className="py-2.5 px-3 text-center">{language === 'kn' ? 'ನೀಡಿದ ಜನರು' : 'People'}</th>
                <th className="py-2.5 px-3">{language === 'kn' ? 'ರಸೀದಿ ನಂ' : 'Receipt No'}</th>
                <th className="py-2.5 px-3">{language === 'kn' ? 'ದಿನಾಂಕ' : 'Date'}</th>
                <th className="py-2.5 px-3 text-right">{language === 'kn' ? 'ಸಂಗ್ರಹ ಮೊತ್ತ (₹)' : 'Amount (₹)'}</th>
                <th className="py-2.5 px-3 text-center w-20">{language === 'kn' ? 'ರಸೀದಿ / ಕ್ರಮ' : 'Receipt / Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    {language === 'kn' ? 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...' : 'Loading records...'}
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    {language === 'kn' ? 'ಯಾವುದೇ ಸಂಗ್ರಹ ದಾಖಲೆ ಕಂಡುಬಂದಿಲ್ಲ' : 'No remittance records match criteria'}
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, idx) => {
                  const globalIndex = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 text-center tabular-nums text-slate-400 text-[11px]">
                        {globalIndex}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-200">
                        {item.moktesara_name}
                        {item.notes && (
                          <div className="text-[10px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                            {item.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{item.grama}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 tabular-nums text-slate-500 dark:text-slate-400 text-[11px]">
                        {item.phone || '—'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          {item.kanike_type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                        {item.people_count} {language === 'kn' ? 'ಜನ' : ''}
                      </td>
                      <td className="py-2.5 px-3 tabular-nums text-slate-500 dark:text-slate-400 text-[11px]">
                        {item.receipt_number || '—'}
                      </td>
                      <td className="py-2.5 px-3 tabular-nums text-slate-500 dark:text-slate-400 text-[11px]">
                        {item.date}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums font-bold text-emerald-700 dark:text-emerald-400">
                        ₹{item.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setReceiptRecord(item)}
                            className="p-1 text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded transition-colors"
                            title="Print Official Moktesara Receipt"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteKanike(item.id, item.moktesara_name)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded transition-colors"
                            title="Delete entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Table Footer with Summary */}
            {filteredItems.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50 dark:bg-slate-950 font-bold border-t border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200">
                  <td colSpan={5} className="py-2.5 px-3 text-right text-[11px] uppercase tracking-wider text-slate-500">
                    {language === 'kn' ? 'ಫಿಲ್ಟರ್ ಮಾಡಿದ ಒಟ್ಟು ಮೊತ್ತ:' : 'Filtered Subtotal:'}
                  </td>
                  <td className="py-2.5 px-3 text-center tabular-nums">
                    {filteredItems.reduce((acc, it) => acc + (Number(it.people_count) || 0), 0)} {language === 'kn' ? 'ಜನ' : ''}
                  </td>
                  <td colSpan={2}></td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    ₹{filteredItems.reduce((acc, it) => acc + (Number(it.amount) || 0), 0).toLocaleString('en-IN')}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* MOBILE CARD VIEW (Shown on small screens, hidden md+) */}
        <div className="block md:hidden divide-y divide-slate-200 dark:divide-slate-800">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-500">
              {language === 'kn' ? 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...' : 'Loading...'}
            </div>
          ) : paginatedItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              {language === 'kn' ? 'ಯಾವುದೇ ದಾಖಲೆ ಕಂಡುಬಂದಿಲ್ಲ' : 'No records match filters'}
            </div>
          ) : (
            paginatedItems.map((item, idx) => (
              <div key={item.id} className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-slate-100">{item.moktesara_name}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      <span>{item.grama}</span>
                      {item.phone && (
                        <>
                          <span>•</span>
                          <span className="font-mono">{item.phone}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-sm text-emerald-700 dark:text-emerald-400">
                      ₹{item.amount.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">{item.date}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {item.kanike_type}
                    </span>
                    <span className="text-[11px] text-slate-600 dark:text-slate-400">
                      {item.people_count} {language === 'kn' ? 'ಜನ' : 'people'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setReceiptRecord(item)}
                      className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[11px] font-medium flex items-center gap-1"
                    >
                      <Receipt className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>{language === 'kn' ? 'ರಸೀದಿ' : 'Receipt'}</span>
                    </button>
                    <button
                      onClick={() => handleDeleteKanike(item.id, item.moktesara_name)}
                      className="p-1 rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Bar */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-slate-50 dark:bg-slate-950 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              {language === 'kn' ? 'ಪುಟ' : 'Page'} <strong className="text-slate-800 dark:text-slate-200">{currentPage}</strong> / {totalPages} ({filteredItems.length} {language === 'kn' ? 'ದಾಖಲೆಗಳು' : 'records'})
            </span>
            <div className="flex items-center gap-1.5">
              <span>{language === 'kn' ? 'ಸಾಲುಗಳು:' : 'Rows:'}</span>
              <select
                value={pageSize}
                onChange={e => setPageSize(Number(e.target.value))}
                aria-label={language === 'kn' ? 'ಪ್ರತಿ ಪುಟದ ಸಾಲುಗಳು' : 'Rows per page'}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 text-slate-800 dark:text-slate-200 text-xs focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <div className="px-2.5 py-0.5 font-mono text-slate-800 dark:text-slate-300 font-semibold text-xs">
              {currentPage}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. CUSTOMIZABLE PRINTABLE OFFICIAL RECEIPT MODAL FOR MOKTESARA */}
      {receiptRecord && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex flex-col p-3 sm:p-6 overflow-y-auto">
          <div className="max-w-2xl w-full mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl flex flex-col my-auto overflow-hidden">
            {/* Modal Header */}
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {language === 'kn' ? 'ಗ್ರಾಮ ಮೊಕ್ತೇಸರರ ಅಧಿಕೃತ ಕಾಣಿಕೆ ಸ್ವೀಕೃತಿ ರಸೀದಿ' : 'Print Moktesara Official Receipt'}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold flex items-center gap-1 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{language === 'kn' ? 'ಮುದ್ರಿಸಿ' : 'Print Receipt'}</span>
                </button>
                <button
                  onClick={() => setReceiptRecord(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Customization Options Bar */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {language === 'kn' ? 'ರಸೀದಿ ಸ್ವೀಕೃತಿ ಟಿಪ್ಪಣಿ (Customizable)' : 'Receipt Acknowledgment Text'}
                </label>
                <input
                  type="text"
                  value={receiptNoteCustom}
                  onChange={e => setReceiptNoteCustom(e.target.value)}
                  className="w-full px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {language === 'kn' ? 'ಅಧಿಕೃತ ಸಹಿ ಹೆಸರು' : 'Authorized Signature Label'}
                </label>
                <input
                  type="text"
                  value={receiptAuthorizedBy}
                  onChange={e => setReceiptAuthorizedBy(e.target.value)}
                  className="w-full px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="sm:col-span-2 flex items-center gap-4 pt-1 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={receiptShowGrama}
                    onChange={e => setReceiptShowGrama(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>Show Grama</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={receiptShowPeopleCount}
                    onChange={e => setReceiptShowPeopleCount(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>Show Contributing People Count</span>
                </label>
              </div>
            </div>

            {/* Printable White Thermal/A5 Slip */}
            <div className="p-4 sm:p-6 bg-slate-100 dark:bg-slate-950 overflow-y-auto max-h-[60vh]">
              <div className="bg-white text-black p-6 sm:p-8 rounded shadow-md font-serif border border-gray-300 max-w-lg mx-auto print:border-none print:shadow-none print:p-0">
                {/* Header */}
                <div className="text-center border-b-2 border-black pb-3 mb-3">
                  <div className="text-lg font-bold">ಶ್ರೀ ಕಾಳಿಕಾಂಬಾ ದೇವಸ್ಥಾನ ಬಾರಕೂರು</div>
                  <div className="text-xs uppercase tracking-wider text-gray-700">
                    Sri Kalikamba Temple, Barkur, Udupi Dist - 576210
                  </div>
                  <div className="text-xs font-bold mt-1 text-gray-800">
                    ಗ್ರಾಮ ಮೊಕ್ತೇಸರರ ಕಾಣಿಕೆ ಸಲ್ಲಿಕೆ ಅಧಿಕೃತ ರಸೀದಿ (Official Receipt)
                  </div>
                </div>

                {/* Receipt Details */}
                <div className="flex justify-between text-xs mb-3 border-b border-gray-200 pb-2">
                  <div>
                    <span className="font-bold">ರಸೀದಿ ನಂ (Receipt No):</span>{' '}
                    <span className="font-mono font-bold">{receiptRecord.receipt_number || '—'}</span>
                  </div>
                  <div>
                    <span className="font-bold">ದಿನಾಂಕ (Date):</span>{' '}
                    <span className="font-mono">{receiptRecord.date}</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-600">ಗ್ರಾಮ ಮೊಕ್ತೇಸರರು (Moktesara):</span>
                    <strong className="text-black font-semibold text-sm">{receiptRecord.moktesara_name}</strong>
                  </div>

                  {receiptShowGrama && (
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-600">ಗ್ರಾಮ / ಊರು (Grama):</span>
                      <strong className="text-black">{receiptRecord.grama}</strong>
                    </div>
                  )}

                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-600">ಉತ್ಸವ / ಕಾರ್ಯಕ್ರಮ (Event):</span>
                    <strong className="text-black">{receiptRecord.festival_event} ({receiptRecord.year})</strong>
                  </div>

                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-600">ಕಾಣಿಕೆ ಪ್ರಕಾರ (Category):</span>
                    <strong className="text-black">{receiptRecord.kanike_type}</strong>
                  </div>

                  {receiptShowPeopleCount && (
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-600">ದೇಣಿಗೆ ನೀಡಿದ ಜನರ ಸಂಖ್ಯೆ:</span>
                      <strong className="text-black font-mono">{receiptRecord.people_count} ಜನ (Families/Donors)</strong>
                    </div>
                  )}

                  {receiptRecord.notes && (
                    <div className="py-1 text-gray-700 italic text-[11px]">
                      ವಿವರ: {receiptRecord.notes}
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t-2 border-black flex justify-between items-center bg-gray-50 p-2.5 rounded">
                    <span className="font-bold text-sm uppercase">ಒಟ್ಟು ಸ್ವೀಕರಿಸಿದ ಮೊತ್ತ (Amount):</span>
                    <span className="font-mono font-bold text-lg text-black">
                      ₹{receiptRecord.amount.toLocaleString('en-IN')}/-
                    </span>
                  </div>
                </div>

                {/* Acknowledgement note */}
                <div className="mt-4 text-[11px] text-gray-700 leading-relaxed border-t border-gray-200 pt-2">
                  {receiptNoteCustom}
                </div>

                {/* Signature */}
                <div className="mt-10 pt-4 flex justify-between text-xs font-bold text-gray-800">
                  <div className="text-center">
                    <div className="border-t border-black w-28 pt-1">ಮೊಕ್ತೇಸರರ ಸಹಿ</div>
                  </div>
                  <div className="text-center">
                    <div className="border-t border-black w-36 pt-1">{receiptAuthorizedBy}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. ADD MOKTESARA REMITTANCE MODAL WITH SEARCHABLE DROPDOWN */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg w-full max-w-lg shadow-xl overflow-hidden">
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {language === 'kn' ? 'ಗ್ರಾಮ ಮೊಕ್ತೇಸರರ ಕಾಣಿಕೆ ಸಂಗ್ರಹ ನಮೂದು' : 'Record Moktesara Collection Remittance'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitKanike} className="p-4 sm:p-5 space-y-3 text-xs">
              <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded border border-slate-200 dark:border-slate-800 flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>{language === 'kn' ? 'ವರ್ಷ' : 'Year'}: <strong className="text-slate-900 dark:text-slate-200">{selectedYear}</strong></span>
                <span>{language === 'kn' ? 'ಉತ್ಸವ' : 'Event'}: <strong className="text-slate-900 dark:text-slate-200">{selectedEvent}</strong></span>
              </div>

              {/* SEARCHABLE DROPDOWN FOR GRAMA MOKTESARA */}
              <div ref={moktesaraDropdownRef} className="relative">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'kn' ? 'ಗ್ರಾಮ ಮೊಕ್ತೇಸರರ ಆಯ್ಕೆ (Searchable Dropdown) *' : 'Select Grama Moktesara *'}
                </label>
                <button
                  type="button"
                  onClick={() => setIsMoktesaraDropdownOpen(!isMoktesaraDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-left text-slate-900 dark:text-slate-200 focus:outline-none"
                >
                  <span className={formData.moktesara_name ? 'text-slate-900 dark:text-slate-100 font-semibold' : 'text-slate-400'}>
                    {formData.moktesara_name || (language === 'kn' ? 'ಮೊಕ್ತೇಸರರನ್ನು ಹುಡುಕಿ ಆಯ್ಕೆಮಾಡಿ...' : 'Search & select moktesara...')}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isMoktesaraDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md shadow-2xl z-50 overflow-hidden">
                    <div className="p-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder={language === 'kn' ? 'ಹೆಸರು, ಗ್ರಾಮ ಅಥವಾ ಫೋನ್ ಹುಡುಕಿ...' : 'Filter by name, grama, phone...'}
                          value={moktesaraSearchQuery}
                          onChange={e => setMoktesaraSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-slate-200 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                      {filteredMoktesararuDropdown.length === 0 ? (
                        <div className="p-3 text-center text-slate-500">
                          {language === 'kn' ? 'ಯಾವುದೇ ಮೊಕ್ತೇಸರರು ಕಂಡುಬಂದಿಲ್ಲ' : 'No moktesara found'}
                        </div>
                      ) : (
                        filteredMoktesararuDropdown.map(m => (
                          <div
                            key={m.id}
                            onClick={() => handleSelectMoktesara(m)}
                            className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/70 cursor-pointer flex items-center justify-between transition-colors"
                          >
                            <div>
                              <div className="font-bold text-slate-900 dark:text-slate-200">{m.name}</div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                <span>{m.grama}</span>
                                <span>•</span>
                                <span className="font-mono">{m.phone_primary}</span>
                              </div>
                            </div>
                            {formData.moktesara_id === m.id && (
                              <Check className="w-4 h-4 text-emerald-600" />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Amount & People Count */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'kn' ? 'ಒಟ್ಟು ಸಂಗ್ರಹ ಮೊತ್ತ (₹) *' : 'Total Amount Collected (₹) *'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    placeholder="25000"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 font-mono font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'kn' ? 'ದೇಣಿಗೆ ನೀಡಿದ ಜನರ ಸಂಖ್ಯೆ *' : 'Number of People Who Contributed *'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    placeholder="35"
                    value={formData.people_count}
                    onChange={e => setFormData({ ...formData, people_count: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* Kanike Category & Custom Option */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    {language === 'kn' ? 'ಕಾಣಿಕೆ ಪ್ರಕಾರ *' : 'Kanike Category *'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomCategoryMode(!isCustomCategoryMode)}
                    className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold hover:underline"
                  >
                    {isCustomCategoryMode
                      ? (language === 'kn' ? 'ಪೂರ್ವಸಿದ್ಧ ಪಟ್ಟಿ' : 'Preset')
                      : (language === 'kn' ? '+ ಕಸ್ಟಮ್ ಕಾಣಿಕೆ' : '+ Custom Category')}
                  </button>
                </div>

                {isCustomCategoryMode ? (
                  <input
                    type="text"
                    placeholder={language === 'kn' ? 'ಉದಾ: ವಿಶೇಷ ರಥ ಕಾಣಿಕೆ' : 'e.g. Special Ratha Kanike'}
                    value={customCategoryInput}
                    onChange={e => setCustomCategoryInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-emerald-500 rounded text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                ) : (
                  <select
                    value={formData.kanike_type}
                    onChange={e => setFormData({ ...formData, kanike_type: e.target.value })}
                    aria-label={language === 'kn' ? 'ಕಾಣಿಕೆ ಪ್ರಕಾರ' : 'Kanike category'}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 focus:outline-none"
                  >
                    {KANIKE_CATEGORIES_PRESET.map((c, i) => (
                      <option key={i} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Grama & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'kn' ? 'ಗ್ರಾಮ / ಊರು' : 'Grama / Village'}
                  </label>
                  <select
                    value={formData.grama}
                    onChange={e => setFormData({ ...formData, grama: e.target.value })}
                    aria-label={language === 'kn' ? 'ಗ್ರಾಮ' : 'Grama'}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 focus:outline-none"
                  >
                    {STANDARD_GRAMAS.map((g, i) => (
                      <option key={i} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'kn' ? 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ' : 'Phone'}
                  </label>
                  <input
                    type="tel"
                    placeholder="9845012345"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* Receipt No & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'kn' ? 'ರಸೀದಿ ಸಂಖ್ಯೆ' : 'Receipt No'}
                  </label>
                  <input
                    type="text"
                    placeholder="MK-2026-005"
                    value={formData.receipt_number}
                    onChange={e => setFormData({ ...formData, receipt_number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'kn' ? 'ದಿನಾಂಕ' : 'Date'}
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'kn' ? 'ವಿಶೇಷ ಟಿಪ್ಪಣಿ' : 'Notes / Remarks'}
                </label>
                <input
                  type="text"
                  placeholder={language === 'kn' ? 'ಉದಾ: ಕಚೂರು ಗ್ರಾಮದ ಭಕ್ತರ ಕಾಣಿಕೆ ಬ್ಯಾಚ್' : 'e.g. Village devotees contribution batch'}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs font-medium transition-colors"
                >
                  {language === 'kn' ? 'ರದ್ದುಮಾಡಿ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold shadow-xs transition-colors"
                >
                  {language === 'kn' ? 'ದಾಖಲೆ ಉಳಿಸಿ' : 'Save Remittance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. ADD CUSTOM FESTIVAL EVENT MODAL */}
      {showNewEventModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg w-full max-w-sm shadow-xl p-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-800">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {language === 'kn' ? 'ಹೊಸ ಉತ್ಸವ ಸೇರಿಸಿ' : 'Add Custom Festival Event'}
              </h4>
              <button
                onClick={() => setShowNewEventModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'kn' ? 'ಉತ್ಸವದ ಹೆಸರು' : 'Event Name'}
              </label>
              <input
                type="text"
                placeholder={language === 'kn' ? 'ಉದಾ: ಬ್ರಹ್ಮರಥೋತ್ಸವ' : 'e.g. Brahmarathotsava'}
                value={newEventName}
                onChange={e => setNewEventName(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowNewEventModal(false)}
                className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-xs"
              >
                {language === 'kn' ? 'ರದ್ದುಮಾಡಿ' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleAddNewEvent}
                className="px-3.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold"
              >
                {language === 'kn' ? 'ಸೇರಿಸಿ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. PRINTABLE AUDIT REGISTER SHEET MODAL */}
      {showPrintRegister && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col p-3 sm:p-6 overflow-y-auto">
          <div className="max-w-4xl w-full mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl flex flex-col my-auto overflow-hidden">
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-slate-500" />
                <span className="font-bold text-slate-900 dark:text-slate-200 text-xs">
                  {language === 'kn' ? 'ಗ್ರಾಮ ಮೊಕ್ತೇಸರರ ಕಾಣಿಕೆ ಸಲ್ಲಿಕೆ ಅಧಿಕೃತ ಮುದ್ರಣ ಹಾಳೆ' : 'Official Grama Moktesararu Remittance Register Sheet'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{language === 'kn' ? 'ಮುದ್ರಿಸಿ' : 'Print Now'}</span>
                </button>
                <button
                  onClick={() => setShowPrintRegister(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-slate-100 dark:bg-slate-950 overflow-y-auto max-h-[75vh]">
              <div className="bg-white text-black p-6 sm:p-8 rounded shadow-lg font-serif max-w-3xl mx-auto border border-gray-300">
                <div className="text-center border-b-2 border-black pb-3 mb-4">
                  <div className="text-lg font-bold">ಶ್ರೀ ಕಾಳಿಕಾಂಬಾ ದೇವಸ್ಥಾನ ಬಾರಕೂರು</div>
                  <div className="text-xs uppercase tracking-wider text-gray-700">
                    Sri Kalikamba Temple, Barkur, Udupi Dist - 576210
                  </div>
                  <div className="text-sm font-bold mt-1.5 underline">
                    {selectedEvent} — {selectedYear} ನೇ ಸಾಲಿನ ಗ್ರಾಮ ಮೊಕ್ತೇಸರರ ಕಾಣಿಕೆ ಸಂಗ್ರಹ ವರದಿ
                  </div>
                  <div className="text-[11px] text-gray-600 mt-0.5">
                    ದಿನಾಂಕ: {new Date().toLocaleDateString('kn-IN')} | ಮುದ್ರಣ ಸಮಯ: {new Date().toLocaleTimeString()}
                  </div>
                </div>

                {/* Detailed Moktesara Remittance Table */}
                <div>
                  <table className="w-full text-left border-collapse border border-gray-400 text-xs">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-400 font-bold">
                        <th className="p-1.5 border-r border-gray-400 w-8 text-center">#</th>
                        <th className="p-1.5 border-r border-gray-400">ಗ್ರಾಮ ಮೊಕ್ತೇಸರರು</th>
                        <th className="p-1.5 border-r border-gray-400">ಗ್ರಾಮ</th>
                        <th className="p-1.5 border-r border-gray-400">ಕಾಣಿಕೆ ಪ್ರಕಾರ</th>
                        <th className="p-1.5 border-r border-gray-400 text-center">ನೀಡಿದ ಜನರು</th>
                        <th className="p-1.5 border-r border-gray-400">ರಸೀದಿ</th>
                        <th className="p-1.5 text-right w-28">ಮೊತ್ತ (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eventScopedItems.map((item, idx) => (
                        <tr key={item.id} className="border-b border-gray-200">
                          <td className="p-1.5 border-r border-gray-200 text-center font-mono">{idx + 1}</td>
                          <td className="p-1.5 border-r border-gray-200 font-semibold">{item.moktesara_name}</td>
                          <td className="p-1.5 border-r border-gray-200">{item.grama}</td>
                          <td className="p-1.5 border-r border-gray-200">{item.kanike_type}</td>
                          <td className="p-1.5 border-r border-gray-200 text-center font-mono">{item.people_count} ಜನ</td>
                          <td className="p-1.5 border-r border-gray-200 font-mono text-[10px]">{item.receipt_number || '—'}</td>
                          <td className="p-1.5 text-right font-mono font-bold">₹{item.amount.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-100 font-bold border-t-2 border-gray-500">
                        <td colSpan={4} className="p-1.5 text-right uppercase border-r border-gray-400">
                          ಒಟ್ಟು ಸಂಗ್ರಹ (GRAND TOTAL):
                        </td>
                        <td className="p-1.5 text-center font-mono border-r border-gray-400">
                          {totalPeopleCount} ಜನ
                        </td>
                        <td></td>
                        <td className="p-1.5 text-right font-mono font-bold text-sm">
                          ₹{grandTotal.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="mt-12 pt-6 flex justify-between text-xs font-bold text-gray-800">
                  <div className="text-center">
                    <div className="border-t border-black w-36 pt-1">ಲೆಕ್ಕಿಗರು (Accountant)</div>
                  </div>
                  <div className="text-center">
                    <div className="border-t border-black w-36 pt-1">ಕಾರ್ಯದರ್ಶಿ (Secretary)</div>
                  </div>
                  <div className="text-center">
                    <div className="border-t border-black w-36 pt-1">ಆಡಳಿತ ಮೊಕ್ತೇಸರರು (Managing Trustee)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
