import React from 'react';
import { UploadCloud, CheckCircle, AlertTriangle, FileSpreadsheet, Play } from 'lucide-react';
import type { UploadedFilesState } from '../types';

interface FileUploadProps {
  filesState: UploadedFilesState;
  onFileSelect: (type: 'optionChainFile' | 'futuresFile' | 'optFile', file: File | null) => void;
  onBatchFilesSelect: (files: FileList) => void;
  onProcessFiles: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  filesState,
  onFileSelect,
  onBatchFilesSelect,
  onProcessFiles
}) => {
  const fileConfigs = [
    {
      key: 'optionChainFile' as const,
      name: filesState.optionChainFile ? filesState.optionChainFile.name : 'option-chain.csv',
      label: '1. Option Chain CSV',
      desc: 'e.g. option-chain-ED-NIFTY-*.csv or option-chain.csv',
      file: filesState.optionChainFile,
    },
    {
      key: 'futuresFile' as const,
      name: filesState.futuresFile ? filesState.futuresFile.name : 'nse50_fut.csv',
      label: '2. NSE 50 Futures CSV',
      desc: 'e.g. MW-FO-nse50_fut-*.csv or nse50_fut.csv',
      file: filesState.futuresFile,
    },
    {
      key: 'optFile' as const,
      name: filesState.optFile ? filesState.optFile.name : 'nse50_opt.csv',
      label: '3. NSE 50 Options CSV',
      desc: 'e.g. MW-FO-nse50_opt-*.csv or nse50_opt.csv',
      file: filesState.optFile,
    },
  ];

  const allUploaded = filesState.optionChainFile && filesState.futuresFile && filesState.optFile;

  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UploadCloud size={20} color="var(--accent-gold)" />
            Step 1: Upload Real Market CSV Files
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Select or drag & drop your 3 real NSE market CSV files to calculate derivative analytics.
          </p>
        </div>

        <div>
          <input
            type="file"
            accept=".csv"
            multiple
            id="batch-file-input"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onBatchFilesSelect(e.target.files);
              }
            }}
          />
          <label
            htmlFor="batch-file-input"
            className="btn-secondary"
            style={{ fontSize: '0.85rem' }}
          >
            <UploadCloud size={16} color="var(--accent-gold)" />
            Upload All 3 Files Together
          </label>
        </div>
      </div>

      {filesState.missingFileError && (
        <div style={{
          backgroundColor: 'var(--bg-red)',
          border: '1px solid var(--color-red)',
          color: 'var(--color-red)',
          padding: '12px 16px',
          borderRadius: '6px',
          marginBottom: '20px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertTriangle size={20} />
          <div>
            Missing File: <span style={{ textDecoration: 'underline' }}>{filesState.missingFileError}</span>
            <div style={{ fontSize: '0.85rem', fontWeight: 400, marginTop: '2px' }}>
              Processing stopped. Please upload all three required CSV files to proceed.
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {fileConfigs.map(item => (
          <div
            key={item.key}
            style={{
              backgroundColor: item.file ? '#F4F7F2' : 'var(--bg-main)',
              border: item.file ? '1.5px solid var(--color-green)' : '1px dashed var(--border-color)',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
              {item.file ? (
                <CheckCircle size={28} color="var(--color-green)" />
              ) : (
                <FileSpreadsheet size={28} color="var(--text-muted)" />
              )}
            </div>

            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '4px' }}>
              <span className="pill-code">{item.label}</span>
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              {item.desc}
            </p>

            <input
              type="file"
              accept=".csv"
              id={`input-${item.key}`}
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                onFileSelect(item.key, f);
              }}
            />

            <label
              htmlFor={`input-${item.key}`}
              className="btn-secondary"
              style={{
                width: '100%',
                justifyContent: 'center',
                fontSize: '0.85rem',
                backgroundColor: item.file ? '#E2F0E5' : 'var(--bg-card)',
                color: item.file ? 'var(--color-green)' : 'var(--text-main)',
                borderColor: item.file ? 'var(--color-green)' : 'var(--border-color)',
                wordBreak: 'break-all'
              }}
            >
              {item.file ? item.file.name : `Select CSV File`}
            </label>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={onProcessFiles}
          className="btn-primary"
          style={{
            padding: '10px 24px',
            fontSize: '0.95rem',
            opacity: allUploaded ? 1 : 0.7
          }}
        >
          <Play size={18} />
          Analyze Option Chain Data
        </button>
      </div>
    </div>
  );
};
