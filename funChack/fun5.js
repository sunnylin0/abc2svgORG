const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

const keywords = new Set(['if', 'for', 'while', 'else', 'switch', 'case', 'break', 'continue', 'return', 'function', 'var', 'let', 'const', 'export', 'import', 'default', 'is', 'to', 'in', 'of', 'new', 'try', 'catch', 'finally', 'void', 'this', 'instanceof']);

const files = globSync('./core/*.js', { ignore: ['node_modules/**', 'analyzer.js', 'report.html', 'report.csv'] });
console.log(`[分析中] 檔案總數：${files.length}`);

const allDefinitions = [];
const fileDatabase = {};

// 1. 抓取定義
files.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    fileDatabase[filePath] = content;
    const lines = content.split('\n');

    const funcRegex = /function\s+([a-zA-Z0-9_$]+)\s*\(|([a-zA-Z0-9_$]+)\s*=\s*(?:\([^)]*\)|[a-zA-Z0-9_$]+)\s*=>|([a-zA-Z0-9_$]+)\s*:\s*function\s*\(|([a-zA-Z0-9_$.]+)\s*=\s*function\s*\(/g;
    
    let match;
    while ((match = funcRegex.exec(content)) !== null) {
        let rawName = null;
        for (let i = 1; i < match.length; i++) {
            if (match[i]) { rawName = match[i]; break; }
        }

        if (rawName) {
            let shortName = rawName.includes('.') ? rawName.split('.').pop() : rawName;
            if (!keywords.has(shortName) && shortName.length > 1) {
                const lineNumber = content.substring(0, match.index).split('\n').length;
                allDefinitions.push({
                    fullName: rawName,
                    searchName: shortName,
                    filePath,
                    line: lineNumber,
                    status: lines[lineNumber - 1].trim()
                });
            }
        }
    }
});

// 2. 交叉統計 (包含檔案分佈)
const report = allDefinitions.map((def, index) => {
    let fileDistribution = [];
    let grandTotal = 0;
    const searchRegex = new RegExp(`\\b${def.searchName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');

    Object.keys(fileDatabase).forEach(file => {
        const matches = fileDatabase[file].match(searchRegex) || [];
        const count = file === def.filePath ? matches.length - 1 : matches.length; // 扣除定義處
        if (count > 0) {
            fileDistribution.push({ fileName: path.basename(file), count });
            grandTotal += count;
        }
    });

    return {
        id: `func-${index}`,
        name: def.fullName,
        location: `${path.basename(def.filePath)}:${def.line}`,
        count: grandTotal,
        code: def.status,
        distribution: fileDistribution
    };
});

report.sort((a, b) => b.count - a.count);
report.map(r => r.distribution.sort((a, b) => b.count - a.count));

// 3. 匯出 HTML (包含按鈕與 JS 互動)
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>JS Function Analysis</title>
    <style>
        body { font-family: "Segoe UI", Tahoma, sans-serif; padding: 20px; background: #f0f2f5; }
        .container { max-width: 1200px; margin: auto; }
        table { border-collapse: collapse; width: 100%; background: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden; }
        th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #eee; }
        th { background: #2563eb; color: white; position: sticky; top: 0; }
        tr:hover { background: #f8fafc; }
        .btn-detail { background: #10b981; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; }
        .btn-detail:hover { background: #059669; }
        .dist-panel { display: none; background: #f1f5f9; padding: 10px; margin-top: 5px; border-radius: 4px; font-size: 13px; }
        .zero { color: #ef4444; font-weight: bold;}
		.distribution_cell{width:180px;}
        code { color: #be185d; font-family: Consolas, monospace; }
    </style>
</head>
<body>
    <div class="container">
        <h2>JS 專案函式參考報告 (跨檔案分佈)</h2>
        <table>
            <thead>
                <tr>
                    <th>函式名稱</th>
                    <th>定義位置</th>
                    <th>總參考</th>
                    <th>操作</th>
                    <th>原始碼</th>
                </tr>
            </thead>
            <tbody>
                ${report.map(r => `
                <tr>
                    <td><b>${r.name}</b></td>
                    <td>${r.location}</td>
                    <td class="${r.count === 0 ? 'zero' : ''}">${r.count}</td>
                    <td class="distribution_cell">
                        ${r.count > 0 ? `<button class="btn-detail" onclick="toggle('${r.id}')">查看分佈</button>` : '-'}
                        <div id="${r.id}" class="dist-panel">
                            ${r.distribution.map(d => `<div>• ${d.fileName}: <b>${d.count}</b> 次</div>`).join('')}
                        </div>
                    </td>
                    <td><code>${r.code.replace(/</g, '&lt;')}</code></td>
                </tr>`).join('')}
            </tbody>
        </table>
    </div>
    <script>
        function toggle(id) {
            const el = document.getElementById(id);
            el.style.display = (el.style.display === 'block') ? 'none' : 'block';
        }
    </script>
</body>
</html>`;

fs.writeFileSync('report.html', htmlContent);
console.log('[完成] 請開啟 report.html 查看互動式報告');