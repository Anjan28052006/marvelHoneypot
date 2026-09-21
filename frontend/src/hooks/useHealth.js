import { useCallback, useEffect, useState } from 'react';
import { fetchHealth } from '../api/sessions';

const HEALTH_INTERVAL_MS = 20000;

export function useHealth() {
  const [online, setOnline] = useState(false);
  const [checking, setChecking] = useState(true);

  const check = useCallback(async () => {
    try {
      const data = await fetchHealth();
      const ok = data?.status === 'ok';
      setOnline(ok);
      return ok;
    } catch (error) {
      console.warn('[SentinelAI] Health check failed', error.message);
      setOnline(false);
      return false;
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (cancelled) return;
      await check();
    };

    run();
    const timer = setInterval(run, HEALTH_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [check]);

  return { online, checking, check };
}
