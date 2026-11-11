// ====== CONFIG ======
// Replace with her WhatsApp number: country code + number, digits only (no + or spaces)
const WHATSAPP_NUMBER = "233591007998";

// Fallback catalogue, shown only if Supabase isn't configured or can't be reached.
// Live products are managed from admin.html.
const DIM = {9:[591,796],10:[691,1100],3:[825,1100],7:[825,1100],12:[825,1100],16:[825,1100]};
const FALLBACK = [
  [1,"Emerald Sun","shirt"],[3,"Royal Violet Trio","cloth"],[2,"Lilac Storm","shirt"],[5,"Violet Horizon","shirt"],
  [7,"Golden Hour Trio","cloth"],[4,"Jade Cloud","shirt"],[6,"Amethyst Dusk","shirt"],[12,"Teal Tide Trio","cloth"],
  [8,"Midnight Gold","shirt"],[10,"Indigo Wave","shirt"],[9,"Ember Bloom","shirt"],[16,"Blue & Blush Trio","cloth"],
  [11,"Marigold Dip","shirt"],[13,"Sky Dip","shirt"],[14,"Orchid Haze","shirt"],[15,"Harvest Camp","shirt"],
].map(([n, name, type]) => {
  const [width, height] = DIM[n] || [817, 1100];
  return { name, type, thumb: `images/p${n}-s.webp`, full: `images/p${n}.webp`, width, height };
});
const $ = (s, r = document) => r.querySelector(s);
const wa = text => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
const label = t => (t === "shirt" ? "Shirt" : "Fabric");

// WhatsApp links
const hello = "Hello Elormdiz! I’d like to make an enquiry.";
$("#fab").href = wa(hello);
$("#waDirect").href = wa(hello);
$("#yr").textContent = new Date().getFullYear();

// Products (Supabase REST, no client library needed on the public site)
const SB = (typeof SUPABASE_URL !== "undefined" && SUPABASE_URL) ? SUPABASE_URL.replace(/\/$/, "") : "";
const assetUrl = p => /^(images\/|https?:)/.test(p) ? p : `${SB}/storage/v1/object/public/products/${p}`;

async function loadProducts() {
  if (!SB) return FALLBACK;
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 5000);
    const r = await fetch(`${SB}/rest/v1/products?select=name,type,thumb_path,full_path,width,height&order=sort.asc,created_at.desc`,
      { headers: { apikey: SUPABASE_ANON_KEY }, signal: ctl.signal });
    clearTimeout(t);
    if (!r.ok) throw new Error(r.status);
    const rows = await r.json();
    return rows.map(x => ({ name: x.name, type: x.type, thumb: assetUrl(x.thumb_path), full: assetUrl(x.full_path), width: x.width || 817, height: x.height || 1100 }));
  } catch (e) { console.warn("Using fallback products:", e); return FALLBACK; }
}

// Build grid
const grid = $("#grid");
function renderGrid(products) {
  grid.innerHTML = "";
  products.forEach((p, i) => {
    const el = document.createElement("article");
    el.className = "item";
    el.tabIndex = 0;
    el.dataset.type = p.type;
    el.style.transitionDelay = `${(i % 4) * 90}ms`;
    el.innerHTML = `<img src="${p.thumb}" alt="" loading="lazy" decoding="async" width="${p.width}" height="${p.height}">
      <span class="tag">${label(p.type)}</span>
      <div class="cap"><h3></h3><span>Tap to order</span></div>`;
    el.firstElementChild.alt = p.name;
    el.querySelector("h3").textContent = p.name;
    el.addEventListener("click", () => openLB(p));
    el.addEventListener("keydown", e => e.key === "Enter" && openLB(p));
    grid.appendChild(el);
  });
}

// Scroll reveal
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
}), { threshold: .12, rootMargin: "0px 0px -40px 0px" });
const observe = () => document.querySelectorAll(".reveal:not(.in),.item:not(.in):not(.hide)").forEach(n => io.observe(n));
observe();
loadProducts().then(ps => { renderGrid(ps); observe(); });

// Filters
const filters = $("#filters"), pill = $(".pill", filters);
function movePill(btn) { pill.style.left = btn.offsetLeft + "px"; pill.style.width = btn.offsetWidth + "px"; }
filters.addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  filters.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b));
  movePill(b);
  const f = b.dataset.f;
  document.querySelectorAll(".item").forEach((it, i) => {
    const show = f === "all" || it.dataset.type === f;
    it.classList.remove("in");
    it.classList.toggle("hide", !show);
    if (show) setTimeout(() => it.classList.add("in"), 40 + i * 35);
  });
});

// Lightbox
const lb = $("#lb");
function openLB(p) {
  $("#lbImg").src = p.full;
  $("#lbImg").alt = p.name;
  $("#lbTitle").textContent = p.name;
  $("#lbType").textContent = label(p.type);
  $("#lbOrder").href = wa(`Hello Elormdiz! I’d like to order the "${p.name}" ${label(p.type).toLowerCase()}.`);
  lb.classList.add("open"); lb.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}
function closeLB() { lb.classList.remove("open"); lb.setAttribute("aria-hidden", "true"); document.body.style.overflow = ""; }
$("#lbClose").onclick = closeLB;
lb.addEventListener("click", e => { if (e.target === lb) closeLB(); });
document.addEventListener("keydown", e => e.key === "Escape" && closeLB());

// Order form -> WhatsApp
$("#orderForm").addEventListener("submit", e => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target));
  const lines = [
    "Hello Elormdiz! I’d like to place an order.",
    "",
    `Name: ${d.name}`,
    `Item: ${d.item}`,
    d.size && `Size / yards: ${d.size}`,
    d.colors && `Colours: ${d.colors}`,
    d.notes && `Notes: ${d.notes}`,
  ].filter(l => l !== false && l !== undefined);
  window.open(wa(lines.join("\n")), "_blank", "noopener");
});

// Nav
const nav = $("#nav"), burger = $("#burger"), links = $("#links");
let sc = false;
addEventListener("scroll", () => { if (sc) return; sc = true; requestAnimationFrame(() => { nav.classList.toggle("scrolled", scrollY > 30); sc = false; }); }, { passive: true });
const setMenu = o => { burger.classList.toggle("open", o); links.classList.toggle("open", o); document.body.classList.toggle("menu", o); document.body.style.overflow = o ? "hidden" : ""; };
burger.onclick = () => setMenu(!links.classList.contains("open"));
links.addEventListener("click", e => { if (e.target.tagName === "A") setMenu(false); });
addEventListener("resize", () => innerWidth > 720 && setMenu(false));

// Mobile: story toggle + step tiles
const moreBtn = $("#moreBtn");
moreBtn.onclick = () => {
  const o = $("#more").classList.toggle("open");
  moreBtn.classList.toggle("open", o);
  moreBtn.firstElementChild.textContent = o ? "Show less" : "Read our story";
};
document.querySelectorAll(".step").forEach(s => s.addEventListener("click", () => {
  if (innerWidth <= 720) s.classList.toggle("open");
}));

// Hero parallax (desktop pointers only, throttled)
if (matchMedia("(hover:hover) and (pointer:fine)").matches) {
  const art = document.querySelectorAll(".hero-art .card");
  let mx = 0, my = 0, tick = false;
  addEventListener("mousemove", e => {
    mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5;
    if (!tick) { tick = true; requestAnimationFrame(() => { art.forEach((c, i) => c.style.translate = `${mx * (i + 1) * -14}px ${my * (i + 1) * -14}px`); tick = false; }); }
  }, { passive: true });
}

// Loader
addEventListener("load", () => {
  setTimeout(() => {
    $("#loader").classList.add("done");
    document.body.classList.add("loaded");
    movePill(filters.querySelector(".on"));
  }, 700);
});
addEventListener("resize", () => movePill(filters.querySelector(".on")));
