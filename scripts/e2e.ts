// Browser acceptance journey over the Chrome DevTools Protocol, using the
// system Edge/Chrome (no Playwright download). Requires a running server.
// Usage: npm run e2e  [BASE_URL=http://localhost:3000] [BROWSER=path\to\msedge.exe]
import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const BROWSER = process.env.BROWSER ?? ["C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Google/Chrome/Application/chrome.exe"].find((p) => fs.existsSync(p))!;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function browser(width: number) {
  const port = 9300 + Math.floor(Math.random() * 500);
  const proc = spawn(BROWSER, ["--headless=new", "--disable-gpu", `--remote-debugging-port=${port}`,
    `--user-data-dir=${path.join(os.tmpdir(), `rt-e2e-${port}`)}`, "about:blank"]);
  let targets: { type: string; webSocketDebuggerUrl: string }[] = [];
  for (let i = 0; i < 40 && !targets.length; i++) {
    await sleep(250);
    try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch { /* starting */ }
  }
  const ws = new WebSocket(targets.find((t) => t.type === "page")!.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r));
  let id = 0;
  const pending = new Map<number, (m: any) => void>();
  const errors: string[] = [];
  ws.addEventListener("message", (e) => {
    const m = JSON.parse(String(e.data));
    if (m.id) pending.get(m.id)?.(m);
    if (m.method === "Runtime.exceptionThrown") errors.push(m.params.exceptionDetails.text);
    if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errors.push(JSON.stringify(m.params.args.map((a: any) => a.value)));
  });
  const send = (method: string, params = {}) => new Promise<any>((r) => { pending.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width < 600 });
  const evaluate = async <T>(expr: string): Promise<T> => {
    const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.result.exceptionDetails) throw new Error(`${expr}: ${r.result.exceptionDetails.text}`);
    return r.result.result.value as T;
  };
  const waitFor = async (expr: string, what: string, ms = 10000) => {
    for (let t = 0; t < ms; t += 200) { if (await evaluate<boolean>(expr).catch(() => false)) return; await sleep(200); }
    throw new Error(`timed out waiting for ${what}`);
  };
  const goto = async (url: string) => { await send("Page.navigate", { url: BASE + url }); await sleep(300); await waitFor("document.readyState === 'complete'", url); };
  const key = (k: string) => send("Input.dispatchKeyEvent", { type: "keyDown", key: k, code: k, windowsVirtualKeyCode: k === "Escape" ? 27 : 0 });
  const type = async (sel: string, text: string) => { await evaluate(`document.querySelector(${JSON.stringify(sel)}).focus()`); await send("Input.insertText", { text }); };
  const noOverflow = () => evaluate<boolean>("document.documentElement.scrollWidth <= document.documentElement.clientWidth");
  return { evaluate, waitFor, goto, key, type, noOverflow, errors, close: () => { ws.close(); proc.kill(); } };
}

const results: [string, boolean, string?][] = [];
async function check(name: string, fn: () => Promise<void>) {
  try { await fn(); results.push([name, true]); } catch (e) { results.push([name, false, (e as Error).message]); }
}
const assert = (c: unknown, m: string) => { if (!c) throw new Error(m); };

async function main() {
  const email = `e2e-${Date.now()}@example.com`;
  for (const width of [1440, 390]) {
    const b = await browser(width);
    const tag = `${width}px`;
    await check(`${tag} landing renders with coverage + disclaimer`, async () => {
      await b.goto("/");
      assert(await b.evaluate<boolean>("document.body.innerText.includes('Legal information, not legal advice')"), "no disclaimer");
      assert(await b.noOverflow(), "horizontal overflow");
    });
    await check(`${tag} address search → analyze`, async () => {
      await b.goto("/app/check");
      await b.type("#addr", "Clinton");
      await b.waitFor("document.querySelectorAll('#addr-list button').length > 0", "suggestions");
      await b.evaluate("document.querySelector('#addr-list button').click()");
      await b.waitFor("!document.querySelector('button[type=submit]').disabled", "analyze enabled");
      await b.evaluate("document.querySelector('button[type=submit]').click()");
      await b.waitFor("location.pathname.startsWith('/app/properties/')", "property page");
      await b.waitFor("document.querySelector('article') !== null", "rule cards");
      assert(await b.noOverflow(), "horizontal overflow on property page");
    });
    await check(`${tag} evidence drawer opens, Esc closes, focus returns`, async () => {
      await b.evaluate("window.__t = [...document.querySelectorAll('button')].find(x => x.textContent.includes('Source evidence')); window.__t.click()");
      await b.waitFor("document.querySelector('dialog[open]') !== null", "dialog open");
      assert(await b.evaluate<boolean>("document.querySelector('dialog[open] mark').textContent.length >= 20"), "no highlighted quote");
      await b.key("Escape");
      await b.waitFor("document.querySelector('dialog[open]') === null", "dialog closed");
      await b.waitFor("document.activeElement === window.__t", "focus returned to trigger");
    });
    await check(`${tag} conditional rule shows branches; answering a clarification re-evaluates as hypothetical`, async () => {
      await b.goto("/app/properties/A0005?asOf=2026-10-01");
      assert(await b.evaluate<boolean>("document.body.innerText.includes('admissible cases checked')"), "no branch block");
      assert(!(await b.evaluate<boolean>("document.body.innerText.includes('Unknown — needs facts')")), "bare Unknown label still shown");
      await b.evaluate(`(() => { const s = document.querySelector('select[name=ans]'); s.selectedIndex = 1; s.form.querySelector('button').click(); })()`);
      await b.waitFor("location.search.includes('ans=')", "answer submitted");
      await b.waitFor("document.body.innerText.includes('Hypothetical:')", "hypothetical banner");
      assert(await b.noOverflow(), "horizontal overflow after answer");
    });
    await check(`${tag} changes T3 shows conflict-flagged NJ addresses`, async () => {
      await b.goto("/app/changes?test=T3");
      assert(await b.evaluate<boolean>("document.body.innerText.includes('conflict-flagged')"), "no change summary");
      assert(await b.noOverflow(), "horizontal overflow on changes");
    });
    await check(`${tag} rule library filters`, async () => {
      await b.goto("/app/rules?category=algorithmic_rent_setting");
      assert(await b.evaluate<number>("document.querySelectorAll('article').length") > 0, "no rules listed");
    });
    if (width === 1440) {
      await check("sign-up → save property → reload persists", async () => {
        await b.goto("/app/properties/A0001");
        await b.goto(`/login?next=${encodeURIComponent("/app/properties/A0001")}`);
        await b.evaluate("[...document.querySelectorAll('button')].find(x => x.textContent.includes('Create one')).click()");
        await b.waitFor("document.querySelector('h1').textContent.includes('Create account')", "signup mode");
        await b.type("input[name=email]", email);
        await b.type("input[name=password]", "correct-horse-1");
        await b.evaluate("document.querySelector('form button:not([type=button])').click()");
        await b.waitFor("location.pathname === '/app/properties/A0001'", "redirect back after signup");
        await b.evaluate("[...document.querySelectorAll('button')].find(x => x.textContent.includes('Save property')).click()");
        await b.waitFor("[...document.querySelectorAll('button')].some(x => x.textContent.includes('Saved'))", "saved state");
        await b.goto("/app/saved");
        assert(await b.evaluate<boolean>("document.body.innerText.includes('DE LONGPRE')"), "saved property missing after reload");
      });
    }
    await check(`${tag} no console errors`, async () => { assert(!b.errors.length, b.errors.join(" | ")); });
    b.close();
  }
  // A fresh browser profile = a different user/session: must not see the first user's data.
  const other = await browser(1440);
  await check("second session cannot see first user's saved data", async () => {
    await other.goto("/app/saved");
    assert(await other.evaluate<boolean>("location.pathname === '/login'"), "unauthenticated user not redirected to login");
    const status = await other.evaluate<number>("fetch('/api/reports/1').then(r => r.status)");
    assert(status === 401, `report endpoint returned ${status}`);
  });
  other.close();

  for (const [n, ok, why] of results) console.log(`${ok ? "PASS" : "FAIL"}  ${n}${why ? ` — ${why}` : ""}`);
  const failed = results.filter((r) => !r[1]).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
}

main();
