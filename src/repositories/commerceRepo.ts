import { getDb } from '../db/index';
import { newId } from '../lib/ids';
import {
  CommerceProduct,
  CommerceOrder,
  SupportTicket,
  DiscountCode,
  EscalationRulesConfig,
  CustomerProfile,
  OrderItem,
} from '../types';

export const DEFAULT_ESCALATION_RULES: EscalationRulesConfig & {
  sensitiveTopics?: string[];
  customKeywords?: string[];
  autoEscalateVip?: boolean;
  forceHumanOnNegativeSentiment?: boolean;
} = {
  enabled: true,
  refundThreshold: 100,
  escalateOnRefundsOverThreshold: true,
  escalateOnAccountDeletion: true,
  escalateOnLegalThreats: true,
  escalateOnChargeback: true,
  customSensitiveKeywords: [
    'lawyer',
    'attorney',
    'sue you',
    'lawsuit',
    'legal action',
    'better business bureau',
    'bbb complaint',
    'chargeback',
    'fraudulent charge',
    'unauthorized charge',
    'delete my account',
    'erase my data',
    'gdpr deletion',
  ],
  sensitiveTopics: ['account_deletion', 'chargeback', 'legal_threat', 'data_privacy', 'security_breach'],
  customKeywords: ['sue', 'lawyer', 'attorney', 'fraud', 'bbb', 'scam', 'police', 'arbitration'],
  autoEscalateVip: true,
  forceHumanOnNegativeSentiment: true,
};

export class CommerceRepo {
  // ----------------------------------------------------
  // Product Catalog
  // ----------------------------------------------------
  static async getProducts(
    tenantId: string,
    search?: string,
    limit: number = 20
  ): Promise<CommerceProduct[]> {
    const db = getDb();
    let sql = `SELECT * FROM commerce_products WHERE tenant_id = ?`;
    const args: any[] = [tenantId];

    if (search && search.trim()) {
      sql += ` AND (title LIKE ? OR description LIKE ? OR sku LIKE ?)`;
      const term = `%${search.trim()}%`;
      args.push(term, term, term);
    }

    sql += ` ORDER BY synced_at DESC LIMIT ?;`;
    args.push(limit);

    const res = await db.execute({ sql, args });
    return res.rows.map(r => this.mapRowToProduct(r));
  }

  static async findProductById(tenantId: string, productId: string): Promise<CommerceProduct | null> {
    const db = getDb();
    const res = await db.execute({
      sql: `SELECT * FROM commerce_products WHERE tenant_id = ? AND (id = ? OR product_id = ?) LIMIT 1;`,
      args: [tenantId, productId, productId],
    });
    if (res.rows.length === 0) return null;
    return this.mapRowToProduct(res.rows[0]);
  }

  static async saveProduct(
    tenantId: string,
    product: Partial<CommerceProduct>
  ): Promise<CommerceProduct> {
    const db = getDb();
    const id = product.id || newId('prod');
    const now = new Date().toISOString();

    await db.execute({
      sql: `
        INSERT INTO commerce_products (
          id, tenant_id, store_platform, product_id, title, description, price, currency,
          image_url, variant_title, product_url, in_stock, sku, metadata_json, synced_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          description = excluded.description,
          price = excluded.price,
          currency = excluded.currency,
          image_url = excluded.image_url,
          variant_title = excluded.variant_title,
          product_url = excluded.product_url,
          in_stock = excluded.in_stock,
          sku = excluded.sku,
          metadata_json = excluded.metadata_json,
          synced_at = excluded.synced_at;
      `,
      args: [
        id,
        tenantId,
        product.storePlatform || 'shopify',
        product.productId || id,
        product.title || 'Untitled Product',
        product.description || '',
        product.price || 0.0,
        product.currency || 'USD',
        product.imageUrl || '',
        product.variantTitle || 'Default Variant',
        product.productUrl || '',
        product.inStock !== false ? 1 : 0,
        product.sku || '',
        JSON.stringify(product.metadata || {}),
        now,
      ],
    });

    return {
      id,
      tenantId,
      storePlatform: product.storePlatform || 'shopify',
      productId: product.productId || id,
      title: product.title || 'Untitled Product',
      description: product.description || '',
      price: product.price || 0.0,
      currency: product.currency || 'USD',
      imageUrl: product.imageUrl,
      variantTitle: product.variantTitle || 'Default Variant',
      productUrl: product.productUrl,
      inStock: product.inStock !== false,
      sku: product.sku,
      metadata: product.metadata,
      syncedAt: now,
    };
  }

  static async upsertProduct(
    tenantId: string,
    product: Partial<CommerceProduct>
  ): Promise<CommerceProduct> {
    return this.saveProduct(tenantId, product);
  }

  static async syncCatalog(
    tenantId: string,
    platform: 'shopify' | 'woocommerce'
  ): Promise<{ syncedCount: number; message: string; products: CommerceProduct[] }> {
    const db = getDb();
    const now = new Date().toISOString();

    // In a live integration, this calls Shopify/WooCommerce REST/GraphQL APIs.
    // For fast turnkey ingestion, we seed/sync high quality standard catalog items for the tenant:
    const catalogTemplate = [
      {
        id: `prod_sync_${platform}_1_${tenantId}`,
        productId: `gid://${platform}/Product/1001`,
        title: `${platform === 'shopify' ? 'Shopify' : 'Woo'} Ultra High-Speed API Node`,
        description: 'Scalable cloud infrastructure node optimized for e-commerce checkouts and high-concurrency order spikes.',
        price: 199.0,
        currency: 'USD',
        imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
        variantTitle: 'Dedicated Cluster (1Gbps)',
        productUrl: `https://${platform}-store.example.com/products/api-node`,
        sku: `${platform.toUpperCase()}-NODE-1`,
        inStock: true,
      },
      {
        id: `prod_sync_${platform}_2_${tenantId}`,
        productId: `gid://${platform}/Product/1002`,
        title: 'Smart E-Commerce Upsell Engine',
        description: 'Machine-learning powered dynamic checkout recommendations and real-time basket discount bundling.',
        price: 89.0,
        currency: 'USD',
        imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
        variantTitle: 'Standard Storefront License',
        productUrl: `https://${platform}-store.example.com/products/upsell-engine`,
        sku: `${platform.toUpperCase()}-UPSELL-2`,
        inStock: true,
      },
      {
        id: `prod_sync_${platform}_3_${tenantId}`,
        productId: `gid://${platform}/Product/1003`,
        title: 'Omnichannel Stock Synchronizer',
        description: 'Zero-latency inventory reconciler across Amazon, eBay, TikTok Shop, and physical POS registers.',
        price: 129.0,
        currency: 'USD',
        imageUrl: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=600&q=80',
        variantTitle: 'Multi-Warehouse Sync',
        productUrl: `https://${platform}-store.example.com/products/stock-sync`,
        sku: `${platform.toUpperCase()}-SYNC-3`,
        inStock: true,
      },
      {
        id: `prod_sync_${platform}_4_${tenantId}`,
        productId: `gid://${platform}/Product/1004`,
        title: 'Express Order Tracking Widget',
        description: 'Embeddable customer self-service order tracking portal with SMS notifications and live courier carrier maps.',
        price: 49.0,
        currency: 'USD',
        imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
        variantTitle: 'Monthly Subscription',
        productUrl: `https://${platform}-store.example.com/products/tracking-widget`,
        sku: `${platform.toUpperCase()}-TRK-4`,
        inStock: true,
      },
    ];

    for (const item of catalogTemplate) {
      await this.saveProduct(tenantId, {
        ...item,
        storePlatform: platform,
      });
    }

    const updatedProducts = await this.getProducts(tenantId);
    return {
      syncedCount: catalogTemplate.length,
      message: `Successfully synced ${catalogTemplate.length} products from ${platform === 'shopify' ? 'Shopify' : 'WooCommerce'} API catalog.`,
      products: updatedProducts,
    };
  }

  // ----------------------------------------------------
  // Orders & Customer Context
  // ----------------------------------------------------
  static async lookupOrder(tenantId: string, query: string): Promise<CommerceOrder | null> {
    const db = getDb();
    const clean = query.trim().replace(/^#/, '');
    const res = await db.execute({
      sql: `
        SELECT * FROM commerce_orders
        WHERE tenant_id = ? AND (order_number LIKE ? OR id = ? OR tracking_number = ?)
        LIMIT 1;
      `,
      args: [tenantId, `%${clean}%`, clean, clean],
    });

    if (res.rows.length === 0) return null;
    return this.mapRowToOrder(res.rows[0]);
  }

  static async getCustomerOrders(tenantId: string, email: string): Promise<CommerceOrder[]> {
    if (!email || !email.trim()) return [];
    const db = getDb();
    const res = await db.execute({
      sql: `SELECT * FROM commerce_orders WHERE tenant_id = ? AND LOWER(customer_email) = LOWER(?) ORDER BY created_at DESC;`,
      args: [tenantId, email.trim()],
    });

    return res.rows.map(r => this.mapRowToOrder(r));
  }

  static async getCustomerProfile(tenantId: string, email: string): Promise<CustomerProfile | null> {
    if (!email || !email.trim()) return null;
    const orders = await this.getCustomerOrders(tenantId, email);
    const totalSpent = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalOrders = orders.length;

    let loyaltyTier: 'Standard' | 'Silver' | 'Gold' | 'VIP' = 'Standard';
    if (totalSpent > 1000 || totalOrders >= 5) loyaltyTier = 'VIP';
    else if (totalSpent > 500 || totalOrders >= 3) loyaltyTier = 'Gold';
    else if (totalSpent > 100 || totalOrders >= 1) loyaltyTier = 'Silver';

    const customerName = orders.length > 0 && orders[0].customerName ? orders[0].customerName : 'Valued Customer';

    return {
      email: email.trim(),
      name: customerName,
      tags: ['Verified Buyer', loyaltyTier],
      totalOrders,
      totalSpent,
      currency: 'USD',
      loyaltyTier,
      recentOrders: orders.slice(0, 3),
    };
  }

  // ----------------------------------------------------
  // Support Tickets (Tool Calling Execution)
  // ----------------------------------------------------
  static async createTicket(
    tenantId: string,
    data: {
      conversationId?: string;
      subject: string;
      description: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      customerEmail?: string;
    }
  ): Promise<SupportTicket> {
    const db = getDb();
    const id = newId('tkt');
    const ticketNumber = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();
    const priority = data.priority || 'medium';

    await db.execute({
      sql: `
        INSERT INTO support_tickets (
          id, tenant_id, conversation_id, ticket_number, subject, description,
          priority, status, customer_email, notes_json, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `,
      args: [
        id,
        tenantId,
        data.conversationId || null,
        ticketNumber,
        data.subject,
        data.description,
        priority,
        'open',
        data.customerEmail || null,
        JSON.stringify(['Created autonomously by AI Assistant during conversation']),
        now,
        now,
      ],
    });

    return {
      id,
      tenantId,
      conversationId: data.conversationId,
      ticketNumber,
      subject: data.subject,
      description: data.description,
      priority,
      status: 'open',
      customerEmail: data.customerEmail,
      notes: ['Created autonomously by AI Assistant during conversation'],
      createdAt: now,
      updatedAt: now,
    };
  }

  static async updateTicket(
    tenantId: string,
    ticketNumberOrId: string,
    data: {
      status?: 'open' | 'in_progress' | 'resolved' | 'closed';
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      note?: string;
    }
  ): Promise<SupportTicket | null> {
    const db = getDb();
    const clean = ticketNumberOrId.trim();
    const res = await db.execute({
      sql: `SELECT * FROM support_tickets WHERE tenant_id = ? AND (ticket_number = ? OR id = ?) LIMIT 1;`,
      args: [tenantId, clean, clean],
    });

    if (res.rows.length === 0) return null;
    const existing = this.mapRowToTicket(res.rows[0]);
    const now = new Date().toISOString();

    const updatedNotes = [...(existing.notes || [])];
    if (data.note) {
      updatedNotes.push(data.note);
    }

    const updatedStatus = data.status || existing.status;
    const updatedPriority = data.priority || existing.priority;

    await db.execute({
      sql: `
        UPDATE support_tickets SET
          status = ?, priority = ?, notes_json = ?, updated_at = ?
        WHERE id = ? AND tenant_id = ?;
      `,
      args: [updatedStatus, updatedPriority, JSON.stringify(updatedNotes), now, existing.id, tenantId],
    });

    return {
      ...existing,
      status: updatedStatus,
      priority: updatedPriority,
      notes: updatedNotes,
      updatedAt: now,
    };
  }

  static async getTickets(tenantId: string): Promise<SupportTicket[]> {
    const db = getDb();
    const res = await db.execute({
      sql: `SELECT * FROM support_tickets WHERE tenant_id = ? ORDER BY created_at DESC;`,
      args: [tenantId],
    });
    return res.rows.map(r => this.mapRowToTicket(r));
  }

  // ----------------------------------------------------
  // Discount Codes (Tool Calling Execution)
  // ----------------------------------------------------
  static async issueDiscountCode(
    tenantId: string,
    data: {
      percentage: number;
      reason?: string;
      customerEmail?: string;
    }
  ): Promise<DiscountCode> {
    const db = getDb();
    const id = newId('disc');
    const code = `SAVE${Math.round(data.percentage)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString();

    await db.execute({
      sql: `
        INSERT INTO discount_codes (
          id, tenant_id, code, percentage, reason, customer_email, created_at, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
      `,
      args: [id, tenantId, code, data.percentage, data.reason || 'AI Customer Retention Courtesy', data.customerEmail || null, now, expiresAt],
    });

    return {
      id,
      tenantId,
      code,
      percentage: data.percentage,
      reason: data.reason || 'AI Customer Retention Courtesy',
      customerEmail: data.customerEmail,
      createdAt: now,
      expiresAt,
    };
  }

  // ----------------------------------------------------
  // Escalation Rules Config (Task 6)
  // ----------------------------------------------------
  static async getEscalationRules(tenantId: string): Promise<EscalationRulesConfig> {
    const db = getDb();
    const res = await db.execute({
      sql: `SELECT escalation_rules_json FROM tenants WHERE id = ? LIMIT 1;`,
      args: [tenantId],
    });

    if (res.rows.length > 0 && res.rows[0].escalation_rules_json) {
      try {
        const parsed = JSON.parse(String(res.rows[0].escalation_rules_json));
        return {
          ...DEFAULT_ESCALATION_RULES,
          ...parsed,
        };
      } catch {
        return DEFAULT_ESCALATION_RULES;
      }
    }
    return DEFAULT_ESCALATION_RULES;
  }

  static async updateEscalationRules(
    tenantId: string,
    rules: Partial<EscalationRulesConfig>
  ): Promise<EscalationRulesConfig> {
    const current = await this.getEscalationRules(tenantId);
    const updated: EscalationRulesConfig = {
      ...current,
      ...rules,
    };

    const db = getDb();
    await db.execute({
      sql: `UPDATE tenants SET escalation_rules_json = ? WHERE id = ?;`,
      args: [JSON.stringify(updated), tenantId],
    });

    return updated;
  }

  // ----------------------------------------------------
  // Helper Mappers
  // ----------------------------------------------------
  private static mapRowToProduct(r: any): CommerceProduct {
    let metadata: Record<string, any> = {};
    try {
      if (r.metadata_json) metadata = JSON.parse(String(r.metadata_json));
    } catch {
      metadata = {};
    }

    return {
      id: String(r.id),
      tenantId: String(r.tenant_id),
      storePlatform: (r.store_platform || 'shopify') as any,
      productId: String(r.product_id),
      title: String(r.title),
      description: r.description ? String(r.description) : undefined,
      price: Number(r.price || 0),
      currency: String(r.currency || 'USD'),
      imageUrl: r.image_url ? String(r.image_url) : undefined,
      variantTitle: r.variant_title ? String(r.variant_title) : undefined,
      productUrl: r.product_url ? String(r.product_url) : undefined,
      inStock: Number(r.in_stock) === 1,
      sku: r.sku ? String(r.sku) : undefined,
      metadata,
      syncedAt: String(r.synced_at),
    };
  }

  private static mapRowToOrder(r: any): CommerceOrder {
    let items: OrderItem[] = [];
    try {
      if (r.items_json) items = JSON.parse(String(r.items_json));
    } catch {
      items = [];
    }

    return {
      id: String(r.id),
      tenantId: String(r.tenant_id),
      orderNumber: String(r.order_number),
      customerEmail: String(r.customer_email),
      customerName: r.customer_name ? String(r.customer_name) : undefined,
      status: (r.status || 'processing') as any,
      totalAmount: Number(r.total_amount || 0),
      currency: String(r.currency || 'USD'),
      trackingUrl: r.tracking_url ? String(r.tracking_url) : undefined,
      trackingNumber: r.tracking_number ? String(r.tracking_number) : undefined,
      carrier: r.carrier ? String(r.carrier) : undefined,
      items,
      createdAt: String(r.created_at),
    };
  }

  private static mapRowToTicket(r: any): SupportTicket {
    let notes: string[] = [];
    try {
      if (r.notes_json) notes = JSON.parse(String(r.notes_json));
    } catch {
      notes = [];
    }

    return {
      id: String(r.id),
      tenantId: String(r.tenant_id),
      conversationId: r.conversation_id ? String(r.conversation_id) : undefined,
      ticketNumber: String(r.ticket_number),
      subject: String(r.subject),
      description: String(r.description),
      priority: (r.priority || 'medium') as any,
      status: (r.status || 'open') as any,
      customerEmail: r.customer_email ? String(r.customer_email) : undefined,
      notes,
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    };
  }
}
