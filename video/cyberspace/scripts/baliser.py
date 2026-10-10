"""Balisage automatique de la prononciation : applique prononciation.json au texte de la voix off.

Usage : python3 baliser.py script-vo.txt > texte-tts.txt
Les remplacements se font sur des mots entiers, du terme le plus long au plus court.
"""
import json, re, sys
lex = json.load(open(__file__.rsplit('/', 1)[0] + '/prononciation.json' if '/' in __file__ else 'prononciation.json'))
text = open(sys.argv[1], encoding='utf-8').read().strip()
for term in sorted(lex['termes'], key=len, reverse=True):
    text = re.sub(r'(?<![\w-])' + re.escape(term) + r'(?![\w-])', lex['termes'][term], text)
print(f"{lex['direction']} {text}")
