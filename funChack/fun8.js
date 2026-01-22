const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

const keywords = new Set(['if', 'for', 'while', 'else', 'switch', 'case', 'break', 'continue', 'return', 'function', 'var', 'let', 'const', 'export', 'import', 'default', 'is', 'to', 'in', 'of', 'new', 'try', 'catch', 'finally', 'void', 'this', 'instanceof', 'typeof', 'true', 'false', 'null', 'undefined']);

const files = globSync('./core/*.js', { ignore: ['node_modules/**', 'analyzer.js', 'report.html'] });
console.log(`[分析開始] 處理檔案：${files.length} 個`);

const funcDefinitions = [];
const varDefinitions = [];
const fileDatabase = {};

files.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    fileDatabase[filePath] = content;
    const lines = content.split('\n');

    // --- 1. 函式解析 ---
    const funcRegex = /function\s+([a-zA-Z0-9_$]+)\s*\(|([a-zA-Z0-9_$]+)\s*=\s*(?:\([^)]*\)|[a-zA-Z0-9_$]+)\s*=>|([a-zA-Z0-9_$]+)\s*:\s*function\s*\(|([a-zA-Z0-9_$.]+)\s*=\s*function\s*\(/g;
    let fMatch;
    while ((fMatch = funcRegex.exec(content)) !== null) {
        let name = fMatch[1] || fMatch[2] || fMatch[3] || fMatch[4];
        if (name) {
            let short = name.includes('.') ? name.split('.').pop() : name;
            if (!keywords.has(short)) {
                const line = content.substring(0, fMatch.index).split('\n').length;
                funcDefinitions.push({ name, short, filePath, line, code: lines[line - 1].trim() });
            }
        }
    }

    // --- 2. 強化版全域變數解析 (支援多行 var a, b, c) ---
    let depth = 0;
    // 使用簡單的狀態機遍歷，避免 Regex 跨行失效
    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        if (char === '{') depth++;
        if (char === '}') depth--;

        // 當處於全域範圍 (depth 0) 且遇到 var/let/const
        if (depth === 0 && (content.substring(i, i+4) === 'var ' || content.substring(i, i+4) === 'let ' || content.substring(i, i+6) === 'const ')) {
            let endOfStatement = content.indexOf(';', i);
            if (endOfStatement !== -1) {
                let statement = content.substring(i, endOfStatement);
                // 移除關鍵字 (var/let/const)
                let varsPart = statement.replace(/^(var|let|const)\s+/, '');
                
                // 處理逗點分隔 (如: a=1, b, c)
                // 這裡用較複雜的拆分，避免拆到物件內部的逗點
                let currentVar = "";
                let parenDepth = 0;
                let braceDepth = 0;
                
                for (let j = 0; j < varsPart.length; j++) {
                    let c = varsPart[j];
                    if (c === '(') parenDepth++;
                    if (c === ')') parenDepth--;
                    if (c === '{') braceDepth++;
                    if (c === '}') braceDepth--;
                    
                    if (c === ',' && parenDepth === 0 && braceDepth === 0) {
                        processVarName(currentVar, i + j, lines, content, filePath);
                        currentVar = "";
                    } else {
                        currentVar += c;
                    }
                }
                processVarName(currentVar, i + varsPart.length, lines, content, filePath);
                
                i = endOfStatement; // 跳過已處理區塊
            }
        }
    }
});

function processVarName(raw, pos, lines, content, filePath) {
    // 抓取等號或逗點前的名稱
    const m = raw.match(/^\s*([a-zA-Z0-9_$]+)/);
    if (m) {
        let name = m[1].trim();
        if (!keywords.has(name) && name.length > 1) {
            const line = content.substring(0, pos).split('\n').length;
            varDefinitions.push({ name, short: name, filePath, line, code: lines[line - 1].trim() });
        }
    }
}

// --- 3. 統計與報表產出 (維持分頁 UI) ---
function getAnalysis(definitions) {
    return definitions.map((def, index) => {
        let distribution = [];
        let total = 0;
        const regex = new RegExp(`\\b${def.short.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
        Object.keys(fileDatabase).forEach(file => {
            const matches = fileDatabase[file].match(regex) || [];
            const count = (file === def.filePath) ? matches.length - 1 : matches.length;
            if (count > 0) {
                distribution.push({ file: path.basename(file), count });
                total += count;
            }
        });
        return { ...def, id: `id-${Math.random().toString(10).substring(2, 10)}`, total, distribution };
    }).sort((a, b) => b.total - a.total);
}

const funcReport = getAnalysis(funcDefinitions);
const varReport = getAnalysis(varDefinitions);

// 產出報告內容 (HTML) ... [此處代碼與前次分頁版本一致，請使用該介面]

// (此處省略 HTML 程式碼，請沿用上一版本的 Tab 分頁 UI 程式碼即可)
// 記得將產出的 HTML 內容寫入檔案

// --- 產出 HTML (與上版相同) ---
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>JS Project Analysis - Advanced</title>
    <style>
        body { font-family: sans-serif; padding: 30px; background: #f4f7f9; color: #333; }
        .tab-nav { display: flex; gap: 5px; margin-bottom: 0; }
        .tab-btn { padding: 12px 30px; cursor: pointer; border: 1px solid #ccc; background: #e0e0e0; border-radius: 8px 8px 0 0; border-bottom: none; }
        .tab-btn.active { background: white; border-top: 4px solid #2563eb; font-weight: bold; }
        .tab-content { display: none; background: white; padding: 20px; border: 1px solid #ccc; border-radius: 0 8px 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .tab-content.active { display: block; }
        table { border-collapse: collapse; width: 100%; }
        th { background: #f8fafc; border-bottom: 2px solid #eee; padding: 12px; text-align: left; position: sticky; top: 0; }
        td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 14px; }
        .zero { color: #f43f5e; font-weight: bold; background: #fff1f2; padding: 2px 4px; border-radius: 4px; }
        .btn-view { background: #2563eb; color: white; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; }
        .dist-info { display: none; background: #f1f5f9; padding: 10px; border-radius: 4px; margin-top: 5px; border-left: 4px solid #2563eb; }
        code { color: #db2777; font-family: Consolas, monospace; background: #fdf2f8; padding: 2px 4px; }
    </style>
</head>
<body>
    <h2>專案開發工具：JS 靜態參考分析</h2>
    <div class="tab-nav">
        <button class="tab-btn active" onclick="openTab(event, 'func-tab')">Function (${funcReport.length})</button>
        <button class="tab-btn" onclick="openTab(event, 'var-tab')">變數 (${varReport.length})</button>
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
        <thead><tr><th>名稱</th><th>位置</th><th>總參考</th><th>檔案分佈</th><th>定義程式碼</th></tr></thead>
        <tbody>
            ${data.map(r => `<tr>
                <td><b>${r.name}</b></td>
                <td>${r.location || path.basename(r.filePath)+':'+r.line}</td>
                <td><span class="${r.total===0?'zero':''}">${r.total}</span></td>
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
console.log('[成功] 報告已更新，請開啟 report.html');