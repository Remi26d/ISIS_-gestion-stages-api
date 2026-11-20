import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Annotated, Literal

from fastapi import FastAPI, HTTPException, Request, Response, status
from fastapi import Path as ParametreChemin
from pydantic import BeforeValidator

from app.database import BaseStages
from app.schemas import Erreur, Stage, StageSaisie

MESSAGE_STAGE_ABSENT = "Stage introuvable."
REPONSE_STAGE_ABSENT = {404: {"model": Erreur, "description": MESSAGE_STAGE_ABSENT}}


def verifier_format_identifiant(valeur: str) -> str:
    if not (valeur.isascii() and valeur.isdecimal()):
        raise ValueError("L’identifiant doit être un entier positif écrit en chiffres.")
    return valeur


IdentifiantStage = Annotated[
    int,
    ParametreChemin(ge=1, le=2**63 - 1, description="Identifiant du stage"),
    BeforeValidator(verifier_format_identifiant),
]


def create_app(chemin_base: Path | None = None) -> FastAPI:
    if chemin_base is None:
        chemin_base = Path(os.environ.get("DATABASE_PATH", "data/stages.sqlite3"))
    base = BaseStages(chemin_base)

    @asynccontextmanager
    async def duree_de_vie(_: FastAPI) -> AsyncIterator[None]:
        base.initialiser()
        yield

    service = FastAPI(
        title="Gestion des stages",
        description="Gérer les stages fictifs d’une école d’ingénieurs.",
        version="1.0.0",
        lifespan=duree_de_vie,
    )

    @service.get("/health", tags=["Service"], summary="Vérifier la disponibilité du service")
    def lire_sante() -> dict[str, Literal["ok"]]:
        return {"status": "ok"}

    @service.get("/stages", tags=["Stages"], summary="Lister les stages")
    def lister_stages() -> list[Stage]:
        return base.lister()

    @service.get(
        "/stages/{id}",
        tags=["Stages"],
        summary="Consulter un stage",
        responses=REPONSE_STAGE_ABSENT,
    )
    def lire_stage(id: IdentifiantStage) -> Stage:
        stage = base.lire(id)
        if stage is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail=MESSAGE_STAGE_ABSENT)
        return stage

    @service.post(
        "/stages",
        tags=["Stages"],
        summary="Créer un stage",
        status_code=status.HTTP_201_CREATED,
        responses={
            201: {
                "description": "Stage créé",
                "headers": {
                    "Location": {
                        "description": "Chemin de la ressource créée",
                        "schema": {"type": "string"},
                    }
                },
            },
        },
    )
    def creer_stage(saisie: StageSaisie, requete: Request, reponse: Response) -> Stage:
        stage = base.creer(saisie)
        reponse.headers["Location"] = requete.url_for("lire_stage", id=stage.id).path
        return stage

    @service.put(
        "/stages/{id}",
        tags=["Stages"],
        summary="Remplacer les informations d’un stage",
        responses=REPONSE_STAGE_ABSENT,
    )
    def remplacer_stage(id: IdentifiantStage, saisie: StageSaisie) -> Stage:
        stage = base.remplacer(id, saisie)
        if stage is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail=MESSAGE_STAGE_ABSENT)
        return stage

    @service.delete(
        "/stages/{id}",
        tags=["Stages"],
        summary="Supprimer un stage",
        status_code=status.HTTP_204_NO_CONTENT,
        response_class=Response,
        responses=REPONSE_STAGE_ABSENT,
    )
    def supprimer_stage(id: IdentifiantStage) -> Response:
        if not base.supprimer(id):
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail=MESSAGE_STAGE_ABSENT)
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    return service


app = create_app()
