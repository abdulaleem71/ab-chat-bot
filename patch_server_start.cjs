const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `  } catch (err) {
    console.error('[TRIAL_CRON] Setup error:', err);
  }

  if (process.env.VERCEL) {`;

const replacement = `  } catch (err) {
    console.error('[TRIAL_CRON] Setup error:', err);
  }

  // Background Job Queue Worker
  try {
    const { JobService } = await import('./src/services/jobService');
    JobService.startWorker();
    console.log('[JOB_WORKER] Started polling for background jobs.');
  } catch (err) {
    console.error('[JOB_WORKER] Failed to start:', err);
  }

  if (process.env.VERCEL) {`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('server.ts', code);
  console.log("Success");
} else {
  console.log("Target not found");
}
