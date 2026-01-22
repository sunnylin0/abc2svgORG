const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

const keywords = new Set(['if', 'for', 'while', 'else', 'switch', 'case', 'break', 'continue', 'return', 'function', 'var', 'let', 'const', 'export', 'import', 'default', 'is', 'to', 'in', 'of', 'new', 'try', 'catch', 'finally', 'void', 'this', 'instanceof', 'typeof', 'true', 'false', 'null', 'undefined']);

const files = globSync('./core/deco.js', { ignore: ['node_modules/**', 'analyzer.js', 'report.html', 'report.csv'] });
console.log(`[分析中] 檔案總數：${files.length}`);

const funcDefinitions = [];
const varDefinitions = [];
const fileDatabase = {};

// 1. 讀取所有檔案內容
files.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    fileDatabase[filePath] = content;
    const lines = content.split('\n');

    // --- 函式 Regex ---
    const funcRegex = /function\s+([a-zA-Z0-9_$]+)\s*\(|([a-zA-Z0-9_$]+)\s*=\s*(?:\([^)]*\)|[a-zA-Z0-9_$]+)\s*=>|([a-zA-Z0-9_$]+)\s*:\s*function\s*\(|([a-zA-Z0-9_$.]+)\s*=\s*function\s*\(/g;
    
    // --- 變數 Regex (抓取 var/let/const name = value) ---
    const varRegex = /\b(?:var|let|const)\s+([a-zA-Z0-9_$]+)\s*=\s*[^;]+/g;

    let match;
    // 抓函式
    while ((match = funcRegex.exec(content)) !== null) {
        let name = match[1] || match[2] || match[3] || match[4];
        if (name) {
            let short = name.includes('.') ? name.split('.').pop() : name;
            if (!keywords.has(short) && short.length > 1) {
                const line = content.substring(0, match.index).split('\n').length;
                funcDefinitions.push({ name, short, filePath, line, code: lines[line - 1].trim() });
            }
        }
    }
    // 抓變數
    while ((match = varRegex.exec(content)) !== null) {
        let name = match[1];
        if (name && !keywords.has(name) && name.length > 1) {
            const line = content.substring(0, match.index).split('\n').length;
            varDefinitions.push({ name, short: name, filePath, line, code: lines[line - 1].trim() });
        }
    }
});

// 2. 統計邏輯 (封裝成通用 function)
function getAnalysis(definitions) {
    return definitions.map((def, index) => {
        let distribution = [];
        let total = 0;
        const regex = new RegExp(`\\b${def.short.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');

        Object.keys(fileDatabase).forEach(file => {
            const matches = fileDatabase[file].match(regex) || [];
            const count = file === def.filePath ? matches.length - 1 : matches.length;
            if (count > 0) {
                distribution.push({ file: path.basename(file), count });
                total += count;
            }
        });
		distribution.sort((a, b) => b.count - a.count);
        return { ...def, id: `id-${Math.random().toString(36).substr(2, 9)}`, total, distribution };
    }).sort((a, b) => b.total - a.total);
}

const funcReport = getAnalysis(funcDefinitions);
const varReport = getAnalysis(varDefinitions);

// 3. 產出分頁 HTML
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>JS Project Analysis</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 30px; background: #f4f7f9; }
        .tab-nav { display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 2px solid #ddd; }
        .tab-btn { padding: 10px 25px; cursor: pointer; border: none; background: #eee; font-size: 16px; border-radius: 8px 8px 0 0; }
        .tab-btn.active { background: #2563eb; color: white; font-weight: bold; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        table { border-collapse: collapse; width: 100%; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        th { background: #2563eb; color: white; padding: 15px; text-align: left; position: sticky; top: 0; }
        td { padding: 12px 15px; border-bottom: 1px solid #eee; }
        .zero { color: #f43f5e; font-weight: bold; }
        .dist-info { display: none; background: #f8fafc; padding: 10px; border: 1px solid #e2e8f0; border-radius: 4px; margin-top: 5px; font-size: 13px; }
        .btn-view { background: #10b981; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; }
        code { color: #db2777; font-size: 12px; }
    </style>
</head>
<body>
    <h1>專案靜態分析報告</h1>
    <div class="tab-nav">
        <button class="tab-btn active" onclick="openTab(event, 'func-tab')">Function 參考</button>
        <button class="tab-btn" onclick="openTab(event, 'var-tab')">變數參考</button>
    </div>

    <div id="func-tab" class="tab-content active">${createTable(funcReport)}</div>
    <div id="var-tab" class="tab-content">${createTable(varReport)}</div>

    <script>
        function openTab(evt, tabId) {
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
            evt.currentTarget.classList.add('active');
        }
        function toggle(id) {
            const el = document.getElementById(id);
            el.style.display = (el.style.display === 'block') ? 'none' : 'block';
        }
    </script>
</body>
</html>`;

function createTable(data) {
    return `<table>
        <thead><tr><th>名稱</th><th>定義位置</th><th>總參考</th><th>詳細分佈</th><th>原始碼</th></tr></thead>
        <tbody>
            ${data.map(r => `<tr>
                <td><b>${r.name}</b></td>
                <td>${path.basename(r.filePath)}:${r.line}</td>
                <td class="${r.total===0?'zero':''}">${r.total}</td>
                <td>
                    ${r.total > 0 ? `<button class="btn-view" onclick="toggle('${r.id}')">查看</button>
                    <div id="${r.id}" class="dist-info">${r.distribution.map(d => `<div>• ${d.file}: <b>${d.count}</b></div>`).join('')}</div>` : '-'}
                </td>
                <td><code>${r.code.replace(/</g, '&lt;')}</code></td>
            </tr>`).join('')}
        </tbody>
    </table>`;
}

fs.writeFileSync('report.html', htmlContent);
console.log('[成功] 已產生分頁報告：report.html');