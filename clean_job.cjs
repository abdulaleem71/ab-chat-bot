const fs = require('fs');
let code = fs.readFileSync('src/services/jobService.ts', 'utf8');

const target = `      } else if (job.type === 'auto_crawl_url') {
        const { KnowledgeService } = await import('./knowledgeService');
        await KnowledgeService.autoCrawlUrl(
          String(job.tenant_id),
          payload.url,
          payload.chatbotId
        );`;

if (code.includes(target)) {
  code = code.replace(target, '');
  fs.writeFileSync('src/services/jobService.ts', code);
  console.log("Success");
}
