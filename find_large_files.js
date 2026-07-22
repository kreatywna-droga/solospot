const fs = require('fs');
const path = require('path');

function getFiles(dir, files = []) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    try {
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        if (!fullPath.includes('.git') && !fullPath.includes('node_modules')) {
          getFiles(fullPath, files);
        }
      } else {
        files.push({ path: fullPath, size: stat.size });
      }
    } catch (e) {}
  }
  return files;
}

const files = getFiles(__dirname);
files.sort((a, b) => b.size - a.size);
files.slice(0, 10).forEach(f => console.log(`${(f.size / 1024 / 1024).toFixed(2)} MB - ${f.path}`));
