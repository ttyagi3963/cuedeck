const fs = require('fs');
const path = require('path');

function findTsxFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findTsxFiles(fullPath, fileList);
    } else if (fullPath.endsWith('.tsx')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const replacements = {
  // Backgrounds
  '\\bbg-zinc-50\\b': 'bg-background-page',
  '\\bbg-zinc-100\\b': 'bg-background-hover',
  '\\bbg-zinc-800\\b': 'bg-background-tooltip',
  '\\bbg-zinc-900\\b': 'bg-background-primary',
  '\\bbg-white\\b': 'bg-surface',
  '\\bbg-black\\b': 'bg-video-bg',
  '\\bbg-red-500\\b': 'bg-notification-badge',
  '\\bbg-red-600\\b': 'bg-danger',

  // Texts
  '\\btext-zinc-800\\b': 'text-text-heading',
  '\\btext-zinc-500\\b': 'text-text-muted',
  '\\btext-white\\b': 'text-text-on-primary',
  '\\btext-black\\b': 'text-text-on-warning',
  '\\btext-red-900\\b': 'text-text-danger',
  '\\btext-red-400\\b': 'text-text-danger-subtle',
  '\\btext-red-600\\b': 'text-text-danger-strong',
  '\\btext-green-600\\b': 'text-trend-positive',

  // Borders
  '\\bborder-zinc-200\\b': 'border-border-default',
  '\\bborder-zinc-300\\b': 'border-border-subtle',
  '\\bborder-zinc-900\\b': 'border-border-active',
  '\\bborder-white\\b': 'border-border-on-primary',
  '\\bborder-red-500\\b': 'border-danger',

  // Spacing (Gaps)
  '\\bgap-1\\b': 'gap-content-gap-xxs',
  '\\bgap-2\\b': 'gap-content-gap-xs',
  '\\bgap-3\\b': 'gap-content-gap-md',
  '\\bgap-4\\b': 'gap-content-gap-sm',
  '\\bgap-6\\b': 'gap-dialog-gap',
  '\\bgap-8\\b': 'gap-page-gap',
  '\\bgap-12\\b': 'gap-content-gap-xl',

  // Paddings
  '\\bp-4\\b': 'p-content-p-sm',
  '\\bp-6\\b': 'p-content-p-md',
  '\\bp-8\\b': 'p-content-p-lg',

  // Radius
  '\\brounded-md\\b': 'rounded-button-primary',
  '\\brounded-lg\\b': 'rounded-dialog',
  '\\brounded-xl\\b': 'rounded-ad-markers',
  '\\brounded-full\\b': 'rounded-full'
};

const tsxFiles = findTsxFiles(path.join(__dirname, 'src/app'));
let totalReplacements = 0;

for (const file of tsxFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  for (const [regexStr, replacement] of Object.entries(replacements)) {
    const regex = new RegExp(regexStr, 'g');
    content = content.replace(regex, replacement);
  }

  if (original !== content) {
    fs.writeFileSync(file, content, 'utf8');
    totalReplacements++;
    console.log('Updated', file);
  }
}

console.log('Total files updated:', totalReplacements);
