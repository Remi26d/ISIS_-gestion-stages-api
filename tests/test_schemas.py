from datetime import date, datetime
from unittest import TestCase

from pydantic import ValidationError

from app.schemas import EXEMPLE_STAGE, StageSaisie


class TestValidationStage(TestCase):
    def test_stage_valide_et_normalisation(self) -> None:
        stage = StageSaisie.model_validate(
            {
                **EXEMPLE_STAGE,
                "nom_etudiant": "  Étudiant Démo  ",
                "entreprise_accueil": "\tAtelier Nuage Démo ",
            }
        )
        self.assertEqual(stage.nom_etudiant, "Étudiant Démo")
        self.assertEqual(stage.entreprise_accueil, "Atelier Nuage Démo")
        self.assertEqual(stage.date_debut, date(2027, 2, 1))
        self.assertEqual(stage.model_dump(mode="json"), EXEMPLE_STAGE)

    def test_rejette_les_chaines_vides(self) -> None:
        for champ in ("nom_etudiant", "entreprise_accueil", "intitule_stage"):
            with self.subTest(champ=champ):
                with self.assertRaises(ValidationError) as erreur:
                    StageSaisie.model_validate({**EXEMPLE_STAGE, champ: " \t\n "})
                self.assertEqual(erreur.exception.errors()[0]["loc"], (champ,))

    def test_limites_des_longueurs(self) -> None:
        for champ, limite in (
            ("nom_etudiant", 120),
            ("entreprise_accueil", 160),
            ("intitule_stage", 240),
        ):
            with self.subTest(champ=champ):
                stage = StageSaisie.model_validate({**EXEMPLE_STAGE, champ: "a" * limite})
                self.assertEqual(len(getattr(stage, champ)), limite)
                with self.assertRaises(ValidationError):
                    StageSaisie.model_validate({**EXEMPLE_STAGE, champ: "a" * (limite + 1)})

    def test_rejette_les_dates_hors_format_ou_impossibles(self) -> None:
        for valeur in (
            "01/02/2027",
            "2027-2-01",
            "2027-02-29",
            "2027-02-01T00:00:00",
            "2027-02-01 ",
            1801440000,
            datetime(2027, 2, 1),
        ):
            with self.subTest(valeur=valeur), self.assertRaises(ValidationError):
                StageSaisie.model_validate({**EXEMPLE_STAGE, "date_debut": valeur})

    def test_rejette_une_fin_avant_le_debut(self) -> None:
        with self.assertRaisesRegex(ValidationError, "La date de fin doit"):
            StageSaisie.model_validate({**EXEMPLE_STAGE, "date_fin": "2027-01-31"})

    def test_accepte_le_meme_jour_et_une_date_bissextile(self) -> None:
        stage = StageSaisie.model_validate(
            {**EXEMPLE_STAGE, "date_debut": date(2028, 2, 29), "date_fin": "2028-02-29"}
        )
        self.assertEqual(stage.date_debut, stage.date_fin)
