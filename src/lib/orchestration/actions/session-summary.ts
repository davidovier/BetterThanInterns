/**
 * Session Summary Action Handler
 *
 * Generates concise session summaries using LLM.
 */

import { db } from '@/lib/db';
import { openai } from '@/lib/llm';
import { GenerateSummaryParams } from '../types';

export async function generateSessionSummary(
  params: GenerateSummaryParams
): Promise<string> {
  try {
    // Fetch session with all linked artifacts
    const session = await db.assistantSession.findUnique({
      where: { id: params.sessionId },
      include: {
        project: {
          include: {
            processes: {
              include: {
                steps: true,
                opportunities: true,
              },
            },
            blueprints: true,
            aiUseCases: true,
          },
        },
      },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    // Build context from session artifacts
    const contextParts: string[] = [];

    contextParts.push(`Session Title: ${session.title}`);

    if (session.project) {
      contextParts.push(`\nProject: ${session.project.name}`);

      if (session.project.processes.length > 0) {
        contextParts.push(`\nProcesses (${session.project.processes.length}):`);
        for (const process of session.project.processes) {
          contextParts.push(`- ${process.name}: ${process.steps.length} steps, ${process.opportunities.length} opportunities`);
        }
      }

      if (session.project.blueprints.length > 0) {
        contextParts.push(`\nBlueprints: ${session.project.blueprints.length} generated`);
      }

      if (session.project.aiUseCases.length > 0) {
        contextParts.push(`\nAI Use Cases: ${session.project.aiUseCases.length} registered for governance`);
      }
    }

    const metadata = session.metadata as any;
    if (metadata.processIds?.length > 0) {
      contextParts.push(`\nLinked Processes: ${metadata.processIds.length}`);
    }
    if (metadata.opportunityIds?.length > 0) {
      contextParts.push(`Linked Opportunities: ${metadata.opportunityIds.length}`);
    }

    const context = contextParts.join('\n');

    // Generate summary with LLM
    const systemPrompt = `You are a helpful assistant that creates concise, informative summaries of work sessions.
Summarize the key activities, artifacts created, and outcomes in 2-3 sentences.
Be specific about what was accomplished.`;

    const userPrompt = `Summarize this work session:\n\n${context}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 200,
    });

    const summary = completion.choices[0]?.message?.content || 'Session summary generated.';

    // Update session with new summary
    await db.assistantSession.update({
      where: { id: params.sessionId },
      data: {
        contextSummary: summary,
      },
    });

    return summary;
  } catch (error) {
    console.error('Error generating session summary:', error);
    throw new Error('Failed to generate session summary');
  }
}
