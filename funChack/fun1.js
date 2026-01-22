const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

// --- 設定區 ---
const TARGET_DIR = './core/*.js'; // 掃描當前目錄及子目錄下的所有 js 檔
const IGNORE = ['node_modules/**', 'project_analyzer.js']; // 排除不需要分析的檔案

// 1. 取得所有檔案路徑
const files = globSync(TARGET_DIR, { ignore: IGNORE });
console.log(`[資訊] 正在分析 ${files.length} 個檔案...`);

const allDefinitions = [];
const fileDatabase = {};

// 2. 第一階段：掃描所有檔案，找出「定義了哪些函式」
files.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    fileDatabase[filePath] = content;

    // 正則表達式：匹配 function name() 或 const name = () =>
    const funcRegex = /(?:function\s+([a-zA-Z0-9_$]+)|(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:\([^)]*\)|[a-zA-Z0-9_$]+)\s*=>)/g;
    let match;
    while ((match = funcRegex.exec(content)) !== null) {
        const name = match[1] || match[2];
        if (name) {
            allDefinitions.push({ name, filePath });
        }
    }
});

// 3. 第二階段：跨檔案統計參考次數
console.log(`[資訊] 找到 ${allDefinitions.length} 個函式定義，開始跨檔案比對...`);

const report = allDefinitions.map(def => {
    let totalCount = 0;
    const escapedName = def.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(`\\b${escapedName}\\b`, 'g');

    // 在每一個檔案的內容中搜尋該函式名
    Object.keys(fileDatabase).forEach(file => {
        const matches = fileDatabase[file].match(searchRegex) || [];
        totalCount += matches.length;
    });

    return {
        '函式名稱': def.name,
        '定義檔案': path.basename(def.filePath),
        '總參考次數': totalCount - 1 // 扣掉定義處那一次
    };
});

// 4. 排序：參考次數由高到低
report.sort((a, b) => b['總參考次數'] - a['總參考次數']);

// 5. 輸出報告
console.log('\n--- 跨檔案函式參考統計報告 ---');
console.table(report);

// 6. 找出完全沒人用的函式 (可能是 Dead Code)
const unused = report.filter(item => item['總參考次數'] <= 0);
if (unused.length > 0) {
    console.log(`\n[提示] 以下 ${unused.length} 個函式在專案中可能未被使用：`);
    console.log(unused.map(i => i['函式名稱']).join(', '));
}