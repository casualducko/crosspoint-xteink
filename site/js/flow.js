// The install sequences. They talk to the device only through a `driver` object (see esp-driver.js),
// so the same code runs against the real chip in the browser and against a fake one in the tests.
//
// driver: { connect(), chipName(), flashSizeBytes(), read(addr, len, onProgress), write(addr, bytes, onProgress),
//           md5(addr, len), reset(), disconnect() }
import {
  APP_OFFSET, APP_SLOT_SIZE, FLASH_SIZE, PTABLE_OFFSET, PTABLE_LEN, OTADATA_OFFSET, OTADATA_LEN,
  FlasherError, activeAppSlot, checkPartitionTable, md5Hex, sha256Hex, validateAppImage,
} from './core.js';

const noop = () => {};

// Read-only checks: ESP32-S3, 16 MB flash, stock X4 Pro partition table. Throws FlasherError when something is off.
// Each device call is limited so a silent unit shows an error instead of an endless "checking". onCheck(text) says what is
// being asked right now.
const withTimeout = (promise, what, ms = 25000) => {
  let timer;
  const limit = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new FlasherError('check-timeout', `The X4 Pro did not answer while ${what}.`,
      'Unplug it, put it in download mode again (hold the left page button while plugging in) and try again. Another USB cable or port can help.')), ms);
  });
  return Promise.race([promise, limit]).finally(() => clearTimeout(timer));
};

export async function checkDevice(driver, { log = noop, stockSha, onCheck = noop } = {}) {
  onCheck('Reading the chip type...');
  const chip = await withTimeout(driver.chipName(), 'reading the chip type');
  if (!/ESP32-S3/i.test(chip)) {
    throw new FlasherError('wrong-chip', `This is not an X4 Pro: the chip is ${chip}, not an ESP32-S3.`, 'Only the Xteink X4 Pro (ESP32-S3) is supported. The original X4 and the X3 use another chip.');
  }
  onCheck('Reading the flash size...');
  const flash = await withTimeout(driver.flashSizeBytes(), 'reading the flash size');
  if (flash !== FLASH_SIZE) {
    throw new FlasherError('wrong-flash', `Expected 16 MB of flash, found ${flash ? Math.round(flash / 1048576) + ' MB' : 'an unknown size'}.`, 'Only the 16 MB X4 Pro is supported.');
  }
  onCheck('Reading the partition table...');
  const pt = await withTimeout(driver.read(PTABLE_OFFSET, PTABLE_LEN, noop), 'reading the partition table');
  const res = await checkPartitionTable(pt, stockSha);
  log(`Partition table SHA-256 ${res.sha.slice(0, 16)}...`);
  if (!res.ok) {
    throw new FlasherError(
      'not-stock-layout',
      "This device's partition table is not the stock X4 Pro layout, so the app slot may not be at 0x10000.",
      'Nothing was changed. If you installed another firmware or changed the layout, use a full-flash tool of your own instead.',
    );
  }
  // The image goes to app0. If the bootloader starts app1, the new firmware would never run.
  onCheck('Checking which app slot starts...');
  const ota = await withTimeout(driver.read(OTADATA_OFFSET, OTADATA_LEN, noop), 'reading the boot slot');
  const slot = activeAppSlot(ota);
  log(`Boot slot: app${slot}`);
  if (slot !== 0) {
    throw new FlasherError(
      'not-app0',
      'This X4 Pro starts its firmware from the second app slot, so a new image in the first slot would not run.',
      'Nothing was changed. Update the unit with the Xteink updater first, or use esptool (see the guide).',
    );
  }
  return { chip, flash, partitionSha: res.sha };
}

// Writes `bytes` to the app slot and checks it landed (MD5 of the flash range vs. the image).
// onStep(id, label) announces phases; onProgress(fraction) reports the write/read progress of the current phase.
// skipCheck: the page already ran checkDevice on this connection; asking the unit again only adds reads that can stall.
export async function installApp(driver, bytes, { onStep = noop, onProgress = noop, log = noop, stockSha, onCheck = noop, skipCheck = false } = {}) {
  onStep('check', 'Checking your X4 Pro');
  const info = skipCheck ? {} : await checkDevice(driver, { log, stockSha, onCheck });
  onStep('verify-file', 'Checking the firmware file');
  const img = await validateAppImage(bytes);
  log(`Image OK: ${img.size.toLocaleString()} bytes, ${img.segments} segments`);
  // The loader pads the image to a multiple of 4 with 0xFF before writing; compare what is on the flash, so do the same.
  const padded = new Uint8Array(Math.ceil(bytes.length / 4) * 4).fill(0xff);
  padded.set(bytes);
  onStep('write', 'Writing the firmware (do not unplug)');
  await driver.write(APP_OFFSET, bytes, onProgress);
  onStep('verify-write', 'Verifying what was written');
  const want = md5Hex(padded);
  const got = String(await driver.md5(APP_OFFSET, padded.length)).toLowerCase();
  log(`Flash MD5 ${got}, expected ${want}`);
  if (got !== want) {
    throw new FlasherError('verify-failed', 'The written data does not match the firmware file.', 'The write did not complete cleanly. Try again; if it keeps failing, try another USB cable or port.');
  }
  onStep('reset', 'Restarting the X4 Pro');
  await driver.reset();
  return { ...info, size: bytes.length };
}

// Downloads `url` with progress and returns the bytes. If `sha256` is given, the download must match it.
export async function fetchVerified(url, { sha256, expectedSize, onProgress = noop, fetchImpl = globalThis.fetch, signal, maxBytes = APP_SLOT_SIZE, timeoutMs = 180000 } = {}) {
  // A stalled connection must not leave the page busy forever: abort after timeoutMs (and if the caller aborts).
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  if (signal) signal.addEventListener('abort', () => ctrl.abort(), { once: true });
  try {
    return await fetchBytes(url, { sha256, expectedSize, onProgress, fetchImpl, signal: ctrl.signal, maxBytes });
  } catch (e) {
    if (ctrl.signal.aborted && !(e instanceof FlasherError)) throw new FlasherError('download-failed', 'The download took too long and was stopped.', 'Check your internet connection and try again.');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchBytes(url, { sha256, expectedSize, onProgress, fetchImpl, signal, maxBytes }) {
  const res = await fetchImpl(url, { cache: 'no-store', signal });
  if (!res.ok) throw new FlasherError('download-failed', `The firmware could not be downloaded (HTTP ${res.status}).`, 'Check your internet connection and try again.');
  const total = Number(res.headers.get('content-length')) || expectedSize || 0;
  if (total > maxBytes) throw new FlasherError('download-failed', 'The file is larger than the 7.9 MB app slot, so it was not used.', 'Try again, or use the flash script.');
  let bytes;
  if (res.body && res.body.getReader) {
    const reader = res.body.getReader();
    const parts = [];
    let got = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      parts.push(value);
      got += value.length;
      if (got > maxBytes) throw new FlasherError('download-failed', 'The file is larger than the 7.9 MB app slot, so it was not used.', 'Try again, or use the flash script.');
      if (total) onProgress(Math.min(1, got / total));
    }
    bytes = new Uint8Array(got);
    let o = 0;
    for (const p of parts) { bytes.set(p, o); o += p.length; }
  } else {
    bytes = new Uint8Array(await res.arrayBuffer());
  }
  if (expectedSize && bytes.length !== expectedSize) {
    throw new FlasherError('download-failed', `The downloaded file has the wrong size (${bytes.length} instead of ${expectedSize} bytes).`, 'Try again.');
  }
  if (sha256) {
    const got = await sha256Hex(bytes);
    if (got !== sha256) throw new FlasherError('checksum-mismatch', 'The downloaded firmware does not match its checksum, so it was not used.', 'Try again. If it still fails, the download source has changed; use the flash script instead.');
  }
  return bytes;
}

export async function installFromUrl(driver, { url, sha256, size }, hooks = {}) {
  hooks.onStep && hooks.onStep('download', 'Downloading the firmware');
  const bytes = await fetchVerified(url, { sha256, expectedSize: size, onProgress: hooks.onProgress, fetchImpl: hooks.fetchImpl });
  return installApp(driver, bytes, hooks);
}
