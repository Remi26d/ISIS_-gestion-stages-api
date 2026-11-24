// Visite locale : aucune écriture dans l’API et aucune donnée de stage modifiée.
const STORAGE_KEY = "isis-stages-tour-v1";
const steps = [
  { view: "dashboard", target: "#metrics", title: "Votre tableau de bord", text: "Retrouvez ici le nombre de stages en cours, à venir et terminés. Les statuts suivent les dates renseignées." },
  { view: "dashboard", target: '.heading-actions [data-action="create"]', title: "Ajouter un stage", text: "Ce bouton ouvre les cinq champs à renseigner. Après l’enregistrement, le stage apparaît dans la liste et le calendrier. Utilisez des données fictives." },
  { view: "stages", target: ".table-toolbar", title: "Retrouver un parcours", text: "Cherchez un étudiant, une entreprise ou une mission. Les filtres se combinent. Cliquez ensuite sur le nom de l’étudiant pour consulter, modifier ou supprimer son stage." },
  { view: "calendar", target: ".calendar-toolbar", title: "Repérer les dates", text: "Le calendrier distingue les débuts et les fins de stage. Cliquez sur un événement pour ouvrir sa fiche. La vue Entreprises regroupe les stages par structure d’accueil." },
  { view: "stages", target: "#exportButton", title: "Exporter la sélection", text: "Lorsqu’il y a des stages, Exporter télécharge un CSV. Depuis la liste, il reprend tous les résultats filtrés, y compris ceux des autres pages." },
  { view: "dashboard", target: "#startTour", title: "Retrouver l’aide", text: "Le bouton ? relance cette visite à tout moment. Le lien Comprendre le projet, dans la navigation, explique le fonctionnement du site et de l’API." },
];

export function setupTour({ navigate, getView }) {
  const dialog = document.querySelector("#tourDialog");
  const card = document.querySelector("#tourCard");
  const spotlight = document.querySelector("#tourSpotlight");
  const pointer = document.querySelector("#tourPointer");
  const launcher = document.querySelector("#startTour");
  const previous = document.querySelector("#tourPrevious");
  const next = document.querySelector("#tourNext");
  let index = 0;
  let origin;
  let frame;
  let started = false;
  let needsFocus = false;
  let active = false;

  function hasSeenTour() {
    try { return localStorage.getItem(STORAGE_KEY) === "1"; }
    catch { return false; }
  }

  function rememberTour() {
    try { localStorage.setItem(STORAGE_KEY, "1"); }
    catch { /* La visite reste utilisable quand le stockage local est bloqué. */ }
  }

  const clamp = (value, low, high) => Math.max(low, Math.min(value, Math.max(low, high)));

  function position() {
    if (!dialog.open) return;
    const target = document.querySelector(steps[index].target);
    const rect = target?.getBoundingClientRect();
    const width = window.innerWidth;
    const height = window.innerHeight;
    const margin = 12;
    const gap = 19;
    const cardWidth = card.offsetWidth;
    const cardHeight = card.offsetHeight;
    const visible = rect && rect.width > 0 && rect.height > 0;
    let placement = "center";
    let left = (width - cardWidth) / 2;
    let top = (height - cardHeight) / 2;

    if (visible) {
      const x = clamp(rect.left - 7, 4, width - 8);
      const y = clamp(rect.top - 7, 4, height - 8);
      spotlight.style.cssText = `left:${x}px;top:${y}px;width:${Math.max(0, Math.min(rect.right + 7, width - 4) - x)}px;height:${Math.max(0, Math.min(rect.bottom + 7, height - 4) - y)}px`;
      left = clamp(rect.left + rect.width / 2 - cardWidth / 2, margin, width - cardWidth - margin);
      if (rect.bottom + gap + cardHeight <= height - margin) {
        top = rect.bottom + gap;
        placement = "below";
      } else if (rect.top - gap - cardHeight >= margin) {
        top = rect.top - gap - cardHeight;
        placement = "above";
      }
      card.style.setProperty("--tour-pointer", `${clamp(rect.left + rect.width / 2 - left, 24, cardWidth - 24)}px`);
    } else {
      spotlight.style.cssText = "left:0;top:0;width:0;height:0";
    }
    card.style.left = `${clamp(left, margin, width - cardWidth - margin)}px`;
    card.style.top = `${clamp(top, margin, height - cardHeight - margin)}px`;
    card.dataset.placement = placement;
    pointer.hidden = placement === "center";
    pointer.dataset.placement = placement;
    pointer.style.left = `${left + clamp((rect?.left ?? 0) + (rect?.width ?? 0) / 2 - left, 24, cardWidth - 24) - 6}px`;
    pointer.style.top = `${placement === "below" ? top - 6 : top + cardHeight - 6}px`;
    card.style.visibility = "visible";
    if (needsFocus) {
      next.focus({ preventScroll: true });
      needsFocus = false;
    }
  }

  function schedulePosition() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(position);
  }

  function showStep(value) {
    index = value;
    needsFocus = true;
    const step = steps[index];
    card.style.visibility = "hidden";
    navigate(step.view);
    document.querySelector("#tourTitle").textContent = step.title;
    document.querySelector("#tourDescription").textContent = step.text;
    document.querySelector("#tourProgress").textContent = `Étape ${index + 1} sur ${steps.length}`;
    document.querySelector("#tourAnnouncement").textContent = `Étape ${index + 1} sur ${steps.length}. ${step.title}. ${step.text}`;
    previous.disabled = index === 0;
    next.textContent = index === steps.length - 1 ? "Terminer" : "Suivant";
    card.scrollTop = 0;
    document.querySelector(step.target)?.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
    schedulePosition();
  }

  function start() {
    if (active || dialog.open || document.querySelector("dialog[open]")) return;
    active = true;
    started = true;
    origin = { view: getView(), scroll: window.scrollY, focus: document.activeElement };
    document.body.classList.add("tour-open");
    dialog.showModal();
    showStep(0);
  }

  function finish() {
    if (!dialog.open) return;
    rememberTour();
    dialog.close();
    restore();
  }

  function restore() {
    if (!active) return;
    active = false;
    cancelAnimationFrame(frame);
    needsFocus = false;
    document.body.classList.remove("tour-open");
    if (!origin) return;
    navigate(origin.view);
    window.scrollTo({ top: origin.scroll, behavior: "instant" });
    const focus = origin.focus?.isConnected && origin.focus !== document.body ? origin.focus : document.querySelector("#main");
    focus.focus({ preventScroll: true });
  }
  dialog.addEventListener("close", () => { if (!dialog.open) restore(); });
  dialog.addEventListener("cancel", (event) => { event.preventDefault(); finish(); });
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight" && index < steps.length - 1) { event.preventDefault(); showStep(index + 1); }
    if (event.key === "ArrowLeft" && index > 0) { event.preventDefault(); showStep(index - 1); }
  });
  previous.addEventListener("click", () => { if (index > 0) showStep(index - 1); });
  next.addEventListener("click", () => { if (index === steps.length - 1) finish(); else showStep(index + 1); });
  document.querySelector("#tourSkip").addEventListener("click", finish);
  document.querySelector("#tourClose").addEventListener("click", finish);
  launcher.addEventListener("click", start);
  window.addEventListener("resize", schedulePosition);
  window.visualViewport?.addEventListener("resize", schedulePosition);
  window.addEventListener("scroll", schedulePosition, true);

  return {
    offerFirstVisit() {
      if (!started && !hasSeenTour()) start();
    },
  };
}
