const fs = require('fs');
const path = require('path');
const { execSync: _execSync } = require('child_process');

// 讀取 package.json
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));

// 更新版本號
const currentVersion = packageJson.version;
const [major, minor, patch] = currentVersion.split('.').map(Number);
packageJson.version = `${major}.${minor}.${patch + 1}`;

// 寫回 package.json
fs.writeFileSync(
    path.join(__dirname, '../package.json'),
    JSON.stringify(packageJson, null, 2)
);

// 更新所有子包的版本
const packagesDir = path.join(__dirname, '../packages');
const packages = fs.readdirSync(packagesDir);

packages.forEach(pkg => {
    const pkgJsonPath = path.join(packagesDir, pkg, 'package.json');
    if (fs.existsSync(pkgJsonPath)) {
        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
        pkgJson.version = packageJson.version;
        fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2));
    }
});

console.log(`Version updated to ${packageJson.version}`); 