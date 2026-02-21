const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

let changedFiles = 0;

walkDir(srcDir, function (filePath) {
    if (filePath.endsWith('.js') || filePath.endsWith('.jsx') || filePath.endsWith('.css')) {
        let content = fs.readFileSync(filePath, 'utf8');

        let newContent = content.replace(/font-medium/g, 'font-normal');

        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            changedFiles++;
            console.log(`Replaced in ${filePath}`);
        }
    }
});

console.log(`Total files modified: ${changedFiles}`);
