import re
from datetime import date
from typing import Annotated, Self

from pydantic import BaseModel, BeforeValidator, ConfigDict, StringConstraints, model_validator

EXEMPLE_STAGE = {
    "nom_etudiant": "Étudiant Démo",
    "entreprise_accueil": "Atelier Nuage Démo",
    "intitule_stage": "Concevoir un tableau de bord de suivi",
    "date_debut": "2027-02-01",
    "date_fin": "2027-07-30",
}


def verifier_format_date(valeur: object) -> str | date:
    if type(valeur) is date:
        return valeur
    if isinstance(valeur, str) and re.fullmatch(r"[0-9]{4}-[0-9]{2}-[0-9]{2}", valeur):
        return valeur
    raise ValueError("Saisir une date au format AAAA-MM-JJ.")


NomEtudiant = Annotated[
    str, StringConstraints(strict=True, strip_whitespace=True, min_length=1, max_length=120)
]
EntrepriseAccueil = Annotated[
    str, StringConstraints(strict=True, strip_whitespace=True, min_length=1, max_length=160)
]
IntituleStage = Annotated[
    str, StringConstraints(strict=True, strip_whitespace=True, min_length=1, max_length=240)
]
DateCalendaire = Annotated[date, BeforeValidator(verifier_format_date)]


class StageSaisie(BaseModel):
    model_config = ConfigDict(extra="forbid", json_schema_extra={"examples": [EXEMPLE_STAGE]})

    nom_etudiant: NomEtudiant
    entreprise_accueil: EntrepriseAccueil
    intitule_stage: IntituleStage
    date_debut: DateCalendaire
    date_fin: DateCalendaire

    @model_validator(mode="after")
    def verifier_chronologie(self) -> Self:
        if self.date_fin < self.date_debut:
            raise ValueError("La date de fin doit suivre ou égaler la date de début.")
        return self


class Stage(StageSaisie):
    model_config = ConfigDict(json_schema_extra={"examples": [{"id": 1, **EXEMPLE_STAGE}]})

    id: int


class Erreur(BaseModel):
    detail: str
