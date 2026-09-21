import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchSessionById, fetchSessions } from '../api/sessions';
import { getSocket } from '../lib/socket';
import {
  computeStats,
  mergeAnalysis,
  normalizeSession,
} from '../lib/formatters';

const MAX_SESSIONS = 500;
const HIGHLIGHT_MS = 3500;
const TOAST_MS = 4500;

export function useSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [highlightedIds, setHighlightedIds] = useState(() => new Set());
  const highlightTimers = useRef(new Map());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSessions();
      const normalized = data.map((item) => normalizeSession(item)).filter((s) => s.id != null);
      setSessions(normalized.slice(0, MAX_SESSIONS));
      setError(null);
    } catch (err) {
      console.error('[SentinelAI] Failed to load sessions', err);
      setError('Unable to establish connection with SentinelAI backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  const highlight = useCallback((id) => {
    const key = String(id);
    setHighlightedIds((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    const existing = highlightTimers.current.get(key);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      setHighlightedIds((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      highlightTimers.current.delete(key);
    }, HIGHLIGHT_MS);
    highlightTimers.current.set(key, timer);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const socket = getSocket();

    const onNewSession = (payload) => {
      const incoming = normalizeSession(payload);
      if (incoming.id == null) {
        console.warn('[SentinelAI] Ignored new_session without id', payload);
        return;
      }

      setSessions((prev) => {
        const exists = prev.some((s) => String(s.id) === String(incoming.id));
        if (exists) {
          return prev.map((s) =>
            String(s.id) === String(incoming.id) ? { ...s, ...incoming, commands: incoming.commands.length ? incoming.commands : s.commands } : s
          );
        }
        return [incoming, ...prev].slice(0, MAX_SESSIONS);
      });

      highlight(incoming.id);
      setToast({
        id: incoming.id,
        ip: incoming.ip_address || 'unknown host',
        protocol: incoming.protocol || 'unknown',
      });
    };

    const onAnalyzed = (payload) => {
      const sessionId = payload?.session_id ?? payload?.analysis?.session_id;
      if (sessionId == null) {
        console.warn('[SentinelAI] Ignored session_analyzed without session_id', payload);
        return;
      }
      const analysis = payload?.analysis || {};
      setSessions((prev) =>
        prev.map((s) => (String(s.id) === String(sessionId) ? mergeAnalysis(s, analysis) : s))
      );
    };

    socket.on('new_session', onNewSession);
    socket.on('session_analyzed', onAnalyzed);

    return () => {
      socket.off('new_session', onNewSession);
      socket.off('session_analyzed', onAnalyzed);
    };
  }, [highlight]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const timers = highlightTimers.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  const stats = useMemo(() => computeStats(sessions), [sessions]);

  const hydrateSession = useCallback(async (id) => {
    try {
      const detail = await fetchSessionById(id);
      if (!detail) return null;
      const normalized = normalizeSession(detail);
      setSessions((prev) =>
        prev.map((s) => (String(s.id) === String(id) ? { ...s, ...normalized } : s))
      );
      return normalized;
    } catch (err) {
      console.warn('[SentinelAI] Failed to load session detail', err.message);
      throw err;
    }
  }, []);

  return {
    sessions,
    loading,
    error,
    toast,
    highlightedIds,
    stats,
    reload: load,
    hydrateSession,
    dismissToast: () => setToast(null),
  };
}
