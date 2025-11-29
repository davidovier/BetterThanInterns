import OpenAI from 'openai';
import { WorkflowDelta } from '@/types/process';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ProcessContext = {
  processName: string;
  processDescription?: string;
  industry?: string;
  existingSteps: Array<{
    id: string;
    title: string;
    description?: string;
    owner?: string;
  }>;
  existingLinks: Array<{
    fromStepId: string;
    toStepId: string;
  }>;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
};

const SYSTEM_PROMPT = `You are a business process mapping assistant for Better Than Interns.

Your role is to help users document their business processes through conversation. You should:
1. Ask clarifying questions about unclear steps
2. Extract process steps (activities), roles/owners, inputs/outputs, and flow between steps
3. Identify frequency (e.g., "Daily", "Weekly", "Per order") and duration (e.g., "5 minutes", "2 hours")
4. Be conversational and helpful, not robotic

IMPORTANT: You must ALWAYS return your response in this EXACT JSON format:
{
  "assistant_message": "Your conversational response to the user",
  "workflow_delta": {
    "new_steps": [
      {
        "temp_id": "unique_temp_id",
        "title": "Step name",
        "description": "What happens in this step",
        "owner": "Role or person",
        "inputs": ["Input 1", "Input 2"],
        "outputs": ["Output 1"],
        "frequency": "Daily",
        "duration": "10 minutes"
      }
    ],
    "updated_steps": [
      {
        "id": "existing_step_id",
        "updates": {
          "title": "Updated title"
        }
      }
    ],
    "new_links": [
      {
        "from_step": "step_id_or_temp_id",
        "to_step": "step_id_or_temp_id",
        "label": "then"
      }
    ]
  }
}

Guidelines:
- Only include new_steps if the user describes NEW steps
- Only include updated_steps if clarifying EXISTING steps
- Only include new_links when you understand the flow between steps
- Use temp_id format like "temp_1", "temp_2" for new steps
- For links, use existing step IDs or temp_ids from new_steps
- Be conservative: if unsure about a detail, ask rather than guess
- Keep assistant_message friendly and use the brand voice (smart, helpful, slightly witty)`;

export async function callProcessAssistant(
  userMessage: string,
  context: ProcessContext
): Promise<{
  assistantMessage: string;
  workflowDelta: WorkflowDelta;
}> {
  try {
    // Build context summary
    const contextSummary = buildContextSummary(context);

    // Build messages
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      {
        role: 'system',
        content: `CONTEXT:\n${contextSummary}`,
      },
    ];

    // Add recent conversation history (last 5 messages)
    const recentHistory = context.conversationHistory.slice(-5);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: userMessage,
    });

    // Call OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from LLM');
    }

    // Parse response
    const parsed = JSON.parse(content);

    return {
      assistantMessage: parsed.assistant_message || '',
      workflowDelta: parsed.workflow_delta || {},
    };
  } catch (error) {
    console.error('Process assistant error:', error);
    throw new Error(`LLM error: Failed to process message - ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function buildContextSummary(context: ProcessContext): string {
  let summary = `Process: ${context.processName}\n`;

  if (context.processDescription) {
    summary += `Description: ${context.processDescription}\n`;
  }

  if (context.industry) {
    summary += `Industry: ${context.industry}\n`;
  }

  summary += `\nExisting Steps (${context.existingSteps.length}):\n`;
  if (context.existingSteps.length === 0) {
    summary += '  (none yet)\n';
  } else {
    context.existingSteps.forEach((step) => {
      summary += `  - [${step.id}] ${step.title}`;
      if (step.owner) summary += ` (${step.owner})`;
      summary += '\n';
      if (step.description) {
        summary += `    ${step.description}\n`;
      }
    });
  }

  summary += `\nExisting Links (${context.existingLinks.length}):\n`;
  if (context.existingLinks.length === 0) {
    summary += '  (none yet)\n';
  } else {
    context.existingLinks.forEach((link) => {
      summary += `  - ${link.fromStepId} -> ${link.toStepId}\n`;
    });
  }

  return summary;
}
