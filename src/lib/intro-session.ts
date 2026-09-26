// Remembers, per browser tab session, that the opening sequence has been seen,
// so reloads and in-app navigation go straight to the lab.

const KEY = 'dcn-lab:intro-seen';

export function hasSeenIntro(): boolean {
  try {
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function markIntroSeen(): void {
  try {
    sessionStorage.setItem(KEY, '1');
  } catch {
    // Storage blocked (private mode / sandboxed iframe) — the intro simply shows again next load.
  }
}
