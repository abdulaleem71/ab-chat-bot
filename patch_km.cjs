const fs = require('fs');
let code = fs.readFileSync('src/components/chatbots/KnowledgeManager.tsx', 'utf8');

code = code.replace(/\\\`/g, '\`');
fs.writeFileSync('src/components/chatbots/KnowledgeManager.tsx', code);
console.log("Success");
