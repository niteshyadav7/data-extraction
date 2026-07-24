import React, { useState, useEffect } from 'react';
import { LayoutGrid, BarChart2, Shield, TrendingUp, Zap, Target, Table, AlertTriangle } from 'lucide-react';

export const StickyNavBar: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('sec-summary');

  const navItems = [
    { id: 'sec-summary', label: 'Summary', icon: LayoutGrid },
    { id: 'sec-pcr', label: 'PCR & Max Pain', icon: BarChart2 },
    { id: 'sec-support', label: 'Support & Resistance', icon: Shield },
    { id: 'sec-oi', label: 'OI & Liquidity', icon: TrendingUp },
    { id: 'sec-greeks', label: 'IV & Greeks', icon: Zap },
    { id: 'sec-expected', label: 'Expected Move', icon: Target },
    { id: 'sec-chain', label: 'Option Chain', icon: Table },
    { id: 'sec-warnings', label: 'Warnings', icon: AlertTriangle },
  ];

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const offset = 140;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
      for (const item of navItems) {
        const el = document.getElementById(item.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(item.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{
      position: 'sticky',
      top: '0px',
      zIndex: 900,
      backgroundColor: 'var(--bg-sidebar)',
      borderBottom: '1px solid var(--border-color)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
      padding: '8px 16px',
      marginBottom: '20px',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      overflowX: 'auto',
      whiteSpace: 'nowrap'
    }}>
      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginRight: '8px' }}>
        QUICK NAV:
      </span>

      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeSection === item.id;
        return (
          <button
            key={item.id}
            onClick={() => scrollToSection(item.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: isActive ? 700 : 500,
              cursor: 'pointer',
              backgroundColor: isActive ? 'var(--accent-gold)' : 'var(--bg-main)',
              color: isActive ? '#FFF' : 'var(--text-main)',
              border: `1px solid ${isActive ? 'var(--accent-gold)' : 'var(--border-color)'}`,
              transition: 'all 0.15s ease',
              boxShadow: isActive ? '0 2px 6px rgba(155, 144, 68, 0.3)' : 'none'
            }}
          >
            <Icon size={14} />
            {item.label}
          </button>
        );
      })}
    </div>
  );
};
