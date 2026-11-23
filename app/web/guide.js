// Exemples pédagogiques déterministes : aucune requête réseau ni écriture en base.
const example = {
  nom_etudiant: "Camille Démo",
  entreprise_accueil: "Atelier Santé Démo",
  intitule_stage: "Suivi des parcours",
  date_debut: "2027-02-01",
  date_fin: "2027-07-30",
};
const json = (value) => JSON.stringify(value, null, 2);
const scenarios = {
  create: {
    description: "Une création valide reçoit un nouvel identifiant.",
    request: `POST /stages\nContent-Type: application/json\n\n${json(example)}`,
    response: `HTTP 201 Created\nLocation: /stages/42\n\n${json({ id: 42, ...example })}`,
    steps: [
      ["Client", "L’interface ou Swagger envoie les cinq champs en JSON."],
      ["FastAPI + Pydantic", "La route sélectionne l’opération et valide types, longueurs et chronologie."],
      ["SQLite", "L’INSERT paramétré crée la ligne dans une transaction et génère son id."],
      ["Réponse", "L’API renvoie le stage, le code 201 et Location. L’interface recharge les données."],
    ],
  },
  replace: {
    description: "Un PUT remplace les cinq champs d’un stage existant et conserve son identifiant.",
    request: `PUT /stages/42\nContent-Type: application/json\n\n${json({ ...example, intitule_stage: "Tableau de bord des parcours" })}`,
    response: `HTTP 200 OK\n\n${json({ id: 42, ...example, intitule_stage: "Tableau de bord des parcours" })}`,
    steps: [
      ["Client", "Le client reprend les cinq champs et modifie l’intitulé. L’id reste dans l’URI."],
      ["Validation", "Pydantic vérifie le corps complet. Un champ obligatoire omis produirait 422."],
      ["SQLite", "L’UPDATE paramétré cible id=42. Une ligne retournée confirme le remplacement."],
      ["Réponse", "Le stage remplacé est renvoyé avec 200. Un autre PUT identique laisse le même état."],
    ],
  },
  delete: {
    description: "Le stage existe, sa suppression réussit et la réponse ne contient aucun corps.",
    request: "DELETE /stages/42",
    response: "HTTP 204 No Content\n\n(corps vide)",
    steps: [
      ["Client", "Le client désigne uniquement la ressource /stages/42."],
      ["FastAPI", "L’identifiant positif est validé avant l’appel à la base."],
      ["SQLite", "DELETE WHERE id=? supprime la ligne. rowcount confirme qu’une ligne a été supprimée."],
      ["Réponse", "L’API renvoie 204 sans JSON. Un GET ultérieur répondra 404."],
    ],
  },
  missing: {
    description: "L’identifiant est valide, mais le stage n’existe pas dans la base.",
    request: "GET /stages/42",
    response: `HTTP 404 Not Found\n\n${json({ detail: "Stage introuvable." })}`,
    steps: [
      ["Client", "Le client demande une ressource précise."],
      ["Validation", "42 respecte la forme et les bornes de l’identifiant."],
      ["SQLite", "La recherche paramétrée ne retourne aucune ligne. La base n’est pas modifiée."],
      ["Réponse", "La route lève une HTTPException 404 avec un message explicite."],
    ],
  },
  invalid: {
    description: "La fin précède le début : la requête est rejetée avant toute écriture.",
    request: `POST /stages\nContent-Type: application/json\n\n${json({ ...example, date_fin: "2027-01-01" })}`,
    response: "HTTP 422 Unprocessable Entity\n\nExtrait de detail :\nLa date de fin doit suivre ou égaler la date de début.",
    steps: [
      ["Client", "Le JSON possède les cinq champs, mais la chronologie est incohérente."],
      ["Pydantic", "Le validateur du modèle refuse date_fin < date_debut."],
      ["SQLite", "Aucun appel à la fonction de création : aucune ligne n’est insérée."],
      ["Réponse", "FastAPI produit 422 avec les erreurs dans detail. Le texte affiché ici en est un extrait."],
    ],
  },
};
const explorer = document.querySelector("#requestExplorer");
explorer.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-scenario]");
  if (!button) return;
  const scenario = scenarios[button.dataset.scenario];
  explorer.querySelectorAll("button[data-scenario]").forEach((item) => {
    item.setAttribute("aria-pressed", String(item === button));
  });
  document.querySelector("#scenarioDescription").textContent = scenario.description;
  document.querySelector("#requestCode").textContent = scenario.request;
  document.querySelector("#responseCode").textContent = scenario.response;
  const steps = document.querySelector("#requestSteps");
  steps.replaceChildren(...scenario.steps.map(([title, description]) => {
    const li = document.createElement("li");
    const strong = document.createElement("strong");
    const span = document.createElement("span");
    strong.textContent = title;
    span.textContent = description;
    li.append(strong, span);
    return li;
  }));
});
