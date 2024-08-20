const assert = require('assert');
const { readFileSync, writeFileSync } = require('fs');
const { resolve } = require('path');
const { argv } = require('process');
const { inc } = require('semver');

const [, , release] = argv;
assert(release === 'major' || release === 'minor' || release === 'patch');

const packageJson = JSON.parse(
  readFileSync(resolve(__dirname, 'package.json'), 'utf8')
);
const manifest = JSON.parse(
  readFileSync(resolve(__dirname, 'public', 'manifest.json'), 'utf8')
);

const newVersion = inc(packageJson.version, release);
assert(newVersion);

packageJson.version = newVersion;
manifest.version = newVersion;

writeFileSync(
  resolve(__dirname, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);
writeFileSync(
  resolve(__dirname, 'public', 'manifest.json'),
  JSON.stringify(manifest, null, 2)
);
