import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  BarChart2,
  Shield,
  TrendingUp,
  Zap,
  Target,
  Table,
  Calculator,
  AlertTriangle,
  Layers,
  Activity,
  Award
} from 'lucide-react';

interface NavSection {
  id: string;
  label: string;
  icon: any;
  category?: string;
  badge?: string;
}

interface SidebarNavProps {
  activeSection?: string;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({ activeSection = 'sec-summary' }) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [currentActive, setCurrentActive] = useState<string>(activeSection);

  const navCategories: { title: string; items: NavSection[] }[] = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'sec-summary', label: 'Market Summary', icon: LayoutGrid },
        { id: 'sec-pcr', label: 'PCR & Gauge', icon: BarChart2 },
        { id: 'sec-support', label: 'Support & Resistance', icon: Shield, badge: 'EOR/EOS' },
      ]
    },
    {
      title: 'DERIVATIVES',
      items: [
        { id: 'sec-oi', label: 'OI & Build-ups', icon: TrendingUp },
        { id: 'sec-greeks', label: 'IV & Greeks', icon: Zap },
        { id: 'sec-expected', label: 'Expected Move', icon: Target },
      ]
    },
    {
      title: 'QUANT TOOLS',
      items: [
        { id: 'sec-chain', label: 'Option Chain', icon: Table },
        { id: 'sec-ltp', label: 'LTP Calculator', icon: Calculator, badge: 'Step 18' },
        { id: 'sec-strategy', label: 'Strategy Hub', icon: Layers, badge: 'Next' },
        { id: 'sec-warnings', label: 'Audit Warnings', icon: AlertTriangle },
      ]
    }
  ];

  const scrollToSection = (id: string) => {
    setCurrentActive(id);
    const element = document.getElementById(id);
    if (element) {
      const offset = 90;
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
      const scrollPosition = window.scrollY + 180;
      for (const cat of navCategories) {
        for (const item of cat.items) {
          const el = document.getElementById(item.id);
          if (el) {
            const top = el.offsetTop;
            const height = el.offsetHeight;
            if (scrollPosition >= top && scrollPosition < top + height) {
              setCurrentActive(item.id);
              break;
            }
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <aside
      style={{
        width: isCollapsed ? '68px' : '240px',
        minWidth: isCollapsed ? '68px' : '240px',
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-color)',
        height: '100vh',
        position: 'sticky',
        top: '0px',
        zIndex: 800,
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        userSelect: 'none',
        overflowX: 'hidden'
      }}
    >
      {/* Sidebar Header & Collapse Toggle */}
      <div style={{
        padding: isCollapsed ? '12px 10px' : '16px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'space-between'
      }}>
        {!isCollapsed && (
          <span style={{ fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.5px', color: 'var(--accent-gold-dark)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={16} /> NAVIGATION
          </span>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            backgroundColor: 'var(--bg-main)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '6px',
            cursor: 'pointer',
            color: 'var(--text-main)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            transition: 'all 0.15s ease'
          }}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Nav List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: isCollapsed ? '12px 6px' : '16px 12px' }}>
        {navCategories.map((cat, catIdx) => (
          <div key={catIdx} style={{ marginBottom: isCollapsed ? '16px' : '20px' }}>
            {!isCollapsed && (
              <div style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                color: 'var(--text-muted)',
                letterSpacing: '1px',
                marginBottom: '8px',
                paddingLeft: '8px'
              }}>
                {cat.title}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {cat.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentActive === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: isCollapsed ? '0px' : '10px',
                      justifyContent: isCollapsed ? 'center' : 'flex-start',
                      width: '100%',
                      padding: isCollapsed ? '10px 0' : '9px 12px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      border: 'none',
                      backgroundColor: isActive ? 'var(--accent-pill)' : 'transparent',
                      color: isActive ? 'var(--accent-gold-dark)' : 'var(--text-main)',
                      borderLeft: isActive ? '3px solid var(--accent-gold)' : '3px solid transparent',
                      transition: 'all 0.15s ease',
                      position: 'relative'
                    }}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon size={18} color={isActive ? 'var(--accent-gold-dark)' : 'var(--text-muted)'} />

                    {!isCollapsed && (
                      <span style={{ flex: 1, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.label}
                      </span>
                    )}

                    {!isCollapsed && item.badge && (
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-main)',
                        color: 'var(--accent-gold-dark)',
                        border: '1px solid var(--border-color)'
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div style={{
        padding: isCollapsed ? '12px 6px' : '12px 16px',
        borderTop: '1px solid var(--border-color)',
        fontSize: '0.72rem',
        color: 'var(--text-muted)',
        textAlign: isCollapsed ? 'center' : 'left'
      }}>
        {isCollapsed ? (
          <Award size={18} color="var(--accent-gold)" />
        ) : (
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>Derivatives Engine v2.5</div>
            <div>Quant Workstation</div>
          </div>
        )}
      </div>
    </aside>
  );
};
