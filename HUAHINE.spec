# -*- mode: python ; coding: utf-8 -*-

from PyInstaller.building.build_main import Analysis, PYZ, EXE, COLLECT

a = Analysis(
    ['HUAHINE.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('aide/templates/*', 'aide/templates'),
        ('aide/static/*', 'aide/static'),
        ('Alain.ui', '.'),
        ('icones/*', 'icones/'),
        ('templates/index.html', 'templates/'),
        ('aide/templates/*.html', 'templates/aide/'),
        ('static/icone/*.png', 'static/icone/'),
        ('templates', 'templates'),
        ('static', 'static'),
        ('static/cartes.mbtiles', 'static')
    ],
    hiddenimports=['flask'],
    hookspath=[],
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='HUAHINE',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=False,
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=['ps2.ico']
)

collect = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=False,
    upx_exclude=[],
    name='HUAHINE'
)