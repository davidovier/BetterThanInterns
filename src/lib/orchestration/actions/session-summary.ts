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
    // Fetch session with workspace
    const session = await db.assistantSession.findUnique({
      where: { id: params.sessionId },
      include: {
        workspace: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    // Build context from session metadata
    const contextParts: string[] = [];
    contextParts.push(`Session Title: ${session.title}`);
    contextParts.push(`Workspace: ${session.workspace.name}`);

    const metadata = session.metadata as any;

    // Fetch linked artifacts from metadata
    if (metadata.processIds?.length > 0) {
      const processes = await db.process.findMany({
        where: { id: { in: metadata.processIds } },
        include: {
          steps: true,
          opportunities: true,
        },
      });

      contextParts.push(`\nProcesses (${processes.length}):`);
      for (const process of processes) {
        contextParts.push(`- ${process.name}: ${process.steps.length} steps, ${process.opportunities.length} opportunities`);
      }
    }

    if (metadata.blueprintIds?.length > 0) {
      contextParts.push(`\nBlueprints: ${metadata.blueprintIds.length} generated`);
    }

    if (metadata.aiUseCaseIds?.length > 0) {
      contextParts.push(`\nAI Use Cases: ${metadata.aiUseCaseIds.length} registered for governance`);
    }

    if (metadata.opportunityIds?.length > 0) {
      contextParts.push(`\nLinked Opportunities: ${metadata.opportunityIds.length}`);
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
