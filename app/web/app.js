import { STATUS, localISO, addDays, stageStatus, stageDuration, stageProgress, dayNumber, normalize, escapeHTML as esc, filterStages, stagesCSV } from "./model.mjs";

const $ = (selector) => document.querySelector(selector);
const icon = (name, extra = "") => `<svg class="icon ${extra}" aria-hidden="true"><use href="/assets/icons.svg#${name}"/></svg>`;
const shortDate = (iso) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${iso}T12:00:00`));
const fullDate = (iso) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${iso}T12:00:00`));
const monthName = (value) => new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(value);
const initials = (name) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
const badge = (stage) => `<span class="badge ${stageStatus(stage)}">${STATUS[stageStatus(stage)].label}</span>`;
const state = { stages: [], ready: false, loading: false, error: "", view: "dashboard", query: "", status: "all", company: "all", sort: "recent", page: 1, calendar: new Date(new Date().getFullYear(), new Date().getMonth(), 1), editing: null, deleting: null, details: null, busy: false };
const pageSize = 8;
let requestSequence = 0;
let toastTimer;
const fields = ["nom_etudiant", "entreprise_accueil", "intitule_stage", "date_debut", "date_fin"];

async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(path, { ...options, cache: "no-store", headers: { Accept: "application/json", ...(options.body ? { "Content-Type": "application/json" } : {}) }, signal: AbortSignal.timeout(30000) });
  } catch (error) {
    throw new Error(error.name === "TimeoutError" ? "Le serveur met du temps à répondre. Réessayez dans quelques instants." : "Le serveur est injoignable. Vérifiez votre connexion puis réessayez.");
  }
  let body = null;
  if (response.status !== 204) {
    try { body = await response.json(); } catch { /* Une erreur réseau peut renvoyer du HTML. */ }
  }
  if (!response.ok) {
    const error = new Error(response.status === 404 ? "Ce stage n’existe plus. La liste va être actualisée." : response.status === 422 ? "Certaines informations doivent être corrigées." : "L’opération n’a pas abouti. Réessayez dans quelques instants.");
    error.status = response.status;
    error.detail = body?.detail;
    throw error;
  }
  return body;
}

function notify(message, error = false) {
  clearTimeout(toastTimer);
  $("#toastRegion").innerHTML = `<div class="toast${error ? " error" : ""}">${icon(error ? "info" : "check")}<span>${esc(message)}</span></div>`;
  toastTimer = setTimeout(() => { $("#toastRegion").textContent = ""; }, error ? 8500 : 5000);
}

function emptyState(title, text, action = "create", compact = false) {
  const actions = action === "create" ? `<button class="button button-primary" data-action="create">${icon("plus")}Créer un stage</button><button class="text-button" data-action="demo">Essayer avec une démo</button>` : action === "reset" ? `<button class="button button-white" data-action="reset">Réinitialiser les filtres</button>` : "";
  return `<div class="empty-state"><div class="empty-illustration">${icon(compact ? "calendar" : "briefcase")}</div><h3>${esc(title)}</h3><p>${esc(text)}</p>${actions ? `<div class="empty-actions">${actions}</div>` : ""}</div>`;
}

function waitingState() {
  return state.error ? emptyState("Les données ne sont pas disponibles", "Utilisez le bouton Réessayer pour rétablir la connexion.", "none") : `<div class="loading-placeholder"><span class="loading-spinner"></span>Nous préparons votre espace…</div>`;
}

async function loadStages() {
  if (state.busy) return;
  const sequence = ++requestSequence;
  state.loading = true;
  $("#refreshButton").classList.add("is-loading");
  $("#refreshButton").disabled = true;
  $("#connection").className = "connection checking";
  $("#connectionText").textContent = "Synchronisation…";
  try {
    const stages = await api("/stages");
    if (sequence !== requestSequence) return;
    if (!Array.isArray(stages)) throw new Error("Le serveur a renvoyé une réponse inattendue.");
    state.stages = stages;
    state.ready = true;
    state.error = "";
    $("#lastUpdated").textContent = `Mis à jour à ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
    $("#connection").className = "connection";
    $("#connectionText").textContent = "Données synchronisées";
  } catch (error) {
    if (sequence !== requestSequence) return;
    state.error = error.message;
    $("#connection").className = "connection offline";
    $("#connectionText").textContent = "Hors connexion";
    $("#lastUpdated").textContent = state.ready ? "Dernières données reçues" : "Connexion indisponible";
  } finally {
    if (sequence === requestSequence) {
      state.loading = false;
      $("#refreshButton").disabled = false;
      $("#refreshButton").classList.remove("is-loading");
      render();
    }
  }
}

function render() {
  $("#errorBanner").hidden = !state.error;
  $("#errorMessage").textContent = state.error + (state.ready ? " Les dernières données reçues restent affichées." : "");
  $("#navCount").textContent = state.ready ? state.stages.length : "—";
  $("#exportButton").disabled = !state.ready || !state.stages.length;
  const companies = [...new Set(state.stages.map((stage) => stage.entreprise_accueil))].sort((a, b) => a.localeCompare(b, "fr"));
  if (state.company !== "all" && !companies.includes(state.company)) state.company = "all";
  $("#companyFilter").innerHTML = `<option value="all">Toutes les entreprises</option>` + companies.map((name) => `<option value="${esc(name)}">${esc(name)}</option>`).join("");
  $("#companyFilter").value = state.company;
  $("#companySuggestions").innerHTML = companies.map((name) => `<option value="${esc(name)}"></option>`).join("");
  renderDashboard();
  renderStages();
  renderCalendar();
  renderCompanies();
}

function renderDashboard() {
  const counts = { all: state.stages.length, active: 0, upcoming: 0, completed: 0 };
  state.stages.forEach((stage) => counts[stageStatus(stage)]++);
  const metrics = [
    ["all", "Stages suivis", "briefcase", "L’ensemble des parcours"],
    ["active", "En cours", "cap", "Des expériences en mouvement"],
    ["upcoming", "À venir", "clock", "Les prochains départs"],
    ["completed", "Terminés", "check", "Des expériences accomplies"],
  ];
  $("#metrics").innerHTML = metrics.map(([key, title, name, note]) => `<button class="metric-card" data-action="status" data-status="${key}" aria-label="Voir les stages : ${title}"><div class="metric-top"><span>${title}</span><span class="metric-icon ${key}">${icon(name)}</span></div><div class="metric-number">${state.ready ? counts[key] : "—"}</div><div class="metric-note">${note}</div></button>`).join("");
  $("#ringTotal").textContent = state.ready ? counts.all : "—";
  const active = counts.all ? counts.active / counts.all * 100 : 0;
  const upcoming = counts.all ? (counts.active + counts.upcoming) / counts.all * 100 : 0;
  $("#statusRing").style.background = counts.all ? `conic-gradient(#aad3b6 0 ${active}%,#a2b2d4 ${active}% ${upcoming}%,#cebfa3 ${upcoming}% 100%)` : "#3d5b4b";
  $("#statusLegend").innerHTML = ["active", "upcoming", "completed"].map((key) => `<div class="legend-row"><span class="legend-marker ${key}"></span><span>${key === "completed" ? "Terminés" : STATUS[key].label}</span><strong>${state.ready ? counts[key] : "—"}</strong></div>`).join("");
  if (!state.ready) { $("#overviewTable").innerHTML = waitingState(); $("#upcomingList").innerHTML = waitingState(); return; }
  const order = { active: 0, upcoming: 1, completed: 2 };
  const stages = [...state.stages].sort((a, b) => order[stageStatus(a)] - order[stageStatus(b)] || a.date_debut.localeCompare(b.date_debut)).slice(0, 5);
  $("#overviewTable").innerHTML = stages.length ? stageTable(stages, true) : emptyState("Le premier parcours commence ici", "Ajoutez un stage ou explorez l’espace avec quelques exemples fictifs.");
  const today = localISO();
  const events = state.stages.flatMap((stage) => [{ date: stage.date_debut, kind: "Début", stage }, { date: stage.date_fin, kind: "Fin", stage }]).filter((event) => event.date >= today).sort((a, b) => a.date.localeCompare(b.date) || a.stage.id - b.stage.id).slice(0, 4);
  $("#upcomingList").innerHTML = events.length ? `<div class="upcoming-list">${events.map(({ date, kind, stage }) => `<div class="upcoming-item"><div class="date-tile"><strong>${new Date(`${date}T12:00:00`).getDate()}</strong><span>${new Date(`${date}T12:00:00`).toLocaleDateString("fr-FR", { month: "short" })} ${date.slice(0, 4)}</span></div><div class="upcoming-copy"><strong>${esc(stage.nom_etudiant)}</strong><p>${kind} de stage · ${esc(stage.entreprise_accueil)}</p></div><button class="icon-button" data-action="details" data-id="${stage.id}" aria-label="Consulter le stage de ${esc(stage.nom_etudiant)}">${icon("chevron")}</button></div>`).join("")}</div>` : emptyState("Le calendrier est dégagé", "Les prochains débuts et fins de stage apparaîtront ici.", "none", true);
}

function stageTable(stages, compact = false) {
  return `<div class="table-scroll"><table><caption class="sr-only">${compact ? "Aperçu des parcours" : "Stages correspondant aux filtres"}</caption><thead><tr><th${compact ? "" : ' style="width:24%"'}>Étudiant</th><th${compact ? "" : ' style="width:26%"'}>${compact ? "Entreprise" : "Mission & entreprise"}</th>${compact ? "" : '<th style="width:21%">Période</th>'}<th${compact ? "" : ' style="width:14%"'}>Statut</th>${compact ? "" : '<th style="width:15%" class="sr-only-heading"><span class="sr-only">Actions</span></th>'}</tr></thead><tbody>${stages.map((stage) => `<tr><td><div class="student-cell"><span class="avatar tone-${stage.id % 4}">${esc(initials(stage.nom_etudiant))}</span><div><button class="student-link" data-action="details" data-id="${stage.id}">${esc(stage.nom_etudiant)}</button><span class="cell-secondary">Stage #${String(stage.id).padStart(3, "0")}</span></div></div></td><td><span class="cell-text cell-title" title="${esc(compact ? stage.intitule_stage : stage.entreprise_accueil)}">${esc(compact ? stage.entreprise_accueil : stage.intitule_stage)}</span>${compact ? "" : `<span class="cell-secondary">${esc(stage.entreprise_accueil)}</span>`}</td>${compact ? "" : `<td class="date-cell">${shortDate(stage.date_debut)}<span class="cell-secondary">au ${shortDate(stage.date_fin)}</span></td>`}<td>${badge(stage)}</td>${compact ? "" : `<td><div class="row-actions"><button class="icon-button" data-action="edit" data-id="${stage.id}" aria-label="Modifier le stage de ${esc(stage.nom_etudiant)}" title="Modifier">${icon("edit")}</button><button class="icon-button delete-action" data-action="delete" data-id="${stage.id}" aria-label="Supprimer le stage de ${esc(stage.nom_etudiant)}" title="Supprimer">${icon("trash")}</button></div></td>`}</tr>`).join("")}</tbody></table></div>`;
}

function renderStages() {
  $("#statusFilter").value = state.status;
  $("#sortSelect").value = state.sort;
  const filtered = filterStages(state.stages, state);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  state.page = Math.min(state.page, pages);
  const start = (state.page - 1) * pageSize;
  const hasFilters = state.query.trim() || state.status !== "all" || state.company !== "all";
  $("#clearFilters").hidden = !hasFilters;
  $("#resultsCount").textContent = state.ready ? `${filtered.length} stage${filtered.length > 1 ? "s" : ""}${hasFilters ? ` sur ${state.stages.length}` : " au total"}` : "En attente de connexion";
  $("#stagesTable").innerHTML = !state.ready ? waitingState() : filtered.length ? stageTable(filtered.slice(start, start + pageSize)) : hasFilters ? emptyState("Aucun stage ne correspond", "Essayez un autre nom, une autre entreprise ou un autre filtre.", "reset") : emptyState("Tout commence par un premier stage", "Les parcours que vous ajoutez seront visibles ici et dans le calendrier.");
  $("#pagination").hidden = !filtered.length;
  $("#pagination").innerHTML = `<span>${start + 1}–${Math.min(start + pageSize, filtered.length)} sur ${filtered.length} stage${filtered.length > 1 ? "s" : ""}</span><div class="pagination-controls"><button class="icon-button previous" data-action="previous-page" aria-label="Page précédente"${state.page === 1 ? " disabled" : ""}>${icon("chevron")}</button><span class="page-number">${state.page} / ${pages}</span><button class="icon-button" data-action="next-page" aria-label="Page suivante"${state.page === pages ? " disabled" : ""}>${icon("chevron")}</button></div>`;
}

function renderCalendar() {
  $("#calendarTitle").textContent = monthName(state.calendar);
  const first = new Date(state.calendar.getFullYear(), state.calendar.getMonth(), 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = addDays(localISO(first), -mondayOffset);
  const today = localISO();
  let eventCount = 0;
  $("#calendarGrid").innerHTML = Array.from({ length: 42 }, (_, index) => {
    const date = addDays(start, index);
    const inMonth = date.slice(0, 7) === localISO(first).slice(0, 7);
    const events = state.stages.flatMap((stage) => [stage.date_debut === date ? { stage, end: false } : null, stage.date_fin === date ? { stage, end: true } : null]).filter(Boolean);
    if (inMonth) eventCount += events.length;
    return `<div class="calendar-day${inMonth ? "" : " other-month"}${date === today ? " is-today" : ""}"><time class="day-number" datetime="${date}" aria-label="${fullDate(date)}${date === today ? ", aujourd’hui" : ""}">${new Date(`${date}T12:00:00`).getDate()}</time>${events.slice(0, 3).map(({ stage, end }) => `<button class="calendar-event${end ? " end" : ""}" data-action="details" data-id="${stage.id}" title="${end ? "Fin" : "Début"} · ${esc(stage.nom_etudiant)} · ${esc(stage.entreprise_accueil)}" aria-label="${end ? "Fin" : "Début"} du stage de ${esc(stage.nom_etudiant)}, le ${fullDate(date)}">${end ? "Fin" : "Début"} · ${esc(stage.nom_etudiant)}</button>`).join("")}${events.length > 3 ? `<button class="more-events" data-action="calendar-day" data-date="${date}">+ ${events.length - 3} autres</button>` : ""}</div>`;
  }).join("");
  $("#calendarSummary").textContent = !state.ready ? "Le calendrier sera disponible après la synchronisation des données." : eventCount ? `${eventCount} événement${eventCount > 1 ? "s" : ""} ce mois-ci. Sélectionnez un nom pour ouvrir la fiche du stage.` : "Aucun début ni fin de stage ce mois-ci. Les stages déjà en cours restent visibles dans la liste.";
}

function renderCompanies() {
  const query = normalize($("#companySearch").value).trim();
  const groups = new Map();
  state.stages.forEach((stage) => { const list = groups.get(stage.entreprise_accueil) || []; list.push(stage); groups.set(stage.entreprise_accueil, list); });
  const companies = [...groups].sort(([a], [b]) => a.localeCompare(b, "fr")).filter(([name]) => normalize(name).includes(query));
  $("#companyCount").textContent = state.ready ? `${companies.length} entreprise${companies.length > 1 ? "s" : ""} d’accueil${query ? ` sur ${groups.size}` : ""}` : "Synchronisation des entreprises…";
  $("#companiesGrid").innerHTML = !state.ready ? waitingState() : !companies.length ? emptyState(query ? "Aucune entreprise trouvée" : "De futures rencontres à construire", query ? "Essayez un autre nom d’entreprise." : "Les entreprises apparaîtront automatiquement lorsque vous ajouterez leurs stages.", query ? "none" : "create") : companies.map(([name, stages]) => `<article class="company-card"><div class="company-card-top"><span class="company-icon">${icon("building")}</span><div><h2>${esc(name)}</h2><p>Entreprise d’accueil</p></div></div><div class="company-metrics"><div><strong>${stages.length}</strong><span>stage${stages.length > 1 ? "s" : ""} suivi${stages.length > 1 ? "s" : ""}</span></div><div><strong>${stages.filter((stage) => stageStatus(stage) === "active").length}</strong><span>en cours</span></div><div><strong>${stages.filter((stage) => stageStatus(stage) === "upcoming").length}</strong><span>à venir</span></div></div><p class="company-missions">${esc([...new Set(stages.map((stage) => stage.intitule_stage))].join(" · "))}</p><button class="button button-white" data-action="company" data-company="${esc(name)}">Consulter les stages</button></article>`).join("");
}

function navigate(view, focus = false) {
  if (!["dashboard", "stages", "calendar", "companies"].includes(view)) view = "dashboard";
  state.view = view;
  const titles = { dashboard: ["Vue d’ensemble", "Tous les parcours. Une vision claire."], stages: ["Les stages", "Chaque expérience, dans le détail."], calendar: ["Calendrier", "Les bonnes dates, au bon moment."], companies: ["Les entreprises", "Les lieux où les parcours prennent forme."] };
  $("#pageTitle").textContent = titles[view][0];
  $("#pageDescription").textContent = titles[view][1];
  document.title = `${titles[view][0]} · Stages ISIS`;
  document.querySelectorAll(".view").forEach((section) => { section.hidden = section.id !== `${view}View`; });
  document.querySelectorAll("[data-view]").forEach((link) => { const active = link.dataset.view === view; link.classList.toggle("active", active); if (active) link.setAttribute("aria-current", "page"); else link.removeAttribute("aria-current"); });
  if (location.hash !== `#${view}`) history.replaceState(null, "", `#${view}`);
  closeNavigation();
  if (focus) $("#main").focus({ preventScroll: true });
}

function resetFilters() {
  state.query = ""; state.status = "all"; state.company = "all"; state.sort = "recent"; state.page = 1;
  $("#searchInput").value = "";
  render();
}

function closeNavigation() {
  $("#sidebar").classList.remove("open");
  $("#sidebar").inert = window.matchMedia("(max-width: 800px)").matches;
  $("#menuButton").setAttribute("aria-expanded", "false");
  $("#navBackdrop").hidden = true;
}

function clearFormErrors() {
  $("#formError").hidden = true;
  fields.forEach((name) => { $(`#error-${name}`).textContent = ""; $("#stageForm").elements[name].removeAttribute("aria-invalid"); });
}

function fieldError(name, message) {
  $(`#error-${name}`).textContent = message;
  $("#stageForm").elements[name].setAttribute("aria-invalid", "true");
}

function updateDuration() {
  const form = $("#stageForm");
  const start = form.elements.date_debut.value;
  const end = form.elements.date_fin.value;
  form.elements.date_fin.min = start || "0001-01-01";
  const days = start && end ? stageDuration({ date_debut: start, date_fin: end }) : 0;
  $("#durationPreview span").textContent = days > 0 ? `${days} jour${days > 1 ? "s" : ""} calendaires, du ${shortDate(start)} au ${shortDate(end)}.` : start && end ? "La date de fin doit être égale ou postérieure au début." : "Choisissez les dates pour connaître la durée du stage.";
}

function openForm(stage = null) {
  state.editing = stage?.id ?? null;
  $("#stageForm").reset();
  clearFormErrors();
  fields.forEach((name) => { $("#stageForm").elements[name].value = stage?.[name] || ""; });
  $("#formTitle").textContent = stage ? "Modifier le stage" : "Nouveau stage";
  $("#formSubtitle").textContent = stage ? `Les informations du parcours #${String(stage.id).padStart(3, "0")}.` : "Quelques informations pour bien commencer.";
  $("#saveButton span").textContent = stage ? "Enregistrer les modifications" : "Créer le stage";
  updateDuration();
  $("#stageDialog").showModal();
}

function setBusy(value) {
  state.busy = value;
  ["stageDialog", "deleteDialog", "demoDialog"].forEach((id) => {
    $(`#${id}`).querySelectorAll("button,input,textarea").forEach((element) => { element.disabled = value; });
  });
}

async function saveStage(event) {
  event.preventDefault();
  if (state.busy) return;
  clearFormErrors();
  const form = $("#stageForm");
  const data = Object.fromEntries(fields.map((name) => [name, form.elements[name].value.trim()]));
  let valid = true;
  fields.forEach((name) => {
    const input = form.elements[name];
    if (!data[name]) { fieldError(name, "Ce champ est obligatoire."); valid = false; }
    else if (input.maxLength > 0 && data[name].length > input.maxLength) { fieldError(name, `Utilisez au maximum ${input.maxLength} caractères.`); valid = false; }
    else if (name.startsWith("date_") && !/^\d{4}-\d{2}-\d{2}$/.test(data[name])) { fieldError(name, "Choisissez une date valide, avec une année à quatre chiffres."); valid = false; }
  });
  if (data.date_debut && data.date_fin && data.date_fin < data.date_debut) { fieldError("date_fin", "La fin ne peut pas précéder le début du stage."); valid = false; }
  if (!valid) { form.querySelector('[aria-invalid="true"]')?.focus(); return; }
  const editing = state.editing;
  setBusy(true);
  $("#saveButton span").textContent = "Enregistrement…";
  try {
    await api(editing === null ? "/stages" : `/stages/${editing}`, { method: editing === null ? "POST" : "PUT", body: JSON.stringify(data) });
    $("#stageDialog").close();
    notify(editing === null ? "Le stage a bien été créé." : "Les modifications ont été enregistrées.");
    state.page = 1;
  } catch (error) {
    $("#formError").textContent = error.message;
    $("#formError").hidden = false;
    if (Array.isArray(error.detail)) error.detail.forEach((item) => {
      const name = item.loc?.[1];
      if (fields.includes(name)) fieldError(name, name.startsWith("date_") ? "Choisissez une date calendaire valide." : "Vérifiez ce champ et sa longueur maximale.");
      else $("#formError").textContent = "Vérifiez les champs et l’ordre des dates.";
    });
    if (error.status === 404) { $("#stageDialog").close(); notify(error.message, true); }
  } finally {
    setBusy(false);
    $("#saveButton span").textContent = editing === null ? "Créer le stage" : "Enregistrer les modifications";
    await loadStages();
  }
}

function detailsMarkup(stage, warning = "") {
  const duration = stageDuration(stage);
  const progress = stageProgress(stage);
  const status = stageStatus(stage);
  const remaining = dayNumber(stage.date_fin) - dayNumber(localISO());
  return `<div class="drawer-body"><div class="drawer-identity"><span class="avatar tone-${stage.id % 4}">${esc(initials(stage.nom_etudiant))}</span><div><h2>${esc(stage.nom_etudiant)}</h2><p>STAGE #${String(stage.id).padStart(3, "0")}</p></div></div>${badge(stage)}<h3 class="drawer-title">${esc(stage.intitule_stage)}</h3><div class="detail-company">${icon("building")}<span>${esc(stage.entreprise_accueil)}</span></div><dl class="detail-dates"><div><dt>Date de début</dt><dd>${fullDate(stage.date_debut)}</dd></div><div><dt>Date de fin</dt><dd>${fullDate(stage.date_fin)}</dd></div></dl><div class="progress-head"><span>Avancement calendaire</span><strong>${progress} %</strong></div><div class="progress-track" role="progressbar" aria-label="Avancement du stage" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100"><div class="progress-fill" style="width:${progress}%"></div></div><p class="progress-caption">${duration} jours calendaires · ${status === "upcoming" ? `Début dans ${dayNumber(stage.date_debut) - dayNumber(localISO())} jours` : status === "completed" ? "Parcours terminé" : remaining === 0 ? "Dernier jour de stage" : `${remaining} jours avant la fin`}</p>${warning ? `<div class="form-error">${esc(warning)}</div>` : ""}<div class="drawer-actions"><button class="button button-primary" data-action="edit" data-id="${stage.id}">${icon("edit")}Modifier</button><button class="button button-white delete-action" data-action="delete" data-id="${stage.id}">${icon("trash")}Supprimer</button></div><p class="drawer-notice">Le statut et l’avancement sont calculés à partir des dates. Ils n’indiquent pas une validation pédagogique du stage.</p></div>`;
}

async function openDetails(id) {
  const cached = state.stages.find((stage) => stage.id === id);
  state.details = id;
  $("#detailsContent").innerHTML = cached ? detailsMarkup(cached) : `<div class="loading-placeholder">Chargement de la fiche…</div>`;
  $("#detailsDialog").showModal();
  try {
    const stage = await api(`/stages/${id}`);
    if ($("#detailsDialog").open && state.details === id) $("#detailsContent").innerHTML = detailsMarkup(stage);
  } catch (error) {
    if (!$("#detailsDialog").open || state.details !== id) return;
    if (error.status === 404) { $("#detailsDialog").close(); notify(error.message, true); await loadStages(); }
    else $("#detailsContent").innerHTML = cached ? detailsMarkup(cached, "Cette fiche n’a pas pu être actualisée. Les dernières informations reçues sont affichées.") : `<div class="drawer-body form-error">${esc(error.message)}</div>`;
  }
}

function openDelete(stage) {
  state.deleting = stage.id;
  $("#deleteDescription").textContent = `Le stage de ${stage.nom_etudiant} chez ${stage.entreprise_accueil} sera supprimé de la base partagée.`;
  $("#deleteError").hidden = true;
  $("#deleteDialog").showModal();
}

async function deleteStage() {
  if (state.busy) return;
  setBusy(true);
  $("#confirmDelete").textContent = "Suppression…";
  try {
    await api(`/stages/${state.deleting}`, { method: "DELETE" });
    $("#deleteDialog").close();
    notify("Le stage a été supprimé.");
  } catch (error) {
    if (error.status === 404) { $("#deleteDialog").close(); notify(error.message, true); }
    else { $("#deleteError").textContent = error.message; $("#deleteError").hidden = false; }
  } finally {
    setBusy(false);
    $("#confirmDelete").textContent = "Supprimer le stage";
    await loadStages();
  }
}

async function addDemo() {
  if (state.busy) return;
  const today = localISO();
  const examples = [
    ["Camille Démo", "Atelier Santé Démo", "Concevoir une application de suivi des patients", -28, 82],
    ["Nora Démo", "Studio Données Démo", "Explorer les données et construire un tableau de bord", -12, 22],
    ["Louis Démo", "Horizon Numérique Démo", "Développer une API de gestion des ressources", 21, 180],
    ["Inès Démo", "Atelier Santé Démo", "Améliorer l’accessibilité d’un portail de santé", 50, 204],
    ["Adam Démo", "Studio Données Démo", "Automatiser un traitement de données", -220, -40],
    ["Jules Démo", "Horizon Numérique Démo", "Créer des tests pour une application web", -130, -8],
  ];
  setBusy(true);
  $("#confirmDemo").textContent = "Ajout des exemples…";
  let created = 0;
  let skipped = 0;
  try {
    for (const [student, company, title, start, end] of examples) {
      if (state.stages.some((stage) => stage.nom_etudiant === student && stage.entreprise_accueil === company && stage.intitule_stage === title)) { skipped++; continue; }
      await api("/stages", { method: "POST", body: JSON.stringify({ nom_etudiant: student, entreprise_accueil: company, intitule_stage: title, date_debut: addDays(today, start), date_fin: addDays(today, end) }) });
      created++;
    }
    $("#demoDialog").close();
    notify(created ? `${created} stages fictifs ajoutés. Vous pouvez explorer l’espace.` : "Les exemples sont déjà présents dans la liste.");
  } catch (error) {
    $("#demoError").hidden = false;
    $("#demoError").textContent = `${error.message} ${created} exemple(s) ajouté(s), ${skipped} déjà présent(s). Vous pouvez réessayer sans les écraser.`;
  } finally {
    setBusy(false);
    $("#confirmDemo").textContent = "Ajouter les exemples";
    await loadStages();
  }
}

function exportCSV() {
  const stages = state.view === "stages" ? filterStages(state.stages, state) : state.stages;
  if (!stages.length) { notify("Aucun stage à exporter avec ces filtres.", true); return; }
  const url = URL.createObjectURL(new Blob([stagesCSV(stages)], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `stages-${localISO()}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  notify(`${stages.length} stage${stages.length > 1 ? "s" : ""} exporté${stages.length > 1 ? "s" : ""} en CSV.`);
}

document.addEventListener("click", (event) => {
  const navigation = event.target.closest("[data-view]");
  if (navigation) { event.preventDefault(); navigate(navigation.dataset.view, true); return; }
  const close = event.target.closest("[data-close]");
  if (close && !state.busy) { $(`#${close.dataset.close}`).close(); return; }
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  const id = Number(button.dataset.id);
  const stage = state.stages.find((item) => item.id === id);
  if (action === "create") openForm();
  else if (action === "calendar") navigate("calendar", true);
  else if (action === "all-stages") { resetFilters(); navigate("stages", true); }
  else if (action === "status") { resetFilters(); state.status = button.dataset.status; renderStages(); navigate("stages", true); }
  else if (action === "company") { resetFilters(); state.company = button.dataset.company; render(); navigate("stages", true); }
  else if (action === "reset") resetFilters();
  else if (action === "details") openDetails(id);
  else if (action === "edit" && stage) { $("#detailsDialog").close(); openForm(stage); }
  else if (action === "delete" && stage) { $("#detailsDialog").close(); openDelete(stage); }
  else if (action === "previous-page") { state.page--; renderStages(); }
  else if (action === "next-page") { state.page++; renderStages(); }
  else if (action === "demo") { $("#demoError").hidden = true; $("#demoDialog").showModal(); }
  else if (action === "calendar-day") {
    const events = state.stages.filter((item) => item.date_debut === button.dataset.date || item.date_fin === button.dataset.date);
    $("#detailsContent").innerHTML = `<div class="drawer-body"><h2>${fullDate(button.dataset.date)}</h2><p class="required-note">Débuts et fins de stage à cette date.</p>${events.map((item) => `<p><button class="student-link" data-action="details" data-id="${item.id}">${esc(item.nom_etudiant)}</button></p>`).join("")}</div>`;
    $("#detailsDialog").showModal();
  }
});

$("#stageForm").addEventListener("submit", saveStage);
$("#confirmDelete").addEventListener("click", deleteStage);
$("#confirmDemo").addEventListener("click", addDemo);
$("#exportButton").addEventListener("click", exportCSV);
$("#retryButton").addEventListener("click", loadStages);
$("#refreshButton").addEventListener("click", loadStages);
$("#clearFilters").addEventListener("click", resetFilters);
$("#searchInput").addEventListener("input", (event) => { state.query = event.target.value; state.page = 1; renderStages(); });
$("#statusFilter").addEventListener("change", (event) => { state.status = event.target.value; state.page = 1; renderStages(); });
$("#companyFilter").addEventListener("change", (event) => { state.company = event.target.value; state.page = 1; renderStages(); });
$("#sortSelect").addEventListener("change", (event) => { state.sort = event.target.value; state.page = 1; renderStages(); });
$("#companySearch").addEventListener("input", renderCompanies);
$("#startDate").addEventListener("input", updateDuration);
$("#endDate").addEventListener("input", updateDuration);
$("#previousMonth").addEventListener("click", () => { state.calendar = new Date(state.calendar.getFullYear(), state.calendar.getMonth() - 1, 1); renderCalendar(); });
$("#nextMonth").addEventListener("click", () => { state.calendar = new Date(state.calendar.getFullYear(), state.calendar.getMonth() + 1, 1); renderCalendar(); });
$("#todayButton").addEventListener("click", () => { state.calendar = new Date(new Date().getFullYear(), new Date().getMonth(), 1); renderCalendar(); });
$("#quickSearch").addEventListener("click", () => { navigate("stages"); $("#searchInput").focus(); });
$("#menuButton").addEventListener("click", () => { const open = !$("#sidebar").classList.contains("open"); $("#sidebar").classList.toggle("open", open); $("#sidebar").inert = !open; $("#menuButton").setAttribute("aria-expanded", String(open)); $("#navBackdrop").hidden = !open; });
$("#navBackdrop").addEventListener("click", closeNavigation);
document.querySelectorAll("dialog").forEach((dialog) => {
  dialog.addEventListener("cancel", (event) => { if (state.busy) event.preventDefault(); });
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if ($("#sidebar").classList.contains("open")) $("#menuButton").focus();
    closeNavigation();
  }
  if (event.key === "/" && !event.ctrlKey && !event.metaKey && !["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName) && !document.querySelector("dialog[open]")) { event.preventDefault(); navigate("stages"); $("#searchInput").focus(); }
});
window.addEventListener("hashchange", () => {
  if (location.hash !== "#main") navigate(location.hash.slice(1), true);
});
window.addEventListener("online", () => { if (!document.querySelector("dialog[open]")) loadStages(); });
window.matchMedia("(max-width: 800px)").addEventListener("change", closeNavigation);
navigate(location.hash.slice(1));
render();
loadStages();
