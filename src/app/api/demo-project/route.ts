import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { ok, CommonErrors } from '@/lib/api-response';
import { logError } from '@/lib/logging';
import { verifyWorkspaceAccess } from '@/lib/access-control';

const createDemoSchema = z.object({
  workspaceId: z.string(),
});

/**
 * POST /api/demo-project
 * Creates a pre-populated demo project with sample process, steps, and opportunities
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return CommonErrors.unauthorized();
    }

    const body = await req.json();
    const data = createDemoSchema.parse(body);

    // Verify workspace access
    const hasAccess = await verifyWorkspaceAccess(data.workspaceId, session.user.id);
    if (!hasAccess) {
      return CommonErrors.forbidden('You do not have access to this workspace');
    }

    // Create demo project
    const project = await db.project.create({
      data: {
        workspaceId: data.workspaceId,
        name: 'Demo – Invoice Processing Automation',
        description: 'Sample project showing invoice automation workflow. Feel free to explore, edit, or delete!',
        status: 'draft',
      },
    });

    // Create demo process
    const process = await db.process.create({
      data: {
        projectId: project.id,
        name: 'Invoice Processing Workflow',
        description: 'How we currently handle incoming invoices from receipt to payment',
        owner: 'Finance Team',
      },
    });

    // Create demo steps
    const step1 = await db.processStep.create({
      data: {
        processId: process.id,
        title: 'Receive Invoice Email',
        description: 'Invoices arrive via email to invoices@company.com',
        owner: 'Admin',
        inputs: ['Email with PDF invoice'],
        outputs: ['Invoice PDF'],
        frequency: 'Daily (5-10x)',
        duration: '2 min',
        positionX: 100,
        positionY: 100,
      },
    });

    const step2 = await db.processStep.create({
      data: {
        processId: process.id,
        title: 'Manual Data Entry',
        description: 'Manually type invoice details into accounting system',
        owner: 'Finance Admin',
        inputs: ['Invoice PDF'],
        outputs: ['Invoice data in system'],
        frequency: 'Daily (5-10x)',
        duration: '5-8 min per invoice',
        positionX: 400,
        positionY: 100,
      },
    });

    const step3 = await db.processStep.create({
      data: {
        processId: process.id,
        title: 'Approval Workflow',
        description: 'Email manager for approval, wait for response',
        owner: 'Manager',
        inputs: ['Invoice data'],
        outputs: ['Approval decision'],
        frequency: 'Daily (5-10x)',
        duration: '1-3 days wait time',
        positionX: 700,
        positionY: 100,
      },
    });

    const step4 = await db.processStep.create({
      data: {
        processId: process.id,
        title: 'Schedule Payment',
        description: 'Manually schedule payment in banking system',
        owner: 'Finance Manager',
        inputs: ['Approved invoice'],
        outputs: ['Payment scheduled'],
        frequency: 'Daily (5-10x)',
        duration: '3 min',
        positionX: 1000,
        positionY: 100,
      },
    });

    // Create links between steps
    await db.processLink.create({
      data: {
        processId: process.id,
        fromStepId: step1.id,
        toStepId: step2.id,
        linkType: 'flow',
      },
    });

    await db.processLink.create({
      data: {
        processId: process.id,
        fromStepId: step2.id,
        toStepId: step3.id,
        linkType: 'flow',
      },
    });

    await db.processLink.create({
      data: {
        processId: process.id,
        fromStepId: step3.id,
        toStepId: step4.id,
        linkType: 'flow',
        label: 'if approved',
      },
    });

    // Create a couple of demo opportunities
    await db.opportunity.create({
      data: {
        processId: process.id,
        stepId: step2.id,
        title: 'OCR + AI Invoice Extraction',
        description: 'Replace manual data entry with automated OCR and AI extraction from invoice PDFs. Extract vendor, amount, due date, line items automatically.',
        opportunityType: 'document_processing',
        impactLevel: 'high',
        effortLevel: 'medium',
        impactScore: 85,
        feasibilityScore: 75,
        rationaleText: 'Manual data entry is error-prone and time-consuming (5-8 min per invoice × 5-10 daily = 40-80 min/day). OCR tools like Rossum, Nanonets, or AWS Textract can extract structured data with 95%+ accuracy.',
      },
    });

    await db.opportunity.create({
      data: {
        processId: process.id,
        stepId: step3.id,
        title: 'Automated Approval Routing',
        description: 'Auto-route invoices to appropriate approver based on amount thresholds and vendor category. Send Slack/email notifications instead of manual emails.',
        opportunityType: 'workflow_automation',
        impactLevel: 'medium',
        effortLevel: 'low',
        impactScore: 65,
        feasibilityScore: 90,
        rationaleText: 'Waiting for email approval adds 1-3 days to cycle time. Simple workflow automation (Zapier, Make, or custom) can route based on rules and send instant notifications.',
      },
    });

    return ok({ projectId: project.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return CommonErrors.invalidInput(error.errors[0]?.message || 'Invalid input');
    }

    logError('Create demo project', error, {});
    return CommonErrors.internalError('Failed to create demo project');
  }
}
