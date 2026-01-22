const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

const keywords = new Set(['if', 'for', 'while', 'else', 'switch', 'case', 'break', 'continue', 'return', 'function', 'var', 'let', 'const', 'export', 'import', 'default', 'is', 'to', 'in', 'of', 'new', 'try', 'catch', 'finally', 'void']);

const files = globSync('./core/*.js', { ignore: ['node_modules/**', 'analyze.js'] });

const allDefinitions = [];
const fileDatabase = {};

files.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    fileDatabase[filePath] = content;
    const lines = content.split('\n');

    /**
     * Regex 詳解：
     * 1. 標準: function name()
     * 2. 箭頭: name = () =>
     * 3. 物件屬性: name: function()
     * 4. 原型/賦值: xxx.prototype.name = function()  <-- 新增重點
     */
    const funcRegex = /\bfunction\s+([a-zA-Z0-9_$]+)\s*\(|\b([a-zA-Z0-9_$]+)\s*=\s*(?:\([^)]*\)|[a-zA-Z0-9_$]+)\s*=>|([a-zA-Z0-9_$]+)\s*:\s*function\s*\(|([a-zA-Z0-9_$.]+)\s*=\s*function\s*\(/g;
    
    let match;
    while ((match = funcRegex.exec(content)) !== null) {
        // 取得四種匹配模式中任何一個有值的部分
        let name = match[1] || match[2] || match[3] || match[4];
        
        // 如果是 prototype 的寫法，通常我們只想看最後面的 function name
        // 例如從 "abc2svg.prototype.set_width" 提取出 "set_width"
        let displayName = name;
        if (name.includes('.')) {
            const parts = name.split('.');
            displayName = parts[parts.length - 1];
        }

        if (displayName && !keywords.has(displayName) && displayName.length > 1) {
            const lineNumber = content.substring(0, match.index).split('\n').length;
            const statusString = lines[lineNumber - 1].trim();

            allDefinitions.push({ 
                fullName: name,      // 完整的名稱 (如 xxx.prototype.set_width)
                shortName: displayName, // 搜尋用的短名稱 (如 set_width)
                filePath, 
                line: lineNumber, 
                status: statusString 
            });
        }
    }
});

const report = allDefinitions.map(def => {
    let totalCount = 0;
    // 使用短名稱來搜尋全專案的參考次數
    const searchRegex = new RegExp(`\\b${def.shortName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');

    Object.keys(fileDatabase).forEach(file => {
        const matches = fileDatabase[file].match(searchRegex) || [];
        totalCount += matches.length;
    });

    return {
        '函式全名': def.fullName,
        '定義檔案': `${path.basename(def.filePath)}:${def.line}`,
        '定義狀態': def.status.length > 50 ? def.status.substring(0, 47) + '...' : def.status,
        '總參考': totalCount - 1
    };
});

report.sort((a, b) => b['總參考'] - a['總參考']);

console.log(`\n--- 跨檔案分析報告 (含 Prototype 與賦值模式) ---`);
console.table(report.slice(0, 100));