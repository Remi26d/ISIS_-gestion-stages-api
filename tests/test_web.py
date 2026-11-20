from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import TestCase

from fastapi.testclient import TestClient

from app.main import create_app


class TestInterfaceWeb(TestCase):
    def setUp(self) -> None:
        dossier = self.enterContext(TemporaryDirectory(prefix="stages-web-"))
        self.client = self.enterContext(TestClient(create_app(Path(dossier) / "web.sqlite3")))

    def test_accueil_et_ressources_utilisables_avec_api(self) -> None:
        accueil = self.client.get("/")
        self.assertEqual(accueil.status_code, 200)
        self.assertIn("text/html", accueil.headers["content-type"])
        self.assertIn('<html lang="fr">', accueil.text)
        self.assertIn('id="stageForm"', accueil.text)
        for fichier, type_attendu in (
            ("style.css", "text/css"),
            ("app.js", "javascript"),
            ("model.mjs", "javascript"),
            ("icons.svg", "image/svg+xml"),
            ("favicon.svg", "image/svg+xml"),
        ):
            with self.subTest(fichier=fichier):
                reponse = self.client.get(f"/assets/{fichier}")
                self.assertEqual(reponse.status_code, 200)
                self.assertIn(type_attendu, reponse.headers["content-type"])
        self.assertEqual(self.client.get("/stages").json(), [])
        self.assertEqual(self.client.get("/docs").status_code, 200)

    def test_ressource_absente_et_code_python_non_expose(self) -> None:
        for chemin in ("/assets/absent.js", "/assets/%2e%2e/database.py"):
            with self.subTest(chemin=chemin):
                reponse = self.client.get(chemin)
                self.assertEqual(reponse.status_code, 404)
                self.assertNotIn("class BaseStages", reponse.text)
