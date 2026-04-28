#!/usr/bin/env bun
/**
 * Post-build fix-up for macOS release DMGs.
 *
 * Two responsibilities:
 *   1. Replace Electrobun's self-extractor wrapper with the real expanded
 *      `.app`. The wrapper relies on rename-on-launch which fails inside a
 *      read-only DMG mount with `RenameAcrossMountPoints`, leaving users
 *      with a blank window. We expand it on the build host so the DMG
 *      ships the final flat bundle.
 *   2. Rebuild the DMG with a custom Finder window — branded background
 *      image, hidden toolbar/sidebar, and fixed positions for the app
 *      icon and the Applications symlink — so the install screen looks
 *      polished.
 *
 * Both steps are designed to be SILENT during the build:
 *   - Step 1 unpacks `Contents/Resources/*.tar.zst` directly via the
 *     bundled `zig-zstd` + `tar` instead of launching the wrapper, so
 *     the app's main window never appears mid-build.
 *   - Step 2 reuses a pre-baked `.DS_Store` from `assets/dmg-DS_Store`
 *     so Finder is not invoked. Set `REBUILD_DMG_DS_STORE=1` to fall
 *     back to the osascript path (which briefly opens the install
 *     window) and refresh the cached `.DS_Store` after layout changes.
 *
 * macOS only. On other platforms the script is a no-op so the same build
 * command can be reused on Linux/Windows CI runners.
 */

import {
  cpSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readlinkSync,
  rmSync,
  symlinkSync,
} from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import packageJson from '../package.json' with { type: 'json' };

const APP_ROOT = resolve(import.meta.dir, '..');
const BUILD_ROOT = join(APP_ROOT, 'build');
const ARTIFACTS_ROOT = join(APP_ROOT, 'artifacts');
const STAGE_ROOT = join(APP_ROOT, '.dmg-stage');
const ASSETS_ROOT = join(APP_ROOT, 'assets');
const BACKGROUND_SVG = join(ASSETS_ROOT, 'dmg-background.svg');
const DS_STORE_CACHE = join(ASSETS_ROOT, 'dmg-DS_Store');
const APP_VERSION = packageJson.version;

// Final DMG window layout (logical points; macOS auto-applies @2x).
const WINDOW = { x: 200, y: 100, width: 600, height: 400 } as const;
const ICON_SIZE = 128;
const APP_ICON_POS = { x: 170, y: 220 } as const;
const APPLICATIONS_ICON_POS = { x: 430, y: 220 } as const;

const REBUILD_DS_STORE =
  process.env['REBUILD_DMG_DS_STORE'] === '1' ||
  process.env['REBUILD_DMG_DS_STORE']?.toLowerCase() === 'true';

function runOrThrow(cmd: string, args: string[]): SpawnSyncReturns<string> {
  const result = spawnSync(cmd, args, { encoding: 'utf8' });
  if (result.status !== 0) {
    const stderr = result.stderr?.trim() ?? '';
    const stdout = result.stdout?.trim() ?? '';
    throw new Error(
      `${cmd} ${args.join(' ')} failed (status=${result.status}): ${stderr || stdout}`
    );
  }
  return result;
}

function findMacBuildDirs(): string[] {
  if (!existsSync(BUILD_ROOT)) return [];
  return readdirSync(BUILD_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.includes('-macos-'))
    .map((entry) => join(BUILD_ROOT, entry.name));
}

function findAppBundle(buildDir: string): string | null {
  const appDir = readdirSync(buildDir, { withFileTypes: true }).find(
    (entry) => entry.isDirectory() && entry.name.endsWith('.app')
  );
  return appDir ? join(buildDir, appDir.name) : null;
}

function isExpandedApp(appBundle: string): boolean {
  return existsSync(
    join(
      appBundle,
      'Contents',
      'Resources',
      'app',
      'views',
      'main-ui',
      'index.html'
    )
  );
}

function findArtifactTarZst(
  buildDir: string,
  appBundle: string
): string | null {
  const buildName = basename(buildDir);
  const appName = basename(appBundle, '.app');
  const candidate = join(
    ARTIFACTS_ROOT,
    `${buildName}-${appName}.app.tar.zst`
  );
  return existsSync(candidate) ? candidate : null;
}

type ZstdTool = {
  label: string;
  args: (input: string, output: string) => string[];
  cmd: string;
};

function findZstdTool(appBundle: string): ZstdTool | null {
  // Electrobun ships zig-zstd inside the *expanded* app's MacOS dir — not
  // in the wrapper bundle — so this only matches on subsequent builds when
  // a previously expanded app is still around.
  const bundled = join(appBundle, 'Contents', 'MacOS', 'zig-zstd');
  if (existsSync(bundled)) {
    return {
      label: 'zig-zstd',
      cmd: bundled,
      args: (input, output) => [
        'decompress',
        '-i',
        input,
        '-o',
        output,
        '--no-timing',
      ],
    };
  }

  for (const candidate of [
    '/opt/homebrew/bin/zstd',
    '/usr/local/bin/zstd',
    '/usr/bin/zstd',
  ]) {
    if (existsSync(candidate)) {
      return {
        label: 'zstd',
        cmd: candidate,
        args: (input, output) => ['-d', '-f', '-o', output, input],
      };
    }
  }

  const which = spawnSync('which', ['zstd'], { encoding: 'utf8' });
  if (which.status === 0) {
    const path = which.stdout.trim();
    if (path && existsSync(path)) {
      return {
        label: 'zstd',
        cmd: path,
        args: (input, output) => ['-d', '-f', '-o', output, input],
      };
    }
  }

  return null;
}

/**
 * Replace the wrapper bundle with the real expanded app by decompressing
 * the `*.app.tar.zst` artifact that Electrobun emits alongside the DMG.
 * Avoids launching the wrapper — which would chain to the inner launcher
 * and briefly pop the app window during the build.
 *
 * Falls back to the launcher-based expansion if no zstd tool is available
 * (system `zstd` not installed, e.g. on a fresh CI runner). The fallback
 * may briefly flash the app window because the wrapper auto-execs the new
 * inner launcher after a successful self-extract; we kill the process tree
 * as fast as possible to minimize the flash.
 */
async function expandAppBundle(buildDir: string, appBundle: string) {
  if (isExpandedApp(appBundle)) return;

  const tarZst = findArtifactTarZst(buildDir, appBundle);
  const tool = findZstdTool(appBundle);

  if (tarZst && tool) {
    console.log(
      `[fix-macos-dmg] expanding ${appBundle} via ${tool.label} (silent)`
    );
    const workDir = mkdtempSync(join(tmpdir(), 'dreaction-expand-'));
    try {
      const tarPath = join(workDir, 'app.tar');
      runOrThrow(tool.cmd, tool.args(tarZst, tarPath));

      const extractDir = join(workDir, 'extract');
      mkdirSync(extractDir, { recursive: true });
      runOrThrow('tar', ['-xf', tarPath, '-C', extractDir]);

      const extractedApp = join(extractDir, basename(appBundle));
      if (!existsSync(extractedApp)) {
        throw new Error(
          `Extracted archive does not contain ${basename(appBundle)} at the root`
        );
      }

      rmSync(appBundle, { recursive: true, force: true });
      cpSync(extractedApp, appBundle, { recursive: true, dereference: true });
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }

    if (!isExpandedApp(appBundle)) {
      throw new Error(
        `Expansion completed but ${appBundle} still does not look like a real app`
      );
    }
    return;
  }

  console.warn(
    '[fix-macos-dmg] no zstd tool found, falling back to launcher-based ' +
      'expansion (the app window may briefly appear). Install zstd ' +
      '(`brew install zstd`) to make builds completely silent.'
  );
  await expandViaLauncher(appBundle);
}

const EXPANSION_TIMEOUT_MS = 30000;
const EXPANSION_POLL_MS = 50;

function stopProcessesMatching(needle: string) {
  const result = spawnSync('pgrep', ['-f', needle], { encoding: 'utf8' });
  const pids = (result.stdout ?? '')
    .split('\n')
    .map((line) => Number(line.trim()))
    .filter((pid) => Number.isInteger(pid) && pid > 0 && pid !== process.pid);
  for (const pid of pids) {
    try {
      process.kill(pid, 'SIGKILL');
    } catch {
      // Race against natural exit; ignore.
    }
  }
}

async function expandViaLauncher(appBundle: string) {
  const launcher = join(appBundle, 'Contents', 'MacOS', 'launcher');
  if (!existsSync(launcher)) {
    throw new Error(`Missing launcher at ${launcher}`);
  }

  const proc = Bun.spawn([launcher], {
    cwd: join(appBundle, 'Contents', 'MacOS'),
    stdout: 'ignore',
    stderr: 'ignore',
  });

  const startedAt = Date.now();
  while (Date.now() - startedAt < EXPANSION_TIMEOUT_MS) {
    if (isExpandedApp(appBundle)) {
      proc.kill('SIGKILL');
      stopProcessesMatching(appBundle);
      await proc.exited.catch(() => undefined);
      return;
    }
    await new Promise((resolveSleep) =>
      setTimeout(resolveSleep, EXPANSION_POLL_MS)
    );
  }

  proc.kill('SIGKILL');
  stopProcessesMatching(appBundle);
  await proc.exited.catch(() => undefined);
  throw new Error(`Timed out waiting for ${appBundle} to self-extract`);
}

function ensureApplicationsSymlink(path: string) {
  if (existsSync(path)) {
    try {
      if (readlinkSync(path) === '/Applications') return;
    } catch {
      rmSync(path, { recursive: true, force: true });
    }
  }
  symlinkSync('/Applications', path);
}

type RenderedBackground = {
  base: string;
  retina: string;
};

/**
 * Render the SVG into both 1x and @2x PNGs via macOS's built-in Quick Look
 * thumbnail pipeline + sips. Returns null if the toolchain is unavailable.
 */
function renderBackground(workDir: string): RenderedBackground | null {
  if (!existsSync(BACKGROUND_SVG)) return null;

  rmSync(workDir, { recursive: true, force: true });
  mkdirSync(workDir, { recursive: true });

  const thumbSize = WINDOW.width * 2;
  const ql = spawnSync('qlmanage', [
    '-t',
    '-s',
    String(thumbSize),
    '-o',
    workDir,
    BACKGROUND_SVG,
  ]);
  if (ql.status !== 0) return null;

  const thumb = join(workDir, 'dmg-background.svg.png');
  if (!existsSync(thumb)) return null;

  const retina = join(workDir, 'background@2x.png');
  const cropRetina = spawnSync('sips', [
    '--cropToHeightWidth',
    String(WINDOW.height * 2),
    String(WINDOW.width * 2),
    thumb,
    '--out',
    retina,
  ]);
  if (cropRetina.status !== 0) return null;

  const base = join(workDir, 'background.png');
  const downscale = spawnSync('sips', [
    '--resampleHeightWidth',
    String(WINDOW.height),
    String(WINDOW.width),
    retina,
    '--out',
    base,
  ]);
  if (downscale.status !== 0) return null;

  return { base, retina };
}

function parseMountPoint(attachOutput: string): string | null {
  for (const line of attachOutput.split('\n')) {
    const parts = line.split('\t').map((part) => part.trim());
    const mountCandidate = parts[parts.length - 1];
    if (mountCandidate && mountCandidate.startsWith('/Volumes/')) {
      return mountCandidate;
    }
  }
  return null;
}

function detachMount(mountPoint: string) {
  const clean = spawnSync('hdiutil', ['detach', mountPoint], {
    encoding: 'utf8',
  });
  if (clean.status === 0) return;
  spawnSync('hdiutil', ['detach', mountPoint, '-force'], { encoding: 'utf8' });
}

function buildOsascript(volumeName: string, withBackground: boolean): string {
  const bgLine = withBackground
    ? `set background picture of viewOptions to file ".background:background.png"`
    : '-- no background image available';
  return `tell application "Finder"
  tell disk "${volumeName}"
    open
    set current view of container window to icon view
    set toolbar visible of container window to false
    set statusbar visible of container window to false
    set the bounds of container window to {${WINDOW.x}, ${WINDOW.y}, ${WINDOW.x + WINDOW.width}, ${WINDOW.y + WINDOW.height}}
    set viewOptions to the icon view options of container window
    set arrangement of viewOptions to not arranged
    set icon size of viewOptions to ${ICON_SIZE}
    set text size of viewOptions to 13
    ${bgLine}
    set position of item "${volumeName}.app" of container window to {${APP_ICON_POS.x}, ${APP_ICON_POS.y}}
    set position of item "Applications" of container window to {${APPLICATIONS_ICON_POS.x}, ${APPLICATIONS_ICON_POS.y}}
    update without registering applications
    close
  end tell
end tell`;
}

/**
 * Generate a fresh `.DS_Store` by mounting a R/W DMG, asking Finder to apply
 * the layout via osascript, and copying the resulting `.DS_Store` out so
 * future builds can reuse it without ever opening Finder.
 *
 * This intentionally pops a Finder window briefly. Only runs when the cache
 * is missing or REBUILD_DMG_DS_STORE=1.
 */
function regenerateDsStoreCache(
  stageDir: string,
  appName: string,
  withBackground: boolean
) {
  const sizeMb = folderSizeMb(stageDir) + 80;
  const rwDmg = join(STAGE_ROOT, `${appName}-ds-store-rw.dmg`);
  rmSync(rwDmg, { force: true });

  console.log(
    '[fix-macos-dmg] regenerating .DS_Store via Finder (this opens the install window briefly)'
  );
  runOrThrow('hdiutil', [
    'create',
    '-srcfolder',
    stageDir,
    '-volname',
    appName,
    '-fs',
    'HFS+',
    '-fsargs',
    '-c c=64,a=16,e=16',
    '-format',
    'UDRW',
    '-size',
    `${sizeMb}m`,
    rwDmg,
  ]);

  const attach = runOrThrow('hdiutil', [
    'attach',
    '-readwrite',
    '-noverify',
    '-noautoopen',
    rwDmg,
  ]);
  const mountPoint = parseMountPoint(attach.stdout);
  if (!mountPoint) {
    rmSync(rwDmg, { force: true });
    throw new Error(
      `Could not detect mount point from hdiutil output:\n${attach.stdout}`
    );
  }

  try {
    const script = buildOsascript(appName, withBackground);
    const result = spawnSync('osascript', ['-e', script], { encoding: 'utf8' });
    if (result.status !== 0) {
      throw new Error(
        `osascript layout failed: ${result.stderr?.trim() || result.stdout?.trim()}`
      );
    }
    spawnSync('sync');

    const liveDsStore = join(mountPoint, '.DS_Store');
    if (!existsSync(liveDsStore)) {
      throw new Error(
        `Finder did not produce a .DS_Store at ${liveDsStore} (layout failed?)`
      );
    }
    mkdirSync(ASSETS_ROOT, { recursive: true });
    copyFileSync(liveDsStore, DS_STORE_CACHE);
    copyFileSync(liveDsStore, join(stageDir, '.DS_Store'));
    console.log(`[fix-macos-dmg] cached .DS_Store at ${DS_STORE_CACHE}`);
  } finally {
    detachMount(mountPoint);
    rmSync(rwDmg, { force: true });
  }
}

function folderSizeMb(folder: string): number {
  const result = spawnSync('du', ['-sk', folder], { encoding: 'utf8' });
  if (result.status !== 0) return 0;
  const kb = Number(result.stdout.split(/\s+/)[0]) || 0;
  return Math.ceil(kb / 1024);
}

function rebuildDmg(buildDir: string, appBundle: string) {
  const buildName = basename(buildDir);
  const appName = basename(appBundle, '.app');
  // Electrobun emits the unversioned filename; we replace it with a
  // versioned one so users can tell builds apart and CI uploads keep
  // older releases addressable. The auto-update tarball + update.json
  // keep their predictable names so the in-app updater still works.
  const sourceDmgPath = join(ARTIFACTS_ROOT, `${buildName}-${appName}.dmg`);
  const dmgPath = join(
    ARTIFACTS_ROOT,
    `${buildName}-${appName}-${APP_VERSION}.dmg`
  );

  if (!existsSync(sourceDmgPath)) {
    console.log(`[fix-macos-dmg] no DMG found for ${buildName}, skipping`);
    return;
  }

  const stageDir = join(STAGE_ROOT, buildName);
  rmSync(stageDir, { recursive: true, force: true });
  mkdirSync(stageDir, { recursive: true });

  cpSync(appBundle, join(stageDir, `${appName}.app`), {
    recursive: true,
    dereference: true,
  });
  ensureApplicationsSymlink(join(stageDir, 'Applications'));

  const background = renderBackground(join(STAGE_ROOT, 'background'));
  if (background) {
    const bgDir = join(stageDir, '.background');
    mkdirSync(bgDir, { recursive: true });
    copyFileSync(background.base, join(bgDir, 'background.png'));
    copyFileSync(background.retina, join(bgDir, 'background@2x.png'));
  } else {
    console.warn(
      '[fix-macos-dmg] could not render dmg-background.svg, falling back to plain DMG'
    );
  }

  // Plant the cached .DS_Store before sealing the DMG so Finder is never
  // invoked. The cache is regenerated on demand below.
  const useCache = existsSync(DS_STORE_CACHE) && !REBUILD_DS_STORE;
  if (useCache) {
    copyFileSync(DS_STORE_CACHE, join(stageDir, '.DS_Store'));
  } else {
    regenerateDsStoreCache(stageDir, appName, Boolean(background));
  }

  const sizeMb = folderSizeMb(stageDir) + 80;
  const rwDmg = join(STAGE_ROOT, `${buildName}-rw.dmg`);
  rmSync(rwDmg, { force: true });

  console.log(`[fix-macos-dmg] rebuilding ${dmgPath}`);
  runOrThrow('hdiutil', [
    'create',
    '-srcfolder',
    stageDir,
    '-volname',
    appName,
    '-fs',
    'HFS+',
    '-fsargs',
    '-c c=64,a=16,e=16',
    '-format',
    'UDRW',
    '-size',
    `${sizeMb}m`,
    rwDmg,
  ]);

  rmSync(dmgPath, { force: true });
  runOrThrow('hdiutil', [
    'convert',
    rwDmg,
    '-format',
    'UDZO',
    '-imagekey',
    'zlib-level=9',
    '-o',
    dmgPath,
  ]);
  rmSync(rwDmg, { force: true });

  // Drop the unversioned source DMG that electrobun emitted. We replaced
  // it with the versioned filename above.
  if (sourceDmgPath !== dmgPath) {
    rmSync(sourceDmgPath, { force: true });
  }
}

async function main() {
  if (process.platform !== 'darwin') {
    console.log('[fix-macos-dmg] non-macOS build host, skipping');
    return;
  }

  const buildDirs = findMacBuildDirs();
  for (const buildDir of buildDirs) {
    const appBundle = findAppBundle(buildDir);
    if (!appBundle) continue;

    await expandAppBundle(buildDir, appBundle);
    rebuildDmg(buildDir, appBundle);
  }
}

await main();
