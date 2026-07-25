const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const arabicPattern = /[\u0600-\u06FF]/;
let output = '';

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const untranslatedArabicLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (arabicPattern.test(line)) {
      // Check if this line contains language checks
      const hasLangToggle = line.includes('lang ===') || line.includes('lang ==') || line.includes('?');
      if (!hasLangToggle) {
        untranslatedArabicLines.push({ lineNum: i + 1, text: line.trim() });
      }
    }
  }

  if (untranslatedArabicLines.length > 0) {
    const relativePath = path.relative(__dirname, filePath);
    output += `\n--- ${relativePath} (${untranslatedArabicLines.length} untranslated-looking lines) ---\n`;
    untranslatedArabicLines.forEach(item => {
      output += `  Line ${item.lineNum}: ${item.text}\n`;
    });
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
        walk(fullPath);
      }
    } else {
      const ext = path.extname(file);
      if (['.ts', '.tsx'].includes(ext)) {
        checkFile(fullPath);
      }
    }
  }
}

walk(srcDir);
fs.writeFileSync(path.join(__dirname, 'untranslated.txt'), output, 'utf8');
console.log('Arabic scan complete. Written to untranslated.txt');
