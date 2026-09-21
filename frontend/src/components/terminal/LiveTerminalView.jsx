import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Terminal as TerminalIcon,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Download,
  Trash2,
  Search,
  Sparkles,
  Play,
  RotateCcw,
  ChevronDown,
  Radio,
} from 'lucide-react';
import TerminalCommandRow from './TerminalCommandRow';
import RiskBadge from '../ui/RiskBadge';
import ProtocolBadge from '../ui/ProtocolBadge';
import IntentBadge from '../ui/IntentBadge';
import { analyzeSession } from '../../api/sessions';
import {
  displayCountry,
  formatDateTime,
  formatDuration,
} from '../../lib/formatters';
import { playSuccessChime, playKeyClick } from '../../lib/audio';

export default function LiveTerminalView({
  sessions = [],
  activeSessionId,
  onSelectSession,
  onOpenSimulator,
  onHydrateSession,
}) {
  const [selectedSessionId, setSelectedSessionId] = useState(
    () => activeSessionId || (sessions.length > 0 ? sessions[0].id : null)
  );
  const [prevActiveId, setPrevActiveId] = useState(activeSessionId);
  const [streamMode, setStreamMode] = useState('session'); // 'session' | 'global'
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [fontSize, setFontSize] = useState('normal'); // 'compact' | 'normal' | 'large'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState(null);
  const [cleared, setCleared] = useState(false);

  const terminalBodyRef = useRef(null);
  const containerRef = useRef(null);

  // Sync activeSessionId if prop changes
  if (activeSessionId !== prevActiveId) {
    setPrevActiveId(activeSessionId);
    if (activeSessionId != null) {
      setSelectedSessionId(activeSessionId);
      setCleared(false);
    }
  }

  // Current session object
  const currentSession = useMemo(() => {
    if (!sessions.length) return null;
    return sessions.find((s) => String(s.id) === String(selectedSessionId)) || sessions[0];
  }, [sessions, selectedSessionId]);

  // If session changed and commands need hydration
  useEffect(() => {
    if (
      currentSession &&
      (!currentSession.commands || currentSession.commands.length === 0) &&
      onHydrateSession
    ) {
      onHydrateSession(currentSession.id);
    }
  }, [currentSession, onHydrateSession]);

  // Auto-scroll on new commands
  useEffect(() => {
    if (autoScroll && terminalBodyRef.current) {
      terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
    }
  }, [currentSession?.commands, autoScroll, streamMode]);

  // Global command feed aggregation
  const globalCommands = useMemo(() => {
    if (streamMode !== 'global') return [];
    const all = [];
    sessions.forEach((s) => {
      if (Array.isArray(s.commands)) {
        s.commands.forEach((c) => {
          all.push({
            ...c,
            session_id: s.id,
            ip_address: s.ip_address,
            protocol: s.protocol,
          });
        });
      }
    });
    // sort by timestamp or sequence
    return all.slice(0, 300);
  }, [sessions, streamMode]);

  const displayedCommands = useMemo(() => {
    if (cleared) return [];
    const source = streamMode === 'global' ? globalCommands : (currentSession?.commands || []);
    if (!searchQuery.trim()) return source;
    const q = searchQuery.toLowerCase();
    return source.filter((c) => {
      const text = (c.command_text || c.input || '').toLowerCase();
      return text.includes(q);
    });
  }, [cleared, streamMode, globalCommands, currentSession, searchQuery]);

  const handleTriggerAnalysis = useCallback(async () => {
    if (!currentSession?.id) return;
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      await analyzeSession(currentSession.id);
      playSuccessChime();
      if (onHydrateSession) {
        await onHydrateSession(currentSession.id);
      }
    } catch (err) {
      setAnalyzeError(err.message || 'AI analysis request failed.');
    } finally {
      setAnalyzing(false);
    }
  }, [currentSession, onHydrateSession]);

  const handleCopyAll = useCallback(() => {
    const lines = displayedCommands.map((c) => c.command_text || c.input || '');
    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedAll(true);
    playKeyClick();
    setTimeout(() => setCopiedAll(false), 2000);
  }, [displayedCommands]);

  const handleDownloadLog = useCallback(() => {
    const lines = [
      `# SentinelAI Honeypot Session Log`,
      `# Session ID: ${currentSession?.id ?? 'Unknown'}`,
      `# IP Address: ${currentSession?.ip_address ?? 'Unknown'}`,
      `# Protocol: ${currentSession?.protocol ?? 'SSH'}`,
      `# Date: ${formatDateTime(currentSession?.start_time)}`,
      `# Risk Score: ${currentSession?.risk_score ?? 'Unclassified'}`,
      `# ----------------------------------------------------`,
      ...displayedCommands.map(
        (c) => `[${c.timestamp || 'N/A'}] (seq:${c.sequence_no || 0}) ${c.command_text || c.input || ''}`
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `honeypot-session-${currentSession?.id || 'live'}.log`;
    a.click();
    URL.revokeObjectURL(url);
    playKeyClick();
  }, [currentSession, displayedCommands]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  const fontSizeClass = {
    compact: 'text-[11px] leading-5',
    normal: 'text-[12px] sm:text-[13px] leading-relaxed',
    large: 'text-[14px] sm:text-[15px] leading-relaxed',
  }[fontSize];

  return (
    <div
      ref={containerRef}
      className={`flex flex-col rounded-xl border border-slate-800 bg-[#04070D] shadow-2xl transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : 'min-h-[calc(100vh-140px)]'
      }`}
    >
      {/* Top Terminal Chrome Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/90 bg-slate-950/90 px-4 py-2.5 backdrop-blur-md">
        {/* Left: Window controls & Session Picker */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-rose-500/80 hover:opacity-100 cursor-pointer" />
            <span className="h-3 w-3 rounded-full bg-amber-500/80 hover:opacity-100 cursor-pointer" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/80 hover:opacity-100 cursor-pointer" />
          </div>

          <div className="h-4 w-px bg-slate-800" />

          {/* Mode Switcher: Single Session vs Global Stream */}
          <div className="flex rounded-md border border-slate-800 bg-slate-900/80 p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => {
                setStreamMode('session');
                setCleared(false);
              }}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1 font-medium transition-colors ${
                streamMode === 'session'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TerminalIcon size={12} />
              <span>Session View</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setStreamMode('global');
                setCleared(false);
              }}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1 font-medium transition-colors ${
                streamMode === 'global'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio size={12} className="text-emerald-400 animate-pulse" />
              <span>Global Live Stream</span>
            </button>
          </div>

          {/* Session Selector Dropdown */}
          {streamMode === 'session' && sessions.length > 0 && (
            <div className="relative">
              <select
                value={selectedSessionId || ''}
                onChange={(e) => {
                  setSelectedSessionId(Number(e.target.value));
                  setCleared(false);
                  if (onSelectSession) onSelectSession(Number(e.target.value));
                }}
                className="appearance-none rounded-md border border-slate-800 bg-slate-900/90 py-1 pl-3 pr-8 font-mono text-[11px] text-slate-200 hover:border-slate-700 focus:border-emerald-500 focus:outline-none"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    #{s.id} • {s.ip_address || 'unknown'} ({s.protocol?.toUpperCase() || 'SSH'})
                    {s.risk_score ? ` - Risk ${s.risk_score}` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500"
              />
            </div>
          )}
        </div>

        {/* Right: Quick Terminal Actions */}
        <div className="flex items-center gap-2 text-[11px]">
          {/* Simulate Attack Button */}
          <button
            type="button"
            onClick={onOpenSimulator}
            className="flex items-center gap-1.5 rounded-md border border-emerald-700/80 bg-emerald-950/60 px-3 py-1 font-semibold uppercase tracking-wider text-emerald-300 transition-all hover:bg-emerald-900/60 hover:shadow-lg hover:shadow-emerald-950/50"
            title="Inject simulated attack commands"
          >
            <Play size={12} className="fill-emerald-400 text-emerald-400" />
            <span>Simulate Attack</span>
          </button>

          {/* Trigger AI Analysis Button */}
          {streamMode === 'session' && currentSession && (
            <button
              type="button"
              disabled={analyzing}
              onClick={handleTriggerAnalysis}
              className="flex items-center gap-1.5 rounded-md border border-violet-800/80 bg-violet-950/50 px-3 py-1 font-medium uppercase tracking-wider text-violet-300 transition-colors hover:bg-violet-900/60 disabled:opacity-50"
              title="Classify session via Google Gemini AI Engine"
            >
              <Sparkles size={12} className={analyzing ? 'animate-spin' : 'text-violet-400'} />
              <span>{analyzing ? 'Analyzing…' : 'Run AI Analysis'}</span>
            </button>
          )}

          {/* Search Filter */}
          <div className="relative hidden sm:block">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter commands..."
              className="w-36 rounded-md border border-slate-800 bg-slate-900/80 py-1 pl-7 pr-2 font-mono text-[11px] text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Font size picker */}
          <div className="hidden rounded-md border border-slate-800 bg-slate-900/80 p-0.5 sm:flex">
            {['compact', 'normal', 'large'].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setFontSize(size)}
                className={`rounded px-1.5 py-0.5 text-[10px] uppercase ${
                  fontSize === size ? 'bg-slate-800 text-slate-100 font-bold' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {size[0]}
              </button>
            ))}
          </div>

          {/* Auto Scroll toggle */}
          <button
            type="button"
            onClick={() => setAutoScroll(!autoScroll)}
            className={`rounded-md border px-2.5 py-1 text-[10px] uppercase tracking-wider transition-colors ${
              autoScroll
                ? 'border-emerald-800/80 bg-emerald-950/40 text-emerald-400'
                : 'border-slate-800 bg-slate-900/80 text-slate-500'
            }`}
            title="Toggle terminal auto-scroll to bottom"
          >
            Auto-Scroll
          </button>

          {/* Copy All */}
          <button
            type="button"
            onClick={handleCopyAll}
            className="rounded-md border border-slate-800 bg-slate-900/80 p-1.5 text-slate-400 hover:border-slate-700 hover:text-slate-200 transition-colors"
            title="Copy command history"
          >
            {copiedAll ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>

          {/* Download Log */}
          <button
            type="button"
            onClick={handleDownloadLog}
            className="rounded-md border border-slate-800 bg-slate-900/80 p-1.5 text-slate-400 hover:border-slate-700 hover:text-slate-200 transition-colors"
            title="Download full forensic log"
          >
            <Download size={14} />
          </button>

          {/* Clear screen buffer */}
          <button
            type="button"
            onClick={() => setCleared(true)}
            className="rounded-md border border-slate-800 bg-slate-900/80 p-1.5 text-slate-400 hover:border-slate-700 hover:text-rose-400 transition-colors"
            title="Clear terminal buffer"
          >
            <Trash2 size={14} />
          </button>

          {/* Fullscreen toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="rounded-md border border-slate-800 bg-slate-900/80 p-1.5 text-slate-400 hover:border-slate-700 hover:text-slate-200 transition-colors"
            title="Toggle fullscreen terminal"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Attacker Session Intelligence Strip */}
      {streamMode === 'session' && currentSession && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/60 bg-slate-950/50 px-4 py-2 text-[11px]">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold uppercase tracking-wider text-slate-500">Target Host:</span>
              <span className="font-mono text-emerald-400">root@cowrie-trap-01</span>
            </div>
            <div className="h-3 w-px bg-slate-800" />
            <div className="flex items-center gap-2">
              <span className="font-semibold uppercase tracking-wider text-slate-500">Attacker IP:</span>
              <span className="font-mono font-bold text-slate-200">{currentSession.ip_address || '127.0.0.1'}</span>
              <span className="text-slate-400">({displayCountry(currentSession.country)})</span>
            </div>
            <div className="h-3 w-px bg-slate-800" />
            <ProtocolBadge protocol={currentSession.protocol} />
            <IntentBadge intent={currentSession.intent} />
            <RiskBadge score={currentSession.risk_score} />
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <div>
              <span className="text-slate-500 uppercase tracking-wider text-[10px]">Duration: </span>
              <span className="font-mono text-slate-300">{formatDuration(currentSession.duration_ms)}</span>
            </div>
            <div>
              <span className="text-slate-500 uppercase tracking-wider text-[10px]">Commands: </span>
              <span className="font-mono text-slate-300">{currentSession.commands?.length || 0}</span>
            </div>
            <div>
              <span className="text-slate-500 uppercase tracking-wider text-[10px]">Captured: </span>
              <span className="font-mono text-slate-300">{formatDateTime(currentSession.start_time)}</span>
            </div>
          </div>
        </div>
      )}

      {/* AI Summary Banner (if classified) */}
      {streamMode === 'session' && currentSession?.summary && (
        <div className="border-b border-violet-900/40 bg-violet-950/20 px-4 py-2 text-[12px] flex items-start gap-2 text-violet-200">
          <Sparkles size={15} className="text-violet-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold uppercase tracking-wider text-violet-400 text-[10px] mr-2">
              Gemini AI Security Verdict:
            </span>
            <span className="text-slate-300">{currentSession.summary}</span>
          </div>
        </div>
      )}

      {/* Error banner if analyze failed */}
      {analyzeError && (
        <div className="border-b border-rose-900/60 bg-rose-950/40 px-4 py-2 text-[12px] text-rose-300">
          {analyzeError}
        </div>
      )}

      {/* Main Terminal Screen Area */}
      <div
        ref={terminalBodyRef}
        className={`terminal-window flex-1 overflow-y-auto p-4 sm:p-5 font-mono ${fontSizeClass} soc-scanlines`}
        style={{ minHeight: isFullscreen ? 'calc(100vh - 120px)' : '480px' }}
      >
        {/* Terminal MOTD banner */}
        <div className="mb-4 select-none border-b border-emerald-950/80 pb-3 text-emerald-500/80">
          <p className="font-bold text-emerald-400">
            ════════════════════════════════════════════════════════════════════════════════
          </p>
          <p className="text-emerald-400 font-bold">
            [+] SENTINEL-AI HONEYPOT INTERCEPTOR // REAL-TIME KERNEL TELEMETRY
          </p>
          <p className="text-emerald-600 text-[11px]">
            [+] SENSOR: cowrie-node-01 • TRAP PROTOCOL: {currentSession?.protocol?.toUpperCase() || 'SSH/22'}
          </p>
          <p className="text-emerald-600 text-[11px]">
            [+] STATUS: ACTIVE TRAP • KEYSTROKE CAPTURE BUFFER READY
          </p>
          <p className="font-bold text-emerald-400">
            ════════════════════════════════════════════════════════════════════════════════
          </p>
        </div>

        {/* Displayed Command Stream */}
        {displayedCommands.length > 0 ? (
          <div className="space-y-0.5">
            {displayedCommands.map((cmd, idx) => (
              <TerminalCommandRow
                key={cmd.id ?? `${cmd.sequence_no}-${idx}`}
                cmd={cmd}
                prompt={
                  streamMode === 'global'
                    ? `attacker@${cmd.ip_address || '127.0.0.1'}:~$`
                    : 'root@target:~#'
                }
              />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500">
            {cleared ? (
              <div>
                <p>Terminal buffer cleared.</p>
                <button
                  type="button"
                  onClick={() => setCleared(false)}
                  className="mt-2 text-xs text-emerald-400 hover:underline flex items-center gap-1 mx-auto"
                >
                  <RotateCcw size={12} />
                  Restore display
                </button>
              </div>
            ) : searchQuery ? (
              <p>No commands matching &quot;{searchQuery}&quot;</p>
            ) : (
              <div className="space-y-3">
                <p className="text-slate-400">Awaiting attacker input or no commands captured in this session.</p>
                <button
                  type="button"
                  onClick={onOpenSimulator}
                  className="inline-flex items-center gap-2 rounded-md border border-emerald-800 bg-emerald-950/60 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-emerald-300 hover:bg-emerald-900"
                >
                  <Play size={13} className="fill-emerald-400" />
                  Launch a Simulated Attack Now
                </button>
              </div>
            )}
          </div>
        )}

        {/* Blinking Live Prompt Line */}
        <div className="mt-2 flex items-center font-mono text-emerald-500">
          <span className="font-semibold text-emerald-600">
            {streamMode === 'global' ? 'interceptor@honeypot-mesh:~#' : 'root@target:~#'}
          </span>
          <span className="terminal-cursor" />
        </div>
      </div>

      {/* Terminal Footer Bar */}
      <div className="flex flex-wrap items-center justify-between border-t border-slate-800/80 bg-slate-950/90 px-4 py-2 text-[10px] text-slate-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 pulse-live" />
            <span className="uppercase tracking-wider font-semibold text-emerald-400">
              Live Sensor Active
            </span>
          </span>
          <span>•</span>
          <span>{displayedCommands.length} commands displayed</span>
          {searchQuery && (
            <>
              <span>•</span>
              <span className="text-amber-400">Filter active: &quot;{searchQuery}&quot;</span>
            </>
          )}
        </div>
        <div className="font-mono text-slate-600">
          TERMINAL // UTF-8 // XTERM-256COLOR
        </div>
      </div>
    </div>
  );
}
