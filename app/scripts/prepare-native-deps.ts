#!/usr/bin/env bun
/**
 * Stage native dependencies that cannot be bundled by Bun (e.g. @ngrok/ngrok
 * which loads a platform-specific .node binary at runtime). Files are copied
 * into `.native-deps/node_modules/...` and shipped into the app bundle through
 * electrobun.config.ts's `copy` field so that runtime `require('@ngrok/ngrok')`
 * resolves correctly inside the packaged app (where no `node_modules` exists
 * by default).
 *
 * Strategy: copy the entire @ngrok/ngrok package, then drop the matching
 * `ngrok.<platform>.node` binary next to its index.js. The loader checks for
 * a local .node file before falling back to require('@ngrok/ngrok-<platform>'),
 * so dropping it locally avoids needing the platform subpackage at all.
 */

import {
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  cpSync,
  copyFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const APP_ROOT = resolve(import.meta.dir, '..');
const REPO_ROOT = resolve(APP_ROOT, '..');
const STAGING_ROOT = join(APP_ROOT, '.native-deps');
const STAGING_NM = join(STAGING_ROOT, 'node_modules');

type NgrokTarget = {
  /** subpackage name, e.g. `@ngrok/ngrok-darwin-arm64` */
  subpackage: string;
  /** local .node file name expected by @ngrok/ngrok/index.js */
  binaryName: string;
};

function detectNgrokTarget(): NgrokTarget {
  const { platform, arch } = process;

  if (platform === 'darwin') {
    if (arch === 'arm64') {
      return {
        subpackage: '@ngrok/ngrok-darwin-arm64',
        binaryName: 'ngrok.darwin-arm64.node',
      };
    }
    if (arch === 'x64') {
      return {
        subpackage: '@ngrok/ngrok-darwin-x64',
        binaryName: 'ngrok.darwin-x64.node',
      };
    }
  }

  if (platform === 'linux') {
    // Best-effort: prefer gnu over musl. CI uses glibc-based ubuntu-latest.
    if (arch === 'x64') {
      return {
        subpackage: '@ngrok/ngrok-linux-x64-gnu',
        binaryName: 'ngrok.linux-x64-gnu.node',
      };
    }
    if (arch === 'arm64') {
      return {
        subpackage: '@ngrok/ngrok-linux-arm64-gnu',
        binaryName: 'ngrok.linux-arm64-gnu.node',
      };
    }
  }

  if (platform === 'win32') {
    if (arch === 'x64') {
      return {
        subpackage: '@ngrok/ngrok-win32-x64-msvc',
        binaryName: 'ngrok.win32-x64-msvc.node',
      };
    }
    if (arch === 'arm64') {
      return {
        subpackage: '@ngrok/ngrok-win32-arm64-msvc',
        binaryName: 'ngrok.win32-arm64-msvc.node',
      };
    }
  }

  throw new Error(
    `Unsupported platform/arch combo for @ngrok/ngrok: ${platform}/${arch}`
  );
}

function resolvePackageDir(name: string): string {
  // Resolve via package.json to get the package root regardless of `main` field.
  const pkgJsonPath = require.resolve(`${name}/package.json`);
  return dirname(pkgJsonPath);
}

/**
 * Bun's optional native subpackages (e.g. @ngrok/ngrok-darwin-arm64) are not
 * always reachable via the standard node resolution because they are not
 * symlinked into any consumer's node_modules/@ngrok/ directory. They live in
 * `node_modules/.bun/<scoped+name>@<version>/node_modules/<scope>/<name>/`.
 * Fall back to scanning that cache directory if normal resolution fails.
 */
function findBunCachedPackageDir(name: string): string | null {
  // name like "@ngrok/ngrok-darwin-arm64" -> bun cache prefix "@ngrok+ngrok-darwin-arm64@"
  const cachePrefix = name.replace('/', '+') + '@';
  const cacheRoots = [
    join(REPO_ROOT, 'node_modules', '.bun'),
    join(APP_ROOT, 'node_modules', '.bun'),
  ];
  for (const cacheRoot of cacheRoots) {
    if (!existsSync(cacheRoot)) continue;
    let entries: string[];
    try {
      entries = readdirSync(cacheRoot);
    } catch {
      continue;
    }
    const match = entries.find((e) => e.startsWith(cachePrefix));
    if (!match) continue;
    const candidate = join(cacheRoot, match, 'node_modules', name);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function resolveSubpackageDir(name: string): string {
  try {
    return resolvePackageDir(name);
  } catch {
    const cached = findBunCachedPackageDir(name);
    if (cached) return cached;
    throw new Error(
      `Could not locate ${name}. It is an optional dependency of @ngrok/ngrok ` +
        `and should be installed automatically on this platform. ` +
        `Try re-running \`bun install\`.`
    );
  }
}

function findNativeBinary(subpackageDir: string, binaryName: string): string {
  const candidate = join(subpackageDir, binaryName);
  if (!existsSync(candidate)) {
    throw new Error(
      `Expected native binary not found at ${candidate}. ` +
        `Run \`bun install\` on this platform to install the matching subpackage.`
    );
  }
  return candidate;
}

function stageNgrok() {
  const target = detectNgrokTarget();

  const ngrokDir = resolvePackageDir('@ngrok/ngrok');
  const subpackageDir = resolveSubpackageDir(target.subpackage);
  const binarySrc = findNativeBinary(subpackageDir, target.binaryName);

  const destNgrokDir = join(STAGING_NM, '@ngrok', 'ngrok');
  mkdirSync(destNgrokDir, { recursive: true });

  // Copy the whole @ngrok/ngrok package (small: just JS + d.ts + readme).
  cpSync(ngrokDir, destNgrokDir, { recursive: true, dereference: true });

  // Drop the platform binary next to index.js so the loader picks it up first.
  copyFileSync(binarySrc, join(destNgrokDir, target.binaryName));

  console.log(
    `[prepare-native-deps] staged @ngrok/ngrok with ${target.binaryName}`
  );
}

function main() {
  rmSync(STAGING_ROOT, { recursive: true, force: true });
  mkdirSync(STAGING_NM, { recursive: true });

  stageNgrok();
}

main();
