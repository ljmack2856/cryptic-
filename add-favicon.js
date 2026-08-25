// add-favicon.js — run with: node add-favicon.js
const fs = require('fs');
const path = require('path');

const faviconTags = `  <link rel="icon" type="image/x-icon" href="images/favicon.ico" />
  <link rel="icon" type="image/png" sizes="32x32" href="images/favicon-32.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="images/favicon-16.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="images/favicon-180.png" />
`;

const skipDirs = ['node_modules', '.git', 'supabase'];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!skipDirs.includes(entry.name)) walk(fullPath);
    } else if (path.extname(entry.name) === '.html') {
      let content = fs.readFileSync(fullPath, 'utf8');

      // Skip files that already have a favicon tag (idempotent — safe to re-run)
      if (content.includes('favicon.ico') || content.includes('favicon-32.png')) {
        console.log('Skipped (already has favicon):', fullPath);
        continue;
      }

      // Insert right before </head> — works regardless of what else is in <head>
      if (content.includes('</head>')) {
        content = content.replace('</head>', faviconTags + '</head>');
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated:', fullPath);
      } else {
        console.log('WARNING - no </head> found, skipped:', fullPath);
      }
    }
  }
}

walk('.');
console.log('Done. Every .html file should now reference the favicon.');