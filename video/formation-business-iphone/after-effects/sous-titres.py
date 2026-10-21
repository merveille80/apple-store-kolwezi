# Prépare les groupes de sous-titres (2 à 4 mots) à partir du minutage Scribe mot par mot.
# Usage : python3 sous-titres.py  ->  écrit sous-titres.json à côté (lu par sous-titres.jsx)
import json, os, re

ICI = os.path.dirname(os.path.abspath(__file__))
mots = json.load(open(os.path.join(ICI, '..', 'voix-mots.json'), encoding='utf-8'))

# Corrections d'affichage : séquences de mots Scribe -> texte affiché
REMPLACE = [(['cent', 'cinquante', 'mille', 'francs,'], '150 000 FC,'), (['cent', 'cinquante', 'mille', 'francs'], '150 000 FC')]
CLES = {'business', "d'iphone", 'iphone', 'iphones', 'rdc', '150', '000', 'fc', 'formation', 'escroquer', 'rentabilité',
        'prix', 'budget', 'whatsapp', 'facebook', 'tiktok', 'méthode', 'rentable', 'lien', 'programme', "t'inscrire"}
LIAISON = {'le', 'la', 'les', 'de', 'des', 'du', "d'", 'en', 'à', 'au', 'tes', 'ta', 'ton', 'et', 'que', 'sans', 'te', 'tu',
           'dans', 'une', 'un', 'avec', 'par', 'sur', 'pour', 'mais', 'ne', 'se', 'où', 'quel', 'comment', 'cette'}

toks = []
i = 0
while i < len(mots):
    for seq, txt in REMPLACE:
        if [m['text'].lower() for m in mots[i:i + len(seq)]] == seq:
            toks.append({'text': txt, 'start': mots[i]['start'], 'end': mots[i + len(seq) - 1]['end']})
            i += len(seq)
            break
    else:
        toks.append(dict(mots[i]))
        i += 1

def nu(t):
    return re.sub(r'[,.?!;:«»]', '', t).lower()

groupes, cur = [], []
for k, t in enumerate(toks):
    cur.append(t)
    nxt = toks[k + 1] if k + 1 < len(toks) else None
    pause = nxt and nxt['start'] - t['end'] >= 0.28
    ponct = re.search(r'[,.?!]$', t['text'])
    longueur = sum(len(x['text']) + 1 for x in cur)
    nmots = sum(len(x['text'].split()) for x in cur)
    plein = nmots >= 4 or longueur >= 22 or (nxt and longueur + len(nxt['text']) > 24)
    if not nxt or pause or ponct or plein:
        # Ne pas finir une ligne sur un petit mot de liaison : il passe au groupe suivant
        if nxt and not (pause or ponct) and len(cur) > 2 and nu(cur[-1]['text']) in LIAISON:
            report = cur.pop()
            groupes.append(cur); cur = [report]
        else:
            groupes.append(cur); cur = []
if cur:
    groupes.append(cur)

sortie = []
for g, mots_g in enumerate(groupes):
    nxt = groupes[g + 1][0]['start'] if g + 1 < len(groupes) else None
    debut = mots_g[0]['start'] - 0.06
    fin = min(nxt - 0.02, mots_g[-1]['end'] + 0.7) if nxt else mots_g[-1]['end'] + 0.9
    # Un « mot » par mot affiché (150 000 FC = 3 mots AE, même instant)
    detail = []
    for t in mots_g:
        for w in t['text'].split():
            detail.append({'t': round(t['start'], 3), 'cle': nu(w) in CLES})
    sortie.append({'texte': ' '.join(t['text'] for t in mots_g).replace("'", '\u2019'), 'debut': round(debut, 3), 'fin': round(fin, 3), 'mots': detail})

json.dump({'groupes': sortie}, open(os.path.join(ICI, 'sous-titres.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
for s in sortie:
    print('%6.2f-%6.2f  %s' % (s['debut'], s['fin'], s['texte']))
