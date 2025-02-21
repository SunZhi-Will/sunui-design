const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 建立輸出目錄
const outputDir = path.join(__dirname, '../dist');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// 獲取所有套件目錄
const packagesDir = path.join(__dirname, '../packages');
const packages = fs.readdirSync(packagesDir).filter(
    file => fs.statSync(path.join(packagesDir, file)).isDirectory()
);

// 為每個套件執行打包
packages.forEach(packageName => {
    const packageDir = path.join(packagesDir, packageName);

    console.log(`打包套件: ${packageName}`);

    // 執行 npm pack
    try {
        execSync('npm pack', {
            cwd: packageDir,
            stdio: 'inherit'
        });

        // 移動 tgz 文件到輸出目錄
        const files = fs.readdirSync(packageDir).filter(file => file.endsWith('.tgz'));
        files.forEach(file => {
            const oldPath = path.join(packageDir, file);
            const newPath = path.join(outputDir, file);
            fs.renameSync(oldPath, newPath);
        });

        console.log(`✅ ${packageName} 打包完成`);
    } catch (error) {
        console.error(`❌ ${packageName} 打包失敗:`, error);
    }
});

console.log(`\n所有套件打包完成，檔案位於: ${outputDir}`); 