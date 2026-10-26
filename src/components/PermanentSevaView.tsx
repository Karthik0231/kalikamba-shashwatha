import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { repository, SEVA_CATEGORIES, STANDARD_GRAMAS } from '../lib/repository';
import { TempleRegistration, SevaTypeKey } from '../types/database';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import {
  Search,
  Plus,
  Upload,
  Download,
  Printer,
  Calendar,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  X,
  Clock,
  Filter,
  Tag,
  Columns,
  CheckSquare,
  Square,
  FileText,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';

export const PermanentSevaView: React.FC = () => {
  const { language, showToast } = useApp();

  const [records, setRecords] = useState<TempleRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab & Filters
  const [activeTab, setActiveTab] = useState<SevaTypeKey>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [placeFilter, setPlaceFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState<number | ''>('');
  const [dayOfMonthFilter, setDayOfMonthFilter] = useState<number | ''>('');
  const [quickDateFilter, setQuickDateFilter] = useState<'ALL' | 'TODAY' | 'TOMORROW'>('ALL');
  const [specificDate, setSpecificDate] = useState('');
  const [selectedFestivalDay, setSelectedFestivalDay] = useState<number | ''>('');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Row Selection for Postal Labels
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Add / Edit Modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    serial_number: '',
    devotee_name: '',
    phone: '',
    address: '',
    place: 'Barkur (ಬಾರಕೂರು)',
    seva_type: 'NITYA_POOJA' as TempleRegistration['seva_type'],
    seva_date: new Date().toISOString().split('T')[0],
    festival_day: 1,
    agreed_fee: 1500,
    paid_amount: 1500,
    notes: '',
  });

  // Bulk Upload Modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Print Mode
  const [printMode, setPrintMode] = useState<'receipt' | 'register' | 'labels' | null>(null);
  const [printingRecord, setPrintingRecord] = useState<TempleRegistration | null>(null);

  // Postal Labels Settings
  const [labelCols, setLabelCols] = useState<2 | 3 | 4>(3);
  const [labelFontSize, setLabelFontSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [labelPadding, setLabelPadding] = useState<'compact' | 'normal' | 'relaxed'>('normal');
  const [labelIncludeSerial, setLabelIncludeSerial] = useState(true);
  const [labelIncludePhone, setLabelIncludePhone] = useState(true);
  const [labelIncludeSeva, setLabelIncludeSeva] = useState(true);
  const [labelShowBorder, setLabelShowBorder] = useState(true);
  const [labelShowSender, setLabelShowSender] = useState(true);
  const [labelCustomHeader, setLabelCustomHeader] = useState('To / ಪ್ರತಿ:');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await repository.getAll();
      setRecords(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.altKey) && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        openNewForm();
      }
      if (e.ctrlKey && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        handleExportExcel();
      }
      if (e.ctrlKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        setPrintMode('labels');
      }
      if (
        (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') ||
        (e.ctrlKey && e.key === 'f')
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setShowFormModal(false);
        setShowUploadModal(false);
        setPrintMode(null);
        setPrintingRecord(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [records]);

  // Available Places from current records
  const availablePlaces = useMemo(() => {
    const set = new Set<string>(STANDARD_GRAMAS);
    records.forEach(r => {
      if (r.place) set.add(r.place);
    });
    return Array.from(set).sort();
  }, [records]);

  // Open New Seva
  const openNewForm = async (defaultSeva: TempleRegistration['seva_type'] = 'NITYA_POOJA') => {
    const selectedSeva = activeTab !== 'ALL' ? (activeTab as TempleRegistration['seva_type']) : defaultSeva;
    const cat = SEVA_CATEGORIES.find(s => s.key === selectedSeva) || SEVA_CATEGORIES[0];
    const serial = await repository.generateSerial(selectedSeva);

    setEditingId(null);
    setFormData({
      serial_number: serial,
      devotee_name: '',
      phone: '',
      address: '',
      place: 'Barkur (ಬಾರಕೂರು)',
      seva_type: selectedSeva,
      seva_date: todayStr,
      festival_day: 1,
      agreed_fee: cat.defaultFee,
      paid_amount: cat.defaultFee,
      notes: '',
    });
    setShowFormModal(true);
  };

  // Open Edit Form
  const openEditForm = (item: TempleRegistration) => {
    setEditingId(item.id);
    setFormData({
      serial_number: item.serial_number,
      devotee_name: item.devotee_name,
      phone: item.phone,
      address: item.address,
      place: item.place || 'Barkur (ಬಾರಕೂರು)',
      seva_type: item.seva_type,
      seva_date: item.seva_date || todayStr,
      festival_day: item.festival_day || 1,
      agreed_fee: item.agreed_fee,
      paid_amount: item.paid_amount,
      notes: item.notes || '',
    });
    setShowFormModal(true);
  };

  // Handle Seva Category change in form
  const handleFormSevaChange = async (type: TempleRegistration['seva_type']) => {
    const cat = SEVA_CATEGORIES.find(s => s.key === type);
    const newSerial = !editingId ? await repository.generateSerial(type) : formData.serial_number;
    setFormData(prev => ({
      ...prev,
      seva_type: type,
      serial_number: newSerial,
      agreed_fee: cat ? cat.defaultFee : prev.agreed_fee,
      paid_amount: cat ? cat.defaultFee : prev.paid_amount,
    }));
  };

  // Save Seva
  const handleSaveSeva = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.devotee_name.trim()) {
      showToast(language === 'kn' ? 'ದಯವಿಟ್ಟು ಭಕ್ತರ ಹೆಸರು ನಮೂದಿಸಿ' : 'Devotee name is required', 'error');
      return;
    }
    if (!formData.phone.trim()) {
      showToast(language === 'kn' ? 'ದಯವಿಟ್ಟು ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ' : 'Phone number is required', 'error');
      return;
    }

    try {
      if (editingId) {
        await repository.update(editingId, {
          devotee_name: formData.devotee_name,
          phone: formData.phone,
          address: formData.address,
          place: formData.place,
          seva_type: formData.seva_type,
          seva_date:
            formData.seva_type === 'NITYA_POOJA' || formData.seva_type === 'ANNADANA'
              ? formData.seva_date
              : undefined,
          festival_day:
            formData.seva_type === 'NAVARATRI' || formData.seva_type === 'SONARATHI'
              ? Number(formData.festival_day)
              : undefined,
          agreed_fee: Number(formData.agreed_fee),
          paid_amount: Number(formData.paid_amount),
          notes: formData.notes,
        });
        showToast(language === 'kn' ? 'ಸೇವಾ ವಿವರ ನವೀಕರಿಸಲಾಗಿದೆ' : 'Record updated successfully', 'success');
      } else {
        await repository.create({
          serial_number: formData.serial_number,
          devotee_name: formData.devotee_name,
          phone: formData.phone,
          address: formData.address,
          place: formData.place,
          seva_type: formData.seva_type,
          seva_date:
            formData.seva_type === 'NITYA_POOJA' || formData.seva_type === 'ANNADANA'
              ? formData.seva_date
              : undefined,
          festival_day:
            formData.seva_type === 'NAVARATRI' || formData.seva_type === 'SONARATHI'
              ? Number(formData.festival_day)
              : undefined,
          agreed_fee: Number(formData.agreed_fee),
          paid_amount: Number(formData.paid_amount),
          payment_status: Number(formData.paid_amount) >= Number(formData.agreed_fee) ? 'PAID' : 'PARTIAL',
          notes: formData.notes,
        });
        showToast(
          language === 'kn'
            ? `ನೋಂದಣಿ ಸಂಖ್ಯೆ ${formData.serial_number} ದಾಖಲಾಗಿದೆ!`
            : `Registration ${formData.serial_number} saved!`,
          'success'
        );
      }
      setShowFormModal(false);
      await loadData();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Operation failed', 'error');
    }
  };

  const handleDelete = async (id: string, serial: string) => {
    if (
      confirm(
        language === 'kn'
          ? `ಈ ನೋಂದಣಿಯನ್ನು ಅಳಿಸಲು ನೀವು ಖಚಿತವಾಗಿರುವಿರಾ? (${serial})`
          : `Delete registration ${serial}?`
      )
    ) {
      await repository.delete(id);
      showToast(language === 'kn' ? 'ದಾಖಲೆಯನ್ನು ಅಳಿಸಲಾಗಿದೆ' : 'Record deleted', 'info');
      await loadData();
    }
  };

  // Reset all filters
  const resetAllFilters = () => {
    setActiveTab('ALL');
    setSearchQuery('');
    setPlaceFilter('');
    setMonthFilter('');
    setDayOfMonthFilter('');
    setQuickDateFilter('ALL');
    setSpecificDate('');
    setSelectedFestivalDay('');
    setPaymentFilter('ALL');
    setCurrentPage(1);
  };

  // Filter Logic
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (activeTab !== 'ALL' && r.seva_type !== activeTab) return false;
      if (placeFilter && r.place !== placeFilter && !r.address.toLowerCase().includes(placeFilter.toLowerCase())) {
        return false;
      }
      if (monthFilter !== '') {
        const m = r.seva_date ? parseInt(r.seva_date.split('-')[1], 10) : r.seva_month;
        if (m !== Number(monthFilter)) return false;
      }
      if (dayOfMonthFilter !== '') {
        const d = r.seva_date ? parseInt(r.seva_date.split('-')[2], 10) : undefined;
        if (d !== Number(dayOfMonthFilter)) return false;
      }
      if (quickDateFilter === 'TODAY' && r.seva_date !== todayStr) return false;
      if (quickDateFilter === 'TOMORROW' && r.seva_date !== tomorrowStr) return false;
      if (specificDate && r.seva_date !== specificDate) return false;
      if (selectedFestivalDay !== '' && r.festival_day !== Number(selectedFestivalDay)) return false;
      if (paymentFilter === 'PAID' && r.payment_status !== 'PAID') return false;
      if (paymentFilter === 'PENDING' && r.payment_status === 'PAID') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const normQ = q.replace(/\D/g, '');
        const matchSerial = r.serial_number.toLowerCase().includes(q);
        const matchName = r.devotee_name.toLowerCase().includes(q);
        const matchPhone = r.phone.includes(normQ || q);
        const matchAddress = r.address.toLowerCase().includes(q);
        const matchPlace = r.place?.toLowerCase().includes(q);
        if (!matchSerial && !matchName && !matchPhone && !matchAddress && !matchPlace) return false;
      }

      return true;
    });
  }, [
    records,
    activeTab,
    placeFilter,
    monthFilter,
    dayOfMonthFilter,
    quickDateFilter,
    specificDate,
    selectedFestivalDay,
    paymentFilter,
    searchQuery,
  ]);

  // Paginated View
  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const from = (currentPage - 1) * pageSize;
    return filteredRecords.slice(from, from + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // Targeted labels
  const labelTargetRecords = useMemo(() => {
    if (selectedIds.size > 0) {
      return records.filter(r => selectedIds.has(r.id));
    }
    return filteredRecords;
  }, [records, selectedIds, filteredRecords]);

  const toggleSelectRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredRecords.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRecords.map(r => r.id)));
    }
  };

  const handleExportExcel = () => {
    const rows = filteredRecords.map(r => ({
      'Serial Number': r.serial_number,
      'Devotee Name': r.devotee_name,
      'Phone Number': r.phone,
      'Address': r.address,
      'Place / Grama': r.place || '',
      'Seva Category': r.seva_type,
      'Seva Date': r.seva_date || '',
      'Festival Day': r.festival_day ? `Day ${r.festival_day}` : '',
      'Total Fee (INR)': r.agreed_fee,
      'Paid Amount (INR)': r.paid_amount,
      'Balance Due (INR)': Math.max(0, r.agreed_fee - r.paid_amount),
      'Payment Status': r.payment_status,
      'Remarks': r.notes || '',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Barkur Sevas');
    XLSX.writeFile(wb, `Kalikamba_Temple_Barkur_Sevas_${todayStr}.xlsx`);
    showToast(language === 'kn' ? 'ಎಕ್ಸೆಲ್ ಫೈಲ್ ಡೌನ್‌ಲೋಡ್ ಆಗಿದೆ' : 'Excel file downloaded', 'success');
  };

  const handleBulkUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const isCsv = file.name.endsWith('.csv');

    const processRows = async (jsonRows: any[]) => {
      try {
        const parsedItems: Omit<TempleRegistration, 'id' | 'created_at' | 'updated_at'>[] = [];
        let count = 0;

        for (const row of jsonRows) {
          const name =
            row['Devotee Name'] ||
            row['Name'] ||
            row['ಭಕ್ತರ ಹೆಸರು'] ||
            row['Devotee'] ||
            Object.values(row)[1];
          const phone = String(row['Phone'] || row['Mobile'] || row['ದೂರವಾಣಿ'] || Object.values(row)[2] || '');
          const address = String(row['Address'] || row['ವಿಳಾಸ'] || Object.values(row)[3] || 'Barkur');
          const place = String(row['Place'] || row['Grama'] || row['ಗ್ರಾಮ'] || 'Barkur (ಬಾರಕೂರು)');
          const sevaRaw = String(row['Seva'] || row['Seva Category'] || 'NITYA_POOJA').toUpperCase();

          let type: TempleRegistration['seva_type'] = 'NITYA_POOJA';
          if (sevaRaw.includes('NAVARATRI') || sevaRaw.includes('ನವರಾತ್ರಿ')) type = 'NAVARATRI';
          else if (sevaRaw.includes('SONARATHI') || sevaRaw.includes('ಸೋನಾರತಿ')) type = 'SONARATHI';
          else if (sevaRaw.includes('ANNADANA') || sevaRaw.includes('ಅನ್ನದಾನ')) type = 'ANNADANA';

          const fee = Number(row['Fee'] || row['Agreed Fee'] || 1500);
          const paid = Number(row['Paid'] || row['Amount Paid'] || fee);
          const serial =
            row['Serial Number'] ||
            row['S.No'] ||
            `${SEVA_CATEGORIES.find(s => s.key === type)?.prefix}-${String(100 + count).padStart(5, '0')}`;

          if (name) {
            parsedItems.push({
              serial_number: serial,
              devotee_name: String(name).trim(),
              phone: phone.trim(),
              address: address.trim(),
              place: place.trim(),
              seva_type: type,
              seva_date: row['Seva Date'] || row['Date'] || todayStr,
              festival_day: row['Festival Day'] ? Number(row['Festival Day']) : undefined,
              agreed_fee: fee,
              paid_amount: paid,
              payment_status: paid >= fee ? 'PAID' : 'PARTIAL',
              notes: row['Remarks'] || row['Notes'] || 'Bulk imported from spreadsheet',
            });
            count++;
          }
        }

        if (parsedItems.length > 0) {
          await repository.bulkImport(parsedItems);
          showToast(
            language === 'kn'
              ? `${parsedItems.length} ದಾಖಲೆಗಳು ಆಮದಾಗಿದೆ!`
              : `Successfully imported ${parsedItems.length} records!`,
            'success'
          );
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
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet);
        processRows(json);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const triggerPrint = (mode: 'receipt' | 'register' | 'labels') => {
    setPrintMode(mode);
    setTimeout(() => {
      window.print();
    }, 150);
  };


  return (
    <div className="space-y-4">
      {/* PRINT: LABELS */}
      {printMode === 'labels' && (
        <div className="hidden print:block print-sheet text-black font-sans p-2 bg-white w-full">
          <div className={`grid gap-2 w-full ${labelCols === 2 ? 'grid-cols-2' : labelCols === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
            {labelTargetRecords.map(r => (
              <div
                key={r.id}
                className={`break-inside-avoid flex flex-col justify-between ${labelShowBorder ? 'border border-gray-400' : 'border border-transparent'} ${labelPadding === 'compact' ? 'p-2 min-h-[90px]' : labelPadding === 'normal' ? 'p-3 min-h-[115px]' : 'p-4 min-h-[140px]'}`}
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] text-gray-600 font-bold border-b border-gray-200 pb-0.5 mb-1">
                    <span>{labelCustomHeader}</span>
                    {labelIncludeSerial && <span>{r.serial_number}</span>}
                  </div>
                  <div className={`font-bold leading-tight text-black ${labelFontSize === 'sm' ? 'text-xs' : labelFontSize === 'md' ? 'text-sm' : 'text-base'}`}>
                    {r.devotee_name}
                  </div>
                  <div className={`text-gray-800 leading-snug mt-1 ${labelFontSize === 'sm' ? 'text-[11px]' : labelFontSize === 'md' ? 'text-xs' : 'text-sm'}`}>
                    {r.address}
                  </div>
                  {labelIncludePhone && r.phone && <div className="text-[10px] text-gray-700 mt-1">Ph: {r.phone}</div>}
                  {labelIncludeSeva && <div className="text-[9px] text-gray-500 font-semibold mt-0.5">{r.seva_type.replace('_', ' ')} {r.festival_day ? `(Day ${r.festival_day})` : `(${r.seva_date || 'Annual'})`}</div>}
                </div>
                {labelShowSender && <div className="text-[8px] text-gray-500 border-t border-gray-100 pt-0.5 mt-1 text-right italic">From: Sri Kalikamba Temple Barkur - 576210</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PRINT: DEVOTEE RECEIPT */}
      {printMode === 'receipt' && printingRecord && (
        <div className="hidden print:block print-sheet text-black font-sans p-6 bg-white max-w-xl mx-auto border-2 border-black">
          <div className="flex items-center gap-3 border-b-2 border-black pb-3 mb-4">
            <img src="/logo.jpg" alt="Temple Logo" className="w-16 h-16 object-contain rounded shrink-0 border border-black/20" />
            <div className="flex-1 text-center pr-4">
              <h1 className="text-xl font-bold leading-tight">ಶ್ರೀ ಕಾಳಿಕಾಂಬಾ ದೇವಸ್ಥಾನ ಬಾರಕೂರು</h1>
              <h2 className="text-xs font-semibold">Sri Kalikamba Temple Barkur, Udupi</h2>
              <p className="text-[11px] text-gray-700"> Barkur, Udupi District, Karnataka - 576210</p>
              <div className="mt-1 text-[11px] font-bold border border-black inline-block px-2.5 py-0.5 uppercase tracking-wider">ಶಾಶ್ವತ ಸೇವಾ ಅಧಿಕೃತ ರಸೀದಿ / Official Seva Receipt</div>
            </div>
          </div>
          <div className="grid grid-cols-2 text-xs gap-3 mb-4">
            <div>
              <p><span className="font-bold">Serial No:</span> {printingRecord.serial_number}</p>
              <p><span className="font-bold">Devotee:</span> {printingRecord.devotee_name}</p>
              <p><span className="font-bold">Phone:</span> {printingRecord.phone}</p>
              <p><span className="font-bold">Address:</span> {printingRecord.address}</p>
            </div>
            <div className="text-right">
              <p><span className="font-bold">Receipt Date:</span> {new Date().toLocaleDateString('en-IN')}</p>
              <p><span className="font-bold">Seva:</span> {printingRecord.seva_type.replace('_', ' ')}</p>
              <p><span className="font-bold">Occurrence:</span> {printingRecord.festival_day ? `Festival Day ${printingRecord.festival_day}` : printingRecord.seva_date}</p>
            </div>
          </div>
          <div className="border border-black mb-4">
            <table className="w-full text-xs">
              <thead className="bg-gray-100 border-b border-black">
                <tr>
                  <th className="p-2 text-left">Description</th>
                  <th className="p-2 text-right">Agreed Fee</th>
                  <th className="p-2 text-right">Paid Amount</th>
                  <th className="p-2 text-right">Balance Due</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 font-semibold">Shashwatha Seva Permanent Endowment</td>
                  <td className="p-2 text-right">₹{printingRecord.agreed_fee.toLocaleString('en-IN')}</td>
                  <td className="p-2 text-right font-bold">₹{printingRecord.paid_amount.toLocaleString('en-IN')}</td>
                  <td className="p-2 text-right">₹{Math.max(0, printingRecord.agreed_fee - printingRecord.paid_amount).toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-end pt-12 text-xs">
            <div className="text-center"><div className="border-t border-black w-36 pt-1">Devotee Signature</div></div>
            <div className="text-center"><div className="border-t border-black w-44 pt-1">Temple Office / Manager</div></div>
          </div>
        </div>
      )}

      {/* PRINT: REGISTER */}
      {printMode === 'register' && (
        <div className="hidden print:block print-sheet text-black font-sans p-4 bg-white">
          <div className="text-center border-b-2 border-black pb-3 mb-4">
            <h1 className="text-2xl font-bold">ಶ್ರೀ ಕಾಳಿಕಾಂಬಾ ದೇವಸ್ಥಾನ ಬಾರಕೂರು</h1>
            <h2 className="text-base font-semibold">Sri Kalikamba Temple Barkur — Seva Register</h2>
            <div className="mt-2 text-sm font-bold border border-black inline-block px-4 py-1 uppercase">
              {quickDateFilter === 'TODAY' ? `Today's Seva — ${todayStr}` : `Filtered Register (${filteredRecords.length} records)`}
            </div>
          </div>
          <table className="w-full text-xs border border-black border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-black">
                <th className="p-2 border-r border-black text-left">S.No</th>
                <th className="p-2 border-r border-black text-left">Devotee Name</th>
                <th className="p-2 border-r border-black text-left">Phone</th>
                <th className="p-2 border-r border-black text-left">Address</th>
                <th className="p-2 border-r border-black text-left">Seva</th>
                <th className="p-2 border-r border-black text-left">Date / Day</th>
                <th className="p-2 border-r border-black text-center">Status</th>
                <th className="p-2 text-center">Sign</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map(r => (
                <tr key={r.id} className="border-b border-black">
                  <td className="p-2 border-r border-black font-bold">{r.serial_number}</td>
                  <td className="p-2 border-r border-black font-semibold">{r.devotee_name}</td>
                  <td className="p-2 border-r border-black">{r.phone}</td>
                  <td className="p-2 border-r border-black truncate max-w-xs">{r.address}</td>
                  <td className="p-2 border-r border-black">{r.seva_type.replace('_', ' ')}</td>
                  <td className="p-2 border-r border-black">{r.festival_day ? `Day ${r.festival_day}` : r.seva_date}</td>
                  <td className="p-2 border-r border-black text-center">{r.payment_status}</td>
                  <td className="p-2 text-center h-8"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TOP BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 no-print">
        {/* Pill tabs */}
        <div className="flex-1 min-w-0 overflow-x-auto scrollbar-none">
          <div className="inline-flex items-center gap-1 p-1 bg-slate-200/60 dark:bg-slate-800/60 rounded-full">
            <button
              onClick={() => { setActiveTab('ALL'); setSelectedFestivalDay(''); setCurrentPage(1); }}
              className={`seva-tab ${activeTab === 'ALL' ? 'seva-tab-active' : 'seva-tab-inactive'}`}
            >
              <span>{language === 'kn' ? 'ಎಲ್ಲಾ' : 'All'}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold leading-none">{records.length}</span>
            </button>
            {SEVA_CATEGORIES.map(cat => {
              const isSelected = activeTab === cat.key;
              const count = records.filter(r => r.seva_type === cat.key).length;
              return (
                <button
                  key={cat.key}
                  onClick={() => { setActiveTab(cat.key); setSelectedFestivalDay(''); setCurrentPage(1); }}
                  className={`seva-tab ${isSelected ? 'seva-tab-active' : 'seva-tab-inactive'}`}
                >
                  <span>{language === 'kn' ? cat.name_kn : cat.name_en}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold leading-none">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => openNewForm()} className="btn-primary">
            <Plus className="w-3.5 h-3.5" />
            <span>{language === 'kn' ? 'ಹೊಸ ಸೇವೆ' : 'Add Seva'}</span>
          </button>
          <button onClick={() => setPrintMode('labels')} className="btn-secondary" title="Postal Labels">
            <Tag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{language === 'kn' ? 'ಲೇಬಲ್' : 'Labels'}</span>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full font-semibold leading-none">{selectedIds.size > 0 ? selectedIds.size : filteredRecords.length}</span>
          </button>
          <button onClick={() => triggerPrint('register')} className="btn-secondary" title="Print register"><Printer className="w-3.5 h-3.5" /></button>
          <button onClick={() => setShowUploadModal(true)} className="btn-secondary" title="Bulk upload"><Upload className="w-3.5 h-3.5" /></button>
          <button onClick={handleExportExcel} className="btn-secondary" title="Export Excel"><Download className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className="section-card p-4 space-y-3 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5">
          <div className="lg:col-span-4 relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder={language === 'kn' ? 'ಹೆಸರು, ಫೋನ್, ವಿಳಾಸ ಹುಡುಕಿ...' : 'Search name, phone, address, serial...'}
              className="filter-input pl-9 pr-8"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="lg:col-span-2">
            <select value={monthFilter} onChange={e => { setMonthFilter(e.target.value ? Number(e.target.value) : ''); setCurrentPage(1); }} className="filter-input">
              <option value="">{language === 'kn' ? 'ಎಲ್ಲಾ ತಿಂಗಳು' : 'All Months'}</option>
              {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}. {m}</option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-1">
            <select value={dayOfMonthFilter} onChange={e => { setDayOfMonthFilter(e.target.value ? Number(e.target.value) : ''); setCurrentPage(1); }} className="filter-input">
              <option value="">Day</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="lg:col-span-2">
            <select value={paymentFilter} onChange={e => { setPaymentFilter(e.target.value as any); setCurrentPage(1); }} className="filter-input">
              <option value="ALL">Payment: All</option>
              <option value="PAID">Full Paid</option>
              <option value="PENDING">Balance Pending</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Quick:</span>
            {(['TODAY', 'TOMORROW'] as const).map(qf => (
              <button
                key={qf}
                onClick={() => { setQuickDateFilter(quickDateFilter === qf ? 'ALL' : qf); setSpecificDate(''); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${quickDateFilter === qf ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
              >
                {qf === 'TODAY' ? (language === 'kn' ? 'ಇಂದಿನ ಸೇವೆ' : "Today's Seva") : (language === 'kn' ? 'ನಾಳೆ' : 'Tomorrow')}
              </button>
            ))}

            {(activeTab === 'NAVARATRI' || activeTab === 'ALL') && (
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-700">
                <span className="text-[11px] font-medium text-slate-500">Navaratri:</span>
                <select value={selectedFestivalDay} onChange={e => { setSelectedFestivalDay(e.target.value ? Number(e.target.value) : ''); setCurrentPage(1); }} className="filter-input !w-auto !py-1 !text-xs">
                  <option value="">All Days</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(d => <option key={d} value={d}>Day {d}</option>)}
                </select>
              </div>
            )}

            {activeTab === 'SONARATHI' && (
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-700">
                <span className="text-[11px] font-medium text-slate-500">Sonarathi:</span>
                <select value={selectedFestivalDay} onChange={e => { setSelectedFestivalDay(e.target.value ? Number(e.target.value) : ''); setCurrentPage(1); }} className="filter-input !w-auto !py-1 !text-xs">
                  <option value="">All 30 Days</option>
                  {Array.from({ length: 30 }, (_, i) => i + 1).map(d => <option key={d} value={d}>Day {d}</option>)}
                </select>
              </div>
            )}

            <input
              type="date"
              value={specificDate}
              onChange={e => { setSpecificDate(e.target.value); setQuickDateFilter('ALL'); setCurrentPage(1); }}
              className="filter-input !w-auto !py-1 !text-xs"
            />
          </div>

          {(searchQuery || placeFilter || monthFilter !== '' || dayOfMonthFilter !== '' || quickDateFilter !== 'ALL' || specificDate || selectedFestivalDay !== '' || paymentFilter !== 'ALL') && (
            <button onClick={resetAllFilters} className="btn-ghost !text-rose-600 dark:!text-rose-400">
              <RotateCcw className="w-3 h-3" />
              <span>{language === 'kn' ? 'ಫಿಲ್ಟರ್ ತೆರವು' : 'Clear Filters'}</span>
            </button>
          )}
        </div>
      </div>

      {/* SUMMARY + SELECT BAR */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-0.5 gap-2 no-print">
        <div className="flex items-center gap-3">
          <button onClick={toggleSelectAll} className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
            {selectedIds.size === filteredRecords.length && filteredRecords.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-emerald-600" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>{selectedIds.size > 0 ? `${selectedIds.size} selected for labels` : `Select all (${filteredRecords.length}) for labels`}</span>
          </button>
          {selectedIds.size > 0 && (
            <button onClick={() => setSelectedIds(new Set())} className="text-rose-500 hover:text-rose-700 font-medium">Clear</button>
          )}
        </div>
        <div className="flex items-center gap-3 font-medium">
          <span className="text-slate-600 dark:text-slate-300">{filteredRecords.length} records</span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span className="text-emerald-700 dark:text-emerald-400">Paid: {filteredRecords.filter(r => r.payment_status === 'PAID').length}</span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span className="text-amber-600 dark:text-amber-400">Pending: {filteredRecords.filter(r => r.payment_status !== 'PAID').length}</span>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="section-card overflow-hidden no-print">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-10 !text-center">
                  <input type="checkbox" checked={selectedIds.size === filteredRecords.length && filteredRecords.length > 0} onChange={toggleSelectAll} className="rounded border-slate-300" />
                </th>
                <th>Serial No</th>
                <th>Devotee Name</th>
                <th>Phone</th>
                <th>Address / Grama</th>
                <th>Seva Category</th>
                <th>Date / Day</th>
                <th className="!text-right">Fee (₹)</th>
                <th className="!text-center">Status</th>
                <th className="!text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-14 !text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                      <span>Loading records...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 !text-center">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No records match current filters</p>
                    <p className="text-slate-400 mt-1">Try resetting filters or adding a new seva registration.</p>
                  </td>
                </tr>
              ) : (
                paginatedRecords.map(item => {
                  const cat = SEVA_CATEGORIES.find(s => s.key === item.seva_type);
                  const isPaid = item.payment_status === 'PAID';
                  const balance = Math.max(0, item.agreed_fee - item.paid_amount);
                  const isSelected = selectedIds.has(item.id);
                  return (
                    <tr key={item.id} style={isSelected ? { background: 'rgba(251,191,36,0.08)' } : {}}>
                      <td className="!text-center">
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelectRow(item.id)} className="rounded border-slate-300" />
                      </td>
                      <td>
                        <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{item.serial_number}</span>
                      </td>
                      <td className="relative group">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 cursor-default">{item.devotee_name}</div>
                        <div className="hidden group-hover:block absolute left-0 top-full z-30 w-72 mt-1 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl text-xs space-y-1.5 pointer-events-none">
                          <div className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1.5 mb-1.5">{item.devotee_name}</div>
                          <div className="text-slate-600 dark:text-slate-300"><span className="font-semibold">Phone:</span> {item.phone}</div>
                          <div className="text-slate-600 dark:text-slate-300 leading-relaxed"><span className="font-semibold">Address:</span> {item.address}</div>
                          <div className="text-slate-600 dark:text-slate-300"><span className="font-semibold">Seva:</span> {cat?.name_en || item.seva_type}</div>
                          <div className="text-slate-600 dark:text-slate-300"><span className="font-semibold">Occurrence:</span> {item.festival_day ? `Festival Day ${item.festival_day}` : item.seva_date || 'Annual'}</div>
                          <div className="flex justify-between font-semibold pt-1.5 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-slate-700 dark:text-slate-300">₹{item.agreed_fee.toLocaleString('en-IN')}</span>
                            <span className={isPaid ? 'text-emerald-600' : 'text-amber-600'}>{isPaid ? 'Full Paid' : `Bal: ₹${balance.toLocaleString('en-IN')}`}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <a href={`tel:${item.phone}`} className="hover:underline text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="tabular-nums">{item.phone}</span>
                        </a>
                      </td>
                      <td className="max-w-[200px]">
                        <div className="truncate flex items-center gap-1.5" title={item.address}>
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{item.address}</span>
                        </div>
                      </td>
                      <td>
                        <span className="font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {language === 'kn' ? cat?.name_kn || item.seva_type : cat?.name_en || item.seva_type}
                        </span>
                      </td>
                      <td>
                        {item.festival_day ? (
                          <span className="badge badge-amber">Day {item.festival_day}</span>
                        ) : (
                          <span className="tabular-nums text-slate-700 dark:text-slate-300">{item.seva_date || '—'}</span>
                        )}
                      </td>
                      <td className="!text-right whitespace-nowrap">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">₹{item.agreed_fee.toLocaleString('en-IN')}</div>
                        {balance > 0 && <div className="text-[11px] text-amber-600 dark:text-amber-400 tabular-nums">Paid: ₹{item.paid_amount.toLocaleString('en-IN')}</div>}
                      </td>
                      <td className="!text-center">
                        {isPaid ? (
                          <span className="badge badge-green"><CheckCircle2 className="w-3 h-3" />Paid</span>
                        ) : (
                          <span className="badge badge-amber"><AlertCircle className="w-3 h-3" />₹{balance.toLocaleString('en-IN')} due</span>
                        )}
                      </td>
                      <td className="!text-center">
                        <div className="inline-flex items-center gap-0.5">
                          <button onClick={() => { setPrintingRecord(item); triggerPrint('receipt'); }} className="btn-ghost !px-2 !py-1.5" title="Receipt"><FileText className="w-3.5 h-3.5" /></button>
                          <button onClick={() => openEditForm(item)} className="btn-ghost !px-2 !py-1.5" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(item.id, item.serial_number)} className="btn-ghost !px-2 !py-1.5 !text-rose-500 hover:!bg-rose-50 dark:hover:!bg-rose-950/30" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} className="filter-input !w-auto !py-1 !px-2">
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span>
              <strong className="text-slate-800 dark:text-slate-100">{filteredRecords.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</strong>
              {' – '}
              <strong className="text-slate-800 dark:text-slate-100">{Math.min(currentPage * pageSize, filteredRecords.length)}</strong>
              {' of '}
              <strong className="text-slate-800 dark:text-slate-100">{filteredRecords.length}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)} className="btn-secondary !px-3 !py-1.5 disabled:opacity-40">
              <ChevronLeft className="w-3.5 h-3.5" /><span>Prev</span>
            </button>
            <span className="px-2 font-semibold text-slate-700 dark:text-slate-300">{currentPage} / {totalPages}</span>
            <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="btn-secondary !px-3 !py-1.5 disabled:opacity-40">
              <span>Next</span><ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* POSTAL LABELS STUDIO MODAL */}
      {printMode === 'labels' && (
        <div className="modal-overlay no-print">
          <div className="modal-panel max-w-4xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Tag className="w-4 h-4 text-amber-600" />
                  {language === 'kn' ? 'ಅಂಚೆ ಲೇಬಲ್ ಸ್ಟುಡಿಯೋ' : 'Postal Mailing Labels Studio'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{labelTargetRecords.length} addresses • A4 sticker sheet layout</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => triggerPrint('labels')} className="btn-primary"><Printer className="w-3.5 h-3.5" /><span>Print Labels</span></button>
                <button onClick={() => setPrintMode(null)} className="btn-ghost"><X className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="form-label">Columns</label>
                <div className="flex gap-1">
                  {[2, 3, 4].map(c => (
                    <button key={c} onClick={() => setLabelCols(c as any)} className={`flex-1 py-2 rounded-lg font-semibold text-xs transition-colors ${labelCols === c ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>{c}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="form-label">Font Size</label>
                <div className="flex gap-1">
                  {(['sm', 'md', 'lg'] as const).map(s => (
                    <button key={s} onClick={() => setLabelFontSize(s)} className={`flex-1 py-2 rounded-lg font-semibold text-xs transition-colors ${labelFontSize === s ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                      {s === 'sm' ? '10pt' : s === 'md' ? '12pt' : '14pt'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="form-label">Sticker Height</label>
                <select value={labelPadding} onChange={e => setLabelPadding(e.target.value as any)} className="filter-input">
                  <option value="compact">Compact</option>
                  <option value="normal">Standard</option>
                  <option value="relaxed">Large</option>
                </select>
              </div>
              <div>
                <label className="form-label">Header Text</label>
                <input type="text" value={labelCustomHeader} onChange={e => setLabelCustomHeader(e.target.value)} className="filter-input" />
              </div>
              <div className="col-span-2 sm:col-span-4 flex flex-wrap gap-4 pt-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                {[
                  { label: 'Serial No', v: labelIncludeSerial, set: setLabelIncludeSerial },
                  { label: 'Phone No', v: labelIncludePhone, set: setLabelIncludePhone },
                  { label: 'Seva Type', v: labelIncludeSeva, set: setLabelIncludeSeva },
                  { label: 'Cut Borders', v: labelShowBorder, set: setLabelShowBorder },
                  { label: 'From: Temple', v: labelShowSender, set: setLabelShowSender },
                ].map(opt => (
                  <label key={opt.label} className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input type="checkbox" checked={opt.v} onChange={e => opt.set(e.target.checked)} className="rounded text-emerald-600" />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-slate-100 dark:bg-slate-950">
              <div className={`grid gap-2 ${labelCols === 2 ? 'grid-cols-2' : labelCols === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
                {labelTargetRecords.slice(0, 12).map(r => (
                  <div key={r.id} className={`bg-white text-black rounded p-2.5 flex flex-col justify-between ${labelShowBorder ? 'border border-dashed border-gray-400' : ''} ${labelPadding === 'compact' ? 'min-h-[80px]' : labelPadding === 'normal' ? 'min-h-[100px]' : 'min-h-[125px]'}`}>
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-gray-500 font-bold border-b border-gray-100 pb-0.5 mb-1">
                        <span>{labelCustomHeader}</span>
                        {labelIncludeSerial && <span>{r.serial_number}</span>}
                      </div>
                      <div className={`font-bold leading-tight ${labelFontSize === 'sm' ? 'text-xs' : labelFontSize === 'md' ? 'text-sm' : 'text-base'}`}>{r.devotee_name}</div>
                      <div className={`text-gray-700 leading-snug mt-0.5 ${labelFontSize === 'sm' ? 'text-[11px]' : labelFontSize === 'md' ? 'text-xs' : 'text-sm'}`}>{r.address}</div>
                      {labelIncludePhone && r.phone && <div className="text-[10px] text-gray-600 mt-0.5">Ph: {r.phone}</div>}
                      {labelIncludeSeva && <div className="text-[9px] text-gray-500 font-semibold">{r.seva_type.replace('_', ' ')}</div>}
                    </div>
                    {labelShowSender && <div className="text-[8px] text-gray-400 border-t border-gray-100 pt-0.5 mt-1 text-right italic">From: Sri Kalikamba Temple Barkur</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT SEVA MODAL */}
      {showFormModal && (
        <div className="modal-overlay no-print">
          <div className="modal-panel max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {editingId ? (language === 'kn' ? 'ಸೇವಾ ವಿವರ ತಿದ್ದುಪಡಿ' : 'Edit Seva Registration') : (language === 'kn' ? 'ಹೊಸ ಶಾಶ್ವತ ಸೇವಾ ನೋಂದಣಿ' : 'New Seva Registration')}
              </h3>
              <button onClick={() => setShowFormModal(false)} className="btn-ghost !px-2"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveSeva} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="form-label">{language === 'kn' ? 'ಭಕ್ತರ ಹೆಸರು' : 'Devotee Name'} <span className="text-rose-500 normal-case">*</span></label>
                  <input type="text" required placeholder="e.g. ಶ್ರೀನಿವಾಸ ಆಚಾರ್ಯ" value={formData.devotee_name} onChange={e => setFormData({ ...formData, devotee_name: e.target.value })} className="form-input" />
                </div>
                <div>
                  <label className="form-label">{language === 'kn' ? 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ' : 'Phone Number'} <span className="text-rose-500 normal-case">*</span></label>
                  <input type="tel" required placeholder="9845123456" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="form-input" />
                </div>
              </div>

              <div>
                <label className="form-label">{language === 'kn' ? 'ಶಾಶ್ವತ ಸೇವಾ ಪ್ರಕಾರ' : 'Seva Category'} <span className="text-rose-500 normal-case">*</span></label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {SEVA_CATEGORIES.map(s => {
                    const isChecked = formData.seva_type === s.key;
                    return (
                      <label
                        key={s.key}
                        className={`radio-tile !py-2 !px-3 items-center gap-2.5 cursor-pointer ${isChecked ? 'radio-tile-active' : ''}`}
                        onClick={() => handleFormSevaChange(s.key)}
                      >
                        <input
                          type="radio"
                          name="seva_type_radio"
                          value={s.key}
                          checked={isChecked}
                          onChange={() => handleFormSevaChange(s.key)}
                          className="radio-small !mt-0 shrink-0"
                        />
                        <span className={`text-xs font-semibold truncate ${isChecked ? 'text-[--primary] dark:text-white' : 'text-slate-700 dark:text-slate-200'}`}>
                          {language === 'kn' ? s.name_kn : s.name_en}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                {formData.seva_type === 'NITYA_POOJA' || formData.seva_type === 'ANNADANA' ? (
                  <div>
                    <label className="form-label">{language === 'kn' ? 'ವಾರ್ಷಿಕ ಸೇವಾ ದಿನಾಂಕ' : 'Annual Seva Date'} <span className="text-rose-500 normal-case">*</span></label>
                    <input type="date" required value={formData.seva_date} onChange={e => setFormData({ ...formData, seva_date: e.target.value })} className="form-input" />
                  </div>
                ) : formData.seva_type === 'NAVARATRI' ? (
                  <div>
                    <label className="form-label">{language === 'kn' ? 'ನವರಾತ್ರಿ ದಿನ (1-10)' : 'Navaratri Day (1–10)'} <span className="text-rose-500 normal-case">*</span></label>
                    <div className="grid grid-cols-5 gap-1.5 mt-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(d => (
                        <button key={d} type="button" onClick={() => setFormData({ ...formData, festival_day: d })} className={`py-2 rounded-lg font-bold text-xs transition-colors ${formData.festival_day === d ? 'bg-[--primary] text-white shadow-xs' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'}`}>{d}</button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="form-label">{language === 'kn' ? 'ಸೋನಾರತಿ ದಿನ (1-30)' : 'Sonarathi Day (1–30)'}</label>
                    <select value={formData.festival_day} onChange={e => setFormData({ ...formData, festival_day: Number(e.target.value) })} className="form-input mt-1">
                      {Array.from({ length: 30 }, (_, i) => i + 1).map(d => <option key={d} value={d}>Day {d}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="form-label">{language === 'kn' ? 'ಸಂಪೂರ್ಣ ಅಂಚೆ ವಿಳಾಸ' : 'Full Postal Address'} <span className="text-rose-500 normal-case">*</span></label>
                <textarea rows={3} required placeholder={language === 'kn' ? 'ಮನೆ ನಂ., ರಸ್ತೆ, ಊರು, ಪಿನ್ ಕೋಡ್...' : 'Door No, Street, Village/Town, Pincode...'} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="form-input resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="form-label">{language === 'kn' ? 'ನಿಗದಿಪಡಿಸಿದ ಶುಲ್ಕ (₹)' : 'Agreed Fee (₹)'}</label>
                  <input type="number" min="0" required value={formData.agreed_fee} onChange={e => { const f = Number(e.target.value); setFormData({ ...formData, agreed_fee: f, paid_amount: f }); }} className="form-input font-semibold" />
                </div>
                <div>
                  <label className="form-label">{language === 'kn' ? 'ಪಾವತಿಸಿದ ಮೊತ್ತ (₹)' : 'Amount Paid (₹)'}</label>
                  <input type="number" min="0" required value={formData.paid_amount} onChange={e => setFormData({ ...formData, paid_amount: Number(e.target.value) })} className="form-input font-semibold" />
                </div>
                {Number(formData.agreed_fee) > Number(formData.paid_amount) && (
                  <div className="col-span-2">
                    <span className="badge badge-amber"><AlertCircle className="w-3 h-3" />Balance: ₹{(Number(formData.agreed_fee) - Number(formData.paid_amount)).toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setShowFormModal(false)} className="btn-secondary">{language === 'kn' ? 'ರದ್ದುಮಾಡಿ' : 'Cancel'}</button>
                <button type="submit" className="btn-primary">
                  {editingId ? (language === 'kn' ? 'ಬದಲಾವಣೆ ಉಳಿಸಿ' : 'Save Changes') : (language === 'kn' ? 'ಸೇವೆ ನೋಂದಾಯಿಸಿ' : 'Register Seva')}
                </button>
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
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Bulk Upload Excel / CSV</h3>
              <button onClick={() => setShowUploadModal(false)} className="btn-ghost !px-2"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5">
              <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl space-y-3 text-center">
                <Upload className="w-8 h-8 mx-auto text-slate-400" />
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Select .xlsx or .csv file</p>
                  <p className="text-xs text-slate-500 mt-1">Columns: Devotee Name, Phone, Address, Place, Seva, Fee, Paid</p>
                </div>
                <label className="btn-primary cursor-pointer">
                  <span>{uploading ? 'Processing...' : 'Browse File'}</span>
                  <input type="file" accept=".csv, .xlsx, .xls" disabled={uploading} onChange={handleBulkUploadFile} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
