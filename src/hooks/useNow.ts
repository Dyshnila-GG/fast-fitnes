import { useEffect, useState } from 'react';

// Текущее время, обновляется каждые intervalMs.
export function useNow(intervalMs = 500): number {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
