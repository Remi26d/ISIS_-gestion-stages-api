"""Vérifie un service HTTP en cours d’exécution avec un stage fictif temporaire."""

import argparse
import json
from contextlib import suppress
from http.client import HTTPMessage
from urllib.error import HTTPError
from urllib.parse import urlsplit
from urllib.request import Request, urlopen
from uuid import uuid4


def appeler(
    url: str, methode: str, chemin: str, attendu: int, saisie: dict[str, str] | None = None
) -> tuple[bytes, HTTPMessage]:
    corps = json.dumps(saisie).encode() if saisie is not None else None
    entetes = {"Content-Type": "application/json"} if corps is not None else {}
    requete = Request(url + chemin, method=methode, data=corps, headers=entetes)
    try:
        reponse = urlopen(requete, timeout=75)
    except HTTPError as erreur:
        reponse = erreur
    with reponse:
        contenu = reponse.read()
        verifier_condition(
            reponse.code == attendu,
            f"{methode} {chemin} → HTTP {reponse.code}, attendu {attendu}. {contenu[:300]!r}",
        )
        print(f"{methode:6} {chemin:18} HTTP {reponse.code}")
        return contenu, reponse.headers


def verifier_condition(condition: bool, message: str) -> None:
    if not condition:
        raise RuntimeError(message)


def verifier_service(url: str) -> None:
    print(f"Vérification HTTP de {url}")
    contenu, _ = appeler(url, "GET", "/health", 200)
    verifier_condition(json.loads(contenu) == {"status": "ok"}, "État du service inattendu.")
    contenu, _ = appeler(url, "GET", "/", 200)
    verifier_condition(b'id="stageForm"' in contenu, "Interface web attendue.")
    for chemin, marqueur in (
        ("/assets/style.css", b".sidebar"),
        ("/assets/app.js", b"loadStages"),
        ("/assets/model.mjs", b"stageStatus"),
        ("/assets/icons.svg", b'<symbol id="cap"'),
        ("/assets/theme.css", b"--isis-coral"),
        ("/assets/isis-logo.jpg", b"\xff\xd8\xff"),
        ("/guide", b'id="requestExplorer"'),
        ("/assets/guide.js", b"requestExplorer"),
        ("/assets/tour.js", b"setupTour"),
        ("/assets/tour.css", b".tour-card"),
        ("/assets/guide-soutenance.pdf", b"%PDF-"),
    ):
        contenu, _ = appeler(url, "GET", chemin, 200)
        verifier_condition(marqueur in contenu, f"Ressource de l’interface absente : {chemin}")
    contenu, _ = appeler(url, "GET", "/docs", 200)
    verifier_condition(b"SwaggerUIBundle" in contenu, "Page Swagger attendue.")
    contenu, _ = appeler(url, "GET", "/openapi.json", 200)
    routes = json.loads(contenu)["paths"]
    verifier_condition(
        set(routes["/stages"]) == {"get", "post"}, "Routes de collection inattendues."
    )
    verifier_condition(
        set(routes["/stages/{id}"]) == {"get", "put", "delete"}, "Routes de ressource inattendues."
    )

    saisie = {
        "nom_etudiant": f"Étudiant Démo {uuid4().hex[:8]}",
        "entreprise_accueil": "Atelier Nuage Démo",
        "intitule_stage": "Mise en place d’un suivi fictif",
        "date_debut": "2027-02-01",
        "date_fin": "2027-07-30",
    }
    contenu, entetes = appeler(url, "POST", "/stages", 201, saisie)
    stage = json.loads(contenu)
    identifiant = stage["id"]
    chemin = f"/stages/{identifiant}"
    supprime = False
    try:
        verifier_condition(stage == {"id": identifiant, **saisie}, "Stage créé inattendu.")
        verifier_condition(entetes.get("Location") == chemin, "En-tête Location inattendu.")
        contenu, _ = appeler(url, "GET", "/stages", 200)
        verifier_condition(stage in json.loads(contenu), "Stage créé absent de la liste.")
        contenu, _ = appeler(url, "GET", chemin, 200)
        verifier_condition(json.loads(contenu) == stage, "Stage lu inattendu.")

        saisie["intitule_stage"] = "Tableau de bord fictif"
        attendu = {"id": identifiant, **saisie}
        contenu, _ = appeler(url, "PUT", chemin, 200, saisie)
        verifier_condition(json.loads(contenu) == attendu, "Stage remplacé inattendu.")
        contenu, _ = appeler(url, "GET", chemin, 200)
        verifier_condition(json.loads(contenu) == attendu, "Remplacement absent de la base.")

        contenu, _ = appeler(url, "DELETE", chemin, 204)
        supprime = True
        verifier_condition(not contenu, "La suppression doit renvoyer un corps vide.")
        contenu, _ = appeler(url, "GET", chemin, 404)
        verifier_condition(
            json.loads(contenu) == {"detail": "Stage introuvable."}, "404 inattendu."
        )
    finally:
        if not supprime:
            with suppress(OSError, RuntimeError):
                appeler(url, "DELETE", chemin, 204)
    print("Contrôles HTTP réussis.")


if __name__ == "__main__":
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("url", help="Adresse HTTP ou HTTPS de base du service")
    url = cli.parse_args().url.rstrip("/")
    adresse = urlsplit(url)
    if adresse.scheme not in {"http", "https"} or not adresse.netloc:
        cli.error("fournir une adresse de service commençant par http:// ou https://")
    verifier_service(url)
