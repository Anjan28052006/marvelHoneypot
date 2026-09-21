import { useState } from 'react';
import { Shield, Terminal, LayoutDashboard, Search, Play, Volume2, VolumeX } from 'lucide-react';
import SystemStatus from './SystemStatus';
import { toggleAudio, initAudioFromStorage, playKeyClick } from '../../lib/audio';

export default function Header({
  apiOnline,
  socketConnected,
  currentView = 'dashboard',
  onViewChange,
  onOpenSimulator,
}) {
  const [audioActive, setAudioActive] = useState(() => initAudioFromStorage());

  const handleToggleAudio = () => {
    const next = toggleAudio();
    setAudioActive(next);
    if (next) playKeyClick();
  };

  const navItems = [
    { id: 'dashboard', label: 'SOC Overview', icon: LayoutDashboard },
    { id: 'terminal', label: 'Live Terminal', icon: Terminal, live: true },
    { id: 'forensics', label: 'Threat Forensics', icon: Search },
  ];

  return (
    <header className="relative z-30 border-b border-slate-800/80 bg-[#070B12]/85 backdrop-blur-md">
      <div className="flex flex-col gap-4 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Logo & Identity */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-800/80 bg-emerald-950/40 text-emerald-400 shadow-sm shadow-emerald-950">
            <Shield size={22} strokeWidth={1.8} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold uppercase tracking-[0.28em] text-slate-100 sm:text-lg">
                SentinelAI
              </h1>
              <span className="rounded bg-emerald-950/80 px-1.5 py-0.5 text-[9px] font-mono font-semibold tracking-wider text-emerald-400 border border-emerald-800/60">
                v2.4
              </span>
            </div>
            <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-slate-500">
              Autonomous Honeypot Command Center
            </p>
          </div>
        </div>

        {/* Center: Navigation Tabs */}
        <nav className="flex items-center rounded-lg border border-slate-800 bg-slate-950/80 p-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (onViewChange) onViewChange(item.id);
                  playKeyClick();
                }}
                className={`relative flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                  isActive
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/70 shadow-sm shadow-emerald-950'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-emerald-400' : 'text-slate-400'} />
                <span>{item.label}</span>
                {item.live && (
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Actions & Status */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Simulate Attack Button */}
          <button
            type="button"
            onClick={onOpenSimulator}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-700/80 bg-emerald-950/70 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-300 hover:bg-emerald-900/70 hover:shadow-lg hover:shadow-emerald-950/50 transition-all glow-emerald"
          >
            <Play size={13} className="fill-emerald-400 text-emerald-400" />
            <span>Simulate Attack</span>
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={handleToggleAudio}
            className={`rounded-lg border p-1.5 transition-colors ${
              audioActive
                ? 'border-emerald-800 bg-emerald-950/60 text-emerald-400'
                : 'border-slate-800 bg-slate-900/60 text-slate-500 hover:text-slate-300'
            }`}
            title={audioActive ? 'Mute SOC Sound FX' : 'Enable SOC Sound FX'}
          >
            {audioActive ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* System Status Indicators */}
          <SystemStatus apiOnline={apiOnline} socketConnected={socketConnected} />
        </div>
      </div>
    </header>
  );
}
