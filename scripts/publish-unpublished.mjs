// 發佈 npm 上還沒有的套件版本。
// 在 GitHub Actions 中透過 npm Trusted Publishing（OIDC）驗證，不需要 NPM_TOKEN。
// 用法：node scripts/publish-unpublished.mjs [--dry-run]
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dryRun = process.argv.includes('--dry-run');

// 整合包依賴其他所有套件，排最後發佈
const order = (dir) => (dir === 'core' ? 0 : dir === 'all' ? 2 : 1);

const packages = readdirSync(path.join(root, 'packages'), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort((a, b) => order(a) - order(b) || a.localeCompare(b))
    .map((dir) => {
        const pkgDir = path.join(root, 'packages', dir);
        const { name, version, private: isPrivate } = JSON.parse(readFileSync(path.join(pkgDir, 'package.json'), 'utf8'));
        return { dir: pkgDir, name, version, isPrivate };
    })
    .filter((p) => !p.isPrivate);

const isPublished = ({ name, version }) => {
    try {
        return execFileSync('npm', ['view', `${name}@${version}`, 'version'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() === version;
    } catch {
        return false;
    }
};

const pending = packages.filter((p) => {
    const published = isPublished(p);
    console.log(`${published ? 'skip   ' : 'publish'} ${p.name}@${p.version}`);
    return !published;
});

if (dryRun || pending.length === 0) {
    console.log(dryRun ? `dry run: ${pending.length} package(s) would be published` : 'nothing to publish');
    process.exit(0);
}

for (const p of pending) {
    execFileSync('npm', ['publish', '--access', 'public'], { cwd: p.dir, stdio: 'inherit' });
}
console.log(`published ${pending.length} package(s)`);
