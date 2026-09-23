/* ==========================================================================
   Enciclopedia de Hechizos — app.js
   Fase 3: Integración con la Harry Potter API (hp-api.onrender.com).
   Los 76 hechizos, su nombre y descripción vienen de la API real. La API
   solo entrega { id, name, description } — no incluye categoría ni tipo de
   uso, así que ambos se calculan en el cliente con un diccionario de
   hechizos conocidos y, como respaldo, un análisis de palabras clave.
   ========================================================================== */

const API_URL = "https://hp-api.onrender.com/api/spells";

let HECHIZOS = [];

// Categoría y tipo confirmados a mano para los hechizos ya documentados
// en la fase anterior, para que su clasificación no cambie.
const KNOWN_CATEGORIES = {
  "expelliarmus": "Encantamiento", "avada kedavra": "Maldición",
  "wingardium leviosa": "Encantamiento", "riddikulus": "Transformación",
  "lumos": "Encantamiento", "crucio": "Maldición",
  "alohomora": "Encantamiento", "petrificus totalus": "Encantamiento",
  "sectumsempra": "Maldición", "accio": "Encantamiento",
  "engorgio": "Transformación", "imperio": "Maldición",
  "nox": "Encantamiento", "expecto patronum": "Encantamiento",
  "protego": "Encantamiento", "vera verto": "Transformación",
  "reparo": "Transformación", "polyjuice potion": "Pociones",
  "felix felicis": "Pociones", "veritaserum": "Pociones", "amortentia": "Pociones"
};
const KNOWN_TIPOS = {
  "expelliarmus": "Defensivo", "avada kedavra": "Ofensivo",
  "wingardium leviosa": "Utilidad", "riddikulus": "Defensivo",
  "lumos": "Utilidad", "crucio": "Ofensivo",
  "alohomora": "Utilidad", "petrificus totalus": "Ofensivo",
  "sectumsempra": "Ofensivo", "accio": "Utilidad",
  "engorgio": "Utilidad", "imperio": "Ofensivo"
};

function classifyCategoria(spell) {
  const key = spell.name.trim().toLowerCase();
  if (KNOWN_CATEGORIES[key]) return KNOWN_CATEGORIES[key];
  const text = `${spell.name} ${spell.description}`.toLowerCase();
  if (/(curse|dark|kill|torture|pain|attack|hex|jinx)/.test(text)) return "Maldición";
  if (/(transfigur|transform|change into|turn into|shape)/.test(text)) return "Transformación";
  if (/(potion|draught|elixir|brew)/.test(text)) return "Pociones";
  return "Encantamiento";
}
function classifyTipo(spell) {
  const key = spell.name.trim().toLowerCase();
  if (KNOWN_TIPOS[key]) return KNOWN_TIPOS[key];
  const text = `${spell.name} ${spell.description}`.toLowerCase();
  if (/(attack|curse|hex|pain|kill|hurt|injure|torture|damage|harm)/.test(text)) return "Ofensivo";
  if (/(protect|shield|block|counter|repel|guard|defend|deflect)/.test(text)) return "Defensivo";
  return "Utilidad";
}

const CATEGORY_BADGE_CLASS = {
  "Encantamiento": "badge-encantamiento", "Maldición": "badge-maldicion",
  "Transformación": "badge-transformacion", "Pociones": "badge-pociones"
};
const CATEGORY_ICONS = {
  "Encantamiento": { icon: "bi-stars", color: "var(--encantamiento)" },
  "Maldición": { icon: "bi-lightning-charge-fill", color: "var(--maldicion)" },
  "Transformación": { icon: "bi-arrow-repeat", color: "var(--transformacion)" },
  "Pociones": { icon: "bi-droplet-half", color: "var(--pociones)" }
};
// Plural correcto en español de cada categoría (no se puede generar
// agregando una "s": "Maldición" + "s" da "Maldicións", que está mal).
const CATEGORY_PLURAL = {
  "Encantamiento": "Encantamientos",
  "Maldición": "Maldiciones",
  "Transformación": "Transformaciones",
  "Pociones": "Pociones"
};

// ---------------------------------------------------------------------------
// Consumo de la API: fetch + manejo de carga y error
// ---------------------------------------------------------------------------
async function loadSpells() {
  const loadingState = document.getElementById("loadingState");
  const errorState = document.getElementById("errorState");
  const appContent = document.getElementById("appContent");

  loadingState.classList.remove("d-none");
  errorState.classList.add("d-none");
  appContent.classList.add("d-none");

  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    HECHIZOS = data.map(s => ({
      name: s.name,
      description: s.description && s.description.trim().length > 0
        ? s.description
        : "Sin descripción disponible en la API.",
      categoria: classifyCategoria(s),
      tipo: classifyTipo(s)
    }));

    // Un hechizo que no viene de ninguna API — solo aparece si buscas "yaz".
    HECHIZOS.push({
      name: "Lumos Yazerium",
      description: "Un hechizo de luz que ella enciende sin varita: basta con verla sonreír para que cualquier día gris se convierta en el mejor día.",
      categoria: "Encantamiento",
      tipo: "Utilidad",
      secret: true
    });

    document.getElementById("statHechizos").textContent = HECHIZOS.length - 1;
    document.getElementById("statCategorias").textContent = new Set(HECHIZOS.filter(h => !h.secret).map(h => h.categoria)).size;

    renderFeatured();
    renderSearch();
    renderIndexAccordion();

    appContent.classList.remove("d-none");
  } catch (err) {
    console.error("Error al consumir la API de Harry Potter:", err);
    errorState.classList.remove("d-none");
  } finally {
    loadingState.classList.add("d-none");
  }
}
document.getElementById("retryBtn").addEventListener("click", loadSpells);

const views = document.querySelectorAll(".view");
const navLinks = document.querySelectorAll("#navLinks .nav-link");

function goToView(viewName) {
  views.forEach(v => v.classList.toggle("d-none", v.id !== `view-${viewName}`));
  navLinks.forEach(l => l.classList.toggle("active", l.dataset.view === viewName));

  window.scrollTo({ top: 0, behavior: "smooth" });
  const menu = document.getElementById("navMenu");
  if (menu.classList.contains("show")) bootstrap.Collapse.getOrCreateInstance(menu).hide();
}
document.querySelectorAll("[data-view]").forEach(el => el.addEventListener("click", e => { e.preventDefault(); goToView(el.dataset.view); }));
document.querySelectorAll("[data-goto]").forEach(el => el.addEventListener("click", e => { e.preventDefault(); goToView(el.dataset.goto); }));

const template = document.getElementById("spellCardTemplate");
function buildCard(spell) {
  const node = template.content.cloneNode(true);
  const badge = node.querySelector(".spell-category-badge");
  badge.textContent = spell.categoria;
  badge.classList.add(CATEGORY_BADGE_CLASS[spell.categoria]);
  node.querySelector(".card-img-top i").className = `bi ${CATEGORY_ICONS[spell.categoria].icon}`;
  node.querySelector(".spell-name").textContent = spell.name;
  node.querySelector(".spell-excerpt").textContent = spell.description;
  if (spell.secret) {
    node.querySelector(".spell-card").classList.add("secret-spell");
    node.querySelector(".card-img-top i").className = "bi bi-heart-fill";
    badge.classList.remove(CATEGORY_BADGE_CLASS[spell.categoria]);
    badge.classList.add("badge-secret");
    badge.textContent = "Hechizo secreto";
  }
  return node;
}

function renderFeatured() {
  const grid = document.getElementById("featuredGrid");
  grid.innerHTML = "";
  HECHIZOS.slice(0, 4).forEach(spell => grid.appendChild(buildCard(spell)));
}

let activeCategory = "Todos", activeTipo = "Todos", searchTerm = "", viewMode = "cards";

function getFilteredSpells() {
  return HECHIZOS.filter(s => {
    if (s.secret) return searchTerm.trim().toLowerCase() === "yaz";
    const matchesCategory = activeCategory === "Todos" || s.categoria === activeCategory;
    const matchesTipo = activeTipo === "Todos" || s.tipo === activeTipo;
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesTipo && matchesSearch;
  });
}

function renderSearch() {
  const filtered = getFilteredSpells();
  const grid = document.getElementById("searchGrid");
  const tableBody = document.getElementById("searchTableBody");
  const resultCount = document.getElementById("resultCount");
  const emptyState = document.getElementById("emptyState");

  grid.innerHTML = "";
  tableBody.innerHTML = "";

  filtered.forEach(spell => {
    grid.appendChild(buildCard(spell));
    const tr = document.createElement("tr");
    const badgeClass = spell.secret ? "badge-secret" : CATEGORY_BADGE_CLASS[spell.categoria];
    const badgeLabel = spell.secret ? "Hechizo secreto" : spell.categoria;
    tr.innerHTML = `<td class="fw-bold">${spell.name}</td><td><span class="badge ${badgeClass}">${badgeLabel}</span></td><td>${spell.tipo}</td><td>${spell.description}</td>`;
    tableBody.appendChild(tr);
  });

  resultCount.textContent = `${filtered.length} resultado${filtered.length !== 1 ? "s" : ""} encontrado${filtered.length !== 1 ? "s" : ""}`;
  emptyState.classList.toggle("d-none", filtered.length !== 0);
  document.getElementById("searchGrid").classList.toggle("d-none", viewMode !== "cards" || filtered.length === 0);
  document.getElementById("searchTableWrapper").classList.toggle("d-none", viewMode !== "table" || filtered.length === 0);
}

document.getElementById("searchInput").addEventListener("input", e => { searchTerm = e.target.value; renderSearch(); });
document.querySelectorAll("#filterChips .chip").forEach(chip => chip.addEventListener("click", () => {
  activeCategory = chip.dataset.filter;
  document.querySelectorAll("#filterChips .chip").forEach(c => c.classList.remove("active"));
  chip.classList.add("active");
  renderSearch();
}));
document.querySelectorAll("#tipoTabs .nav-link").forEach(tab => tab.addEventListener("click", () => {
  activeTipo = tab.dataset.tipo;
  document.querySelectorAll("#tipoTabs .nav-link").forEach(t => t.classList.remove("active"));
  tab.classList.add("active");
  renderSearch();
}));
document.getElementById("modeCards").addEventListener("change", () => { viewMode = "cards"; renderSearch(); });
document.getElementById("modeTable").addEventListener("change", () => { viewMode = "table"; renderSearch(); });

function renderIndexAccordion() {
  const accordion = document.getElementById("indexAccordion");
  accordion.innerHTML = "";
  const categories = [...new Set(HECHIZOS.filter(s => !s.secret).map(s => s.categoria))];
  categories.forEach((cat, i) => {
    const spells = HECHIZOS.filter(s => s.categoria === cat && !s.secret);
    const meta = CATEGORY_ICONS[cat];
    const collapseId = `collapse-${i}`;
    const item = document.createElement("div");
    item.className = "accordion-item";
    item.innerHTML = `
      <h2 class="accordion-header">
        <button class="accordion-button ${i === 0 ? "" : "collapsed"}" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}">
          <i class="bi ${meta.icon} me-2" style="color:${meta.color};"></i> ${CATEGORY_PLURAL[cat]}
          <span class="badge ms-2" style="background:${meta.color};">${spells.length}</span>
        </button>
      </h2>
      <div id="${collapseId}" class="accordion-collapse collapse ${i === 0 ? "show" : ""}" data-bs-parent="#indexAccordion">
        <div class="accordion-body">
          <ul class="list-group list-group-flush">
            ${spells.map(s => `<li class="list-group-item"><span>${s.name}</span><span class="badge bg-secondary">${s.tipo}</span></li>`).join("")}
          </ul>
        </div>
      </div>`;
    accordion.appendChild(item);
  });
}

const spellForm = document.getElementById("spellForm");
const formAlertZone = document.getElementById("formAlertZone");
function showFormAlert(type, message) {
  formAlertZone.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show" role="alert">${message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button></div>`;
}
spellForm.addEventListener("submit", e => {
  e.preventDefault();
  e.stopPropagation();
  const categoriaSeleccionada = spellForm.querySelector('input[name="categoriaForm"]:checked');
  const tipoSeleccionado = spellForm.querySelector('input[name="tipoForm"]:checked');
  document.getElementById("categoriaError").classList.toggle("show", !categoriaSeleccionada);
  document.getElementById("tipoError").classList.toggle("show", !tipoSeleccionado);
  const isValid = spellForm.checkValidity() && categoriaSeleccionada && tipoSeleccionado;
  spellForm.classList.add("was-validated");
  if (!isValid) { showFormAlert("info", "Revisa los campos marcados antes de enviar tu sugerencia."); return; }
  const nombre = document.getElementById("spellName").value.trim();
  const fuente = document.getElementById("spellSource").value.trim();
  const detalleFuente = fuente ? ` (visto en ${fuente})` : "";
  showFormAlert("success", `<i class="bi bi-check-circle me-2"></i>¡Gracias! "${nombre}"${detalleFuente} se registró como sugerencia.`);
  spellForm.reset();
  spellForm.classList.remove("was-validated");
  document.getElementById("categoriaError").classList.remove("show");
  document.getElementById("tipoError").classList.remove("show");
});

document.addEventListener("DOMContentLoaded", loadSpells);

/* ==========================================================================
   Easter egg — dedicado a Yaz.
   Escribe "yaz" en cualquier momento (no necesitas hacer click en nada)
   para revelar un hechizo secreto.
   ========================================================================== */
(function () {
  let buffer = "";
  document.addEventListener("keydown", (e) => {
    if (e.key.length !== 1) return;
    buffer = (buffer + e.key).slice(-3).toLowerCase();
    if (buffer === "yaz") {
      showLoveOverlay(
        "Expecto Yazronum",
        "Cuando pienso en los momentos más felices de mi vida, todos tienen algo en común: tú. Ese es mi patronus, y siempre lo será.",
        "— Ethan, para Yaz ✨"
      );
      buffer = "";
    }
  });

  function spawnHearts() {
    const container = document.getElementById("loveHearts");
    const symbols = ["💛", "✨", "💫"];
    container.innerHTML = "";
    for (let i = 0; i < 24; i++) {
      const span = document.createElement("span");
      span.className = "floating-heart";
      span.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      span.style.left = `${Math.random() * 100}%`;
      span.style.animationDuration = `${4 + Math.random() * 4}s`;
      span.style.animationDelay = `${Math.random() * 2}s`;
      span.style.fontSize = `${1 + Math.random() * 1.2}rem`;
      container.appendChild(span);
    }
  }

  function showLoveOverlay(spellName, message, signature) {
    const overlay = document.getElementById("loveOverlay");
    overlay.querySelector(".love-spell-name").textContent = spellName;
    overlay.querySelector(".love-message").textContent = message;
    overlay.querySelector(".love-signature").textContent = signature;
    spawnHearts();
    overlay.classList.remove("d-none");
  }
  function hideLoveOverlay() {
    document.getElementById("loveOverlay").classList.add("d-none");
  }

  document.getElementById("closeLoveOverlay").addEventListener("click", hideLoveOverlay);
  document.getElementById("loveOverlay").addEventListener("click", (e) => {
    if (e.target.id === "loveOverlay") hideLoveOverlay();
  });

  const heartTrigger = document.getElementById("heartTrigger");
  if (heartTrigger) {
    heartTrigger.addEventListener("click", () => showLoveOverlay(
      "Amoris Yazendio",
      "De todos los hechizos que existen, ninguno es tan fuerte como lo que siento por ti. Gracias por ser mi persona favorita en este mundo (y en cualquier universo mágico).",
      "— Ethan, para Yaz 💛"
    ));
  }

  console.log(
    "%c✨ Si encontraste esto, tienes buen ojo.\nEste grimorio tiene hechizos secretos escondidos para alguien especial: Yaz.\nEscribe \"yaz\" en cualquier parte de la página para encontrar uno. 💛",
    "color:#c9a24a; font-size:13px; line-height:1.5;"
  );
})();

