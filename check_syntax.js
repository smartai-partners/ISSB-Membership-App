const fs = require('fs');

const filePath = '/workspace/issb-portal/src/components/layout/Navbar.tsx';
const content = fs.readFileSync(filePath, 'utf8');

// Simple check for common JSX syntax issues
const lines = content.split('\n');

// Check for unclosed JSX elements around line 271
console.log('Lines around 271:');
for (let i = 268; i <= 274; i++) {
  console.log(`${i}: ${lines[i-1]}`);
}

// Count opening and closing braces and angle brackets
let openBraces = 0;
let openParens = 0;
let openAngle = 0;

for (const line of lines) {
  for (const char of line) {
    if (char === '{') openBraces++;
    if (char === '}') openBraces--;
    if (char === '(') openParens++;
    if (char === ')') openParens--;
    if (char === '<') openAngle++;
    if (char === '>') openAngle--;
  }
}

console.log('\nBracket counts:');
console.log('Braces:', openBraces);
console.log('Parentheses:', openParens);
console.log('Angle brackets:', openAngle);

if (openBraces !== 0) console.log('❌ Unbalanced braces');
if (openParens !== 0) console.log('❌ Unbalanced parentheses');
if (openAngle !== 0) console.log('❌ Unbalanced angle brackets');
