import OpenAI from 'openai';
import { chatCompletionWithBilling } from './aiWrapper';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function testLLMCall(workspaceId: string, prompt: string): Promise<string> {
  try {
    const result = await chatCompletionWithBilling(
      workspaceId,
      'LIGHT_CLARIFICATION',
      {
        model: 'gpt-4o', // Updated to gpt-4o (faster, cheaper, better performance)
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant for Better Than Interns.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 150,
      }
    );

    if (!result.success) {
      throw result.error;
    }

    return result.data.choices[0]?.message?.content || 'No response';
  } catch (error) {
    console.error('LLM call error:', error);
    throw new Error('Failed to call LLM');
  }
}
