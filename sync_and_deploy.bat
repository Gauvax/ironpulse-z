@echo off
setlocal
echo ========================================================
echo        SYNCHRONISATION ET DEPLOIEMENT IRONPULSE
echo ========================================================
echo.

set "GIT_EXE=%LOCALAPPDATA%\Programs\MinGit\cmd\git.exe"
set "GH_EXE=C:\Program Files\GitHub CLI\gh.exe"

if not exist "%GIT_EXE%" (
    echo [ERREUR] Git introuvable dans %GIT_EXE%
    pause
    exit /b 1
)

cd /d "%~dp0"
echo [1/3] Verification des modifications locales...
"%GIT_EXE%" status -s

echo.
echo [2/3] Ajout des fichiers et creation du commit...
"%GIT_EXE%" add .
"%GIT_EXE%" commit -m "update: sync auto %date% %time%" 2>nul

echo.
echo [3/3] Envoi vers GitHub (Gauvax/ironpulse-z)...
"%GIT_EXE%" push origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo  SUCCES : Code pousse sur GitHub !
    echo  Vercel recompile et met a jour la PWA en 15 secondes :
    echo  https://ironpulse-pwa.vercel.app/
    echo ========================================================
) else (
    echo.
    echo [ATTENTION] Echec de l'envoi vers GitHub. Verifiez votre connexion.
)

echo.
pause
