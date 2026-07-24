import React from 'react';
import { UploadCloud, CheckCircle, AlertTriangle, FileSpreadsheet, Play, FilePlus } from 'lucide-react';
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
      placeholder: 'Select Option Chain CSV',
      label: '1. Option Chain CSV',
      desc: 'e.g. option-chain-ED-NIFTY-*.csv or option-chain.csv',
      file: filesState.optionChainFile,
    },
    {
      key: 'futuresFile' as const,
      placeholder: 'Select NSE 50 Futures CSV',
      label: '2. NSE 50 Futures CSV',
      desc: 'e.g. MW-FO-nse50_fut-*.csv or nse50_fut.csv',
      file: filesState.futuresFile,
    },
    {
      key: 'optFile' as const,
      placeholder: 'Select NSE 50 Options CSV',
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
            id="batch-upload-input"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onBatchFilesSelect(e.target.files);
              }
            }}
          />
          <label htmlFor="batch-upload-input" className="btn-secondary" style={{ cursor: 'pointer' }}>
            <UploadCloud size={16} />
            Upload All 3 Files Together
          </label>
        </div>
      </div>

      {filesState.missingFileError && (
        <div style={{
          backgroundColor: '#FDEDEC',
          color: '#C0392B',
          padding: '10px 14px',
          borderRadius: '6px',
          marginBottom: '16px',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          border: '1px solid #FADBD8'
        }}>
          <AlertTriangle size={16} />
          <span>Missing File: Please select <strong>{filesState.missingFileError}</strong> to complete analysis.</span>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px',
        marginBottom: '20px'
      }}>
        {fileConfigs.map((config) => (
          <div
            key={config.key}
            style={{
              border: `1.5px dashed ${config.file ? 'var(--color-green)' : 'var(--border-color)'}`,
              backgroundColor: config.file ? 'rgba(76, 175, 80, 0.04)' : 'var(--bg-main)',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ marginBottom: '10px' }}>
              {config.file ? (
                <CheckCircle size={32} color="var(--color-green)" />
              ) : (
                <FilePlus size={32} color="var(--text-muted)" />
              )}
            </div>

            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '4px' }}>
              {config.label}
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              {config.desc}
            </div>

            <input
              type="file"
              accept=".csv"
              id={`upload-${config.key}`}
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                onFileSelect(config.key, file);
              }}
            />

            <label
              htmlFor={`upload-${config.key}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: config.file ? '#E8F5E9' : 'var(--bg-sidebar)',
                color: config.file ? 'var(--color-green)' : 'var(--text-main)',
                border: `1px solid ${config.file ? 'var(--color-green)' : 'var(--border-color)'}`,
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              <FileSpreadsheet size={14} />
              {config.file ? config.file.name : config.placeholder}
            </label>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'right' }}>
        <button
          onClick={onProcessFiles}
          className="btn-primary"
          style={{
            padding: '10px 24px',
            fontSize: '0.95rem',
            opacity: allUploaded ? 1 : 0.85
          }}
        >
          <Play size={16} />
          Analyze Option Chain Data
        </button>
      </div>
    </div>
  );
};
