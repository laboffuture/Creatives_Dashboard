"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { WeeklyContent } from "@/components/dashboard/WeeklyContent";
import { parseReportData, ParsedReportData } from "@/lib/parsers";

// Format size helper
function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// Format date helper
function formatDate(dateString: string) {
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 'Unknown';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(d);
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime: string;
  webViewLink?: string;
}

export default function BackupPage() {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);
  const [historicalData, setHistoricalData] = useState<ParsedReportData | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    async function fetchFiles() {
      try {
        const response = await fetch('/api/drive');
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch backup files');
        }
        
        // Sort newest-first so 'Latest Backup' and the table order are correct
        // regardless of the order the Apps Script returns files in.
        const sorted = ((data.files || []) as DriveFile[]).slice().sort(
          (a, b) => (new Date(b.createdTime).getTime() || 0) - (new Date(a.createdTime).getTime() || 0)
        );
        setFiles(sorted);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load backups");
      } finally {
        setLoading(false);
      }
    }

    fetchFiles();
  }, []);

  const loadHistoricalData = async (file: DriveFile) => {
    setSelectedFile(file);
    setLoadingData(true);
    setHistoricalData(null);
    try {
      const response = await fetch('/api/drive/read-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: file.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to read Excel data');
      
      const parsed = parseReportData(data.data);
      setHistoricalData(parsed);
      
      // Scroll down to the report
      setTimeout(() => {
        document.getElementById('historical-report-view')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: unknown) {
      alert("Error loading historical data: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoadingData(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      
      {/* Dashboard Header */}
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-primary">BACKUPS</h1>
        </div>
        <button className="flex items-center gap-2 bg-surface-container-high text-on-surface py-2 px-4 rounded border border-outline-variant text-xs hover:bg-surface-container-highest transition-colors">
          <span className="material-symbols-outlined text-[18px]">cloud_sync</span>
          Google Drive Integration
        </button>
      </div>

      {/* Analysis Section */}
      {!loading && !error && files.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Total Archives */}
          <div className="bg-white border border-outline-variant p-6 relative overflow-hidden flex flex-col justify-between card-shadow rounded-xl">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
            <div className="flex items-center gap-2 text-on-surface-variant mb-4">
               <span className="material-symbols-outlined text-[18px]">folder_zip</span>
               <span className="text-xs font-bold uppercase tracking-wider">Total Archives</span>
            </div>
            <div className="text-4xl font-black text-primary">{files.length}</div>
          </div>
          
          {/* Total Storage Used */}
          <div className="bg-white border border-outline-variant p-6 relative overflow-hidden flex flex-col justify-between card-shadow rounded-xl">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary"></div>
            <div className="flex items-center gap-2 text-on-surface-variant mb-4">
               <span className="material-symbols-outlined text-[18px]">database</span>
               <span className="text-xs font-bold uppercase tracking-wider">Storage Used</span>
            </div>
            <div className="text-4xl font-black text-primary">
              {formatBytes(files.reduce((acc, file) => acc + (parseInt(file.size || '0') || 0), 0))}
            </div>
          </div>

          {/* Latest Backup */}
          <div className="bg-white border border-outline-variant p-6 relative overflow-hidden flex flex-col justify-between card-shadow rounded-xl">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-tertiary-container"></div>
            <div className="flex items-center gap-2 text-on-surface-variant mb-4">
               <span className="material-symbols-outlined text-[18px]">schedule</span>
               <span className="text-xs font-bold uppercase tracking-wider">Latest Backup</span>
            </div>
            <div className="text-xl font-bold text-primary mt-1">
              {formatDate(files[0].createdTime)}
            </div>
          </div>
        </div>
      )}

      {/* Table Container */}
      <section className="bg-white border border-outline-variant rounded-xl overflow-hidden card-shadow">
        <div className="p-6 border-b border-outline-variant flex items-center gap-4">
          <div className="bg-primary-container p-3 rounded">
            <span className="material-symbols-outlined text-on-primary">archive</span>
          </div>
          <div>
            <h2 className="text-xl font-black text-primary">Backup Archives</h2>
            <p className="text-sm text-on-surface-variant mt-1">Downloadable monthly data backups for audit and historical tracking.</p>
          </div>
        </div>

        <div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
              <p>Fetching backup files from Google Drive...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-error">
              <AlertCircle className="w-8 h-8 mb-4 opacity-80" />
              <p className="font-medium text-center">{error}</p>
              <p className="text-sm mt-2 text-error max-w-md text-center">
                Please ensure the Google API Key is correctly configured in .env.local and has access to the Drive API.
              </p>
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl mb-4 opacity-50">folder_off</span>
              <p>No backup files found in the specified folder.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-primary text-white text-xs uppercase tracking-widest font-bold">
                    <th className="py-3 px-6">File Name</th>
                    <th className="py-3 px-6">Date Created</th>
                    <th className="py-3 px-6">Size</th>
                    <th className="py-3 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {files.map((file, idx) => (
                    <motion.tr 
                      key={file.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`hover:bg-surface-container-low transition-colors group ${selectedFile?.id === file.id ? 'bg-surface-container-low border-l-4 border-primary' : 'border-l-4 border-transparent'}`}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <span className={`material-symbols-outlined transition-colors ${selectedFile?.id === file.id ? 'text-primary' : 'text-on-surface-variant'}`}>description</span>
                          <span className={`font-semibold ${selectedFile?.id === file.id ? 'text-primary font-bold' : 'text-primary'}`}>{file.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-on-surface-variant">
                        {formatDate(file.createdTime)}
                      </td>
                      <td className="py-4 px-6 text-sm text-on-surface-variant">
                        {file.size ? formatBytes(parseInt(file.size)) : 'Unknown size'}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => loadHistoricalData(file)}
                            className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-primary hover:opacity-90 rounded transition-colors gap-2"
                          >
                            <span className="material-symbols-outlined text-[16px]">visibility</span>
                            View Dashboard
                          </button>
                          {file.webViewLink ? (
                            <a 
                              href={file.webViewLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary border border-outline-variant hover:bg-surface-container rounded transition-colors gap-2"
                            >
                              <span className="material-symbols-outlined text-[16px]">download</span>
                              Download
                            </a>
                          ) : (
                            <span className="text-on-surface-variant/40 text-sm">No link</span>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Historical Dashboard View */}
      {selectedFile && (
        <div id="historical-report-view" className="mt-12 pt-8">
          <div className="flex items-center justify-between mb-6 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant card-shadow">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-2xl">history</span>
              <h2 className="text-xl font-bold text-primary">
                Historical Report View: {selectedFile.name}
              </h2>
            </div>
            <button 
              onClick={() => { setSelectedFile(null); setHistoricalData(null); }}
              className="px-4 py-2 text-xs font-bold text-on-surface-variant border border-outline-variant hover:bg-surface-container rounded transition-colors uppercase"
            >
              Close View
            </button>
          </div>

          {loadingData && (
            <div className="flex flex-col items-center justify-center py-20 bg-surface-container-lowest rounded-xl card-shadow border border-outline-variant">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p className="text-primary font-bold">Downloading and parsing historical spreadsheet...</p>
              <p className="text-on-surface-variant text-sm mt-2">This may take a few seconds.</p>
            </div>
          )}

          {historicalData && !loadingData && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 border border-outline-variant rounded-xl p-2 bg-surface-container-lowest">
              <WeeklyContent 
                reportTitle={`HISTORICAL BACKUP • ${selectedFile.name.toUpperCase().replace('.XLSX', '')}`}
                titleSuffix="HISTORICAL DATA"
                weekInfo={historicalData.weekInfo}
                kpis={historicalData.kpis}
                members={historicalData.members}
                subTeams={historicalData.subTeams}
                vertexes={historicalData.vertexes}
              />
            </div>
          )}
        </div>
      )}

    </div>
  );
}
