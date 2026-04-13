export type IntegrationStatus = "connected" | "disconnected" | "error";
export type IntegrationCategory = "ai" | "build" | "automation" | "delivery" | "monitoring" | "growth";

export interface Integration {
  id: string;
  name: string;
  description: string;
  category: IntegrationCategory;
  icon: string;
  status: IntegrationStatus;
  supportsOAuth: boolean;
  fields: string[];
}

export const categories: Record<IntegrationCategory, { label: string; emoji: string; description: string }> = {
  ai: { label: "AI / LLM", emoji: "🧠", description: "Modele AI dhe gjenerim përmbajtjeje" },
  build: { label: "Build / Knowledge", emoji: "🏗️", description: "Zhvillim, backend dhe menaxhim njohurish" },
  automation: { label: "Automation / Scraping / Voice", emoji: "🔗", description: "Automatizim, scraping dhe AI zanor" },
  delivery: { label: "Delivery / Communication", emoji: "📡", description: "Kanale komunikimi dhe shpërndarje" },
  monitoring: { label: "Monitoring / Reporting", emoji: "📊", description: "Dashboards dhe raportim" },
  growth: { label: "Growth / Discovery", emoji: "🚀", description: "Zbulim dhe validim" },
};

export const integrations: Integration[] = [
  // AI / LLM
  { id: "chatgpt", name: "ChatGPT / OpenAI", description: "Ide, strukturë, MVP plan, UI/UX flow. Agente custom me API.", category: "ai", icon: "🤖", status: "disconnected", supportsOAuth: false, fields: ["API Key", "Organization ID", "Model Selection", "Usage Limits"] },
  { id: "claude", name: "Claude", description: "Dokumente serioze, logjikë, arkitekturë. Bashkë-themelues strategjik.", category: "ai", icon: "🧬", status: "disconnected", supportsOAuth: false, fields: ["API Key", "Model Selection", "Usage Limits"] },
  { id: "gemini", name: "Gemini", description: "Docs, Sheets, video, analizë me volum të madh. Google Workspace.", category: "ai", icon: "💎", status: "disconnected", supportsOAuth: true, fields: ["API Key", "Model Selection", "Google Workspace Link"] },
  { id: "deepseek", name: "DeepSeek", description: "Kod, debug, logjikë teknike. Super i lirë dhe i shpejtë.", category: "ai", icon: "🔍", status: "disconnected", supportsOAuth: false, fields: ["API Key", "Model Selection"] },
  { id: "perplexity", name: "Perplexity", description: "Research real-time, competitor analysis, verifikim faktesh.", category: "ai", icon: "🔮", status: "disconnected", supportsOAuth: false, fields: ["API Key", "Usage Limits"] },

  // Build / Knowledge
  { id: "github", name: "GitHub", description: "Version control + scaling. Repository management.", category: "build", icon: "🐙", status: "disconnected", supportsOAuth: true, fields: ["Access Token", "Repositories", "Webhooks"] },
  { id: "anything-llm", name: "Anything-LLM", description: "Private AI system. RAG hub qendror për biznese.", category: "build", icon: "🧊", status: "disconnected", supportsOAuth: false, fields: ["Instance URL", "API Key", "Workspace Selection"] },
  { id: "airtable", name: "Airtable", description: "MVP backend pa drama. No-code database inteligjent.", category: "build", icon: "📋", status: "disconnected", supportsOAuth: true, fields: ["API Key", "Base Selection", "Webhook URL"] },

  // Automation / Scraping / Voice
  { id: "n8n", name: "n8n", description: "Automation backbone. Workflow engine për të gjitha eventet.", category: "automation", icon: "⚡", status: "disconnected", supportsOAuth: false, fields: ["Instance URL", "API Key", "Webhook Secret"] },
  { id: "firecrawl", name: "Firecrawl", description: "Web scraping avancuar, konverto në Markdown/JSON.", category: "automation", icon: "🔥", status: "disconnected", supportsOAuth: false, fields: ["API Key", "Webhook URL"] },
  { id: "browse-ai", name: "Browse.ai", description: "Scraping pa kod. Data pipelines për marketing intel.", category: "automation", icon: "🕷️", status: "disconnected", supportsOAuth: false, fields: ["API Key", "Robot Selection"] },
  { id: "vapi", name: "Vapi", description: "Telefonata AI. Voice agents për sales dhe support.", category: "automation", icon: "📞", status: "disconnected", supportsOAuth: false, fields: ["API Key", "Phone Number", "Agent Config"] },
  { id: "retell-ai", name: "Retell AI", description: "Call center AI. Agjentë zanorë 24/7.", category: "automation", icon: "🎙️", status: "disconnected", supportsOAuth: false, fields: ["API Key", "Agent ID", "Phone Config"] },

  // Delivery / Communication
  { id: "twilio-whatsapp", name: "Twilio WhatsApp", description: "WhatsApp Business messaging masiv.", category: "delivery", icon: "💬", status: "disconnected", supportsOAuth: false, fields: ["Account SID", "Auth Token", "Phone Number"] },
  { id: "twilio-sms", name: "Twilio SMS", description: "SMS masiv për nurture leads.", category: "delivery", icon: "📱", status: "disconnected", supportsOAuth: false, fields: ["Account SID", "Auth Token", "Phone Number"] },
  { id: "sendgrid", name: "SendGrid", description: "Email automation dhe marketing transaksional.", category: "delivery", icon: "📧", status: "disconnected", supportsOAuth: false, fields: ["API Key", "Sender Email", "Templates"] },
  { id: "telegram", name: "Telegram Bots", description: "Bot administrator. Logs, alerta, statistika.", category: "delivery", icon: "✈️", status: "disconnected", supportsOAuth: false, fields: ["Bot Token", "Chat ID", "Webhook URL"] },
  { id: "facebook", name: "Meta / Facebook", description: "WhatsApp Business API, Login, Ads automation.", category: "delivery", icon: "📘", status: "disconnected", supportsOAuth: true, fields: ["App ID", "App Secret", "Page Token"] },
  { id: "tiktok", name: "TikTok Developers", description: "Growth channel. Zbulim organik.", category: "delivery", icon: "🎵", status: "disconnected", supportsOAuth: true, fields: ["App ID", "App Secret", "Access Token"] },

  // Monitoring
  { id: "looker-studio", name: "Looker Studio", description: "Dashboard vizual për klientë. Raporte të qarta.", category: "monitoring", icon: "📊", status: "disconnected", supportsOAuth: true, fields: ["Google Account", "Report Templates"] },

  // Growth
  { id: "producthunt", name: "Product Hunt", description: "Validim ideje. Testim traction.", category: "growth", icon: "🏹", status: "disconnected", supportsOAuth: true, fields: ["API Token", "Product Listing"] },
  { id: "rankmyai", name: "RankMyAI", description: "Krahasim AI agjentësh. GEO optimization.", category: "growth", icon: "📈", status: "disconnected", supportsOAuth: false, fields: ["API Key", "Agent IDs"] },
];
