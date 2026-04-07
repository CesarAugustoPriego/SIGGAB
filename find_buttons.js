const fs = require('fs');
const path = require('path');

function searchFiles(dir, exts) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results = results.concat(searchFiles(full, exts));
    } else if (exts.includes(path.extname(full))) {
      results.push(full);
    }
  }
  return results;
}

const findMissingHandlers = (dir, isMobile) => {
  const files = searchFiles(dir, ['.tsx']);
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const regex = isMobile ? /<Pressable[^>]*>/g : /<button[^>]*>/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const tag = match[0];
      const hasHandler = isMobile ? tag.includes('onPress') : tag.includes('onClick');
      const isSubmit = tag.includes('type="submit"');
      if (!hasHandler && !isSubmit) {
        // get line number
        const line = content.substring(0, match.index).split('\n').length;
        console.log([] : - );
      }
    }
    
    // Also check for Button or IconButton components
    const btnRegex = /<Button[^>]*>|<IconButton[^>]*>/g;
    while ((match = btnRegex.exec(content)) !== null) {
        const tag = match[0];
        const hasHandler = isMobile ? tag.includes('onPress') : tag.includes('onClick');
        const isSubmit = tag.includes('type="submit"');
        if (!hasHandler && !isSubmit) {
            const line = content.substring(0, match.index).split('\n').length;
            console.log([] : - );
        }
    }
  }
};

findMissingHandlers('c:/Users/DME/Downloads/SIGGAB/Frontend/src', false);
findMissingHandlers('c:/Users/DME/Downloads/SIGGAB/Mobile/src', true);
