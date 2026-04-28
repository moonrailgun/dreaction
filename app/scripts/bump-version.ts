#!/usr/bin/env bun
/**
 * Manual package.json version bumper for release-it.
 *
 * release-it normally delegates the manifest bump to its `npm` plugin,
 * which shells out to `npm version`. That implicitly runs npm's manifest
 * validation/lockfile pipeline, which fails with `EUNSUPPORTEDPROTOCOL`
 * on this repo because we use Bun's `workspace:*` dep protocol that
 * native npm does not understand.
 *
 * To keep release-it driving versioning while avoiding npm entirely, we
 * disable the npm plugin in `.release-it.json` and use this script via
 * the `after:bump` hook to write the new version into ./package.json.
 *
 * The git plugin's `beforeRelease` runs `git add . --update`, which will
 * pick up the modified (already-tracked) package.json and include it in
 * the release commit.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const version = process.argv[2];
if (!version) {
  console.error('Usage: bun run scripts/bump-version.ts <version>');
  process.exit(1);
}

const pkgPath = resolve(import.meta.dir, '..', 'package.json');
const raw = readFileSync(pkgPath, 'utf-8');
const pkg = JSON.parse(raw) as { version?: string };
const previous = pkg.version;

if (previous === version) {
  console.log(`[bump-version] package.json already at ${version}, skipping`);
  process.exit(0);
}

pkg.version = version;
// Preserve a single trailing newline to match repo formatting.
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
console.log(`[bump-version] package.json: ${previous ?? '(none)'} -> ${version}`);
