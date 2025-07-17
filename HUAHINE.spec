# -*- mode: python ; coding: utf-8 -*-

a = Analysis(
    ['HUAHINE.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('aide/templates/*', 'aide/templates'),
        ('aide/static/*', 'aide/static'),
        ('Alain.ui', '.'),
        ('icones/*', 'icones/'),
	('images/*','images'),
        ('templates/index.html', 'templates/'),
        ('aide/templates/*.html', 'templates/aide/'),
        ('static/icone/*.ico', 'static/icone/'),
        ('templates', 'templates')
     ],
    hiddenimports=[],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='HUAHINE',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='VoilierImage.ico'  # Ajoutez cette ligne pour activer l'icône par défaut
)