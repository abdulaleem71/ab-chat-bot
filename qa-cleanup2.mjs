import { createClient } from '@libsql/client';
const db = createClient({ url: 'file:nomadschat.db' });

// 1. Remove conversations created during QA testing (after the seed's conv_1)
const convRes = await db.execute(`SELECT id FROM conversations WHERE created_at >= '2026-08-12T10:00:00Z';`);
for (const row of convRes.rows) {
  await db.execute({ sql: `DELETE FROM messages WHERE conversation_id = ?;`, args: [String(row.id)] });
  await db.execute({ sql: `DELETE FROM leads WHERE conversation_id = ?;`, args: [String(row.id)] });
  await db.execute({ sql: `DELETE FROM conversations WHERE id = ?;`, args: [String(row.id)] });
}
console.log('Removed QA conversations:', convRes.rows.length);

// 2. Remove QA users + their tenants (cascades bots/knowledge/subscriptions/org members)
const qaUsers = await db.execute(`SELECT id, tenant_id FROM users WHERE email LIKE 'qa_%@test.local' OR email LIKE 'qa_a_%' OR email LIKE 'qa_b_%';`);
for (const u of qaUsers.rows) {
  const tid = String(u.tenant_id);
  await db.execute({ sql: `DELETE FROM organization_members WHERE tenant_id = ?;`, args: [tid] });
  await db.execute({ sql: `DELETE FROM subscriptions WHERE tenant_id = ?;`, args: [tid] });
  await db.execute({ sql: `DELETE FROM knowledge_chunks WHERE tenant_id = ?;`, args: [tid] });
  await db.execute({ sql: `DELETE FROM knowledge_sources WHERE tenant_id = ?;`, args: [tid] });
  await db.execute({ sql: `DELETE FROM chatbots WHERE tenant_id = ?;`, args: [tid] });
  await db.execute({ sql: `DELETE FROM conversations WHERE tenant_id = ?;`, args: [tid] });
  await db.execute({ sql: `DELETE FROM leads WHERE tenant_id = ?;`, args: [tid] });
  await db.execute({ sql: `DELETE FROM users WHERE id = ?;`, args: [String(u.id)] });
  await db.execute({ sql: `DELETE FROM tenants WHERE id = ?;`, args: [tid] });
}
console.log('Removed QA users:', qaUsers.rows.length);

for (const t of ['users','tenants','chatbots','conversations','messages','leads','knowledge_sources','knowledge_chunks']) {
  const r = await db.execute(`SELECT COUNT(*) as c FROM ${t}`);
  console.log(t + ':', r.rows[0].c);
}
