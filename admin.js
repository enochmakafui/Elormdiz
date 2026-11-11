const $ = s => document.querySelector(s);
const BUCKET = "products";
const THUMB_W = 640;   // grid thumbnail width
const FULL_MAX = 1400; // lightbox image, longest side

const loginEl = $("#login"), appEl = $("#app");

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  loginEl.hidden = false;
  $("#loginForm").innerHTML = '<h1 class="logo">Elormdiz</h1><p class="msg">Supabase is not configured yet. Add the project URL and anon key to config.js.</p>';
  throw new Error("Supabase not configured");
}

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let products = [];

const isLocal = p => /^(images\/|https?:)/.test(p);
const publicUrl = p => isLocal(p) ? p : sb.storage.from(BUCKET).getPublicUrl(p).data.publicUrl;

// ---------- auth ----------
async function showForSession(session) {
  loginEl.hidden = !!session;
  appEl.hidden = !session;
  if (session) await refresh();
}
sb.auth.getSession().then(({ data }) => showForSession(data.session));
sb.auth.onAuthStateChange((_e, session) => { if (!session) showForSession(null); });

$("#loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  const f = new FormData(e.target), msg = $("#loginMsg");
  msg.textContent = "";
  const { data, error } = await sb.auth.signInWithPassword({ email: f.get("email"), password: f.get("password") });
  if (error) { msg.textContent = "Wrong email or password."; return; }
  showForSession(data.session);
});
$("#logout").onclick = () => sb.auth.signOut();

// ---------- image processing ----------
async function toWebp(file, maxW, maxSide) {
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  let scale = 1;
  if (maxW) scale = Math.min(1, maxW / bmp.width);
  if (maxSide) scale = Math.min(scale, maxSide / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  c.getContext("2d").drawImage(bmp, 0, 0, w, h);
  bmp.close();
  const blob = await new Promise(r => c.toBlob(r, "image/webp", 0.82));
  if (!blob) throw new Error("Could not process this image");
  return { blob, w, h };
}

// ---------- add product ----------
const fileEl = $("#file"), preview = $("#preview"), dropText = $("#dropText");
fileEl.addEventListener("change", () => {
  const f = fileEl.files[0];
  if (!f) { preview.hidden = true; dropText.hidden = false; return; }
  preview.src = URL.createObjectURL(f);
  preview.hidden = false; dropText.hidden = true;
});

$("#addForm").addEventListener("submit", async e => {
  e.preventDefault();
  const form = e.target, msg = $("#addMsg"), btn = $("#addBtn");
  const file = fileEl.files[0];
  if (!file) return;
  const say = (t, ok) => { msg.textContent = t; msg.classList.toggle("ok", !!ok); };
  btn.disabled = true; say("Processing photo…");
  const uploaded = [];
  try {
    const thumb = await toWebp(file, THUMB_W, null);
    const full = await toWebp(file, null, FULL_MAX);
    const id = (crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random().toString(36).slice(2)).slice(0, 18);
    const thumbPath = `${id}-s.webp`, fullPath = `${id}.webp`;

    say("Uploading…");
    for (const [path, blob] of [[thumbPath, thumb.blob], [fullPath, full.blob]]) {
      const { error } = await sb.storage.from(BUCKET).upload(path, blob, { contentType: "image/webp", cacheControl: "31536000" });
      if (error) throw error;
      uploaded.push(path);
    }

    const sort = products.length ? Math.min(...products.map(p => p.sort)) - 1 : 0;
    const f = new FormData(form);
    const { error } = await sb.from("products").insert({
      name: f.get("name").trim(), type: f.get("type"),
      thumb_path: thumbPath, full_path: fullPath,
      width: thumb.w, height: thumb.h, sort,
    });
    if (error) throw error;

    form.reset(); preview.hidden = true; dropText.hidden = false;
    say("Published! It's now on the website.", true);
    await refresh();
  } catch (err) {
    if (uploaded.length) await sb.storage.from(BUCKET).remove(uploaded);
    say("Something went wrong: " + (err.message || err));
  } finally { btn.disabled = false; }
});

// ---------- list ----------
async function refresh() {
  const { data, error } = await sb.from("products").select("*").order("sort", { ascending: true }).order("created_at", { ascending: false });
  if (error) { $("#list").textContent = "Could not load products: " + error.message; return; }
  products = data;
  render();
}

function render() {
  const list = $("#list");
  list.innerHTML = "";
  $("#count").textContent = `(${products.length})`;
  products.forEach((p, i) => {
    const row = document.createElement("div");
    row.className = "row";

    const img = document.createElement("img");
    img.src = publicUrl(p.thumb_path); img.alt = ""; img.loading = "lazy";

    const meta = document.createElement("div");
    meta.className = "meta";
    const name = document.createElement("input");
    name.value = p.name; name.maxLength = 60; name.setAttribute("aria-label", "Name");
    const type = document.createElement("select");
    type.setAttribute("aria-label", "Type");
    for (const [v, t] of [["shirt", "Shirt"], ["cloth", "Fabric"]]) {
      const o = new Option(t, v, false, p.type === v); type.add(o);
    }
    const save = async () => {
      const n = name.value.trim();
      if (!n) { name.value = p.name; return; }
      if (n === p.name && type.value === p.type) return;
      const { error } = await sb.from("products").update({ name: n, type: type.value }).eq("id", p.id);
      if (error) { alert("Could not save: " + error.message); return; }
      p.name = n; p.type = type.value;
      name.style.borderColor = "#1f8a5a"; setTimeout(() => name.style.borderColor = "", 900);
    };
    name.addEventListener("change", save);
    type.addEventListener("change", save);
    meta.append(name, type);

    const acts = document.createElement("div");
    acts.className = "acts";
    const mk = (cls, txt, label, fn, disabled) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "ico " + cls; b.textContent = txt;
      b.setAttribute("aria-label", label); b.disabled = !!disabled; b.onclick = fn;
      return b;
    };
    acts.append(
      mk("", "↑", "Move up", () => move(i, -1), i === 0),
      mk("", "↓", "Move down", () => move(i, 1), i === products.length - 1),
      mk("del", "✕", "Delete", () => remove(p)),
    );

    row.append(img, meta, acts);
    list.append(row);
  });
}

async function move(i, d) {
  const j = i + d;
  if (j < 0 || j >= products.length) return;
  const arr = products.slice();
  [arr[i], arr[j]] = [arr[j], arr[i]];
  // renumber so ties never cause confusion
  const changed = [];
  arr.forEach((p, k) => { if (p.sort !== k) changed.push([p, k]); });
  const results = await Promise.all(changed.map(([p, k]) => sb.from("products").update({ sort: k }).eq("id", p.id)));
  const bad = results.find(r => r.error);
  if (bad) { alert("Could not reorder: " + bad.error.message); }
  await refresh();
}

async function remove(p) {
  if (!confirm(`Delete "${p.name}" from the website? This can't be undone.`)) return;
  const { error } = await sb.from("products").delete().eq("id", p.id);
  if (error) { alert("Could not delete: " + error.message); return; }
  const files = [p.thumb_path, p.full_path].filter(x => !isLocal(x));
  if (files.length) await sb.storage.from(BUCKET).remove(files);
  await refresh();
}
