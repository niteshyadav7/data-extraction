import React, { useState } from 'react';
import type { DataWarnings } from '../types';
import { AlertCircle, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';

interface WarningsSectionProps {
  warnings: DataWarnings;
}

export const WarningsSection: React.FC<WarningsSectionProps> = ({ warnings }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const totalWarnings =
    warnings.missingValuesCount +
    warnings.duplicateRowsCount +
    warnings.invalidIvCount +
    warnings.negativeOiCount +
    warnings.negativeVolumeCount;

  const warningCategories = [
    { key: 'missing', title: 'Missing Values', count: warnings.missingValuesCount, details: warnings.missingValuesDetails },
    { key: 'duplicates', title: 'Duplicate Rows', count: warnings.duplicateRowsCount, details: warnings.duplicateRowsDetails },
    { key: 'invalidIv', title: 'Invalid IV', count: warnings.invalidIvCount, details: warnings.invalidIvDetails },
    { key: 'negativeOi', title: 'Negative OI', count: warnings.negativeOiCount, details: warnings.negativeOiDetails },
    { key: 'negativeVolume', title: 'Negative Volume', count: warnings.negativeVolumeCount, details: warnings.negativeVolumeDetails },
  ];

  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={20} color={totalWarnings > 0 ? 'var(--color-red)' : 'var(--color-green)'} />
          Step 13: Data Quality Audit & Warnings
        </h2>

        <span className={totalWarnings > 0 ? 'badge-red' : 'badge-green'}>
          {totalWarnings > 0 ? `${totalWarnings} Warnings Detected` : 'All Checks Passed Cleanly'}
        </span>
      </div>

      {totalWarnings === 0 ? (
        <div style={{ padding: '16px', backgroundColor: '#F4F7F2', borderRadius: '6px', border: '1px solid var(--color-green)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle size={20} color="var(--color-green)" />
          <span style={{ fontSize: '0.9rem', color: 'var(--color-green)', fontWeight: 600 }}>
            CSV Data Validation Successful! No missing values, duplicate rows, invalid IVs, or negative numbers were detected.
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {warningCategories.map(cat => (
            <div
              key={cat.key}
              style={{
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                backgroundColor: cat.count > 0 ? 'var(--bg-main)' : 'var(--bg-card)',
                overflow: 'hidden'
              }}
            >
              <div
                onClick={() => cat.count > 0 && setExpandedSection(expandedSection === cat.key ? null : cat.key)}
                style={{
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: cat.count > 0 ? 'pointer' : 'default'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{cat.title}</span>
                  <span className={cat.count > 0 ? 'badge-red' : 'badge-neutral'}>
                    {cat.count} Issues
                  </span>
                </div>

                {cat.count > 0 && (
                  <div>
                    {expandedSection === cat.key ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                )}
              </div>

              {expandedSection === cat.key && cat.count > 0 && (
                <div style={{ padding: '12px 16px', backgroundColor: '#FFF', borderTop: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                  <ul style={{ paddingLeft: '20px', color: 'var(--color-red)' }}>
                    {cat.details.slice(0, 15).map((detail, i) => (
                      <li key={i}>{detail}</li>
                    ))}
                    {cat.details.length > 15 && (
                      <li style={{ color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '4px' }}>
                        ...and {cat.details.length - 15} more item(s).
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
