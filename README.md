# CrossPoint for the Xteink X4 Pro: web flasher

A static page that installs an unofficial CrossPoint build on an **Xteink X4 Pro** from Chrome or Edge over WebSerial.
The build adds a **two-unit mode**: two X4 Pros pair by ESP-NOW radio and read as the two pages of one book.

- **Use it:** the Pages site of this repository (Settings, Pages). Hold the left page button while plugging in USB, click Connect, click Install.
- **Only the X4 Pro** (ESP32-S3, 16 MB). The original X4 and the X3 are refused.
- **Safe by construction:** the page writes only the first app slot (0x10000) after it has checked the chip, the flash size, that the partition
  table is the stock X4 Pro one (SHA-256 pinned in `site/js/core.js`) and that the bootloader starts that slot (otadata); it validates the image
  (header, checksum, digest) before writing and compares the loader's MD5 of the flash with the file afterwards. The bootloader, partition
  table, settings and SD card are not touched. It offers no backup or restore: reading 8 MB over WebSerial stalled on real hardware, so the page shows the
  esptool command to save a copy of the app slot instead.
- **Source of the firmware:** see `NOTICE.md` (the firmware contains GPL-2.0 code, so its source is offered there).

## Layout

| Path | Role |
|---|---|
| `site/` | what GitHub Pages serves: `index.html`, `style.css`, `js/` (`ui.js` page, `flow.js` sequences, `core.js` checks, `esp-driver.js` serial adapter), `vendor/` (esptool-js 0.7.0, Apache-2.0, unmodified), `manifest.json`, `firmware/` |
| `test/` | `node --test test/*.test.mjs` runs the flows against a fake in-memory X4 Pro |
| `tools/make-manifest.py` | copies a built `firmware.bin` into `site/firmware/` and writes `site/manifest.json` |
| `.github/workflows/pages.yml` | runs the tests and deploys `site/` on every push to `main` |

## Releasing a new firmware

1. Build in the port repository (`ENVNAME=x4pro-radio ./build-crosspoint.sh`) from committed source, and tag that source `xteink-v<version>` in
   `crosspoint-diptyx` (branch `xteink-link`) and `freeink-sdk`.
2. `python3 tools/make-manifest.py <firmware.bin> <version>`, then run the tests (`FIRMWARE_BIN=site/firmware/crosspoint-xteink-app.bin node --test test/*.test.mjs`).
3. Commit and push to `main`. Try it on a real unit before announcing it.

Optional extra tests: `X4PRO_DUMP=<a full flash dump of an X4 Pro>` also checks the pinned partition-table hash and the boot slot against that dump.

An unofficial project, not affiliated with Xteink or the CrossPoint project. Use at your own risk.
