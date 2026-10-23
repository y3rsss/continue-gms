const KEY = "continue.reloaded-into";
const ENTRY = /\/assets\/index-[\w-]+\.js/;

const runningEntry = () =>
  document
    .querySelector<HTMLScriptElement>('script[type="module"][src*="/assets/index-"]')
    ?.getAttribute("src") ?? null;

// a tab opened before a deploy runs old code against the new API, and its old page files are gone
export async function newerVersion(): Promise<string | null> {
  const running = runningEntry();
  if (!running) return null;
  try {
    const html = await fetch("/", { cache: "no-store" }).then((response) => response.text());
    const deployed = html.match(ENTRY)?.[0] ?? null;
    return deployed && deployed !== running ? deployed : null;
  } catch {
    return null;
  }
}

export function reloadInto(version: string): boolean {
  try {
    if (sessionStorage.getItem(KEY) === version) return false;
    sessionStorage.setItem(KEY, version);
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}
