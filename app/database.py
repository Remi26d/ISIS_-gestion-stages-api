import sqlite3
from collections.abc import Iterator
from contextlib import closing, contextmanager
from pathlib import Path

from app.schemas import Stage, StageSaisie

COLONNES_STAGE = "id, nom_etudiant, entreprise_accueil, intitule_stage, date_debut, date_fin"


class BaseStages:
    def __init__(self, chemin: Path) -> None:
        self.chemin = chemin

    @contextmanager
    def _connexion(self) -> Iterator[sqlite3.Connection]:
        # Chaque opération a sa propre transaction et ferme sa connexion après celle-ci.
        with closing(sqlite3.connect(self.chemin, autocommit=False)) as connexion, connexion:
            connexion.row_factory = sqlite3.Row
            yield connexion

    def initialiser(self) -> None:
        self.chemin.parent.mkdir(parents=True, exist_ok=True)
        with self._connexion() as connexion:
            connexion.execute("""
                CREATE TABLE IF NOT EXISTS stages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nom_etudiant TEXT NOT NULL,
                    entreprise_accueil TEXT NOT NULL,
                    intitule_stage TEXT NOT NULL,
                    date_debut TEXT NOT NULL,
                    date_fin TEXT NOT NULL,
                    CHECK (date_fin >= date_debut)
                )
                """)

    def lister(self) -> list[Stage]:
        with self._connexion() as connexion:
            lignes = connexion.execute(f"SELECT {COLONNES_STAGE} FROM stages ORDER BY id")
            return [Stage.model_validate(dict(ligne)) for ligne in lignes]

    def lire(self, identifiant: int) -> Stage | None:
        with self._connexion() as connexion:
            ligne = connexion.execute(
                f"SELECT {COLONNES_STAGE} FROM stages WHERE id = ?", (identifiant,)
            ).fetchone()
            return Stage.model_validate(dict(ligne)) if ligne is not None else None

    def creer(self, saisie: StageSaisie) -> Stage:
        with self._connexion() as connexion:
            curseur = connexion.execute(
                f"""
                INSERT INTO stages (nom_etudiant, entreprise_accueil, intitule_stage,
                                    date_debut, date_fin)
                VALUES (:nom_etudiant, :entreprise_accueil, :intitule_stage, :date_debut, :date_fin)
                RETURNING {COLONNES_STAGE}
                """,
                saisie.model_dump(mode="json"),
            )
            with closing(curseur):
                ligne = curseur.fetchone()
            return Stage.model_validate(dict(ligne))

    def remplacer(self, identifiant: int, saisie: StageSaisie) -> Stage | None:
        with self._connexion() as connexion:
            parametres = {**saisie.model_dump(mode="json"), "id": identifiant}
            curseur = connexion.execute(
                f"""
                UPDATE stages
                SET nom_etudiant = :nom_etudiant, entreprise_accueil = :entreprise_accueil,
                    intitule_stage = :intitule_stage, date_debut = :date_debut, date_fin = :date_fin
                WHERE id = :id
                RETURNING {COLONNES_STAGE}
                """,
                parametres,
            )
            with closing(curseur):
                ligne = curseur.fetchone()
            return Stage.model_validate(dict(ligne)) if ligne is not None else None

    def supprimer(self, identifiant: int) -> bool:
        with self._connexion() as connexion:
            resultat = connexion.execute("DELETE FROM stages WHERE id = ?", (identifiant,))
            return resultat.rowcount == 1
