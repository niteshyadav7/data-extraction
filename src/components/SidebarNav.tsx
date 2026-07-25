import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LayoutGrid,
  BarChart2,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Zap,
  Target,
  Table,
  Calculator,
  AlertTriangle,
  Briefcase,
  Activity,
  Award,
  Layers,
  Building2
} from 'lucide-react';

interface NavSection {
  id: string;
  label: string;
  icon: any;
  iconColor: string;
  badge?: string;
  isViewSwitch?: boolean;
  viewName?: 'DASHBOARD' | 'STRATEGY_HUB' | 'IRON_CONDOR' | 'IRON_BUTTERFLY' | 'BULL_PUT_CREDIT' | 'BEAR_CALL_CREDIT' | 'SHORT_STRANGLE' | 'RATIO_PUT_SPREAD' | 'CALENDAR_SPREAD';
}

interface SidebarNavProps {
  activeSection?: string;
  currentView?: 'DASHBOARD' | 'STRATEGY_HUB' | 'IRON_CONDOR' | 'IRON_BUTTERFLY' | 'BULL_PUT_CREDIT' | 'BEAR_CALL_CREDIT' | 'SHORT_STRANGLE' | 'RATIO_PUT_SPREAD' | 'CALENDAR_SPREAD';
  onSelectView?: (view: 'DASHBOARD' | 'STRATEGY_HUB' | 'IRON_CONDOR' | 'IRON_BUTTERFLY' | 'BULL_PUT_CREDIT' | 'BEAR_CALL_CREDIT' | 'SHORT_STRANGLE' | 'RATIO_PUT_SPREAD' | 'CALENDAR_SPREAD', sectionId?: string) => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeSection = 'sec-summary',
  currentView = 'DASHBOARD',
  onSelectView
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [currentActive, setCurrentActive] = useState<string>(activeSection);

  // Accordion state: closed by default (OVERVIEW open)
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    'OVERVIEW': true,
    'DERIVATIVES': false,
    'QUANT TOOLS': false,
    'QUANT STRATEGIES': false
  });

  const toggleCategory = (title: string) => {
    if (title === 'OVERVIEW') {
      if (onSelectView) {
        onSelectView('DASHBOARD', 'sec-summary');
      } else {
        scrollToSection('sec-summary');
      }
    }

    setOpenCategories(prev => {
      const isCurrentlyOpen = !!prev[title];
      if (isCurrentlyOpen) {
        return {
          'OVERVIEW': false,
          'DERIVATIVES': false,
          'QUANT TOOLS': false,
          'QUANT STRATEGIES': false
        };
      }
      return {
        'OVERVIEW': title === 'OVERVIEW',
        'DERIVATIVES': title === 'DERIVATIVES',
        'QUANT TOOLS': title === 'QUANT TOOLS',
        'QUANT STRATEGIES': title === 'QUANT STRATEGIES'
      };
    });
  };

  const navCategories: { title: string; categoryIcon: any; items: NavSection[] }[] = [
    {
      title: 'OVERVIEW',
      categoryIcon: LayoutGrid,
      items: [
        { id: 'sec-summary', label: 'Market Summary', icon: LayoutGrid, iconColor: 'var(--accent-gold-dark)' },
        { id: 'sec-pcr', label: 'PCR & Gauge', icon: BarChart2, iconColor: '#27AE60' },
        { id: 'sec-support', label: 'Support & Resistance', icon: ShieldCheck, iconColor: '#2980B9', badge: 'EOR/EOS' },
      ]
    },
    {
      title: 'DERIVATIVES',
      categoryIcon: TrendingUp,
      items: [
        { id: 'sec-oi', label: 'OI & Build-ups', icon: TrendingUp, iconColor: '#8E44AD' },
        { id: 'sec-greeks', label: 'IV & Greeks', icon: Zap, iconColor: '#D35400' },
        { id: 'sec-expected', label: 'Expected Move', icon: Target, iconColor: '#C0392B' },
        { id: 'sec-fiidii', label: 'FII / DII Flow Studio', icon: Building2, iconColor: '#C5A059', badge: 'Smart Money' },
      ]
    },
    {
      title: 'QUANT TOOLS',
      categoryIcon: Calculator,
      items: [
        { id: 'sec-chain', label: 'Option Chain', icon: Table, iconColor: '#16A085' },
        { id: 'sec-ltp', label: 'LTP Calculator', icon: Calculator, iconColor: '#34495E', badge: 'Step 18' },
        { id: 'sec-warnings', label: 'Audit Warnings', icon: AlertTriangle, iconColor: '#E67E22' },
      ]
    },
    {
      title: 'QUANT STRATEGIES',
      categoryIcon: Layers,
      items: [
        { id: 'sec-iron-condor', label: 'Iron Condor Strategy', icon: Briefcase, iconColor: '#27AE60', badge: 'Dynamic', isViewSwitch: true, viewName: 'IRON_CONDOR' },
        { id: 'sec-iron-butterfly', label: 'Iron Butterfly Strategy', icon: Award, iconColor: '#2980B9', badge: 'Max Pain Pin', isViewSwitch: true, viewName: 'IRON_BUTTERFLY' },
        { id: 'sec-bull-put-credit', label: 'Bull Put Credit Spread', icon: TrendingUp, iconColor: '#27AE60', badge: 'Support Credit', isViewSwitch: true, viewName: 'BULL_PUT_CREDIT' },
        { id: 'sec-bear-call-credit', label: 'Bear Call Credit Spread', icon: TrendingDown, iconColor: '#C0392B', badge: 'Resistance Credit', isViewSwitch: true, viewName: 'BEAR_CALL_CREDIT' },
        { id: 'sec-short-strangle', label: 'Short Strangle Strategy', icon: Activity, iconColor: '#8E44AD', badge: 'IV Crush', isViewSwitch: true, viewName: 'SHORT_STRANGLE' },
        { id: 'sec-ratio-put-spread', label: 'Ratio Put Spread', icon: Target, iconColor: '#D35400', badge: 'Crash Hedge', isViewSwitch: true, viewName: 'RATIO_PUT_SPREAD' },
        { id: 'sec-calendar-spread', label: 'Calendar Time Spread', icon: BarChart2, iconColor: '#16A085', badge: 'Theta Arb', isViewSwitch: true, viewName: 'CALENDAR_SPREAD' },
      ]
    }
  ];

  const handleItemClick = (item: NavSection, catTitle: string) => {
    setCurrentActive(item.id);
    setOpenCategories({
      'OVERVIEW': catTitle === 'OVERVIEW',
      'DERIVATIVES': catTitle === 'DERIVATIVES',
      'QUANT TOOLS': catTitle === 'QUANT TOOLS',
      'QUANT STRATEGIES': catTitle === 'QUANT STRATEGIES'
    });

    if (item.isViewSwitch && item.viewName && onSelectView) {
      onSelectView(item.viewName, item.id);
    } else if (onSelectView) {
      onSelectView('DASHBOARD', item.id);
    } else {
      scrollToSection(item.id);
    }
  };

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
    if (currentView !== 'DASHBOARD') {
      let activeId = 'sec-strategy';
      if (currentView === 'IRON_CONDOR') activeId = 'sec-iron-condor';
      else if (currentView === 'IRON_BUTTERFLY') activeId = 'sec-iron-butterfly';
      else if (currentView === 'BULL_PUT_CREDIT') activeId = 'sec-bull-put-credit';
      else if (currentView === 'BEAR_CALL_CREDIT') activeId = 'sec-bear-call-credit';
      else if (currentView === 'SHORT_STRANGLE') activeId = 'sec-short-strangle';
      else if (currentView === 'RATIO_PUT_SPREAD') activeId = 'sec-ratio-put-spread';
      else if (currentView === 'CALENDAR_SPREAD') activeId = 'sec-calendar-spread';

      setCurrentActive(activeId);
      setOpenCategories({
        'OVERVIEW': false,
        'DERIVATIVES': false,
        'QUANT TOOLS': false,
        'QUANT STRATEGIES': true
      });
      return;
    }

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 180;
      for (const cat of navCategories) {
        for (const item of cat.items) {
          if (item.isViewSwitch) continue;
          const el = document.getElementById(item.id);
          if (el) {
            const top = el.offsetTop;
            const height = el.offsetHeight;
            if (scrollPosition >= top && scrollPosition < top + height) {
              setCurrentActive(item.id);
              // Auto-open active category on scroll and close others
              setOpenCategories({
                'OVERVIEW': cat.title === 'OVERVIEW',
                'DERIVATIVES': cat.title === 'DERIVATIVES',
                'QUANT TOOLS': cat.title === 'QUANT TOOLS',
                'QUANT STRATEGIES': cat.title === 'QUANT STRATEGIES'
              });
              break;
            }
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentView]);

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
          <span
            onClick={() => {
              if (onSelectView) onSelectView('DASHBOARD', 'sec-summary');
              else scrollToSection('sec-summary');
            }}
            style={{ fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.5px', color: 'var(--accent-gold-dark)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            title="Go to Main Dashboard Market Summary"
          >
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

      {/* Accordion Nav List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: isCollapsed ? '12px 6px' : '16px 12px' }}>
        {navCategories.map((cat, catIdx) => {
          const isOpen = !!openCategories[cat.title];
          const CategoryIcon = cat.categoryIcon;

          return (
            <div key={catIdx} style={{ marginBottom: isCollapsed ? '16px' : '12px' }}>
              {/* Accordion Header */}
              {!isCollapsed ? (
                <button
                  onClick={() => toggleCategory(cat.title)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 6px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    color: 'var(--text-muted)',
                    letterSpacing: '0.8px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CategoryIcon size={14} color="var(--accent-gold-dark)" /> {cat.title}
                  </span>
                  {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
              ) : (
                <div style={{
                  height: '1px',
                  backgroundColor: 'var(--border-color)',
                  margin: '10px 4px'
                }} />
              )}

              {/* Accordion Sub-Items */}
              {(isOpen || isCollapsed) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: isCollapsed ? '0' : '4px' }}>
                  {cat.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = (currentView === 'IRON_CONDOR' && item.id === 'sec-iron-condor') ||
                      (currentView === 'STRATEGY_HUB' && item.id === 'sec-strategy') ||
                      (currentView === 'DASHBOARD' && currentActive === item.id);

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item, cat.title)}
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
                        title={isCollapsed ? `${item.label} (${cat.title})` : undefined}
                      >
                        <Icon size={18} color={isActive ? 'var(--accent-gold-dark)' : item.iconColor} />

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
              )}
            </div>
          );
        })}
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
