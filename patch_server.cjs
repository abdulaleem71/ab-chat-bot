const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target1 = `app.post('/api/knowledge/scrape-url', requireAuth, requirePermission('manage_knowledge_base'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { url, chatbotIds } = req.body || {};
  if (!url || typeof url !== 'string' || url.length > 2000) {
    return res.status(400).json({ success: false, error: 'Valid URL is required' });
  }
  const targetBotIds = Array.isArray(chatbotIds) ? chatbotIds : [];

  try {
    const source = await KnowledgeService.scrapeAndIngestUrl(req.user!.tenantId, url, targetBotIds);
    if (source) {
      await checkAndFlagContent(req.user!.tenantId, source.id, source.title, 'knowledge_base', source.content);
    }
    res.json({ success: true, knowledgeSource: source });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'Failed to crawl target URL' });
  }
}));`;

const replacement1 = `app.post('/api/knowledge/scrape-url', requireAuth, requirePermission('manage_knowledge_base'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { url, chatbotIds } = req.body || {};
  if (!url || typeof url !== 'string' || url.length > 2000) {
    return res.status(400).json({ success: false, error: 'Valid URL is required' });
  }
  const targetBotIds = Array.isArray(chatbotIds) ? chatbotIds : [];

  try {
    const { JobService } = await import('./src/services/jobService');
    await JobService.enqueue({
      tenantId: req.user!.tenantId,
      type: 'scrape_url',
      payload: { url, chatbotIds: targetBotIds },
      maxAttempts: 1
    });
    
    // Return a dummy pending source for the UI
    const pendingSource = {
      id: 'pending_' + Date.now(),
      chatbotIds: targetBotIds,
      tenantId: req.user!.tenantId,
      title: url,
      type: 'url',
      status: 'pending',
      content: 'Crawling in progress...',
      chunkCount: 0,
      updatedAt: new Date().toISOString()
    };
    res.json({ success: true, knowledgeSource: pendingSource });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'Failed to enqueue target URL crawl job' });
  }
}));`;

const target2 = `app.post('/api/chatbots/:id/scrape-url', requireAuth, requirePermission('manage_knowledge_base'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { url } = req.body || {};
  if (!url || typeof url !== 'string' || url.length > 2000) {
    return res.status(400).json({ success: false, error: 'Valid URL is required' });
  }

  try {
    const source = await KnowledgeService.scrapeAndIngestUrl(req.user!.tenantId, url, [req.params.id]);
    res.json({ success: true, knowledgeSource: source });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'Failed to crawl target URL' });
  }
}));`;

const replacement2 = `app.post('/api/chatbots/:id/scrape-url', requireAuth, requirePermission('manage_knowledge_base'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { url } = req.body || {};
  if (!url || typeof url !== 'string' || url.length > 2000) {
    return res.status(400).json({ success: false, error: 'Valid URL is required' });
  }

  try {
    const { JobService } = await import('./src/services/jobService');
    await JobService.enqueue({
      tenantId: req.user!.tenantId,
      type: 'scrape_url',
      payload: { url, chatbotIds: [req.params.id] },
      maxAttempts: 1
    });
    
    const pendingSource = {
      id: 'pending_' + Date.now(),
      chatbotIds: [req.params.id],
      tenantId: req.user!.tenantId,
      title: url,
      type: 'url',
      status: 'pending',
      content: 'Crawling in progress...',
      chunkCount: 0,
      updatedAt: new Date().toISOString()
    };
    res.json({ success: true, knowledgeSource: pendingSource });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'Failed to enqueue target URL crawl job' });
  }
}));`;


let success = true;
if (code.includes(target1)) {
  code = code.replace(target1, replacement1);
  console.log("Replaced target1");
} else {
  console.log("Target 1 not found");
  success = false;
}

if (code.includes(target2)) {
  code = code.replace(target2, replacement2);
  console.log("Replaced target2");
} else {
  console.log("Target 2 not found");
  success = false;
}

if (success) {
  fs.writeFileSync('server.ts', code);
}
