const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 獲取最近的提交信息
const getRecentCommits = () => {
    const lastTag = execSync('git describe --tags --abbrev=0').toString().trim();
    const commits = execSync(`git log ${lastTag}..HEAD --pretty=format:"%h - %s (%an)"`).toString().trim();
    return commits.split('\n');
};

// 讀取現有的 CHANGELOG.md
const changelogPath = path.join(__dirname, '../CHANGELOG.md');
let changelog = fs.readFileSync(changelogPath, 'utf8');

// 獲取當前版本
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
const currentVersion = packageJson.version;

// 獲取最近的提交
const commits = getRecentCommits();

// 分類提交
const changes = {
    feat: [],
    fix: [],
    docs: [],
    style: [],
    refactor: [],
    test: [],
    chore: []
};

commits.forEach(commit => {
    const type = commit.split(' - ')[1].split(':')[0];
    if (changes[type]) {
        changes[type].push(commit);
    }
});

// 生成新的變更日誌
const newChangelog = `## [${currentVersion}] - ${new Date().toISOString().split('T')[0]}

${Object.entries(changes)
        .filter(([_, commits]) => commits.length > 0)
        .map(([type, commits]) => {
            const title = {
                feat: '### Added',
                fix: '### Fixed',
                docs: '### Documentation',
                style: '### Changed',
                refactor: '### Changed',
                test: '### Changed',
                chore: '### Changed'
            }[type];

            return `${title}\n${commits.map(commit => `- ${commit.split(' - ')[1]}`).join('\n')}`;
        })
        .join('\n\n')}

${changelog.split('\n').slice(2).join('\n')}`;

// 寫回 CHANGELOG.md
fs.writeFileSync(changelogPath, newChangelog);

console.log('CHANGELOG.md updated'); 