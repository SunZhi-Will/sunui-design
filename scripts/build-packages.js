#!/usr/bin/env node

/**
 * 構建所有包的腳本，順序執行以確保正確的依賴關係
 */

import { execSync } from 'child_process';
import { join } from 'path';
import { existsSync } from 'fs';

// 獲取項目根目錄
const rootDir = process.cwd();

// 要構建的包列表，按依賴順序排列
const packages = [
    'core',
    'card',
    'countdown-banner',
    'file-upload',
    'filter',
    'floating',
    'gradient',
    'side-panel',
    'social',
    'all'
];

// 構建每個包
packages.forEach(pkg => {
    const pkgDir = join(rootDir, 'packages', pkg);

    if (!existsSync(pkgDir)) {
        console.error(`Package directory not found: ${pkgDir}`);
        return;
    }

    console.log(`\n\n📦 Building package: @sunui-design/${pkg === 'all' ? 'react' : pkg}`);

    try {
        execSync('npm run build', {
            cwd: pkgDir,
            stdio: 'inherit'
        });
        console.log(`✅ Successfully built @sunui-design/${pkg === 'all' ? 'react' : pkg}`);
    } catch (error) {
        console.error(`❌ Failed to build @sunui-design/${pkg === 'all' ? 'react' : pkg}`);
        console.error(error);
        process.exit(1);
    }
});

console.log('\n\n🎉 All packages built successfully!'); 