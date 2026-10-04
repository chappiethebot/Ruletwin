// Records the two ≤60 s demo videos from the running site (our own output only; the
// judges asked for real system output, so footage is never generated):
//   footage  headless Edge/Chrome over CDP, 1920x1080 screencast of the live product
//   voice    media/voice/<video>-<n>.mp3 (made in the ElevenLabs app), else the ElevenLabs
//            API (ELEVENLABS_API_KEY in .env.local), else a silent draft with estimated timing
//   music    media/music/<video>.mp3 or media/music/bed.mp3 (optional; ducked under the voice)
//   finish   title + end cards, cross-fades, camera zooms, burned-in captions (ffmpeg)
// Usage: node scripts/demo-video.ts [product|technical] [--base http://localhost:3001] [--lines]
// --lines prints the narration lines and file names for recording them in ElevenLabs.
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ROOT, readJson } from "./config.ts";

const args = process.argv.slice(2);
const BASE = args.includes("--base") ? args[args.indexOf("--base") + 1] : "http://localhost:3001";
const KEY = process.env.ELEVENLABS_API_KEY;
const VOICE = process.env.ELEVENLABS_VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM"; // premade voice "Rachel"
const VW = 1280, VH = 720, DPR = 1.5, W = VW * DPR, H = VH * DPR; // 1920x1080 output
const XF = 0.6;    // cross-fade length (s)
const LEAD = 0.45; // silence before each line, after the transition
const TAIL = 0.7;  // silence after each line
const OUT = path.join(ROOT, "media");
const BROWSER = process.env.BROWSER ?? ["C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Google/Chrome/Application/chrome.exe"].find((p) => fs.existsSync(p))!;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Page = Awaited<ReturnType<typeof open>>;
type Action = [at: number, run: (p: Page) => Promise<unknown>];
interface Scene { say?: string; hold?: number; setup: (p: Page) => Promise<unknown>; actions?: Action[] }

// ---------- browser (CDP) ----------
async function open() {
  const port = 9600 + Math.floor(Math.random() * 300);
  const proc = spawn(BROWSER, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1.5", `--remote-debugging-port=${port}`,
    `--user-data-dir=${path.join(os.tmpdir(), `rt-video-${port}`)}`, "about:blank"]);
  let targets: { type: string; webSocketDebuggerUrl: string }[] = [];
  for (let i = 0; i < 40 && !targets.length; i++) { await sleep(250); try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch { /* starting */ } }
  const ws = new WebSocket(targets.find((t) => t.type === "page")!.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r));
  let id = 0;
  const pending = new Map<number, (m: any) => void>();
  let onFrame: ((m: any) => void) | null = null;
  ws.addEventListener("message", (e) => {
    const m = JSON.parse(String(e.data));
    if (m.id) pending.get(m.id)?.(m);
    if (m.method === "Page.screencastFrame") { send("Page.screencastFrameAck", { sessionId: m.params.sessionId }); onFrame?.(m.params); }
  });
  const send = (method: string, params = {}) => new Promise<any>((r) => { pending.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: VW, height: VH, deviceScaleFactor: DPR, mobile: false });
  const js = (expr: string) => send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
  const goto = async (url: string) => {
    await send("Page.navigate", { url: BASE + url });
    for (let i = 0; i < 60; i++) { await sleep(100); if ((await js("document.readyState")).result?.result?.value === "complete") break; }
    await js("document.fonts.ready"); await sleep(400);
  };
  const find = (sel: string, contains: string) => `[...document.querySelectorAll(${JSON.stringify(sel)})].find((x) => x.textContent.includes(${JSON.stringify(contains)}))`;
  return {
    goto, js,
    type: async (sel: string, text: string) => {
      await js(`document.querySelector(${JSON.stringify(sel)}).focus()`);
      for (const ch of text) { await send("Input.insertText", { text: ch }); await sleep(85); }
    },
    click: (sel: string, contains = "") => js(`${find(sel, contains)}?.click()`),
    scrollTo: (sel: string, contains = "", offset = 90) => js(`(() => { const el = ${find(sel, contains)}; if (el) window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - ${offset}, behavior: "smooth" }); })()`),
    scrollBy: (y: number) => js(`window.scrollBy({ top: ${y}, behavior: "smooth" })`),
    // Camera move: scale the page around an element's centre (CSS transform, eased).
    zoom: (sel: string, contains = "", scale = 1.35) => js(`(() => { const el = ${find(sel, contains)}; if (!el) return; const b = el.closest("dialog") ?? document.body, r = el.getBoundingClientRect(), o = b === document.body ? { left: 0, top: -scrollY } : b.getBoundingClientRect();
      b.style.transformOrigin = (r.left - o.left + r.width / 2) + "px " + (r.top - o.top + b.scrollTop * (b === document.body ? 0 : 1) + r.height / 2) + "px"; b.style.transition = "transform 1.3s cubic-bezier(.2,.7,.2,1)"; b.style.transform = "scale(${scale})"; })()`),
    unzoom: () => js(`for (const b of [document.body, ...document.querySelectorAll("dialog")]) b.style.transform = "none"`),
    reveal: (sel: string) => js(`document.querySelector(${JSON.stringify(sel)})?.scrollIntoView({ block: "center", behavior: "smooth" })`),
    // Title / end cards are rendered inside the site so they use its typeface.
    card: async (html: string) => { await goto("/"); await js(`document.body.innerHTML = ${JSON.stringify(html)}; document.body.style.margin = "0"; window.scrollTo(0, 0)`); await sleep(50); },
    shot: async () => (await send("Page.captureScreenshot", { format: "jpeg", quality: 92 })).result.data as string,
    screencast: async (cb: ((f: { data: string; metadata: { timestamp?: number } }) => void) | null) => {
      onFrame = cb;
      if (cb) await send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: W, maxHeight: H, everyNthFrame: 1 });
      else await send("Page.stopScreencast");
    },
    close: () => { ws.close(); proc.kill(); },
  };
}

// ---------- cards ----------
const STYLE = `<style>@keyframes rt-rise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
.rt{animation:rt-rise .9s cubic-bezier(.2,.7,.2,1) both}.rt-line{opacity:0;animation:rt-rise .5s ease-out both}</style>`;
const center = (inner: string) => `${STYLE}<div style="height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;background:#fff;color:#111">${inner}</div>`;
const titleCard = (kicker: string, title: string, sub: string) => center(`
  <p class="rt" style="margin:0;font-size:15px;letter-spacing:.14em;text-transform:uppercase;color:#d4380d">${kicker}</p>
  <h1 class="rt" style="margin:18px 0 0;font-size:96px;font-weight:600;letter-spacing:-.045em;line-height:1;animation-delay:.12s">${title}</h1>
  <p class="rt" style="margin:22px 0 0;font-size:24px;color:#66665f;animation-delay:.28s">${sub}</p>`);
const endCard = center(`
  <p class="rt" style="margin:0;font-size:64px;font-weight:600;letter-spacing:-.04em">Rental law, <span style="color:#d4380d">by address.</span></p>
  <p class="rt" style="margin:26px 0 0;font-size:26px;animation-delay:.15s">ruletwin.vercel.app</p>
  <p class="rt" style="margin:40px 0 0;font-size:15px;color:#66665f;animation-delay:.3s">Hack-Nation × RealPage · Challenge 02 · Legal information, not legal advice.</p>`);
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const terminal = (title: string, lines: string[]) => `${STYLE}<div style="height:100vh;box-sizing:border-box;padding:64px 110px;background:#fff;color:#111">
  <p class="rt" style="margin:0;color:#d4380d;font-size:14px;letter-spacing:.14em;text-transform:uppercase">Own validation output</p>
  <h1 class="rt" style="margin:12px 0 28px;font-size:52px;font-weight:600;letter-spacing:-.035em;animation-delay:.08s">${esc(title)}</h1>
  <div style="background:#f6f6f4;border-radius:24px;padding:30px 36px;font:16px/1.7 'Cascadia Mono',Consolas,monospace">${lines.map((l, i) =>
    `<div class="rt-line" style="white-space:pre-wrap;animation-delay:${(0.35 + i * 0.09).toFixed(2)}s;${l.startsWith("$") ? "color:#d4380d" : ""}">${esc(l) || "&nbsp;"}</div>`).join("")}</div></div>`;
const log = (f: string) => fs.existsSync(path.join(OUT, "logs", f)) ? fs.readFileSync(path.join(OUT, "logs", f), "utf8").trim().split(/\r?\n/) : [`(missing media/logs/${f})`];
function ledgerLines() {
  const ledger = readJson<{ disposition: string }[]>(path.join(ROOT, "data", "extraction", "ledger.json"));
  const by: Record<string, number> = {};
  for (const l of ledger) { const k = l.disposition.split(" ")[0]; by[k] = (by[k] ?? 0) + 1; }
  const pub = log("publish.txt");
  return ["$ node scripts/extract.ts", `ledger: ${ledger.length} entries, every one with a disposition`, ...Object.entries(by).map(([k, n]) => `  ${k.padEnd(30)} ${n}`), "",
    "$ npm run publish   # gates: schema, exact quotes, ids, evidence", pub.find((l) => /rules \(/.test(l)) ?? "", ...pub.filter((l) => /^T\d:/.test(l))];
}

// ---------- the two videos ----------
const AS_OF = "2026-10-01";
const VIDEOS: Record<string, Scene[]> = {
  product: [
    { hold: 3.2, setup: (p) => p.card(titleCard("Product demo", "RuleTwin", "Rental housing law, at the level of a single address")) },
    { say: "Rental housing law comes in layers: state, county and city. RuleTwin answers one question for any building: which rules apply here, today?",
      setup: (p) => p.goto("/"), actions: [[5.2, (p) => p.zoom("form", "", 1.18)]] },
    { say: "Search an address, like thirty-five fifteen Fillmore Street in San Francisco.",
      setup: async (p) => { await p.goto("/"); },
      actions: [[0.3, (p) => p.type("#addr", "Fillmore")], [2.4, (p) => p.click("#addr-list button", "3515")], [3.6, (p) => p.click("button[type=submit]")]] },
    { say: "You get a plain-language answer: the city's rent ordinance applies, and the state cap yields to it. In English, or in Spanish.",
      setup: (p) => p.goto(`/app/properties/A0016?asOf=${AS_OF}`),
      actions: [[1.2, (p) => p.scrollTo("section", "In plain words", 110)], [6.4, (p) => p.click("a", "Ver en español")]] },
    { say: "Every answer is traced to the exact sentence of law, with its source and retrieval date.",
      setup: async (p) => { await p.goto(`/app/properties/A0016?asOf=${AS_OF}`); await p.js(`window.scrollTo(0, document.querySelector("article").getBoundingClientRect().top + scrollY - 100)`); },
      actions: [[0.8, (p) => p.click("article button", "Source evidence")], [1.8, (p) => p.reveal("dialog mark")], [3.0, (p) => p.zoom("dialog mark", "", 1.2)]] },
    { say: "When the data can't decide, RuleTwin says unknown, and asks the one question that would settle it.",
      setup: (p) => p.goto(`/app/properties/A0005?asOf=${AS_OF}`),
      actions: [[0.6, (p) => p.scrollTo("h2", "Every rule", 80)], [3.4, (p) => p.zoom("aside", "What would settle", 1.15)]] },
    { say: "It also tracks law changes. New Jersey's FAIR Act affects one hundred forty buildings, and ninety are flagged for conflict with local bans.",
      setup: (p) => p.goto("/app/changes?test=T3"),
      actions: [[1.0, (p) => p.scrollTo("section", "Test case", 100)], [4.2, (p) => p.zoom("[role=status]", "conflict-flagged", 1.2)]] },
    { say: "RuleTwin. Housing law, made visible, one address at a time.", setup: (p) => p.card(endCard) },
  ],
  technical: [
    { hold: 3.2, setup: (p) => p.card(titleCard("Technical walkthrough", "RuleTwin", "Extraction · Address lookup · Change tracking")) },
    { say: "Module A. A language model reads every supplied document and outputs structured rules. Each quote must match the source exactly, or the record is rejected. Forty-eight rules, zero errors.",
      setup: (p) => p.card(terminal("Automated extraction", ledgerLines())) },
    { say: "Each rule follows the official schema, with its coverage conditions compiled into testable logic.",
      setup: (p) => p.goto("/app/rules?category=algorithmic_rent_setting"),
      actions: [[0.8, (p) => p.click("summary", "Structured record")], [1.6, (p) => p.scrollTo("summary", "Structured record", 160)]] },
    { say: "Module B. The Census geocoder finds the legal city. One deterministic engine applies every rule with true, false and unknown logic, and proves which missing facts matter.",
      setup: (p) => p.goto(`/app/properties/A0005?asOf=${AS_OF}`),
      actions: [[0.6, (p) => p.scrollTo("article", "admissible cases", 90)], [4.5, (p) => p.zoom("article", "admissible cases", 1.15)]] },
    { say: "Every answer carries its source, retrieval date, as-of date and reasoning boundary.",
      setup: async (p) => { await p.goto(`/app/properties/A0016?asOf=${AS_OF}`); await p.click("summary", "Audit view"); await sleep(300); await p.js(`window.scrollTo(0, [...document.querySelectorAll("summary")].find(x => x.textContent.includes("Audit view")).getBoundingClientRect().top + scrollY - 90)`); },
      actions: [[1.6, (p) => p.zoom("table", "", 1.15)]] },
    { say: "Module C replays all five supplied change cases through the same engine. Massachusetts' bills stay pending, with a hypothetical impact on one hundred ten buildings.",
      setup: (p) => p.goto("/app/changes?test=T4"),
      actions: [[1.0, (p) => p.scrollTo("section", "Test case", 100)], [5.0, (p) => p.scrollBy(420)]] },
    { say: "Fifty-six unit tests, sixteen browser journeys, and a reproducible audit log. Legal information, not legal advice.",
      setup: (p) => p.card(terminal("Validation", ["$ npm test", ...log("test.txt"), "", "$ npm run e2e   # desktop 1440 px and phone 390 px", ...log("e2e.txt").slice(-5)])) },
    { hold: 3.4, setup: (p) => p.card(endCard) },
  ],
};

// ---------- audio ----------
const ff = (a: string[], cwd: string) => { const r = spawnSync("ffmpeg", ["-y", "-loglevel", "error", ...a], { cwd, encoding: "utf8", maxBuffer: 1 << 26 }); if (r.status) throw new Error(r.stderr); };
const duration = (f: string) => Number(spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f], { encoding: "utf8" }).stdout.trim());

async function voiceFile(name: string, i: number, text: string, dir: string): Promise<string | null> {
  const manual = path.join(OUT, "voice", `${name}-${i}.mp3`);
  if (fs.existsSync(manual)) return manual;
  if (!KEY) return null;
  const file = path.join(dir, `v${i}.mp3`);
  if (fs.existsSync(file) && fs.existsSync(file + ".txt") && fs.readFileSync(file + ".txt", "utf8") === VOICE + text) return file; // cached
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}?output_format=mp3_44100_128`, {
    method: "POST", headers: { "xi-api-key": KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ text, model_id: "eleven_multilingual_v2", voice_settings: { stability: 0.55, similarity_boost: 0.8, style: 0.15 } }),
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 300)}`);
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  fs.writeFileSync(file + ".txt", VOICE + text);
  return file;
}

const srtTime = (t: number) => new Date(Math.max(0, t) * 1000).toISOString().slice(11, 23).replace(".", ",");

async function render(name: string) {
  const scenes = VIDEOS[name];
  const dir = path.join(OUT, `${name}-work`);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(path.join(dir, "frames"), { recursive: true });

  // Timing: each narrated scene = lead + line + tail (+ the cross-fade it overlaps).
  const voices: (string | null)[] = [];
  const speech: number[] = [];
  for (const [i, s] of scenes.entries()) {
    const v = s.say ? await voiceFile(name, i, s.say, dir) : null;
    voices.push(v);
    speech.push(s.say ? (v ? duration(v) : s.say.split(/\s+/).length / 2.7) : 0);
  }
  const fixed = scenes.reduce((a, s) => a + (s.say ? LEAD + TAIL : s.hold ?? 3) + XF, 0) - XF * scenes.length;
  const raw = speech.reduce((a, b) => a + b, 0);
  const tempo = Math.min(1.12, Math.max(1, raw / Math.max(1, 59.5 - fixed))); // fit ≤60 s without rushing
  const durs = scenes.map((s, i) => (s.say ? LEAD + speech[i] / tempo + TAIL : s.hold ?? 3) + XF);
  const starts = durs.map((_, i) => durs.slice(0, i).reduce((a, b) => a + b - XF, 0));
  const total = starts.at(-1)! + durs.at(-1)!;
  const source = voices.some(Boolean) ? (voices.every((v, i) => v || !scenes[i].say) ? "voice" : "partial voice") : "silent draft";
  console.log(`${name}: ${scenes.length} scenes, ${total.toFixed(1)} s, ${source}${tempo > 1 ? `, voice tempo ×${tempo.toFixed(2)}` : ""}`);
  if (total > 60) console.warn("  warning: over 60 s; shorten the narration");

  // Footage: one clip per scene from the browser's paint stream (smooth motion).
  const page = await open();
  for (const [i, s] of scenes.entries()) {
    await s.setup(page);
    const frames: { file: string; t: number }[] = [];
    let n = 0;
    const save = (data: string, t: number) => { const file = `frames/s${i}-${String(n++).padStart(5, "0")}.jpg`; fs.writeFileSync(path.join(dir, file), Buffer.from(data, "base64")); frames.push({ file, t }); };
    const t0 = Date.now() / 1000;
    save(await page.shot(), t0);
    await page.screencast((f) => save(f.data, f.metadata.timestamp ?? Date.now() / 1000));
    const timers = (s.actions ?? []).map(([at, run]) => setTimeout(() => { run(page).catch(() => {}); }, (at / tempo) * 1000));
    await sleep(durs[i] * 1000);
    timers.forEach(clearTimeout);
    await page.screencast(null);
    await page.unzoom();
    const list = frames.filter((f) => f.t >= t0 - 0.05 && f.t <= t0 + durs[i]).sort((a, b) => a.t - b.t);
    const lines = list.flatMap((f, k) => [`file '${f.file}'`, `duration ${Math.max(0.001, (list[k + 1]?.t ?? t0 + durs[i]) - f.t).toFixed(4)}`]);
    lines.push(`file '${list.at(-1)!.file}'`);
    fs.writeFileSync(path.join(dir, `s${i}.txt`), lines.join("\n") + "\n");
    ff(["-f", "concat", "-safe", "0", "-i", `s${i}.txt`, "-vf", `fps=30,scale=${W}:${H}:flags=lanczos,format=yuv420p`, "-t", durs[i].toFixed(3),
      "-c:v", "libx264", "-preset", "slow", "-crf", "16", `s${i}.mp4`], dir);
  }
  page.close();

  // Cross-fades between scene clips.
  const vIn = scenes.flatMap((_, i) => ["-i", `s${i}.mp4`]);
  let chain = "", last = "[0:v]";
  for (let i = 1; i < scenes.length; i++) {
    chain += `${last}[${i}:v]xfade=transition=fade:duration=${XF}:offset=${(starts[i]).toFixed(3)}[x${i}];`;
    last = `[x${i}]`;
  }
  ff([...vIn, "-filter_complex", chain.replace(/;$/, ""), "-map", last, "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p", "video.mp4"], dir);

  // Voice track: each line placed after its transition; music ducked underneath.
  const aIn: string[] = [], parts: string[] = [];
  let k = 0;
  for (const [i, v] of voices.entries()) {
    if (!v) continue;
    aIn.push("-i", v);
    const at = Math.round((starts[i] + XF / 2 + LEAD) * 1000);
    parts.push(`[${k++}:a]${tempo > 1 ? `atempo=${tempo.toFixed(3)},` : ""}aresample=48000,adelay=${at}|${at}[a${k}]`);
  }
  const music = [path.join(OUT, "music", `${name}.mp3`), path.join(OUT, "music", "bed.mp3")].find((f) => fs.existsSync(f));
  let audio = "";
  if (k) audio = `${parts.join(";")};${Array.from({ length: k }, (_, j) => `[a${j + 1}]`).join("")}amix=inputs=${k}:normalize=0,apad=whole_dur=${total.toFixed(3)}[voice]`;
  else { aIn.push("-f", "lavfi", "-t", total.toFixed(3), "-i", "anullsrc=r=48000:cl=stereo"); audio = `[${k++}:a]anull[voice]`; }
  if (music) {
    aIn.push("-stream_loop", "-1", "-i", music);
    audio += `;[${k}:a]aresample=48000,volume=0.35,afade=t=in:d=1.5,afade=t=out:st=${(total - 2.5).toFixed(3)}:d=2.5,atrim=0:${total.toFixed(3)}[bed];[voice]asplit[v1][v2];[bed][v2]sidechaincompress=threshold=0.03:ratio=10:attack=20:release=400[duck];[v1][duck]amix=inputs=2:normalize=0[mix]`;
  } else audio += ";[voice]anull[mix]";
  ff([...aIn, "-filter_complex", `${audio};[mix]loudnorm=I=-16:TP=-1.5:LRA=11,atrim=0:${total.toFixed(3)}[out]`, "-map", "[out]", "-ar", "48000", "-c:a", "pcm_s16le", "audio.wav"], dir);

  // Captions: sentence cues, timed by length within each narrated line.
  const cues: string[] = [];
  let c = 1;
  for (const [i, s] of scenes.entries()) {
    if (!s.say) continue;
    const sentences = s.say.match(/[^.!?]+[.!?]+/g) ?? [s.say];
    let u = starts[i] + XF / 2 + LEAD;
    for (const sen of sentences) {
      const d = (speech[i] / tempo) * (sen.length / s.say.length);
      cues.push(`${c++}\n${srtTime(u)} --> ${srtTime(u + d)}\n${sen.trim()}\n`);
      u += d;
    }
  }
  fs.writeFileSync(path.join(dir, "captions.srt"), cues.join("\n"));

  const out = path.join(OUT, `ruletwin-${name}${source === "silent draft" ? "-draft" : ""}.mp4`);
  const style = "FontName=Segoe UI Semibold,FontSize=11,PrimaryColour=&H00FFFFFF,BackColour=&HA0111111,BorderStyle=4,Outline=6,Shadow=0,MarginV=18";
  ff(["-i", "video.mp4", "-i", "audio.wav", "-vf", `subtitles=captions.srt:force_style='${style}'`, "-c:v", "libx264", "-preset", "slow", "-crf", "17",
    "-profile:v", "high", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", out], dir);
  fs.copyFileSync(path.join(dir, "captions.srt"), out.replace(/\.mp4$/, ".srt"));
  console.log(`  -> ${path.relative(ROOT, out)} (${duration(out).toFixed(1)} s, ${W}x${H}) + .srt`);
}

if (args.includes("--lines")) {
  for (const [name, scenes] of Object.entries(VIDEOS))
    for (const [i, s] of scenes.entries()) if (s.say) console.log(`media/voice/${name}-${i}.mp3\t${s.say}`);
} else {
  const which = args.find((a) => a in VIDEOS);
  for (const name of which ? [which] : Object.keys(VIDEOS)) await render(name);
}
