export const STATUS = {
  active: { label: "En cours", icon: "briefcase" },
  upcoming: { label: "À venir", icon: "clock" },
  completed: { label: "Terminé", icon: "check" },
};

export function localISO(value = new Date()) {
  return `${String(value.getFullYear()).padStart(4, "0")}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

export function addDays(iso, days) {
  const value = new Date(`${iso}T12:00:00`);
  value.setDate(value.getDate() + days);
  return localISO(value);
}

export function stageStatus(stage, today = localISO()) {
  if (stage.date_debut > today) return "upcoming";
  if (stage.date_fin < today) return "completed";
  return "active";
}

export function dayNumber(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  const value = new Date(0);
  value.setUTCFullYear(year, month - 1, day);
  value.setUTCHours(0, 0, 0, 0);
  return value.getTime() / 86400000;
}

export function stageDuration(stage) {
  return dayNumber(stage.date_fin) - dayNumber(stage.date_debut) + 1;
}

export function stageProgress(stage, today = localISO()) {
  const elapsed = dayNumber(today) - dayNumber(stage.date_debut) + 1;
  return Math.min(100, Math.max(0, Math.round(elapsed / stageDuration(stage) * 100)));
}

export function normalize(value) {
  return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr");
}

export function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
}

export function filterStages(stages, { query = "", status = "all", company = "all", sort = "recent" } = {}, today = localISO()) {
  const words = normalize(query).trim().split(/\s+/).filter(Boolean);
  const result = stages.filter((stage) => {
    const text = normalize(`${stage.nom_etudiant} ${stage.entreprise_accueil} ${stage.intitule_stage} ${stage.id}`);
    return words.every((word) => text.includes(word))
      && (status === "all" || stageStatus(stage, today) === status)
      && (company === "all" || stage.entreprise_accueil === company);
  });
  result.sort((a, b) => {
    if (sort === "student") return a.nom_etudiant.localeCompare(b.nom_etudiant, "fr") || a.id - b.id;
    if (sort === "start") return a.date_debut.localeCompare(b.date_debut) || a.id - b.id;
    if (sort === "end") return a.date_fin.localeCompare(b.date_fin) || a.id - b.id;
    return b.id - a.id;
  });
  return result;
}

export function csvCell(value) {
  let text = String(value);
  // Les noms et missions saisis ne doivent pas devenir des formules de tableur.
  if (/^[\s]*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function stagesCSV(stages, today = localISO()) {
  const header = ["Identifiant", "Étudiant", "Entreprise d’accueil", "Intitulé du stage", "Date de début", "Date de fin", "Statut"];
  const rows = stages.map((stage) => [stage.id, stage.nom_etudiant, stage.entreprise_accueil, stage.intitule_stage, stage.date_debut, stage.date_fin, STATUS[stageStatus(stage, today)].label]);
  return "\uFEFF" + [header, ...rows].map((row) => row.map(csvCell).join(";")).join("\r\n");
}
