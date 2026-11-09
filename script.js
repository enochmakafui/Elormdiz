// ====== CONFIG ======
// Replace with her WhatsApp number: country code + number, digits only (no + or spaces)
const WHATSAPP_NUMBER = "233000000000";

const PRODUCTS = [
  { img: 1,  name: "Emerald Sun",     type: "shirt" },
  { img: 3,  name: "Royal Violet Trio", type: "cloth" },
  { img: 2,  name: "Lilac Storm",     type: "shirt" },
  { img: 5,  name: "Violet Horizon",  type: "shirt" },
  { img: 7,  name: "Golden Hour Trio", type: "cloth" },
  { img: 4,  name: "Jade Cloud",      type: "shirt" },
  { img: 6,  name: "Amethyst Dusk",   type: "shirt" },
  { img: 12, name: "Teal Tide Trio",  type: "cloth" },
  { img: 8,  name: "Midnight Gold",   type: "shirt" },
  { img: 10, name: "Indigo Wave",     type: "shirt" },
  { img: 9,  name: "Ember Bloom",     type: "shirt" },
  { img: 16, name: "Blue & Blush Trio", type: "cloth" },
  { img: 11, name: "Marigold Dip",    type: "shirt" },
  { img: 13, name: "Sky Dip",         type: "shirt" },
  { img: 14, name: "Orchid Haze",     type: "shirt" },
  { img: 15, name: "Harvest Camp",    type: "shirt" },
];

const $ = (s, r = document) => r.querySelector(s);
const wa = text => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
const label = t => (t === "shirt" ? "Shirt" : "Fabric");

// WhatsApp links
const hello = "Hello Elormdiz! I’d like to make an enquiry.";
$("#fab").href = wa(hello);
$("#waDirect").href = wa(hello);
$("#yr").textContent = new Date().getFullYear();

// Build grid
const grid = $("#grid");
PRODUCTS.forEach((p, i) => {
  const el = document.createElement("article");
  el.className = "item";
  el.tabIndex = 0;
  el.dataset.type = p.type;
  el.style.transitionDelay = `${(i % 4) * 90}ms`;
  el.innerHTML = `<img src="images/p${p.img}.jpg" alt="${p.name}" loading="lazy">
    <span class="tag">${label(p.type)}</span>
    <div class="cap"><h3>${p.name}</h3><span>Tap to order</span></div>`;
  el.addEventListener("click", () => openLB(p));
  el.addEventListener("keydown", e => e.key === "Enter" && openLB(p));
  grid.appendChild(el);
});

// Scroll reveal
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
}), { threshold: .12, rootMargin: "0px 0px -40px 0px" });
const observe = () => document.querySelectorAll(".reveal:not(.in),.item:not(.in):not(.hide)").forEach(n => io.observe(n));
observe();

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
  $("#lbImg").src = `images/p${p.img}.jpg`;
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
addEventListener("scroll", () => nav.classList.toggle("scrolled", scrollY > 30), { passive: true });
burger.onclick = () => { burger.classList.toggle("open"); links.classList.toggle("open"); };
links.addEventListener("click", e => { if (e.target.tagName === "A") { burger.classList.remove("open"); links.classList.remove("open"); } });

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

// Hero parallax
const art = document.querySelectorAll(".hero-art .card");
addEventListener("mousemove", e => {
  const x = (e.clientX / innerWidth - .5), y = (e.clientY / innerHeight - .5);
  art.forEach((c, i) => c.style.translate = `${x * (i + 1) * -14}px ${y * (i + 1) * -14}px`);
}, { passive: true });

// Loader
addEventListener("load", () => {
  setTimeout(() => {
    $("#loader").classList.add("done");
    document.body.classList.add("loaded");
    movePill(filters.querySelector(".on"));
  }, 700);
});
addEventListener("resize", () => movePill(filters.querySelector(".on")));
