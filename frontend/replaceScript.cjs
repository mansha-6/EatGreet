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

walkDir(srcDir, function (filePath) {
    if (filePath.endsWith('.js') || filePath.endsWith('.jsx') || filePath.endsWith('.css')) {
        let content = fs.readFileSync(filePath, 'utf8');

        // Regex to match anything like bg-orange-50, text-orange-600, hover:bg-orange-100, etc.
        // It matches the prefix (bg, text, border, etc.) and replaces the orange part with [#FD6941]
        // This also handles opacity modifiers like bg-orange-50/50 
        let newContent = content.replace(/(bg|text|border|ring|from|to|shadow|fill)-orange-[0-9]{2,3}(\/[0-9]{1,3})?/g, '$1-[#FD6941]');

        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`Replaced in ${filePath}`);
        }
    }
});
