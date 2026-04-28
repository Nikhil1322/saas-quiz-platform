const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\nikhi\\OneDrive\\Desktop\\Quiz project\\admin-dashboard\\app';

function walk(dir, callback) {
    fs.readdirSync(dir).forEach( f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
};

walk(dir, (filePath) => {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.js')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let original = content;
        content = content.replace(/localStorage\.getItem\(['"]token['"]\)/g, 'localStorage.getItem("merchant_token")');
        content = content.replace(/localStorage\.setItem\(['"]token['"]\s*,/g, 'localStorage.setItem("merchant_token",');
        content = content.replace(/localStorage\.removeItem\(['"]token['"]\)/g, 'localStorage.removeItem("merchant_token")');
        
        if (content !== original) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated: ${filePath}`);
        }
    }
});
