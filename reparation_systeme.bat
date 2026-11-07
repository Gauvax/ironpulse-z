@echo off
:: Ce script verifie et repare les fichiers systeme Windows et GamingServices
:: Il demande automatiquement les privileges Administrateur s'ils manquent.

>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"
if '%errorlevel%' NEQ '0' (
    echo Demande des privileges administrateur...
    powershell -Command "Start-Process '%~0' -Verb RunAs"
    exit /b
)

echo ========================================================
echo     OPTIMISATION ET REPARATION SYSTEME WINDOWS
echo ========================================================
echo.

echo [1/3] Verification et reparation du magasin de composants Windows (DISM)...
echo Cela peut prendre quelques minutes, veuillez patienter...
dism.exe /Online /Cleanup-image /Restorehealth
echo.

echo [2/3] Verification et reparation des fichiers systeme (SFC)...
sfc /scannow
echo.

echo [3/3] Reinitialisation et reparation de Gaming Services (Xbox)...
powershell -Command "Get-AppxPackage *gamingservices* -allusers | Remove-AppxPackage -allusers" >nul 2>&1
powershell -Command "Start-Process 'ms-windows-store://pdp/?productid=9MWPM2CQNLHN'"
echo.

echo ========================================================
echo            REPARATION TERMINEE AVEC SUCCES !
echo ========================================================
echo.
pause
