[CmdletBinding()]
param(
    [uri]$UrlGitHub,
    [uri]$UrlRender,
    [switch]$SansNavigateur
)

$ErrorActionPreference = 'Stop'
$racine = [System.IO.Path]::GetDirectoryName($PSScriptRoot)
$image = 'gestion-stages-api:validation'
$conteneur = 'gestion-stages-verification'
$etiquette = 'isis.gestion-stages.validation=1'
$urlLocale = 'http://127.0.0.1:8000'
$modeRender = ($null -ne $UrlRender) -or ($null -ne $UrlGitHub)

if ($modeRender) {
    if ($null -eq $UrlGitHub -or $null -eq $UrlRender) {
        throw 'Indique les deux adresses avec -UrlGitHub et -UrlRender.'
    }
    if (-not $UrlGitHub.IsAbsoluteUri -or $UrlGitHub.Scheme -ne 'https' -or
        $UrlGitHub.Host -ne 'github.com' -or -not $UrlGitHub.IsDefaultPort -or
        $UrlGitHub.UserInfo -or $UrlGitHub.Query -or $UrlGitHub.Fragment -or
        $UrlGitHub.AbsolutePath -notmatch '^/[A-Za-z0-9-]+/[A-Za-z0-9._-]+/?$') {
        throw 'Colle le lien HTTPS de la page du dépôt GitHub.'
    }
    if (-not $UrlRender.IsAbsoluteUri -or $UrlRender.Scheme -ne 'https' -or
        $UrlRender.Host -notlike '*.onrender.com' -or -not $UrlRender.IsDefaultPort -or
        $UrlRender.UserInfo -or $UrlRender.Query -or $UrlRender.Fragment -or
        $UrlRender.AbsolutePath -notin @('/', '/docs', '/docs/')) {
        throw "Colle l’URL HTTPS onrender.com affichée dans ton Web Service."
    }
    $adresseGitHub = 'https://github.com' + ($UrlGitHub.AbsolutePath.TrimEnd('/') -replace '\.git$', '')
    $adresse = $UrlRender.GetLeftPart([System.UriPartial]::Authority)
    $dossierPreuves = Join-Path $racine 'preuves/render'
    $nomJournal = '03-parcours-http.txt'
} else {
    $adresse = $urlLocale
    $dossierPreuves = Join-Path $racine 'preuves/docker'
    $nomJournal = '00-validation-docker.txt'
}

New-Item -ItemType Directory -Path $dossierPreuves -Force | Out-Null
$journal = Join-Path $dossierPreuves $nomJournal
Set-Content -LiteralPath $journal -Encoding UTF8 -Value "Vérification du $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz')"

function Ecrire-Journal {
    param([string]$Ligne)
    Write-Host $Ligne
    Add-Content -LiteralPath $journal -Encoding UTF8 -Value $Ligne -ErrorAction Stop
}

function Invoke-Docker {
    param([string[]]$Arguments)
    # Docker écrit aussi des messages de progression sur stderr.
    $ErrorActionPreference = 'Continue'
    & docker @Arguments 2>&1 | ForEach-Object { Ecrire-Journal ([string]$_) }
    if ($LASTEXITCODE -ne 0) {
        throw "Docker a renvoyé le code $LASTEXITCODE ($($Arguments[0])). Journal disponible dans $journal."
    }
}

function Attendre-API {
    param([string]$Adresse, [int]$Secondes)
    $limite = [DateTime]::UtcNow.AddSeconds($Secondes)
    $dernierEtat = 'Réponse inattendue.'
    do {
        try {
            $reponse = Invoke-WebRequest -Uri "$Adresse/health" -UseBasicParsing -TimeoutSec 8
            $sante = ConvertFrom-Json -InputObject $reponse.Content
            if ($reponse.StatusCode -eq 200 -and $sante.status -eq 'ok') {
                Ecrire-Journal "GET $Adresse/health → HTTP 200, status ok"
                return
            }
        } catch {
            $dernierEtat = $_.Exception.Message
        }
        Start-Sleep -Seconds 2
    } while ([DateTime]::UtcNow -lt $limite)
    throw "Le service ne répond pas sur $Adresse/health. $dernierEtat"
}

try {
    if (-not (Get-Command docker -CommandType Application -ErrorAction SilentlyContinue)) {
        throw 'Installe Docker Desktop puis ouvre une nouvelle fenêtre PowerShell.'
    }
    Ecrire-Journal 'Version du moteur Docker'
    Invoke-Docker -Arguments @('version', '--format', '{{.Server.Version}}')
    $existants = @(& docker container ls --all --filter "label=$etiquette" --format '{{.Names}}')
    if ($LASTEXITCODE -ne 0) { throw 'La liste des conteneurs Docker est indisponible.' }

    if ($modeRender) {
        if ($conteneur -notin $existants) { throw "Lance d’abord la vérification Docker locale." }
        Invoke-Docker -Arguments @('start', $conteneur)
        Attendre-API -Adresse $adresse -Secondes 100
        $cible = $adresse
    } else {
        Ecrire-Journal "Construction de l’image Docker du projet"
        Invoke-Docker -Arguments @('build', '--progress=plain', '--tag', $image, $racine)
        if ($conteneur -in $existants) {
            Invoke-Docker -Arguments @('rm', '--force', $conteneur)
        }
        Invoke-Docker -Arguments @('run', '--detach', '--name', $conteneur, '--label', $etiquette,
            '--env', 'PORT=10000', '--publish', '127.0.0.1:8000:10000', $image)
        Attendre-API -Adresse $adresse -Secondes 30
        Invoke-Docker -Arguments @('container', 'ls', '--filter', "name=$conteneur")
        $cible = 'http://127.0.0.1:10000'
    }

    $controle = Join-Path $PSScriptRoot 'verifier_service.py'
    Invoke-Docker -Arguments @('cp', $controle, "${conteneur}:/tmp/verifier_service.py")
    Invoke-Docker -Arguments @('exec', $conteneur, 'python', '/tmp/verifier_service.py', $cible)

    if ($modeRender) {
        $readme = Join-Path $racine 'README.md'
        $markdown = [System.IO.File]::ReadAllText($readme)
        $ligneGitHub = '(?m)^\*\*Dépôt GitHub\*\* · [^\r\n]+'
        $ligneRender = '(?m)^\*\*URL publique Render\*\* · [^\r\n]+'
        if ($markdown -notmatch $ligneGitHub -or $markdown -notmatch $ligneRender) {
            throw 'Les lignes des adresses du projet sont introuvables dans le README.'
        }
        $markdown = $markdown -replace $ligneGitHub, "**Dépôt GitHub** · [$adresseGitHub]($adresseGitHub)"
        $markdown = $markdown -replace $ligneRender, "**URL publique Render** · [$adresse]($adresse)"
        [System.IO.File]::WriteAllText($readme, $markdown, [System.Text.UTF8Encoding]::new($false))
        Ecrire-Journal 'Les adresses GitHub et Render sont renseignées dans le README.'
    }
    Ecrire-Journal 'Validation terminée.'
} catch {
    Ecrire-Journal "Échec de la validation. $($_.Exception.Message)"
    throw
}

Write-Host "Journal enregistré : $journal"
if (-not $SansNavigateur) { Start-Process "$adresse/docs" }
