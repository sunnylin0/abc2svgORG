const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

// 1. 設定排除關鍵字
const keywords = new Set(['if', 'for', 'while', 'else', 'switch', 'case', 'break', 'continue', 'return', 'function', 'var', 'let', 'const', 'export', 'import', 'default', 'is', 'to', 'in', 'of', 'new', 'try', 'catch', 'finally', 'void', 'this']);

// 2. 取得所有檔案
const files = globSync('./core/*.js', { ignore: ['node_modules/**', 'analyzer.js', 'report.html', 'report.csv'] });
console.log(`[資訊] 正在分析 ${files.length} 個檔案...`);

const allDefinitions = [];
const fileDatabase = {};

// 3. 第一階段：抓取定義
files.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    fileDatabase[filePath] = content;
    const lines = content.split('\n');

    // 修正後的 Regex：使用非捕獲群組或統一處理
    // 1. function name
    // 2. name = () =>
    // 3. name: function
    // 4. name = function
    const funcRegex = /function\s+([a-zA-Z0-9_$]+)\s*\(|([a-zA-Z0-9_$]+)\s*=\s*(?:\([^)]*\)|[a-zA-Z0-9_$]+)\s*=>|([a-zA-Z0-9_$]+)\s*:\s*function\s*\(|([a-zA-Z0-9_$.]+)\s*=\s*function\s*\(/g;
    
    let match;
    while ((match = funcRegex.exec(content)) !== null) {
        // 修正：遍歷 match[1] 到 [4]，找到第一個不是 undefined 的值
        let name = match[1] || match[2] || match[3] || match[4];
        
        if (name) {
            let displayName = name;
            if (name.includes('.')) {
                const parts = name.split('.');
                displayName = parts[parts.length - 1];
            }

            if (!keywords.has(displayName) && displayName.length > 1) {
                const lineNumber = content.substring(0, match.index).split('\n').length;
                const statusString = lines[lineNumber - 1].trim();

                allDefinitions.push({ 
                    fullName: name,
                    shortName: displayName,
                    filePath, 
                    line: lineNumber, 
                    status: statusString 
                });
            }
        }
    }
});

// 4. 第二階段：統計次數
console.log(`[資訊] 找到 ${allDefinitions.length} 個定義，開始統計參考次數...`);

const report = allDefinitions.map(def => {
    let totalCount = 0;
    const searchRegex = new RegExp(`\\b${def.shortName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');

    Object.keys(fileDatabase).forEach(file => {
        const matches = fileDatabase[file].match(searchRegex) || [];
        totalCount += matches.length;
    });

    return {
        name: def.fullName,
        location: `${path.basename(def.filePath)}:${def.line}`,
        count: totalCount - 1,
        code: def.status
    };
});

report.sort((a, b) => b.count - a.count);



console.log('\n--- 跨檔案精準參考報告 (排除保留字) ---');
console.table(report.slice(0, 150)); // 只顯示前 50 筆最重要的


// // 5. 匯出 CSV (Excel 用)
// const csvContent = '\ufeff' + [
//     ['函式名稱', '定義位置', '參考次數', '原始碼狀態'].join(','),
//     ...report.map(r => [`"${r.name}"`, `"${r.location}"`, r.count, `"${r.code.replace(/"/g, '""')}"`].join(','))
// ].join('\n');
// fs.writeFileSync('report.csv', csvContent);

// 6. 匯出 HTML (瀏覽器用)
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: sans-serif; padding: 20px; background: #f5f5f5; }
        table { border-collapse: collapse; width: 100%; background: white; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background: #0078d4; color: white; position: sticky; top: 0; }
        tr:hover { background: #f1f1f1; }
        .zero { color: #d13438; font-weight: bold; }
        code { background: #f8f8f8; padding: 2px 5px; border-radius: 3px; color: #001080; }
    </style>
</head>
<body>
    <h2>JS 跨檔案函式參考分析報告</h2>
    <table>
        <thead><tr><th>函式名稱</th><th>定義位置</th><th>參考次數</th><th>原始碼狀態</th></tr></thead>
        <tbody>
            ${report.map(r => `
                <tr>
                    <td><b>${r.name}</b></td>
                    <td>${r.location}</td>
                    <td class="${r.count === 0 ? 'zero' : ''}">${r.count}</td>
                    <td><code>${r.code.replace(/</g, '&lt;')}</code></td>
                </tr>`).join('')}
        </tbody>
    </table>
</body>
</html>`;
fs.writeFileSync('report.html', htmlContent);

console.log('\n[完成] 報告已產生：');
console.log('- Excel 請開啟: report.csv');
console.log('- 瀏覽器請開啟: report.html');