# NomadsChat — Complete Application Functionality & Architecture Documentation

This document serves as the single source of truth for the **NomadsChat** application, covering both the **User Portal** (tenant workspaces, chatbots, knowledge base RAG, live inbox, ticketing, integrations, team management, billing, and embed widget) and the **Admin Portal** (super-admin command center, multi-tenant directory, conversation logs, live activity feeds, funnel analytics, domain center, and audit logs), along with their interconnections, data flows, and route matrices.

---

## 1. Application Overview

### Purpose of the Application
NomadsChat is a production-grade, AI-powered customer support and knowledge management platform. It enables businesses and developers to instantly ingest website knowledge (via RAG and live URL crawling), build custom AI support assistants powered by Gemini models, embed real-time chat widgets on any web property, handle human agent handoffs, issue support tickets and discount coupons, and integrate seamlessly with collaboration tools like Slack, WhatsApp, Zapier, and HubSpot.

### Main Features
- **AI Chatbot Builder & Customizer**: Create, configure, and customize AI support assistants with adjustable tone, model selection, welcome greetings, fallback messages, domain locking, and custom system instructions.
- **RAG Knowledge Base Engine**: Ingest website URLs, markdown documents, FAQs, and raw text chunks with automatic vector chunking and live snippet citation.
- **Live Test Playground**: Real-time simulation playground allowing tenants to test chatbot responses, inspect grounding sources, and simulate visitor interactions.
- **Multi-Channel Inbox & Live Chat**: Real-time customer conversation management with human agent takeover, canned responses, internal notes, CSAT rating collection, support ticketing, and discount coupon generation.
- **Marketplace Integrations**: One-click connection and OAuth setup for Slack (channel alerts), WhatsApp Business (messaging), Zapier (automations), and HubSpot (CRM contact/deal sync).
- **Team Collaboration & RBAC**: Invite team members, assign roles (Admin, Agent, Viewer), and manage workspace access.
- **Billing & Subscription Tiers**: Starter, Growth, and Enterprise tier management with modal checkout flows.
- **Admin Super-Command Center**: Multi-tenant platform administration, global conversation logs, live activity feeds, conversion funnels, product analytics, domain security center, and immutable audit logs.

### Overall Architecture & Information Structure
- **Frontend**: React 18+ with Vite, Tailwind CSS, Motion (motion/react), and Lucide React icons.
- **Backend**: Node.js & Express (`server.ts`) with custom REST endpoints, authentication middleware, and Turso / SQLite persistence via Drizzle / SQLite client.
- **AI Core**: Google Gemini SDK (`@google/genai`) configured server-side with structured tool calling (`create_ticket`, `update_ticket`, `issue_discount_code`, `call_webhook`, `escalate_to_human`).

### Main User Types / Roles
1. **Workspace Tenant User / Admin**: Registers an organization account, manages chatbots, knowledge base, inbox, integrations, and billing.
2. **Support Agent**: Handles incoming live chats, takes over conversations from the AI, adds internal notes, issues discount codes, and creates support tickets.
3. **Platform Super Admin**: Accesses the dedicated `/admin` portal to monitor multi-tenant system health, audit logs, global conversation transcripts, and platform revenue metrics.

---

## 2. User Portal — Separate Overview

### Page Name & Purpose
- **Dashboard / Overview (`/overview`)**: High-level command center displaying key performance metrics, quick onboarding steps, bot health, and embed code snippet generator.
- **AI Chatbots (`/chatbots`)**: Manage, create, edit, clone, and delete AI support chatbots.
- **Knowledge Base (`/knowledge`)**: Manage RAG data sources, URL crawlers, and document chunks.
- **Live Test Playground (`/playground`)**: Interactive testing environment for previewing bot behavior and grounding sources.
- **Inbox & Live Chat (`/inbox`)**: Real-time customer conversation hub, agent takeover, ticketing, and customer intelligence panel.
- **Integrations Marketplace (`/integrations`)**: Connect Slack, WhatsApp, Zapier, and HubSpot.
- **Team Management (`/team`)**: Invite and manage workspace team members and roles.
- **Billing & Plans (`/pricing`)**: View subscription tiers, active plan status, and upgrade options.

### Authentication & Permissions
- Authentication: JWT Bearer token stored in `localStorage` (`auth_token`).
- Permissions: Tenant-scoped access isolating data per organization.

---

## 3. Admin Portal — Separate Overview

### Access & Purpose
The Admin Portal (`/admin` or admin routes) is a dedicated super-administrator dashboard for managing the entire SaaS platform across multiple tenants.

### Admin Pages & Routes
- **Command Center Overview (`/admin/overview`)**: High-level platform health, active tenants count, total conversation volume, and system alerts.
- **Chatbot Directory (`/admin/chatbots`)**: Global view of all chatbots across all tenants with status monitoring and inspection.
- **Conversation Logs (`/admin/conversations`)**: Searchable global transcript archive with filtering by tenant, status, and sentiment.
- **Live Activity Feed (`/admin/activity`)**: Real-time event stream of visitor chats, tool executions, and ticket creations.
- **Conversion Funnel (`/admin/funnel`)**: Drop-off and conversion metrics from visitor landing to successful AI resolution or human handoff.
- **Product Analytics (`/admin/analytics`)**: Usage metrics, token consumption, and tool invocation frequencies.
- **User Directory (`/admin/users`)**: Tenant organization and user account management.
- **Website Domain Center (`/admin/domains`)**: Domain verification, security status, and allowed domain enforcement.
- **Audit Logs (`/admin/audit`)**: Immutable security and administrative action logs.
- **System Alerts (`/admin/alerts`)**: Platform error monitoring, webhook dispatch failures, and rate limit tracking.

---

## 4. Admin ↔ User Portal Connections

### Interaction Mapping
| User Action | Stored / Updated Data | Admin Visibility | Admin Action | User-Visible Result |
| :--- | :--- | :--- | :--- | :--- |
| **User creates chatbot** | `chatbots` table record | Chatbot Directory | Super admin can inspect configuration or deactivate | Chatbot becomes active in user's embed widget |
| **Visitor chats with bot** | `conversations` & `messages` tables | Live Activity Feed & Conversation Logs | Admin can review transcripts or inspect tool usage | Bot responds with RAG context & tool actions |
| **User invites team member** | `team_invitations` table | User Directory / Tenant Details | Admin can view active seats & workspace members | Invited member receives access link |
| **User connects integration** | `integrations` table (`is_connected = 1`) | System Alerts / Integration Stats | Admin can verify platform integration health | Slack/Zapier/HubSpot data sync active |

---

## 5. Navigation & Information Architecture

- **User Portal Sidebar**: Dashboard, AI Chatbots, Knowledge Base, Live Test Playground, Inbox & Live Chat, Integrations, Team, Billing, Settings.
- **Admin Portal Sidebar**: Command Center, Chatbots Directory, Conversation Logs, Live Activity, Conversion Funnel, Product Analytics, User Directory, Domain Center, Audit Logs, System Alerts.
- **Protected Routes**: All workspace and admin routes enforce authentication guards (`requireAuth`).

---

## 6. Authentication & Authorization

- **Login & Signup**: Email/password authentication returning a secure JWT token.
- **Session Management**: Persistent sessions via `localStorage` with automatic header attachment (`Authorization: Bearer <token>`).
- **Authorization Levels**: Standard Tenant User, Workspace Team Member, and Platform Super Admin.

---

## 7. Complete Feature Documentation

- **RAG Engine**: Chunks knowledge base sources and performs vector similarity search during visitor chat requests.
- **Tool Execution**: Gemini function calling for `create_ticket`, `update_ticket`, `issue_discount_code`, `call_webhook`, and `escalate_to_human`.
- **Widget Embedding**: Generates clean HTML `<script>` tags for embedding the chat widget on external websites.

---

## 8. Forms, Inputs & Validation

- **Chatbot Editor**: Name, description, tone selection, system instructions, fallback message, and website URL domains.
- **Knowledge Ingestion Form**: URL input or text snippet input with instant scraping & chunking.
- **Integration Configuration Modals**: API keys, access tokens, webhook secrets, and store URLs with live test connection buttons.

---

## 9. User Flows

1. **New User Onboarding**: Sign up → Create workspace → Name first AI chatbot → Ingest website knowledge base → Test in live playground → Copy embed snippet.
2. **Customer Support Interaction**: Visitor opens embed chat widget → Asks question → Bot answers via RAG / tools → Visitor requests human → Agent takes over in Inbox.

---

## 10. Modals, Menus & Interactive Components

- **Bot Editor Modal**: Comprehensive multi-tab configuration modal.
- **Widget Embed Modal**: Code snippet copy modal with framework tabs (HTML, React, Shopify, WordPress).
- **Integration Setup Modal**: Credential entry and test connection feedback.
- **Ticket & Discount Modals**: Quick action drawers for agents.

---

## 11. States & Error Handling

- **Loading States**: Skeleton loaders, button spinners during API calls and Gemini inference.
- **Empty States**: Friendly illustrations and call-to-action buttons when no chatbots, knowledge sources, or conversations exist.
- **Error States**: Inline alert banners and toast notifications for failed API requests or invalid credentials.

---

## 12. Data & Entity Relationships

- **Tenants**: Root organization entity.
- **Users**: Associated with a tenant and role.
- **Chatbots**: Belongs to a tenant; holds configuration and system prompts.
- **Conversations & Messages**: Belongs to a chatbot and tenant; tracks visitor interactions and outcomes.
- **Knowledge Sources & Chunks**: Belongs to a chatbot/tenant; powers RAG retrieval.
- **Support Tickets**: Linked to conversations and tenants.
- **Integrations**: Tenant-scoped connection state and configuration.

---

## 13. Complete Route & Feature Matrix

| Portal | Route/Page | Purpose | Access | Main Features | Admin/User Connection |
| :--- | :--- | :--- | :--- | :--- | :--- |
| User | `/overview` | Command Center & Metrics | Authenticated | KPI cards, quick start, embed snippet | Feeds dashboard metrics |
| User | `/chatbots` | AI Assistant Management | Authenticated | Create, edit, clone, delete bots | Visible in admin chatbot directory |
| User | `/knowledge` | Knowledge Base RAG | Authenticated | URL crawler, chunk manager | Powers bot retrieval |
| User | `/playground` | Live Test Playground | Authenticated | Interactive test chat, grounding preview | Simulates visitor queries |
| User | `/inbox` | Real-Time Live Chat & Inbox | Authenticated | Agent takeover, ticketing, notes, CSAT | Creates conversation logs |
| User | `/integrations` | Marketplace & Connectors | Authenticated | Slack, WhatsApp, Zapier, HubSpot | Monitored by admin alerts |
| User | `/team` | Team & RBAC Management | Authenticated | Member invites, role assignments | Reflected in user directory |
| User | `/pricing` | Billing & Subscription | Authenticated | Tier selection, modal checkout | Platform revenue tracking |
| Admin | `/admin/overview` | Super Admin Command Center | Super Admin | System health, tenant stats | Aggregates all tenant data |
| Admin | `/admin/conversations` | Global Conversation Archive | Super Admin | Searchable transcript logs | Inspects user conversations |
| Admin | `/admin/activity` | Real-Time Activity Stream | Super Admin | Live event stream | Tracks platform activity |

---

## 14. Complete Feature Checklist

- [x] JWT Authentication & Protected Routes
- [x] Multi-bot Creation & Configuration
- [x] RAG Knowledge Base Ingestion & Chunks
- [x] Live Test Playground with Source Citations
- [x] Real-time Multi-channel Inbox & Agent Takeover
- [x] Support Ticketing & Discount Code Generation
- [x] Integration Marketplace (Slack, WhatsApp, Zapier, HubSpot)
- [x] Team Invitation & Role Management
- [x] Subscription Tier Checkout
- [x] Embeddable Widget Generator
- [x] Admin Super-Command Center & Multi-tenant Oversight
- [x] Global Conversation Logs & Live Activity Streams
- [x] Domain Security Center & Audit Logs

---

## 15. Unverified / Inaccessible Functionality

- **Live OAuth Provider Redirects**: Actual third-party OAuth round-trips for Slack, WhatsApp, and HubSpot require live external API credentials configured in environment variables.
- **Production Webhook Dispatches**: External webhooks depend on external server availability.
- **Real-time Push Notifications**: WebSocket real-time delivery falls back to polling / SQLite persistence in sandbox environments without persistent background worker clusters.
