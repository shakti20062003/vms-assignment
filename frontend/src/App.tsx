import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Ship, BarChart2, Landmark, Users, Anchor } from 'lucide-react';
import { RoutesTab } from './adapters/ui/pages/RoutesTab';
import { CompareTab } from './adapters/ui/pages/CompareTab';
import { BankingTab } from './adapters/ui/pages/BankingTab';
import { PoolingTab } from './adapters/ui/pages/PoolingTab';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

type TabId = 'routes' | 'compare' | 'banking' | 'pooling';

const TABS = [
  { id: 'routes'  as TabId, label: 'Routes',  icon: <Ship size={15} /> },
  { id: 'compare' as TabId, label: 'Compare', icon: <BarChart2 size={15} /> },
  { id: 'banking' as TabId, label: 'Banking', icon: <Landmark size={15} />, article: 'Art. 20' },
  { id: 'pooling' as TabId, label: 'Pooling', icon: <Users size={15} />,    article: 'Art. 21' },
];

function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('routes');

  return (
    <div className="min-h-screen grid-bg">
      <header className="border-b border-ocean-800/60 bg-ocean-950/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-ocean-600/30 border border-ocean-600/50 flex items-center justify-center glow-ocean">
                <Anchor size={16} className="text-ocean-300" />
              </div>
              <div>
                <span className="font-display text-ocean-100 text-sm tracking-wide">FuelEU Maritime</span>
                <span className="hidden sm:inline text-ocean-500 text-xs font-mono ml-2">Compliance Platform</span>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 card-inner rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-jade-400 pulse-glow" />
              <span className="text-ocean-300 text-xs font-mono">Target 89.3368 gCO₂e/MJ · 2025</span>
            </div>
          </div>
        </div>
      </header>

      <nav className="border-b border-ocean-800/40 bg-ocean-950/50 sticky top-14 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'border-ocean-400 text-ocean-100'
                    : 'border-transparent text-ocean-400 hover:text-ocean-200 hover:border-ocean-700'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.article && <span className="hidden sm:inline text-xs font-mono text-ocean-600">{tab.article}</span>}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'routes'  && <RoutesTab />}
        {activeTab === 'compare' && <CompareTab />}
        {activeTab === 'banking' && <BankingTab />}
        {activeTab === 'pooling' && <PoolingTab />}
      </main>

      <footer className="border-t border-ocean-800/40 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <span className="text-ocean-600 text-xs font-mono">FuelEU Maritime Regulation (EU) 2023/1805</span>
          <span className="text-ocean-700 text-xs font-mono">Compliance Dashboard v1.0</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Dashboard />
    </QueryClientProvider>
  );
}
