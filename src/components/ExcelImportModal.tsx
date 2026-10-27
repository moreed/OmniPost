import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  Download, 
  Check, 
  AlertCircle, 
  X, 
  ArrowRight, 
  Table, 
  ClipboardPaste, 
  Sparkles, 
  Zap, 
  Layers,
  FileCheck,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Globe
} from 'lucide-react';
import { ExcelColumnMapping, SocialPostItem, ImportValidationReport } from '../types/social';
import { 
  parseExcelFile, 
  parsePastedSpreadsheetText, 
  convertRowsToSocialPosts, 
  ParsedExcelResult, 
  exportAura29ColumnWorkbook,
  AURA_29_HEADERS
} from '../utils/excelParser';
import { generateDefaultNovemberCalendar } from '../utils/defaultCalendar';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (posts: SocialPostItem[]) => void;
  existingPosts: SocialPostItem[];
  initialFile?: File | null;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  existingPosts,
  initialFile = null,
}) => {
  const [importTab, setImportTab] = useState<'templates' | 'upload' | 'paste'>(
    initialFile ? 'upload' : 'templates'
  );
  const [file, setFile] = useState<File | null>(initialFile);
  const [pastedText, setPastedText] = useState<string>('');
  const [parsedData, setParsedData] = useState<ParsedExcelResult | null>(null);
  const [customMapping, setCustomMapping] = useState<ExcelColumnMapping | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (initialFile) {
      setImportTab('upload');
      handleFileSelected(initialFile);
    }
  }, [initialFile]);

  if (!isOpen) return null;

  const handleFileSelected = async (selectedFile: File) => {
    setErrorMsg(null);
    setIsProcessing(true);
    setFile(selectedFile);

    try {
      const result = await parseExcelFile(selectedFile);
      if (result.rawRows.length === 0) {
        setErrorMsg('The selected spreadsheet has no rows or is empty.');
        setIsProcessing(false);
        return;
      }
      setParsedData(result);
      setCustomMapping(result.detectedMapping);
    } catch (err: any) {
      setErrorMsg(`Failed to parse Excel file: ${err?.message || 'Unsupported format'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessPastedText = () => {
    if (!pastedText.trim()) {
      setErrorMsg('Please paste tab-separated or comma-separated cells from your spreadsheet.');
      return;
    }
    setErrorMsg(null);
    setIsProcessing(true);

    try {
      const result = parsePastedSpreadsheetText(pastedText);
      if (result.rawRows.length === 0) {
        setErrorMsg('Could not detect any rows in the pasted data.');
        setIsProcessing(false);
        return;
      }
      setParsedData(result);
      setCustomMapping(result.detectedMapping);
    } catch (err: any) {
      setErrorMsg(`Failed to parse pasted table: ${err?.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 1-Click Sync: Pre-populated 30-day master schedule into Studio
  const handleSyncNovemberSchedule = () => {
    const sample = generateDefaultNovemberCalendar();
    onImportComplete(sample);
    setSyncSuccessMsg('Successfully loaded 30-Day Aura432Hz Master Campaign into Studio (29 Columns Preserved)!');
    setTimeout(() => {
      onClose();
    }, 700);
  };

  // Download Pre-populated 30-day Excel template
  const handleDownloadPopulatedTemplate = () => {
    const samplePosts = generateDefaultNovemberCalendar();
    exportAura29ColumnWorkbook(samplePosts, 'populated', 'Aura432Hz_30_video_master_content_calendar_.xlsx');
  };

  // Download Blank Excel template
  const handleDownloadBlankTemplate = () => {
    const samplePosts = generateDefaultNovemberCalendar();
    exportAura29ColumnWorkbook(samplePosts, 'blank', 'Aura432Hz_Blank_Template_29_Columns.xlsx');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (!parsedData || !customMapping) return;

    try {
      const converted = convertRowsToSocialPosts(parsedData.rawRows, customMapping);
      if (converted.length === 0) {
        setErrorMsg('Could not extract valid post rows with the selected column mapping.');
        return;
      }
      onImportComplete(converted);
      onClose();
    } catch (err: any) {
      setErrorMsg(`Error during import conversion: ${err?.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Aura432Hz 29-Column Content Ingestion & Readiness Engine
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  PHASE 1: PREPARATION ONLY
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Preserve all 29 columns from `30 Video Posts` worksheet • Zero video generation or posting during Phase 1
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800/80 bg-slate-950/40">
          <button
            type="button"
            onClick={() => {
              setImportTab('templates');
              setParsedData(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 cursor-pointer transition-all ${
              importTab === 'templates'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Aura432Hz Master & Blank Templates</span>
          </button>
          <button
            type="button"
            onClick={() => setImportTab('upload')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 cursor-pointer transition-all ${
              importTab === 'upload'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Custom Workbook (.xlsx)</span>
          </button>
          <button
            type="button"
            onClick={() => setImportTab('paste')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 cursor-pointer transition-all ${
              importTab === 'paste'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ClipboardPaste className="w-4 h-4" />
            <span>Paste Table Data</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {syncSuccessMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold">{syncSuccessMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          {/* Tab 1: Templates & 1-Click Studio Sync */}
          {importTab === 'templates' && (
            <div className="space-y-6">
              {/* Strict Phase 1 Notice */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Phase 1 Ingestion Guard Active
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Loading or importing content registers the 30 daily packages into the calendar and stores all 29 source fields immutably. In accordance with strict Phase 1 rules, <strong className="text-slate-200">zero video assets are generated and zero posts are dispatched to external platforms</strong> until administrator review in Phase 2.
                  </p>
                </div>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Populated 30-Day Master Schedule */}
                <div className="bg-slate-950/90 rounded-2xl border border-cyan-500/30 p-5 flex flex-col justify-between hover:border-cyan-500/60 transition-all shadow-lg relative group">
                  <div className="absolute top-4 right-4 px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    29 COLUMNS • 30 DAYS
                  </div>

                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
                      <Sparkles className="w-5 h-5" />
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-white">
                        Aura432Hz 30-Video Master Calendar
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Pre-populated with 30 sound healing video packages: hooks, full scripts, phonetic pronunciation, 4 platform posting times, and verbatim Gemini visual prompts.
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-2 text-[11px] text-slate-400">
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-cyan-400" />
                        <span>30 Days (Nov 1 – Nov 30) across 4 campaign phases</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Posting times: IG (18:00), YT (19:30), FB (20:00), TT (21:00)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Master time zone: Cairo (UTC+2) with UK & US references</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Raw source records preserved separately from active edits</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 space-y-2">
                    <button
                      type="button"
                      onClick={handleSyncNovemberSchedule}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-opacity cursor-pointer shadow-md"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Sync 30-Day Master into Studio (Phase 1)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadPopulatedTemplate}
                      className="w-full py-2 px-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Excel Workbook (`Aura432Hz...xlsx`)</span>
                    </button>
                  </div>
                </div>

                {/* Blank Production Framework */}
                <div className="bg-slate-950/90 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg">
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center text-slate-300 border border-slate-700">
                      <Table className="w-5 h-5" />
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-white">
                        Blank Production Framework (29 Headers)
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Pristine spreadsheet structure with exact 29 column headers, data formats, and a secondary sheet of platform video rules.
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-2 text-[11px] text-slate-400">
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-slate-400" />
                        <span>Exact 29 columns on sheet `30 Video Posts`</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-slate-400" />
                        <span>Sample row 1 included as structural guide</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-slate-400" />
                        <span>Pre-formatted for offline Excel & Google Sheets editing</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-slate-400" />
                        <span>Includes `Platform Specifications & Rules` reference sheet</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6">
                    <button
                      type="button"
                      onClick={handleDownloadBlankTemplate}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Blank Template (.xlsx)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 29 Columns Reference Drawer */}
              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    Recognized 29 Column Specification
                  </span>
                  <span className="text-[11px] text-slate-500">Sheet: 30 Video Posts</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 text-[10px] text-slate-400 font-mono">
                  {AURA_29_HEADERS.map((col, idx) => (
                    <div key={col} className="p-1.5 rounded bg-slate-900 border border-slate-800 truncate" title={col}>
                      <span className="text-cyan-400 mr-1.5">{idx + 1}.</span>
                      {col}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Upload File */}
          {importTab === 'upload' && !parsedData && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-800 hover:border-cyan-500/50 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 bg-slate-950/40 hover:bg-slate-950/70 transition-all cursor-pointer group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelected(e.target.files[0]);
                    }
                  }}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20 group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-white">
                    {file ? file.name : 'Click to select or drag and drop your spreadsheet'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Accepts `Aura432Hz_30_video_master_content_calendar_.xlsx` or any .xlsx/.csv with 29 columns
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  Select File from Computer
                </span>
              </div>
            </div>
          )}

          {/* Tab 3: Paste Table */}
          {importTab === 'paste' && !parsedData && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Paste rows directly from Excel or Google Sheets (Tab-Separated or CSV)
                </label>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste headers and 30 rows here (Ctrl+V / Cmd+V)..."
                  rows={8}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <button
                type="button"
                onClick={handleProcessPastedText}
                disabled={!pastedText.trim() || isProcessing}
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
              >
                <FileCheck className="w-4 h-4" />
                <span>Parse & Validate Pasted Cells</span>
              </button>
            </div>
          )}

          {/* Phase 1 Validation & Readiness Report Screen */}
          {parsedData && (
            <div className="space-y-6">
              {/* Validation Report Header Card */}
              {parsedData.validationReport && (
                <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        <FileCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">
                          Phase 1 Ingestion Validation Report
                        </h3>
                        <p className="text-xs text-slate-400">
                          File: <span className="text-slate-200">{parsedData.validationReport.fileName}</span> • Sheet: <span className="text-slate-200">{parsedData.validationReport.sheetName}</span>
                        </p>
                      </div>
                    </div>

                    {/* Readiness Score Badge */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Readiness Score
                        </div>
                        <div className="text-base font-extrabold text-cyan-400 font-mono">
                          {parsedData.validationReport.readinessScore}%
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        parsedData.validationReport.status === 'passed'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : parsedData.validationReport.status === 'passed_with_warnings'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}>
                        {parsedData.validationReport.status === 'passed' && 'VALIDATION PASSED'}
                        {parsedData.validationReport.status === 'passed_with_warnings' && 'PASSED WITH WARNINGS'}
                        {parsedData.validationReport.status === 'failed' && 'ERRORS DETECTED'}
                      </div>
                    </div>
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Rows Ingested</div>
                      <div className="text-lg font-bold text-white font-mono mt-0.5">
                        {parsedData.validationReport.validRows} / {parsedData.validationReport.totalRowsDetected}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Columns Matched</div>
                      <div className="text-lg font-bold text-cyan-400 font-mono mt-0.5">
                        {parsedData.validationReport.columnsMatched} / 29
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Validation Errors</div>
                      <div className={`text-lg font-bold font-mono mt-0.5 ${
                        parsedData.validationReport.errorCount === 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {parsedData.validationReport.errorCount}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Warnings Flagged</div>
                      <div className="text-lg font-bold text-amber-400 font-mono mt-0.5">
                        {parsedData.validationReport.warningCount}
                      </div>
                    </div>
                  </div>

                  {/* Issues List */}
                  {parsedData.validationReport.issues.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <div className="text-[11px] font-bold text-slate-300">Validation Checks Log:</div>
                      <div className="max-h-32 overflow-y-auto space-y-1 pr-2">
                        {parsedData.validationReport.issues.map((iss, i) => (
                          <div
                            key={i}
                            className={`p-2 rounded text-xs flex items-center justify-between ${
                              iss.severity === 'error'
                                ? 'bg-red-500/10 text-red-300 border border-red-500/20'
                                : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                            }`}
                          >
                            <span className="font-mono text-[11px]">{iss.message}</span>
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-950/60">
                              {iss.field}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Data Preview (First 5 Rows) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Table className="w-4 h-4 text-cyan-400" />
                    Previewing First 5 Entries (Raw Source Retention Verified)
                  </h4>
                  <span className="text-xs text-slate-500 font-mono">
                    Total: {parsedData.rawRows.length} rows detected
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/60">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">Day #</th>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Title</th>
                        <th className="p-2.5">Category</th>
                        <th className="p-2.5">Posting Times</th>
                        <th className="p-2.5">Egypt Time</th>
                        <th className="p-2.5">Prompt Length</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {parsedData.rawRows.slice(0, 5).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/50">
                          <td className="p-2.5 font-bold text-cyan-400">Day {idx + 1}</td>
                          <td className="p-2.5 font-mono text-[11px]">{row['Date'] || `2026-11-${idx + 1 < 10 ? '0' + (idx + 1) : idx + 1}`}</td>
                          <td className="p-2.5 max-w-[200px] truncate text-white">{row['Video Title'] || row['Title'] || `Sound Journey Day ${idx + 1}`}</td>
                          <td className="p-2.5">{row['Content Focus'] || row['Category'] || 'Sound Science'}</td>
                          <td className="p-2.5 font-mono text-[10px] text-slate-400">
                            IG: {row['Instagram Posting Time'] || '18:00'} | YT: {row['YouTube Shorts Posting Time'] || '19:30'}
                          </td>
                          <td className="p-2.5 font-mono text-[10px] text-emerald-400">
                            {row['Egypt Local Time Reference'] || '20:00 Cairo'}
                          </td>
                          <td className="p-2.5 text-slate-400">
                            {(row['Gemini Generation Prompt'] || '').length > 0 ? `${(row['Gemini Generation Prompt'] || '').length} chars` : 'Default'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setParsedData(null);
                    setFile(null);
                    setPastedText('');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Back to File Selection
                </button>

                <button
                  type="button"
                  onClick={handleConfirmImport}
                  className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:opacity-90 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer transition-opacity shadow-lg"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm Ingestion & Hydrate Calendar ({parsedData.rawRows.length} Days)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
