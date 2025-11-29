/**
 * Seed Tools Database
 *
 * Run with: npx tsx scripts/seed-tools.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TOOLS = [
  // OCR / Document Processing
  {
    name: 'Textract',
    vendor: 'Amazon Web Services',
    category: 'ocr',
    description:
      'Automatically extracts text, handwriting, and data from scanned documents. Works with forms, invoices, receipts, and IDs.',
    useCases: ['invoice_extraction', 'document_processing', 'form_parsing'],
    pricingTier: 'paid',
    integrationComplexity: 'medium',
    securityNotes: 'SOC 2, HIPAA, PCI DSS compliant. Data encrypted at rest and in transit.',
    websiteUrl: 'https://aws.amazon.com/textract/',
  },
  {
    name: 'Docparser',
    vendor: 'Docparser',
    category: 'data_extraction',
    description:
      'Extract data from PDF documents and export to 100+ apps. No coding required. Template-based extraction.',
    useCases: ['invoice_extraction', 'document_processing', 'data_entry'],
    pricingTier: 'freemium',
    integrationComplexity: 'low',
    securityNotes: 'GDPR compliant. Data deleted after 30 days.',
    websiteUrl: 'https://docparser.com/',
  },
  {
    name: 'Nanonets',
    vendor: 'Nanonets',
    category: 'ocr',
    description:
      'AI-powered OCR for invoices, receipts, IDs, and custom documents. Pre-trained models available.',
    useCases: ['invoice_extraction', 'receipt_processing', 'document_processing'],
    pricingTier: 'paid',
    integrationComplexity: 'low',
    securityNotes: 'SOC 2 Type II certified. GDPR compliant.',
    websiteUrl: 'https://nanonets.com/',
  },

  // Workflow Automation
  {
    name: 'Zapier',
    vendor: 'Zapier',
    category: 'workflow_automation',
    description:
      'Connect 6,000+ apps and automate workflows without coding. Trigger actions based on events.',
    useCases: ['workflow_automation', 'integration', 'data_sync', 'notification'],
    pricingTier: 'freemium',
    integrationComplexity: 'low',
    securityNotes: 'SOC 2 Type II, GDPR compliant. OAuth for app connections.',
    websiteUrl: 'https://zapier.com/',
  },
  {
    name: 'Make (Integromat)',
    vendor: 'Make',
    category: 'workflow_automation',
    description:
      'Visual automation platform for complex workflows. More powerful than Zapier for advanced scenarios.',
    useCases: ['workflow_automation', 'integration', 'data_transformation'],
    pricingTier: 'freemium',
    integrationComplexity: 'medium',
    securityNotes: 'GDPR compliant. ISO 27001 certified.',
    websiteUrl: 'https://www.make.com/',
  },
  {
    name: 'n8n',
    vendor: 'n8n',
    category: 'workflow_automation',
    description:
      'Open-source workflow automation. Self-hostable for full data control. 350+ integrations.',
    useCases: ['workflow_automation', 'integration', 'data_sync'],
    pricingTier: 'free',
    integrationComplexity: 'medium',
    securityNotes: 'Self-hosted option for full control. Cloud version GDPR compliant.',
    websiteUrl: 'https://n8n.io/',
  },

  // RPA (Robotic Process Automation)
  {
    name: 'UiPath',
    vendor: 'UiPath',
    category: 'rpa',
    description:
      'Enterprise RPA platform for automating repetitive tasks. Screen scraping, data entry, system integration.',
    useCases: ['data_entry', 'workflow_automation', 'system_integration'],
    pricingTier: 'enterprise',
    integrationComplexity: 'high',
    securityNotes: 'SOC 2, ISO 27001, HIPAA compliant. Enterprise-grade security.',
    websiteUrl: 'https://www.uipath.com/',
  },
  {
    name: 'Power Automate Desktop',
    vendor: 'Microsoft',
    category: 'rpa',
    description:
      'Free desktop automation from Microsoft. Record and replay tasks, integrate with Office 365.',
    useCases: ['data_entry', 'desktop_automation', 'workflow_automation'],
    pricingTier: 'freemium',
    integrationComplexity: 'low',
    securityNotes: 'Microsoft security standards. Integrates with Azure AD.',
    websiteUrl: 'https://powerautomate.microsoft.com/desktop/',
  },

  // LLM / AI Agents
  {
    name: 'OpenAI API',
    vendor: 'OpenAI',
    category: 'llm_agent',
    description:
      'GPT-4 and GPT-3.5 for text generation, summarization, classification, extraction, and more.',
    useCases: [
      'text_generation',
      'email_response',
      'data_extraction',
      'classification',
      'summarization',
    ],
    pricingTier: 'paid',
    integrationComplexity: 'medium',
    securityNotes: 'SOC 2 compliant. Data not used for training by default.',
    websiteUrl: 'https://openai.com/api/',
  },
  {
    name: 'Anthropic Claude',
    vendor: 'Anthropic',
    category: 'llm_agent',
    description:
      'Claude 3 for analysis, summarization, and complex reasoning. Strong at following instructions.',
    useCases: [
      'text_analysis',
      'summarization',
      'data_extraction',
      'decision_support',
    ],
    pricingTier: 'paid',
    integrationComplexity: 'medium',
    securityNotes: 'SOC 2 Type II. Data deleted after 30 days.',
    websiteUrl: 'https://www.anthropic.com/',
  },
  {
    name: 'LangChain',
    vendor: 'LangChain',
    category: 'llm_agent',
    description:
      'Framework for building LLM applications. Chain prompts, add memory, connect to data sources.',
    useCases: ['llm_workflow', 'chatbots', 'data_analysis', 'document_qa'],
    pricingTier: 'free',
    integrationComplexity: 'high',
    securityNotes: 'Open-source. Security depends on deployment.',
    websiteUrl: 'https://www.langchain.com/',
  },

  // Email / Communication
  {
    name: 'SaneBox',
    vendor: 'SaneBox',
    category: 'llm_agent',
    description:
      'AI-powered email filtering and prioritization. Auto-sort unimportant emails, snooze, reminders.',
    useCases: ['email_triage', 'inbox_management', 'communication'],
    pricingTier: 'paid',
    integrationComplexity: 'low',
    securityNotes: 'Read-only access to email. GDPR compliant.',
    websiteUrl: 'https://www.sanebox.com/',
  },

  // Integration / APIs
  {
    name: 'Tray.io',
    vendor: 'Tray.io',
    category: 'integration',
    description:
      'Enterprise integration platform for connecting cloud apps and automating workflows at scale.',
    useCases: ['integration', 'workflow_automation', 'data_sync'],
    pricingTier: 'enterprise',
    integrationComplexity: 'high',
    securityNotes: 'SOC 2, ISO 27001, HIPAA compliant.',
    websiteUrl: 'https://tray.io/',
  },

  // Data Extraction / Web Scraping
  {
    name: 'ParseHub',
    vendor: 'ParseHub',
    category: 'data_extraction',
    description:
      'Visual web scraping tool. Extract data from websites without coding. Handles JavaScript.',
    useCases: ['web_scraping', 'data_extraction', 'data_collection'],
    pricingTier: 'freemium',
    integrationComplexity: 'low',
    securityNotes: 'Cloud-based. Data stored encrypted.',
    websiteUrl: 'https://www.parsehub.com/',
  },

  // Specialized Tools
  {
    name: 'Rossum',
    vendor: 'Rossum',
    category: 'ocr',
    description:
      'AI-powered document processing for invoices, purchase orders, and receipts. Learns from corrections.',
    useCases: ['invoice_extraction', 'ap_automation', 'document_processing'],
    pricingTier: 'paid',
    integrationComplexity: 'medium',
    securityNotes: 'ISO 27001, SOC 2 Type II. GDPR compliant.',
    websiteUrl: 'https://rossum.ai/',
  },
  {
    name: 'Workato',
    vendor: 'Workato',
    category: 'workflow_automation',
    description:
      'Enterprise automation platform with 1,000+ pre-built connectors. Combines integration and RPA.',
    useCases: ['workflow_automation', 'integration', 'data_sync', 'business_process'],
    pricingTier: 'enterprise',
    integrationComplexity: 'medium',
    securityNotes: 'SOC 2, ISO 27001, HIPAA, PCI DSS compliant.',
    websiteUrl: 'https://www.workato.com/',
  },
];

async function seedTools() {
  console.log('🌱 Seeding tools...');

  for (const toolData of TOOLS) {
    try {
      // Check if tool already exists
      const existing = await prisma.tool.findFirst({
        where: { name: toolData.name },
      });

      let tool;
      if (existing) {
        // Update existing tool
        tool = await prisma.tool.update({
          where: { id: existing.id },
          data: toolData,
        });
      } else {
        // Create new tool
        tool = await prisma.tool.create({
          data: toolData,
        });
      }
      console.log(`✓ ${tool.name}`);
    } catch (error) {
      console.error(`✗ Failed to seed ${toolData.name}:`, error);
    }
  }

  console.log(`\n✅ Seeded ${TOOLS.length} tools successfully!`);
}

seedTools()
  .catch((e) => {
    console.error('Error seeding tools:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
