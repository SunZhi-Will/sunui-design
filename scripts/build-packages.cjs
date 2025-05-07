#!/usr/bin/env node

/**
 * 構建所有包的腳本，順序執行以確保正確的依賴關係
 * CommonJS 版本，確保在任何 Node.js 環境中都能正常工作
 */

const { execSync } = require('child_process');
const { join } = require('path');
const { existsSync } = require('fs');

// 獲取項目根目錄
const rootDir = process.cwd();

// 檢查並創建必要的目錄
function ensureDirectoryExists(dir) {
    if (!existsSync(dir)) {
        console.log(`Creating directory: ${dir}`);
        require('fs').mkdirSync(dir, { recursive: true });
    }
}

// 要構建的包列表，按依賴順序排列
const packages = [
    'core', // 首先構建核心包
    // 然後構建不依賴其他包的組件
    'countdown-banner',
    'side-panel',
    // 接著構建具有依賴關係的組件
    'card',
    'file-upload',
    'filter',
    'floating',
    'gradient',
    'social',
    // 最後構建包含所有內容的主包
    'all'
];

// 構建狀態跟踪
let hasErrors = false;
const builtPackages = [];

// 構建每個包
packages.forEach(pkg => {
    const pkgDir = join(rootDir, 'packages', pkg);

    if (!existsSync(pkgDir)) {
        console.error(`Package directory not found: ${pkgDir}`);
        return;
    }

    // 確保 dist 目錄存在
    ensureDirectoryExists(join(pkgDir, 'dist'));

    const packageName = pkg === 'all' ? 'react' : pkg;
    console.log(`\n\n📦 Building package: @sunui-design/${packageName}`);

    // 如果是 all 包，首先檢查其他包是否成功構建
    if (pkg === 'all' && hasErrors) {
        console.warn(`⚠️ Skipping @sunui-design/${packageName} due to previous build errors`);
        return;
    }

    try {
        execSync('npm run build', {
            cwd: pkgDir,
            stdio: 'inherit',
            env: { ...process.env, NODE_ENV: 'production' }
        });
        console.log(`✅ Successfully built @sunui-design/${packageName}`);
        builtPackages.push(packageName);
    } catch (error) {
        console.error(`❌ Failed to build @sunui-design/${packageName}`);
        console.error(`Error details: ${error.message || 'Unknown error'}`);
        hasErrors = true;

        if (pkg !== 'all') {
            // 如果不是 all 包，則繼續嘗試構建其他包
            console.warn(`⚠️ Continuing with other packages...`);
        } else {
            // 如果是 all 包構建失敗，退出程序
            process.exit(1);
        }
    }
});

// 顯示構建結果摘要
console.log('\n\n📋 Build Summary:');
console.log(`Built ${builtPackages.length}/${packages.length} packages`);
console.log(`✅ Success: ${builtPackages.join(', ')}`);

if (hasErrors) {
    console.error(`❌ Some packages failed to build`);
    process.exit(1);
} else {
    console.log('\n🎉 All packages built successfully!');
} 