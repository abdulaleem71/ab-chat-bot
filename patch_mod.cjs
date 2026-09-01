const fs = require('fs');
let code = fs.readFileSync('src/services/moderationService.ts', 'utf8');

code = code.replace(/\\\`/g, '\`');
fs.writeFileSync('src/services/moderationService.ts', code);
console.log("Success");
