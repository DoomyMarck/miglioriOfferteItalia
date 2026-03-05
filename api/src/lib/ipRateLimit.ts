const MAX_REQUESTS = 30;
const WINDOW_MS = 60_000;

type RequestWindow = {
  count: number;
  startedAt: number;
};

const windows = new Map<string, RequestWindow>();

export function isIpAllowed(ip: string): boolean {
  const now = Date.now();
  const current = windows.get(ip);

  if (!current || now - current.startedAt > WINDOW_MS) {
    windows.set(ip, { count: 1, startedAt: now });
    return true;
  }

  if (current.count >= MAX_REQUESTS) return false;

  current.count += 1;
  windows.set(ip, current);
  return true;
}
