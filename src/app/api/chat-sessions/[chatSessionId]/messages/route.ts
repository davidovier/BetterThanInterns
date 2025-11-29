import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { callProcessAssistant } from '@/lib/process-assistant';
import { WorkflowDelta } from '@/types/process';
import { ok, CommonErrors, ErrorCodes, error } from '@/lib/api-response';
import { logError } from '@/lib/logging';

const sendMessageSchema = z.object({
  content: z.string().min(1),
});

export async function POST(
  req: Request,
  { params }: { params: { chatSessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return CommonErrors.unauthorized();
    }

    // Verify access to chat session
    const chatSession = await db.chatSession.findUnique({
      where: { id: params.chatSessionId },
      include: {
        process: {
          include: {
            project: {
              include: {
                workspace: {
                  include: {
                    members: {
                      where: { userId: session.user.id },
                    },
                  },
                },
              },
            },
            steps: {
              orderBy: { createdAt: 'asc' },
            },
            links: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 10,
        },
      },
    });

    if (
      !chatSession ||
      chatSession.process.project.workspace.members.length === 0
    ) {
      return CommonErrors.forbidden('You do not have access to this chat session');
    }

    const body = await req.json();
    const { content } = sendMessageSchema.parse(body);

    // Save user message
    const userMessage = await db.chatMessage.create({
      data: {
        sessionId: params.chatSessionId,
        role: 'user',
        content,
      },
    });

    // Build conversation history
    const conversationHistory = chatSession.messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    // Call LLM
    const { assistantMessage, workflowDelta } = await callProcessAssistant(
      content,
      {
        processName: chatSession.process.name,
        processDescription: chatSession.process.description || undefined,
        industry: chatSession.process.project.industry || undefined,
        existingSteps: chatSession.process.steps.map((s) => ({
          id: s.id,
          title: s.title,
          description: s.description || undefined,
          owner: s.owner || undefined,
        })),
        existingLinks: chatSession.process.links.map((l) => ({
          fromStepId: l.fromStepId,
          toStepId: l.toStepId,
        })),
        conversationHistory,
      }
    );

    // Save assistant message
    const assistantMsg = await db.chatMessage.create({
      data: {
        sessionId: params.chatSessionId,
        role: 'assistant',
        content: assistantMessage,
        workflowDeltaJson: workflowDelta,
      },
    });

    // Apply workflow delta
    const tempIdMap = await applyWorkflowDelta(
      chatSession.process.id,
      workflowDelta
    );

    // Load updated graph
    const updatedProcess = await db.process.findUnique({
      where: { id: chatSession.process.id },
      include: {
        steps: {
          orderBy: { createdAt: 'asc' },
        },
        links: true,
      },
    });

    return ok({
      userMessage: {
        id: userMessage.id,
        role: userMessage.role,
        content: userMessage.content,
        createdAt: userMessage.createdAt,
      },
      assistantMessage: {
        id: assistantMsg.id,
        role: assistantMsg.role,
        content: assistantMsg.content,
        createdAt: assistantMsg.createdAt,
      },
      workflowDelta,
      updatedGraph: {
        steps: updatedProcess?.steps || [],
        links: updatedProcess?.links || [],
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return CommonErrors.invalidInput(err.errors[0]?.message || 'Invalid input');
    }

    logError('Chat message processing', err, { chatSessionId: params.chatSessionId });

    // Check if it's an LLM-specific error
    if (err instanceof Error && err.message.includes('LLM')) {
      return error(
        500,
        ErrorCodes.PROCESS_ASSISTANT_FAILED,
        'Failed to process message. The AI assistant encountered an error. Please try again.'
      );
    }

    return CommonErrors.internalError('Failed to process message');
  }
}

async function applyWorkflowDelta(
  processId: string,
  delta: WorkflowDelta
): Promise<Map<string, string>> {
  const tempIdMap = new Map<string, string>();

  // Create new steps
  if (delta.new_steps && delta.new_steps.length > 0) {
    // Calculate positions for new steps (simple vertical layout)
    const existingSteps = await db.processStep.count({
      where: { processId },
    });

    for (let i = 0; i < delta.new_steps.length; i++) {
      const newStep = delta.new_steps[i];
      const step = await db.processStep.create({
        data: {
          processId,
          title: newStep.title,
          description: newStep.description,
          owner: newStep.owner,
          inputs: newStep.inputs || [],
          outputs: newStep.outputs || [],
          frequency: newStep.frequency,
          duration: newStep.duration,
          positionX: 100,
          positionY: (existingSteps + i) * 100 + 100,
        },
      });

      tempIdMap.set(newStep.temp_id, step.id);
    }
  }

  // Update existing steps
  if (delta.updated_steps && delta.updated_steps.length > 0) {
    for (const update of delta.updated_steps) {
      await db.processStep.update({
        where: { id: update.id },
        data: update.updates,
      });
    }
  }

  // Create new links
  if (delta.new_links && delta.new_links.length > 0) {
    for (const newLink of delta.new_links) {
      // Resolve temp IDs to real IDs
      const fromStepId = tempIdMap.get(newLink.from_step) || newLink.from_step;
      const toStepId = tempIdMap.get(newLink.to_step) || newLink.to_step;

      // Check if link already exists
      const existingLink = await db.processLink.findFirst({
        where: {
          processId,
          fromStepId,
          toStepId,
        },
      });

      if (!existingLink) {
        await db.processLink.create({
          data: {
            processId,
            fromStepId,
            toStepId,
            label: newLink.label,
            linkType: newLink.link_type || 'flow',
          },
        });
      }
    }
  }

  return tempIdMap;
}
