const fs = require('fs');
let code = fs.readFileSync('src/services/jobService.ts', 'utf8');

code = code.replace(/\\\`/g, '\`');
fs.writeFileSync('src/services/jobService.ts', code);
console.log("Success");
