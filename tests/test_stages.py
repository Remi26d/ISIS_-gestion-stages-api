import os
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import TestCase
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import create_app
from app.schemas import EXEMPLE_STAGE


class TestApiStages(TestCase):
    def setUp(self) -> None:
        dossier = self.enterContext(TemporaryDirectory(prefix="stages-test-"))
        self.chemin = Path(dossier) / "test.sqlite3"
        self.client = self.enterContext(TestClient(create_app(self.chemin)))

    def creer_stage(self, **champs: str) -> dict:
        reponse = self.client.post("/stages", json={**EXEMPLE_STAGE, **champs})
        self.assertEqual(reponse.status_code, 201, reponse.text)
        return reponse.json()

    def test_liste_vide(self) -> None:
        reponse = self.client.get("/stages")
        self.assertEqual(reponse.status_code, 200)
        self.assertEqual(reponse.json(), [])

    def test_creation_et_location(self) -> None:
        reponse = self.client.post("/stages", json=EXEMPLE_STAGE)
        self.assertEqual(reponse.status_code, 201)
        stage = reponse.json()
        self.assertIs(type(stage["id"]), int)
        self.assertGreater(stage["id"], 0)
        self.assertEqual(stage, {"id": stage["id"], **EXEMPLE_STAGE})
        self.assertEqual(reponse.headers["Location"], f"/stages/{stage['id']}")

    def test_lecture_liste_et_detail(self) -> None:
        stage = self.creer_stage(entreprise_accueil="Atelier d’Innovation Démo")
        liste = self.client.get("/stages")
        detail = self.client.get(f"/stages/{stage['id']}")
        self.assertEqual(liste.status_code, 200)
        self.assertEqual(liste.json(), [stage])
        self.assertEqual(detail.status_code, 200)
        self.assertEqual(detail.json(), stage)

    def test_remplacement_complet_et_idempotent(self) -> None:
        identifiant = self.creer_stage()["id"]
        chemin = f"/stages/{identifiant}"
        saisie = {
            "nom_etudiant": "Étudiant Démo B",
            "entreprise_accueil": "Studio Données Démo",
            "intitule_stage": "Préparer un inventaire de données",
            "date_debut": "2027-03-01",
            "date_fin": "2027-08-27",
        }
        attendu = {"id": identifiant, **saisie}
        for _ in range(2):
            reponse = self.client.put(chemin, json=saisie)
            self.assertEqual(reponse.status_code, 200)
            self.assertEqual(reponse.json(), attendu)
        self.assertEqual(self.client.get(chemin).json(), attendu)
        self.assertEqual(self.client.get("/stages").json(), [attendu])

    def test_suppression_laissant_les_autres_stages(self) -> None:
        stage_a = self.creer_stage(nom_etudiant="Étudiant Démo A")
        stage_b = self.creer_stage(nom_etudiant="Étudiant Démo B")
        chemin = f"/stages/{stage_a['id']}"
        reponse = self.client.delete(chemin)
        self.assertEqual(reponse.status_code, 204)
        self.assertEqual(reponse.content, b"")
        self.assertEqual(self.client.get(chemin).status_code, 404)
        self.assertEqual(self.client.delete(chemin).status_code, 404)
        self.assertEqual(self.client.get("/stages").json(), [stage_b])

    def test_stage_inexistant_pour_get_put_et_delete(self) -> None:
        chemin = "/stages/9223372036854775807"
        for methode in ("GET", "PUT", "DELETE"):
            with self.subTest(methode=methode):
                options = {"json": EXEMPLE_STAGE} if methode == "PUT" else {}
                reponse = self.client.request(methode, chemin, **options)
                self.assertEqual(reponse.status_code, 404)
                self.assertEqual(reponse.json(), {"detail": "Stage introuvable."})
        self.assertEqual(self.client.get("/stages").json(), [])

    def test_identifiants_generes_distincts_et_non_reutilises(self) -> None:
        stage_a = self.creer_stage()
        stage_b = self.creer_stage()
        self.assertNotEqual(stage_a["id"], stage_b["id"])
        self.assertEqual(self.client.get("/stages").json(), [stage_a, stage_b])
        self.assertEqual(self.client.delete(f"/stages/{stage_b['id']}").status_code, 204)
        stage_c = self.creer_stage()
        self.assertGreater(stage_c["id"], stage_b["id"])
        self.assertEqual(self.client.get("/stages").json(), [stage_a, stage_c])

    def test_creations_concurrentes(self) -> None:
        noms = [f"Étudiant Démo {indice}" for indice in range(6)]
        with ThreadPoolExecutor(max_workers=4) as pool:
            stages = list(pool.map(lambda nom: self.creer_stage(nom_etudiant=nom), noms))
        self.assertEqual(len({stage["id"] for stage in stages}), len(noms))
        self.assertCountEqual(self.client.get("/stages").json(), stages)

    def test_post_rejette_chaque_champ_manquant(self) -> None:
        for champ in EXEMPLE_STAGE:
            with self.subTest(champ=champ):
                incomplet = {cle: valeur for cle, valeur in EXEMPLE_STAGE.items() if cle != champ}
                reponse = self.client.post("/stages", json=incomplet)
                self.assertEqual(reponse.status_code, 422)
                self.assertEqual(reponse.json()["detail"][0]["loc"], ["body", champ])
        self.assertEqual(self.client.get("/stages").json(), [])

    def test_corps_invalides_sans_ecriture(self) -> None:
        cas_invalides = (
            {"nom_etudiant": 123},
            {"entreprise_accueil": "   "},
            {"intitule_stage": None},
            {"date_fin": "30/07/2027"},
            {"date_fin": "2027-01-01"},
            {"id": 9},
            {"commentaire": "Champ non prévu"},
        )
        stage = self.creer_stage()
        for champs in cas_invalides:
            for methode, chemin in (("POST", "/stages"), ("PUT", f"/stages/{stage['id']}")):
                with self.subTest(methode=methode, champs=champs):
                    reponse = self.client.request(methode, chemin, json={**EXEMPLE_STAGE, **champs})
                    self.assertEqual(reponse.status_code, 422)
                    self.assertIsInstance(reponse.json()["detail"], list)
        self.assertEqual(self.client.get("/stages").json(), [stage])

    def test_put_partiel_n_altere_pas_la_ressource(self) -> None:
        stage = self.creer_stage()
        chemin = f"/stages/{stage['id']}"
        reponse = self.client.put(chemin, json={"intitule_stage": "Autre intitulé Démo"})
        self.assertEqual(reponse.status_code, 422)
        self.assertEqual(self.client.get(chemin).json(), stage)

    def test_identifiants_invalides(self) -> None:
        for valeur in ("abc", "0", "-1", "1.0", "9223372036854775808"):
            for methode in ("GET", "PUT", "DELETE"):
                with self.subTest(methode=methode, valeur=valeur):
                    options = {"json": EXEMPLE_STAGE} if methode == "PUT" else {}
                    reponse = self.client.request(methode, f"/stages/{valeur}", **options)
                    self.assertEqual(reponse.status_code, 422)
                    self.assertEqual(reponse.json()["detail"][0]["loc"], ["path", "id"])

    def test_json_mal_forme(self) -> None:
        reponse = self.client.post(
            "/stages", content="{", headers={"Content-Type": "application/json"}
        )
        self.assertEqual(reponse.status_code, 422)
        self.assertEqual(self.client.get("/stages").json(), [])

    def test_sonde_et_contrat_openapi(self) -> None:
        sante = self.client.get("/health")
        self.assertEqual(sante.status_code, 200)
        self.assertEqual(sante.json(), {"status": "ok"})
        docs = self.client.get("/docs")
        self.assertEqual(docs.status_code, 200)
        self.assertIn("SwaggerUIBundle", docs.text)
        openapi = self.client.get("/openapi.json")
        self.assertEqual(openapi.status_code, 200)
        schema = openapi.json()
        routes = schema["paths"]
        self.assertEqual(set(routes["/stages"]), {"get", "post"})
        self.assertEqual(set(routes["/stages/{id}"]), {"get", "put", "delete"})
        self.assertIn("Location", routes["/stages"]["post"]["responses"]["201"]["headers"])
        self.assertNotIn("content", routes["/stages/{id}"]["delete"]["responses"]["204"])
        saisie = schema["components"]["schemas"]["StageSaisie"]
        self.assertEqual(set(saisie["required"]), set(EXEMPLE_STAGE))
        self.assertFalse(saisie["additionalProperties"])
        for champ in ("date_debut", "date_fin"):
            self.assertEqual(saisie["properties"][champ]["format"], "date")


class TestPersistance(TestCase):
    def test_redemarrage_sur_le_meme_fichier_configure(self) -> None:
        with TemporaryDirectory(prefix="stages-persistance-") as dossier:
            chemin = Path(dossier) / "data" / "persistance.sqlite3"
            with patch.dict(os.environ, {"DATABASE_PATH": str(chemin)}):
                with TestClient(create_app()) as premier:
                    reponse = premier.post("/stages", json=EXEMPLE_STAGE)
                    self.assertEqual(reponse.status_code, 201)
                    stage = reponse.json()
                self.assertTrue(chemin.is_file())
                with TestClient(create_app()) as second:
                    reponse = second.get(f"/stages/{stage['id']}")
                    self.assertEqual(reponse.status_code, 200)
                    self.assertEqual(reponse.json(), stage)
