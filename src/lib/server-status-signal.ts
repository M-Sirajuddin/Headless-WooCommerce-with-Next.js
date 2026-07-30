/**
 * Cross-module server-status signal.
 *
 * API fetch wrappers (which live outside React) call `notifyServerDown()` when
 * a real backend request fails or returns 503, and `notifyServerUp()` when one
 * succeeds. The ServerStatusProvider subscribes to these so we never have to
 * poll /api/health during normal operation — the actual traffic is the signal.
 */
type Listener = (down: boolean) => void;

const listeners = new Set<Listener>();

export function subscribeServerStatus(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit(down: boolean) {
  listeners.forEach((l) => l(down));
}

export function notifyServerDown() {
  emit(true);
}

export function notifyServerUp() {
  emit(false);
}

/**
 * Classifies a fetch outcome and emits the matching signal.
 * Call with the Response on completion, or with the thrown error.
 */
export function reportResponse(res: Response) {
  if (res.status === 503) notifyServerDown();
  else if (res.ok) notifyServerUp();
}

export function reportFetchError(err: unknown) {
  // Network failure / timeout / abort — treat as server unreachable.
  notifyServerDown();
}
