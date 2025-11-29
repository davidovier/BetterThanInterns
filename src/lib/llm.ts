import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function testLLMCall(prompt: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
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
    });

    return response.choices[0]?.message?.content || 'No response';
  } catch (error) {
    console.error('LLM call error:', error);
    throw new Error('Failed to call LLM');
  }
}
