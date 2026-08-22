// rebrand.js — run with: node rebrand.js
const fs = require('fs');
const path = require('path');

const replacements = [
  // Order matters — most specific first
  [/CryptoBitPesa\s*—/g, 'CryptoBitPesa —'],       // page titles
  [/>BITPESA</g, '>BITPESA<'],                      // logo span text only
  [/CryptoBitPesa/g, 'CryptoBitPesa'],             // footer copyright
  [/CryptoBitPesa/g, 'CryptoBitPesa'],               // remaining mixed-case (accountRef, comments)
  [/CRYPTOBITPESA/g, 'CRYPTOBITPESA'],               // remaining all-caps
  [/cryptofxminers\.com/g, 'cryptobitpesa.com'],      // domain references / referral URL
];

const extensions = ['.html', '.js'];
const skipDirs = ['node_modules', '.git'];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!skipDirs.includes(entry.name)) walk(fullPath);
    } else if (extensions.includes(path.extname(entry.name))) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const [pattern, replacement] of replacements) {
        if (pattern.test(content)) {
          content = content.replace(pattern, replacement);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated:', fullPath);
      }
    }
  }
}

walk('.');
console.log('Done. Review the "Updated" list above, then check aml-policy.html, terms-of-services.html, and privacy-policy.html manually.');