#!/usr/bin/env python3
"""Baut die Alltagshilfe-App aus src/ zusammen.

    python3 tools/build.py          -> index.html (für GitHub Pages), sw.js mit neuer Version, version.json

Stil und Programm werden in eine einzige Datei index.html eingesetzt. Mit esbuild (falls vorhanden)
wird beides verkleinert, sonst bleibt es lesbar. Die Quellen in src/ werden nie verändert.
"""
import datetime
import json
import pathlib
import re
import shutil
import subprocess
import sys

WURZEL = pathlib.Path(__file__).resolve().parent.parent
SRC = WURZEL / 'src'
ESBUILD = shutil.which('esbuild') or '/opt/npm-tools/node_modules/esbuild/bin/esbuild'


def verkleinern(text, art):
    if not pathlib.Path(ESBUILD).exists():
        return text
    r = subprocess.run([ESBUILD, f'--loader={art}', '--minify', '--target=es2019' if art == 'js' else '--target=safari14'],
                       input=text.encode(), capture_output=True)
    if r.returncode:
        sys.exit(f'FEHLER beim Verkleinern ({art}):\n{r.stderr.decode()}')
    return r.stdout.decode().strip()


def main():
    html = (SRC / 'index.html').read_text()
    css = verkleinern((SRC / 'styles.css').read_text(), 'css')
    js = verkleinern((SRC / 'app.js').read_text(), 'js')
    if '</script' in js or '</style' in css:
        sys.exit('FEHLER: </script> oder </style> im Quelltext, das würde die Seite zerbrechen.')
    html = html.replace('<!--STYLES-->', f'<style>{css}</style>').replace('<!--SCRIPT-->', f'<script>{js}</script>')
    (WURZEL / 'index.html').write_text(html)

    jetzt = datetime.datetime.now()
    version = 'nahbei-' + jetzt.strftime('%Y-%m-%d-%H%M')
    sw = (SRC / 'sw.js').read_text().replace('__VERSION__', version)
    (WURZEL / 'sw.js').write_text(sw)
    (WURZEL / 'version.json').write_text(json.dumps({'version': version}) + '\n')
    groesse = len(html.encode()) / 1024
    print(f'index.html gebaut ({groesse:.0f} KB), Version {version}')


if __name__ == '__main__':
    main()
