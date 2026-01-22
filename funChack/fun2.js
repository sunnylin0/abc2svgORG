const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

// --- 排除 JavaScript 保留字 ---
const keywords = new Set([
    'if', 'for', 'while', 'else', 'switch', 'case', 'break', 'continue',
    'return', 'function', 'var', 'let', 'const', 'export', 'import',
    'default', 'is', 'to', 'in', 'of', 'new', 'try', 'catch', 'finally'
]);

const TARGET_DIR = './core/*.js';
const IGNORE = ['node_modules/**', 'project_analyzer.js'];

const files = globSync(TARGET_DIR, { ignore: IGNORE });
console.log(`[資訊] 正在分析 ${files.length} 個檔案...`);

const allDefinitions = [];
const fileDatabase = {};

// 1. 第一階段：更精準地抓取「函式定義」
files.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    fileDatabase[filePath] = content;

    // 排除註解，避免抓到註解裡的文字
    const cleanContent = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');

    // 嚴格比對：
    // 1. function name(
    // 2. name = (args) =>
    // 3. name: function(
    const funcRegex = /\bfunction\s+([a-zA-Z0-9_$]+)\s*\(|\b([a-zA-Z0-9_$]+)\s*=\s*(?:\([^)]*\)|[a-zA-Z0-9_$]+)\s*=>|([a-zA-Z0-9_$]+)\s*:\s*function\s*\(/g;
    
    let match;
    while ((match = funcRegex.exec(cleanContent)) !== null) {
        const name = match[1] || match[2] || match[3];
        // 只有「不在關鍵字清單內」且「長度 > 1」的才算函式
        if (name && !keywords.has(name) && name.length > 1) {
            allDefinitions.push({ name, filePath });
        }
    }
});

// 2. 第二階段：統計與去重
console.log(`[資訊] 排除關鍵字後，開始精準統計...`);

// 利用 Set 避免同一個檔案重複定義同名函式導致重複計算
const uniqueDefs = Array.from(new Set(allDefinitions.map(d => JSON.stringify(d))))
                        .map(s => JSON.parse(s));

const report = uniqueDefs.map(def => {
    let totalCount = 0;
    // 使用字詞邊界 \b 確保不會抓到 nameABC
    const searchRegex = new RegExp(`\\b${def.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');

    Object.keys(fileDatabase).forEach(file => {
        const matches = fileDatabase[file].match(searchRegex) || [];
        totalCount += matches.length;
    });

    return {
        '函式名稱': def.name,
        '定義檔案': path.basename(def.filePath),
        '總參考次數': totalCount - 1
    };
});

report.sort((a, b) => b['總參考次數'] - a['總參考次數']);

console.log('\n--- 跨檔案精準參考報告 (排除保留字) ---');
console.table(report.slice(0, 50)); // 只顯示前 50 筆最重要的