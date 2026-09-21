import { useCallback, useMemo, useState, useEffect } from 'react';
import { Activity, AlertTriangle, Radio, ShieldAlert, Terminal, Play } from 'lucide-react';
import Header from '../components/layout/Header';
import StatCard from '../components/dashboard/StatCard';
import ThreatActivity from '../components/dashboard/ThreatActivity';
import RiskDistribution from '../components/dashboard/RiskDistribution';
import AttackTable from '../components/sessions/AttackTable';
import SessionDetails from '../components/sessions/SessionDetails';
import LiveTerminalView from '../components/terminal/LiveTerminalView';
import ForensicsView from '../components/forensics/ForensicsView';
import AttackSimulatorModal from '../components/simulator/AttackSimulatorModal';
import ErrorState from '../components/ui/ErrorState';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { useHealth } from '../hooks/useHealth';
import { useSessions } from '../hooks/useSessions';
import { useSocket } from '../hooks/useSocket';
import { playAlertPing } from '../lib/audio';

export default function Dashboard() {
  const { online: apiOnline, check: checkHealth } = useHealth();
  const { connected: socketConnected } = useSocket();
  const {
    sessions,
    loading,
    error,
    toast,
    highlightedIds,
    stats,
    reload,
    hydrateSession,
    dismissToast,
  } = useSessions();

  // Navigation: 'dashboard' | 'terminal' | 'forensics'
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedId, setSelectedId] = useState(null);
  const [activeTerminalId, setActiveTerminalId] = useState(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  // Play audio ping on new session
  useEffect(() => {
    if (toast) {
      playAlertPing();
    }
  }, [toast]);

  const selectedSession = useMemo(
    () => sessions.find((s) => String(s.id) === String(selectedId)) || null,
    [sessions, selectedId]
  );

  const handleSelect = useCallback(
    async (session) => {
      setSelectedId(session.id);
      setDetailError(null);
      setDetailLoading(true);
      try {
        await hydrateSession(session.id);
      } catch {
        setDetailError('Unable to load full session details.');
      } finally {
        setDetailLoading(false);
      }
    },
    [hydrateSession]
  );

  // Open session directly in the Full Page Live Terminal
  const handleOpenTerminal = useCallback(
    async (sessionId) => {
      setActiveTerminalId(sessionId);
      setCurrentView('terminal');
      try {
        await hydrateSession(sessionId);
      } catch (e) {
        console.warn('Hydrate session error:', e.message);
      }
    },
    [hydrateSession]
  );

  const handleSessionCreated = useCallback(
    async (newSessionId) => {
      setActiveTerminalId(newSessionId);
      setCurrentView('terminal');
      await reload();
      try {
        await hydrateSession(newSessionId);
      } catch (e) {
        console.warn('Hydrate created session error:', e.message);
      }
    },
    [reload, hydrateSession]
  );

  const handleRetry = useCallback(async () => {
    await checkHealth();
    await reload();
  }, [checkHealth, reload]);

  const avgDisplay = stats.avgRisk == null ? '—' : stats.avgRisk.toFixed(1);
  const showFatalError = Boolean(error) && sessions.length === 0 && !loading;

  return (
    <div className="soc-atmosphere soc-scanlines relative min-h-screen">
      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Navigation & Header */}
        <Header
          apiOnline={apiOnline}
          socketConnected={socketConnected}
          currentView={currentView}
          onViewChange={setCurrentView}
          onOpenSimulator={() => setIsSimulatorOpen(true)}
        />

        {/* Live Attack Intercept Alert Notification Banner */}
        {toast ? (
          <div className="mx-4 mt-3 flex items-center justify-between rounded-lg border border-emerald-800/80 bg-emerald-950/80 px-4 py-2.5 backdrop-blur-md shadow-lg shadow-emerald-950/40 sm:mx-6 animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold uppercase tracking-wider text-emerald-400">
                  New Attack Intercepted:
                </span>
                <span className="font-mono text-slate-200">
                  Session #{toast.id} &bull; {toast.ip} &bull; {String(toast.protocol).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  handleOpenTerminal(toast.id);
                  dismissToast();
                }}
                className="flex items-center gap-1 rounded bg-emerald-900/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-200 hover:bg-emerald-800 transition-colors"
              >
                <Terminal size={12} />
                <span>Watch Live Terminal</span>
              </button>
              <button
                type="button"
                onClick={dismissToast}
                className="rounded p-1 text-slate-400 hover:text-slate-200"
              >
                &times;
              </button>
            </div>
          </div>
        ) : null}

        {/* Live Ticker Tape Strip */}
        <div className="border-b border-slate-800/60 bg-[#06090F]/70 px-4 py-1.5 text-[10px] text-slate-400 flex items-center justify-between overflow-hidden">
          <div className="flex items-center gap-2 whitespace-nowrap overflow-x-auto">
            <span className="font-bold uppercase tracking-widest text-emerald-400">
              TRAP TELEMETRY:
            </span>
            <span className="text-slate-500">
              {sessions.length > 0 ? (
                <>
                  Latest: #{sessions[0].id} [{sessions[0].ip_address}] via {sessions[0].protocol?.toUpperCase()} &bull;
                  Active Sessions: {stats.active} &bull; High Risk Incidents: {stats.highRisk}
                </>
              ) : (
                'Sensor listening on ports 22, 23, 80... Awaiting inbound attacker probes.'
              )}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2 font-mono text-slate-500">
            <span>DEFCON 3</span>
            <span>&bull;</span>
            <span>AI ENGINE: GEMINI 3.6 FLASH</span>
          </div>
        </div>

        {/* Main Content View Switcher */}
        <main className="flex-1 px-4 py-5 sm:px-6">
          {loading && sessions.length === 0 ? (
            <LoadingSkeleton />
          ) : showFatalError ? (
            <ErrorState
              onRetry={handleRetry}
              apiOnline={apiOnline}
              socketConnected={socketConnected}
            />
          ) : currentView === 'terminal' ? (
            /* FULL PAGE LIVE TERMINAL VIEW */
            <LiveTerminalView
              sessions={sessions}
              activeSessionId={activeTerminalId}
              onSelectSession={(id) => setActiveTerminalId(id)}
              onOpenSimulator={() => setIsSimulatorOpen(true)}
              onHydrateSession={hydrateSession}
            />
          ) : currentView === 'forensics' ? (
            /* THREAT FORENSICS VIEW */
            <ForensicsView
              sessions={sessions}
              selectedSessionId={activeTerminalId || (sessions[0]?.id ?? null)}
              onSelectSession={(id) => setActiveTerminalId(id)}
              onOpenTerminal={handleOpenTerminal}
            />
          ) : (
            /* DASHBOARD / SOC OVERVIEW */
            <div className="space-y-4">
              {!apiOnline ? (
                <div className="rounded-lg border border-rose-900/60 bg-rose-950/40 px-4 py-2.5 text-xs text-rose-200 flex items-center justify-between">
                  <span>Backend connectivity degraded. Displaying last cached session telemetry.</span>
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="underline text-rose-400 hover:text-rose-200"
                  >
                    Retry connection
                  </button>
                </div>
              ) : null}

              {/* Quick Hero Actions Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800/90 bg-gradient-to-r from-emerald-950/30 via-slate-900/60 to-slate-950/80 p-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-400">
                    <Terminal size={22} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">
                      Live Honeypot Terminal Active
                    </h2>
                    <p className="text-xs text-slate-400">
                      Watch attacker keystrokes streaming in real-time or simulate live exploit vectors.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentView('terminal')}
                    className="flex items-center gap-2 rounded-lg border border-emerald-700 bg-emerald-900/60 px-4 py-2 text-xs font-bold uppercase tracking-wider text-emerald-200 hover:bg-emerald-800 transition-colors glow-emerald"
                  >
                    <Terminal size={14} />
                    <span>Open Full Page Terminal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSimulatorOpen(true)}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    <Play size={13} className="fill-slate-400" />
                    <span>Simulate Attack</span>
                  </button>
                </div>
              </div>

              {/* Stat Cards Grid */}
              <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Total Attacks"
                  value={stats.total}
                  icon={Activity}
                  accent="emerald"
                  hint="Recorded honeypot sessions"
                />
                <StatCard
                  label="Active Sessions"
                  value={stats.active}
                  icon={Radio}
                  accent="sky"
                  hint="Sessions currently streaming"
                />
                <StatCard
                  label="High Risk"
                  value={stats.highRisk}
                  icon={ShieldAlert}
                  accent="rose"
                  hint="Risk score ≥ 7 / 10"
                />
                <StatCard
                  label="Average Risk"
                  value={avgDisplay}
                  icon={AlertTriangle}
                  accent="amber"
                  hint={
                    stats.scoredCount
                      ? `${stats.scoredCount} classified by AI`
                      : 'Awaiting AI classification'
                  }
                />
              </section>

              {/* Charts Grid */}
              <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <div className="xl:col-span-2">
                  <ThreatActivity sessions={sessions} />
                </div>
                <RiskDistribution distribution={stats.distribution} total={stats.total} />
              </section>

              {/* Attack Table with Search, Filters, and Terminal Actions */}
              <AttackTable
                sessions={sessions}
                selectedId={selectedId}
                highlightedIds={highlightedIds}
                onSelect={handleSelect}
                onOpenTerminal={handleOpenTerminal}
              />
            </div>
          )}
        </main>
      </div>

      {/* Attack Simulator Modal */}
      <AttackSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onSessionCreated={handleSessionCreated}
      />

      {/* Session Details Drawer Overlay */}
      {selectedSession ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs"
            aria-label="Close session details overlay"
            onClick={() => setSelectedId(null)}
          />
          <SessionDetails
            session={selectedSession}
            loading={detailLoading}
            error={detailError}
            onClose={() => setSelectedId(null)}
            onOpenTerminal={handleOpenTerminal}
            onHydrateSession={hydrateSession}
          />
        </>
      ) : null}
    </div>
  );
}
