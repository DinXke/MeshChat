#!/usr/bin/env python3
"""Bereken per land en per zoomniveau hoeveel bytes aan tiles er in een PMTiles-archief
(v3) zitten, door alleen de directories te lezen (niet de tiles zelf).

Gebruik:  python3 pmtiles_sizes.py /opt/meshstats/tiles/basemap.pmtiles > sizes.json

Uitvoer: {"archive": {...header...}, "countries": {"BE": {"name": "België", "bbox": [...],
          "bytes_per_zoom": {"0": n, ...}, "tiles_per_zoom": {...}}, ...}}
Landen als bounding boxes (overlap telt dubbel; de cache in de client ontdubbelt).
"""
import gzip, json, math, struct, sys, zlib

COUNTRIES = {
    "BE": ("België", 2.5, 49.5, 6.4, 51.5),
    "NL": ("Nederland", 3.3, 50.75, 7.25, 53.6),
    "LU": ("Luxemburg", 5.7, 49.4, 6.55, 50.2),
    "DE": ("Duitsland", 5.85, 47.25, 15.05, 55.1),
    "FR": ("Frankrijk", -5.2, 41.3, 9.6, 51.15),
    "GB": ("Verenigd Koninkrijk", -8.7, 49.85, 1.8, 60.9),
    "IE": ("Ierland", -10.6, 51.4, -5.95, 55.4),
    "CH": ("Zwitserland", 5.95, 45.8, 10.5, 47.85),
    "AT": ("Oostenrijk", 9.5, 46.35, 17.2, 49.05),
    "DK": ("Denemarken", 8.0, 54.5, 12.7, 57.8),
    "ES": ("Spanje", -9.4, 35.9, 3.4, 43.85),
    "PT": ("Portugal", -9.55, 36.9, -6.15, 42.2),
    "IT": ("Italië", 6.6, 36.6, 18.55, 47.1),
    "CZ": ("Tsjechië", 12.05, 48.55, 18.9, 51.1),
    "PL": ("Polen", 14.1, 49.0, 24.2, 54.9),
    "NO": ("Noorwegen (zuid)", 4.6, 57.9, 12.5, 64.0),
    "SE": ("Zweden (zuid)", 10.9, 55.3, 19.5, 64.0),
    "SI": ("Slovenië", 13.35, 45.4, 16.6, 46.9),
    "HR": ("Kroatië", 13.5, 42.4, 19.45, 46.55),
    "HU": ("Hongarije", 16.1, 45.7, 22.9, 48.6),
    "SK": ("Slowakije", 16.8, 47.7, 22.6, 49.6),
}

def read_varint(buf, pos):
    shift = 0; result = 0
    while True:
        b = buf[pos]; pos += 1
        result |= (b & 0x7F) << shift
        if b < 0x80: return result, pos
        shift += 7

def decompress(data, kind):
    if kind in (0, 1): return data
    if kind == 2: return gzip.decompress(data)
    if kind == 3:
        import brotli; return brotli.decompress(data)
    if kind == 4:
        import zstandard; return zstandard.ZstdDecompressor().decompress(data)
    raise ValueError("onbekende compressie %d" % kind)

def parse_dir(buf):
    n, pos = read_varint(buf, 0)
    ids = []; last = 0
    for _ in range(n):
        v, pos = read_varint(buf, pos); last += v; ids.append(last)
    runs = []
    for _ in range(n):
        v, pos = read_varint(buf, pos); runs.append(v)
    lens = []
    for _ in range(n):
        v, pos = read_varint(buf, pos); lens.append(v)
    offs = []
    for i in range(n):
        v, pos = read_varint(buf, pos)
        offs.append(offs[i-1] + lens[i-1] if v == 0 and i > 0 else v - 1)
    return list(zip(ids, offs, lens, runs))

def tileid_to_zxy(tid):
    acc = 0; z = 0
    while True:
        num = 1 << (2 * z)
        if acc + num > tid: break
        acc += num; z += 1
    pos = tid - acc; n = 1 << z; x = y = 0; t = pos; s = 1
    while s < n:
        rx = 1 & (t // 2); ry = 1 & (t ^ rx)
        if ry == 0:
            if rx == 1: x = s - 1 - x; y = s - 1 - y
            x, y = y, x
        x += s * rx; y += s * ry; t //= 4; s *= 2
    return z, x, y

def tile_bounds(z, x, y):
    n = 1 << z
    lon0 = x / n * 360 - 180; lon1 = (x + 1) / n * 360 - 180
    lat0 = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * (y + 1) / n))))
    lat1 = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / n))))
    return lon0, lat0, lon1, lat1

def main(path):
    f = open(path, "rb")
    h = f.read(127)
    assert h[:7] == b"PMTiles" and h[7] == 3, "geen PMTiles v3"
    u64 = lambda o: struct.unpack_from("<Q", h, o)[0]
    root_off, root_len = u64(8), u64(16); leaf_off, leaf_len = u64(40), u64(48)
    tile_off = u64(56); internal_comp = h[97]; tile_comp = h[98]
    minz, maxz = h[100], h[101]
    i32 = lambda o: struct.unpack_from("<i", h, o)[0] / 1e7
    archive = {"min_zoom": minz, "max_zoom": maxz, "bounds": [i32(102), i32(106), i32(110), i32(114)],
               "tile_compression": tile_comp, "addressed_tiles": u64(72), "tile_entries": u64(80), "tile_data_bytes": u64(64)}
    f.seek(root_off); root = parse_dir(decompress(f.read(root_len), internal_comp))
    codes = list(COUNTRIES.keys())
    bpz = {c: [0] * (maxz + 1) for c in codes}; tpz = {c: [0] * (maxz + 1) for c in codes}
    total_bpz = [0] * (maxz + 1); total_tpz = [0] * (maxz + 1)
    # bbox-check per zoom met tile-indices in plaats van graden (snel)
    def lon2x(lon, z): return int((lon + 180) / 360 * (1 << z))
    def lat2y(lat, z):
        lat = max(-85.05, min(85.05, lat)); r = math.radians(lat)
        return int((1 - math.log(math.tan(r) + 1 / math.cos(r)) / math.pi) / 2 * (1 << z))
    ranges = {z: {c: (lon2x(b[1], z), lat2y(b[4], z), lon2x(b[3], z), lat2y(b[2], z)) for c, b in COUNTRIES.items()} for z in range(maxz + 1)}

    def handle_entry(tid, length, run):
        for k in range(run):
            z, x, y = tileid_to_zxy(tid + k)
            total_bpz[z] += length; total_tpz[z] += 1
            for c in codes:
                x0, y0, x1, y1 = ranges[z][c]
                if x0 <= x <= x1 and y0 <= y <= y1:
                    bpz[c][z] += length; tpz[c][z] += 1

    leaves = 0
    for tid, off, length, run in root:
        if run == 0:
            f.seek(leaf_off + off); leaf = parse_dir(decompress(f.read(length), internal_comp)); leaves += 1
            for tid2, off2, len2, run2 in leaf:
                if run2 == 0: continue
                handle_entry(tid2, len2, run2)
            if leaves % 100 == 0: print("leaf dirs:", leaves, file=sys.stderr)
        else:
            handle_entry(tid, length, run)
    out = {"archive": archive, "leaf_dirs": leaves,
           "total": {"bytes_per_zoom": total_bpz, "tiles_per_zoom": total_tpz},
           "countries": {c: {"name": COUNTRIES[c][0], "bbox": list(COUNTRIES[c][1:]), "bytes_per_zoom": bpz[c], "tiles_per_zoom": tpz[c]} for c in codes}}
    json.dump(out, sys.stdout, ensure_ascii=False)

if __name__ == "__main__":
    main(sys.argv[1])
