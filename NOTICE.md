CrossPoint for the Xteink X4 Pro - licences and notices
======================================================

This repository ("crosspoint-xteink") holds the browser flasher for an UNOFFICIAL build of the CrossPoint e-reader
firmware for the Xteink X4 Pro, with a two-unit link. The firmware is not affiliated with, endorsed by, or supported by
Xteink, the CrossPoint project or the FreeInk project. It is provided as is, without warranty of any kind.

1. How this is licensed
-----------------------
Most of the source code here is under the MIT License (CrossPoint, the FreeInk SDK, the port and link code). The firmware
BINARY, however, also contains third-party libraries under other licences, most importantly wolfSSL (GNU GPL, version 2).
Distributing a binary that contains GPL-2.0 code means the binary as a whole is distributed under the terms of the
GPL-2.0, which includes the duty to provide the complete corresponding source code (section 4 below). The MIT-licensed
source files themselves remain MIT in source form. Do not describe the compiled firmware as "MIT only".

This is a best-effort summary by the port's maintainers, not legal advice. The licence text in each source file or
directory is authoritative.

2. The project's own code and what it is derived from
-----------------------------------------------------
- CrossPoint Reader - MIT License, Copyright (c) 2025 CrossPoint Reader organization.
  https://github.com/crosspoint-reader/crosspoint-reader   (full text: LICENSE)
- FreeInk SDK (the freeink-sdk submodule, our fork with the Diptyx board support) - MIT License,
  Copyright (c) 2026 FreeInk. https://github.com/Free-Ink/freeink-sdk . Its own NOTICE file credits the OpenX4 E-Paper
  Community SDK (MIT, Copyright (c) 2025 Open X4 E-Paper Contributors), which its e-paper drivers derive from.
- Diptyx firmware - MIT License, Copyright (c) 2026 Diptyx. https://github.com/MartijndenHoed/Diptyx
  Parts of the source tree this build comes from were derived from it (the dual-screen port). Its copyright notice,
  reproduced as the MIT License requires: Copyright (c) 2026 Diptyx. Permission is hereby granted, free of charge, to any
  person obtaining a copy of that software and associated documentation files, to deal in the Software without
  restriction, subject to the conditions that the copyright notice and this permission notice are included in all
  copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
- The Xteink X4 Pro port and the unit link in this build are offered under the same MIT License as CrossPoint.

3. Third-party components in the firmware binary
------------------------------------------------
Libraries fetched by PlatformIO at build time (versions as built; see platformio.ini for the exact pins):
- Arduino-wolfSSL 5.7.2 - GPL-2.0 (or a commercial licence from wolfSSL, not used here).
  Text: diptyx/licenses/GPL-2.0.txt.  Source: https://github.com/wolfSSL/Arduino-wolfSSL
- WebSockets 2.7.3 - LGPL-2.1. Text: diptyx/licenses/LGPL-2.1.txt.
  The firmware is statically linked; the corresponding source and build instructions below let you relink it.
- JPEGDEC 1.2.7 and PNGdec 1.1.6 (BitBank Software) - Apache-2.0. Text: diptyx/licenses/Apache-2.0.txt.
- esptool-js 0.7.0 (Espressif Systems) - Apache-2.0. Not part of the firmware: it is the unmodified library bundled with the
  web flasher page (site/vendor/esptool-js.bundle.js, licence text next to it). https://github.com/espressif/esptool-js
- ArduinoJson 7.4.2 (Benoit Blanchon), SdFat 2.3.1 (Bill Greiman), QRCode 0.0.1
  (Richard Moore) - MIT. See each library's licence file in its source repository.
Components shipped inside CrossPoint's own source tree (lib/):
- expat (Copyright (c) 2017-2024 Sebastian Pipping and others, MIT-style licence), miniz (Copyright 2013-2014 RAD Game
  Tools and Valve Software, MIT), uzlib (Copyright (c) uzlib authors, zlib licence): see the headers and licence files in
  lib/expat, lib/miniz and lib/uzlib.
- Built-in fonts (lib/EpdFont/builtinFonts/source/): Noto Sans, Noto Sans Arabic, Noto Sans Hebrew, Noto Serif and
  OpenDyslexic under the SIL Open Font License 1.1 (OFL.txt in each directory); Ubuntu under the Ubuntu Font Licence 1.0
  (UFL.txt).
- Hyphenation patterns and other data under lib/Epub: see the notices in those directories.
Frameworks and toolchain (not part of this repository): Arduino core for ESP32 (LGPL-2.1+), ESP-IDF (Apache-2.0), and the
Xtensa GCC toolchain with its newlib/libgcc runtime. The compiled firmware contains parts of these.

4. Corresponding source (GPL-2.0 section 3, LGPL-2.1 section 6)
----------------------------------------------------------------
The firmware image served by the web flasher is built from the git tag named in manifest.json's version
("xteink-v<version>", for example xteink-v0.2.0-1) of https://github.com/casualducko/crosspoint-diptyx (branch
xteink-link), together with its submodule freeink-sdk at the commit that tag pins
(https://github.com/casualducko/freeink-sdk). It builds with PlatformIO using the environment `x4pro-radio`
(`ENVNAME=x4pro-radio ./build-crosspoint.sh` in the port repository, https://github.com/casualducko/diptyx-crosspoint,
or `pio run -e x4pro-radio` in crosspoint-diptyx; see platformio.ini for the exact library pins). The licence texts named
above are in the `diptyx/licenses/` directory of that repository. This is a written offer: the same source stays
available, at no charge beyond the cost of copying, from those repositories for at least three years after each
release, to anyone who has a binary.

5. Trademarks
-------------
"CrossPoint", "Xteink" and "X4 Pro" are used only to say what this build is for. No endorsement is implied.
