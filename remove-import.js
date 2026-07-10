const fs = require('fs');
let css = fs.readFileSync('src/app/globals.css', 'utf8');
css = css.replace(/@import url\([^\)]+\);\n?/g, '');
fs.writeFileSync('src/app/globals.css', css, 'utf8');
console.log('Removed all @import url from globals.css');
