import test from "node:test";
import assert from "node:assert/strict";
import { localISO, addDays, stageStatus, stageDuration, stageProgress, filterStages, escapeHTML, csvCell, stagesCSV } from "../app/web/model.mjs";

const stage = { id: 1, nom_etudiant: "Élodie Démo", entreprise_accueil: "Atelier Santé Démo", intitule_stage: "Construire une API", date_debut: "2026-11-01", date_fin: "2026-11-30" };

test("Le premier et le dernier jour appartiennent au stage en cours", () => {
  assert.equal(stageStatus(stage, "2026-10-31"), "upcoming");
  assert.equal(stageStatus(stage, "2026-11-01"), "active");
  assert.equal(stageStatus(stage, "2026-11-30"), "active");
  assert.equal(stageStatus(stage, "2026-12-01"), "completed");
});
test("La durée calendaire compte les bornes et les années bissextiles", () => {
  assert.equal(stageDuration(stage), 30);
  assert.equal(stageDuration({ date_debut: "2028-02-28", date_fin: "2028-03-01" }), 3);
  assert.equal(stageDuration({ date_debut: "2026-03-28", date_fin: "2026-03-30" }), 3);
  assert.equal(stageDuration({ date_debut: "0001-01-01", date_fin: "0001-01-01" }), 1);
});
test("Les dates locales sont conservées sans conversion UTC", () => {
  assert.equal(localISO(new Date(2026, 10, 20, 23, 59)), "2026-11-20");
  assert.equal(addDays("2028-02-28", 1), "2028-02-29");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
});
test("L’avancement est borné, y compris pour un stage d’un jour", () => {
  assert.equal(stageProgress(stage, "2026-10-20"), 0);
  assert.equal(stageProgress(stage, "2026-11-15"), 50);
  assert.equal(stageProgress(stage, "2026-12-20"), 100);
  assert.equal(stageProgress({ date_debut: "2026-11-20", date_fin: "2026-11-20" }, "2026-11-20"), 100);
});
test("La recherche combine les mots sans accents et les filtres sans modifier la source", () => {
  const stages = [stage, { ...stage, id: 2, nom_etudiant: "Adam Démo", date_debut: "2027-01-01", date_fin: "2027-02-01" }];
  assert.deepEqual(filterStages(stages, { query: "ELODIE sante", status: "active", company: stage.entreprise_accueil }, "2026-11-20"), [stage]);
  assert.equal(filterStages(stages, { query: "elodie", status: "completed" }, "2026-11-20").length, 0);
  assert.deepEqual(filterStages(stages, { sort: "student" }).map((item) => item.id), [2, 1]);
  assert.deepEqual(stages.map((item) => item.id), [1, 2]);
});
test("Le CSV protège les formules et conserve guillemets, accents et sauts de ligne", () => {
  assert.equal(csvCell('=HYPERLINK("https://exemple.invalid")'), '"\'=HYPERLINK(""https://exemple.invalid"")"');
  assert.equal(csvCell(" @SUM(A1)"), '"\' @SUM(A1)"');
  const csv = stagesCSV([{ ...stage, intitule_stage: 'Analyse; "santé"\nAPI' }], "2026-11-20");
  assert.ok(csv.startsWith("\uFEFF"));
  assert.ok(csv.includes('"Analyse; ""santé""\nAPI"'));
  assert.ok(csv.includes('"En cours"'));
});
test("Les valeurs utilisateur deviennent du texte dans les vues HTML", () => {
  assert.equal(escapeHTML('<img src=x onerror="alert(1)"> &'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp;');
});
