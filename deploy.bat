@echo off
rem Attendre 2 secondes pour s'assurer que tous les processus sont fermés
timeout /t 2

rem Supprime l'ancien dossier dist si existant
if exist dist (
    rmdir /s /q dist
    rem Attendre que la suppression soit terminée
    timeout /t 2
)

rem Compile avec PyInstaller en utilisant le chemin complet
D:\ALAIN\HUAHINE2-Alain\.venv\Scripts\pyinstaller.exe  --clean HUAHINE.spec


rem Attendre que la compilation soit terminée
timeout /t 2

rem Crée le dossier static dans dist
mkdir dist\static

rem Copie le fichier mbtiles
copy static\cartes.mbtiles dist\static\

echo "Déploiement terminé !"
pause