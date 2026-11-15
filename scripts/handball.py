"""Handball als abgestumpftes Ikosaeder (32 Felder: 12 Fünfecke, 20 Sechsecke), gedreht und
orthografisch projiziert. Jedes Feld eine Farbe. Ausgabe: SVG-Pfade (sichtbare Felder, hinten nach vorn)."""
import math, itertools, json, sys
phi = (1 + 5 ** 0.5) / 2
V = []
for a, b in itertools.product((-1, 1), repeat=2):
    V += [(0, a, b * phi), (a, b * phi, 0), (b * phi, 0, a)]
norm = lambda v: (lambda l: tuple(x / l for x in v))(math.sqrt(sum(x * x for x in v)))
V = [norm(v) for v in V]
d = lambda a, b: math.dist(a, b)
emin = min(d(a, b) for a, b in itertools.combinations(V, 2))
nb = {i: [j for j in range(12) if j != i and abs(d(V[i], V[j]) - emin) < 1e-6] for i in range(12)}
faces = sorted({tuple(sorted(t)) for t in itertools.combinations(range(12), 3) if all(abs(d(V[x], V[y]) - emin) < 1e-6 for x, y in itertools.combinations(t, 2))})
assert len(faces) == 20
P = lambda i, j: tuple(V[i][k] + (V[j][k] - V[i][k]) / 3 for k in range(3))   # Abstumpfungspunkt nahe i

def order(pts, c):
    # Punkte um den Mittelpunkt c im Kreis sortieren
    c = norm(c); up = (0, 0, 1) if abs(c[2]) < 0.9 else (1, 0, 0)
    u = norm((up[1]*c[2]-up[2]*c[1], up[2]*c[0]-up[0]*c[2], up[0]*c[1]-up[1]*c[0]))
    w = (c[1]*u[2]-c[2]*u[1], c[2]*u[0]-c[0]*u[2], c[0]*u[1]-c[1]*u[0])
    return sorted(pts, key=lambda p: math.atan2(sum(p[k]*w[k] for k in range(3)), sum(p[k]*u[k] for k in range(3))))

panels = []
for i in range(12):
    panels.append(('pent', V[i], order([P(i, j) for j in nb[i]], V[i])))
for f in faces:
    a, b, c = f
    pts = [P(a, b), P(b, a), P(b, c), P(c, b), P(c, a), P(a, c)]
    ctr = tuple(sum(V[x][k] for x in f) / 3 for k in range(3))
    panels.append(('hex', ctr, order(pts, ctr)))
assert len(panels) == 32

def rot(v, ax, ay, az):
    x, y, z = v
    y, z = y*math.cos(ax) - z*math.sin(ax), y*math.sin(ax) + z*math.cos(ax)
    x, z = x*math.cos(ay) + z*math.sin(ay), -x*math.sin(ay) + z*math.cos(ay)
    x, y = x*math.cos(az) - y*math.sin(az), x*math.sin(az) + y*math.cos(az)
    return (x, y, z)

AX, AY, AZ = math.radians(float(sys.argv[1]) if len(sys.argv) > 1 else 28), math.radians(float(sys.argv[2]) if len(sys.argv) > 2 else -34), math.radians(12)
R, C = 46, 50
light = norm((-0.45, -0.6, 0.66))
# Farben: Fünfecke schwarz; Sechsecke gelb, wenn sie an ein bestimmtes Fünfeck-Paar grenzen, sonst weiß
hexes = [p for p in panels if p[0] == 'hex']
axis = norm((0.3, 1, 0.2))
out = []
for kind, ctr, pts in panels:
    cr = norm(rot(ctr, AX, AY, AZ))
    if cr[2] < -0.42:
        continue
    # Kanten auf der Kugel unterteilen (gewölbte Nähte), Punkte hinter dem Rand auf den Rand legen
    poly = []
    for k in range(len(pts)):
        p1, p2 = pts[k], pts[(k + 1) % len(pts)]
        for t in range(8):
            q = norm(tuple(p1[m] + (p2[m] - p1[m]) * t / 8 for m in range(3)))
            x, y, z = rot(q, AX, AY, AZ)
            if z < 0:
                l = math.hypot(x, y); x, y = x / l, y / l
            poly.append((C + R * x, C - R * y))
    shade = max(0.0, sum(cr[m] * light[m] for m in range(3)))
    if kind == 'pent':
        base = (14, 14, 12)
    else:
        band = sum(ctr[m] * axis[m] for m in range(3))
        base = (245, 208, 0) if -0.25 < band < 0.55 else (250, 249, 244)
    f = 0.84 + 0.16 * shade
    col = '#%02x%02x%02x' % tuple(min(255, int(c * f + (18 if kind == 'pent' else 0) * shade)) for c in base)
    out.append((cr[2], col, 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in poly) + ' Z'))
out.sort()
print(json.dumps([[c, p] for _, c, p in out]))
print(len(out), sum(1 for _ in panels), file=sys.stderr)
