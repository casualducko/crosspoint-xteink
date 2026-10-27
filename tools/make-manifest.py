#!/usr/bin/env python3
"""Copies a built app image into site/firmware/ and writes site/manifest.json for it.

usage: tools/make-manifest.py <firmware.bin> <version>
"""
import datetime, hashlib, json, pathlib, shutil, sys

root = pathlib.Path(__file__).resolve().parent.parent
src, version = pathlib.Path(sys.argv[1]), sys.argv[2]
data = src.read_bytes()
if len(data) > 0x7E0000:
    sys.exit('the image does not fit the 0x7E0000-byte app slot')
dest = root / 'site' / 'firmware' / 'crosspoint-xteink-app.bin'
shutil.copyfile(src, dest)
manifest = {
    'name': 'CrossPoint for the Xteink X4 Pro',
    'version': version,
    'released': datetime.date.today().isoformat(),
    'firmware': {'path': 'firmware/crosspoint-xteink-app.bin', 'size': len(data), 'sha256': hashlib.sha256(data).hexdigest()},
}
(root / 'site' / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
(dest.parent / 'crosspoint-xteink-app.bin.sha256').write_text(f"{manifest['firmware']['sha256']}  crosspoint-xteink-app.bin\n")
print(json.dumps(manifest, indent=2))
