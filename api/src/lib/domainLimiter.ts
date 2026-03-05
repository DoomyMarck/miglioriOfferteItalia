const DOMAIN_INTERVAL_MS = 1_000;
const nextAllowedAt = new Map<string, number>();

export async function waitForDomainSlot(hostname: string): Promise<void> {
  const now = Date.now();
  const next = nextAllowedAt.get(hostname) ?? 0;
  const waitMs = Math.max(0, next - now);

  if (waitMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  nextAllowedAt.set(hostname, Date.now() + DOMAIN_INTERVAL_MS);
}
