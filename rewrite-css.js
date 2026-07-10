const fs = require('fs');

const tailwindImport = `@import "tailwindcss";\n`;
const googleFont = `@import url('https://fonts.googleapis.com/css2?family=Hind:wght@300;400;500;600;700&family=Baloo+2:wght@400;500;600;700;800&family=Poppins:wght@300;400;500;600;700;800;900&display=swap');\n`;

let oldStyle = fs.readFileSync('./old_site/style.css', 'utf8');

const cssVarsIndex = oldStyle.indexOf('/* ===== CSS VARIABLES ===== */');
if (cssVarsIndex !== -1) {
  oldStyle = oldStyle.substring(cssVarsIndex);
}

const newContent = tailwindImport + googleFont + "\n" + oldStyle;

fs.writeFileSync('./src/app/globals.css', newContent, 'utf8');
console.log('Successfully rewrote globals.css perfectly!');
