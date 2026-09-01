import { IntegrationRepo } from '../repositories/integrationRepo';

export class HubspotSyncService {
  static async syncContact(
    tenantId: string,
    contact: { name?: string; email?: string; externalId?: string }
  ): Promise<void> {
    if (!contact.email || !contact.email.includes('@')) return;
    try {
      const config = await IntegrationRepo.getConfigDecrypted(tenantId, 'hubspot');
      const apiKey = config.apiKey || config.accessToken || config.token;
      if (!apiKey) return;

      const email = contact.email.toLowerCase().trim();
      const name = contact.name || 'Website Visitor';
      const [firstName, ...lastNameParts] = name.split(' ');
      const lastName = lastNameParts.join(' ');

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      };

      // 1. Search if contact already exists in HubSpot by email (prevents duplicate CRM contact records)
      const searchRes = await globalThis.fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          filterGroups: [
            {
              filters: [
                {
                  propertyName: 'email',
                  operator: 'EQ',
                  value: email,
                },
              ],
            },
          ],
        }),
      });

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.results && searchData.results.length > 0) {
          const hubspotContactId = searchData.results[0].id;
          // Update existing HubSpot contact record
          await globalThis.fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${hubspotContactId}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
              properties: {
                email,
                firstname: firstName || '',
                lastname: lastName || '',
                lifecyclestage: 'lead',
                ...(contact.externalId ? { nomadschat_visitor_id: contact.externalId } : {}),
              },
            }),
          });
          return;
        }
      }

      // 2. Create new contact in HubSpot if not found
      await globalThis.fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          properties: {
            email,
            firstname: firstName || '',
            lastname: lastName || '',
            lifecyclestage: 'lead',
            ...(contact.externalId ? { nomadschat_visitor_id: contact.externalId } : {}),
          },
        }),
      });
    } catch (err) {
      console.error('HubSpot contact sync error:', err);
    }
  }
}
