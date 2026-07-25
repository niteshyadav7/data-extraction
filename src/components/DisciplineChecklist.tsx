import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, X } from 'lucide-react';

interface DisciplineChecklistProps {
  onClose?: () => void;
}

export const DisciplineChecklist: React.FC<DisciplineChecklistProps> = ({ onClose }) => {
  const [checkedRules, setCheckedRules] = useState<Record<number, boolean>>({});

  const rules = [
    {
      id: 1,
      title: '1. Time Discipline (The 11:30 AM Window)',
      ruleText: 'Do NOT trade during chaotic opening minutes (09:15 - 09:45 AM). Upload CSV data and run strategy analysis between 11:30 AM – 12:15 PM when Theta decay is fastest.',
      category: 'TIMING'
    },
    {
      id: 2,
      title: '2. System Permission Gatekeeper (Red/Green Banner)',
      ruleText: 'NEVER take a trade if the system displays 🔴 DO NOT TRADE TODAY. Only enter trades when the banner is 🟢 SAFE TO TRADE TODAY with greenTheta confirmation.',
      category: 'PERMISSION'
    },
    {
      id: 3,
      title: '3. Extrinsic Boundary Rule (EOS ↔ EOR Corridor)',
      ruleText: 'Always anchor Short Put at/below EOS Reversal Floor (Put Support) and Short Call at/above EOR Reversal Ceiling (Call Resistance). Never sell ATM inside the channel.',
      category: 'BOUNDARY'
    },
    {
      id: 4,
      title: '4. Capital & Wing Protection (Max 20% Capital)',
      ruleText: 'Never risk more than 20% of your account capital on a single trade setup. Always buy defined protective wings (Long Call & Long Put) to cap tail-risk.',
      category: 'RISK_MANAGEMENT'
    },
    {
      id: 5,
      title: '5. The 60% Max Profit Target Exit Rule',
      ruleText: 'Never hold until 03:30 PM expiry to greedily chase the last 10% premium. Close trade & lock in cashflow when position reaches 60% – 70% of Max Profit!',
      category: 'PROFIT_EXIT'
    }
  ];

  const toggleRule = (id: number) => {
    setCheckedRules(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const totalChecked = Object.values(checkedRules).filter(Boolean).length;
  const isAllChecked = totalChecked === rules.length;

  return (
    <div className="card" style={{
      marginBottom: '20px',
      backgroundColor: 'var(--bg-sidebar)',
      border: `2px solid ${isAllChecked ? 'var(--color-green)' : 'var(--accent-gold)'}`,
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      padding: '20px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div>
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 800,
            padding: '3px 10px',
            borderRadius: '4px',
            backgroundColor: isAllChecked ? 'var(--color-green)' : 'var(--accent-gold-dark)',
            color: '#FFF',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            marginBottom: '4px'
          }}>
            <ShieldCheck size={14} /> TRADER DISCIPLINE CODE (5 GOLDEN RULES)
          </span>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
            📋 Option Seller Pre-Trade Execution Checklist ({totalChecked}/5 Verified)
          </h3>
        </div>

        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
        {rules.map((rule) => {
          const isChecked = !!checkedRules[rule.id];
          return (
            <div
              key={rule.id}
              onClick={() => toggleRule(rule.id)}
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: isChecked ? 'rgba(46, 204, 113, 0.08)' : 'var(--bg-main)',
                border: `1.5px solid ${isChecked ? '#ABEBC6' : 'var(--border-color)'}`,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ marginTop: '2px', flexShrink: 0 }}>
                {isChecked ? (
                  <CheckCircle2 size={20} color="var(--color-green)" />
                ) : (
                  <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: '2px solid var(--text-muted)' }} />
                )}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: isChecked ? 'var(--color-green)' : 'var(--text-main)' }}>
                  {rule.title}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: '1.5' }}>
                  {rule.ruleText}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        padding: '12px 16px',
        borderRadius: '8px',
        backgroundColor: isAllChecked ? '#E2F0E5' : '#FEF9E7',
        border: `1.5px solid ${isAllChecked ? 'var(--color-green)' : '#F9E79F'}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: isAllChecked ? 'var(--color-green)' : '#B7950B' }}>
          {isAllChecked ? '🟢 ALL 5 DISCIPLINE RULES VERIFIED! SAFE TO EXECUTE TRADE.' : '⚠️ VERIFY ALL 5 DISCIPLINE RULES BEFORE PLACING TRADE ORDERS.'}
        </span>
        <span style={{ fontSize: '0.8rem', fontWeight: 900, color: isAllChecked ? 'var(--color-green)' : '#B7950B' }}>
          {totalChecked} / 5 RULES
        </span>
      </div>
    </div>
  );
};
