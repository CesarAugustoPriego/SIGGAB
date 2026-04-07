const fs = require('fs');
const path = require('path');
function search(dir) {
  let res = [];
  try {
    const list = fs.readdirSync(dir);
    for (const f of list) {
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory()) res = res.concat(search(full));
        else if (full.endsWith('.tsx')) res.push(full);
    }
  } catch(e) {}
  return res;
}
const webFiles = search('c:/Users/DME/Downloads/SIGGAB/Frontend/src');
const mobFiles = search('c:/Users/DME/Downloads/SIGGAB/Mobile/src');

function checkFile(file, isMobile) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  for (let i=0; i<lines.length; i++) {
    const l = lines[i];
    if (l.includes('console.log') || l.includes('() => {}') || l.includes('()=>{}') || l.includes('() => void')) {
        if (l.includes('onClick') || l.includes('onPress')) {
            console.log(file + ':' + (i+1) + ' -> ' + l.trim());
        }
    }
    // Check for mock headers like <View style={styles.iconBtn}> with an icon but no onPress
    if (l.includes('<Feather') || l.includes('<MaterialCommunityIcons')) {
       // if this is inside an iconBtn view but not a pressable
       const p = Math.max(0, i-2);
       const snippet = lines.slice(p, i+2).join(' ');
       // just rough heuristic
    }
  }
}
webFiles.forEach(f => checkFile(f, false));
mobFiles.forEach(f => checkFile(f, true));
