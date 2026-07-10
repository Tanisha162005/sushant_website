const fs = require('fs');
const path = './src/app/globals.css';
let content = fs.readFileSync(path, 'utf8');

const importStmt = `@import url('https://fonts.googleapis.com/css2?family=Hind:wght@300;400;500;600;700&family=Baloo+2:wght@400;500;600;700;800&family=Poppins:wght@300;400;500;600;700;800;900&display=swap');`;

content = content.split(importStmt).join('');
content = content.replace('@import "tailwindcss";', `@import "tailwindcss";\n${importStmt}`);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed globals.css');
