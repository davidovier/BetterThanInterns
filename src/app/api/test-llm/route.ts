import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { testLLMCall } from '@/lib/llm';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const response = await testLLMCall(prompt);

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Test LLM error:', error);
    return NextResponse.json(
      { error: 'Failed to call LLM' },
      { status: 500 }
    );
  }
}
