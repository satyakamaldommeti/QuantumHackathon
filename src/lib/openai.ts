export async function summarizeText(text: string, model = 'gpt-4o-mini') {
  // prefer proxy by default; set VITE_USE_PROXY=false to call OpenAI directly from the client
  const rawUseProxy = (import.meta as any).env?.VITE_USE_PROXY;
  const useProxy = rawUseProxy === undefined ? true : rawUseProxy === 'true';
  const proxyBase = (import.meta as any).env?.VITE_PROXY_URL || 'http://localhost:3001';
  const prompt = `Please provide a concise, bullet-point medical summary of the following text. Keep language simple and include clear action items and warning signs. Do not provide medical diagnosis; advise consulting a healthcare professional when appropriate.\n\n${text}`;

  const messages = [
    { role: 'system', content: 'You are a helpful assistant that summarizes medical documents into simple bullet points.' },
    { role: 'user', content: prompt }
  ];

  if (useProxy) {
    const endpoints = [`${proxyBase}/api/chat`, '/api/chat'];
    let lastErr: any = null;
    for (const endpoint of endpoints) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages, model }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          lastErr = new Error(`Proxy error ${endpoint}: ${res.status} ${JSON.stringify(err)}`);
          continue;
        }
        const data = await res.json();
        return (data.reply || '').trim();
      } catch (err: any) {
        lastErr = err;
        continue;
      }
    }
    throw new Error(`All proxy endpoints failed: ${lastErr?.message || lastErr}`);
  }

  const key = (import.meta as any).env?.VITE_OPENAI_API_KEY;
  if (!key) {
    throw new Error('VITE_OPENAI_API_KEY is not set. Add it to your .env file or enable proxy.');
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 650,
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const textErr = await res.text();
    throw new Error(`OpenAI API error: ${res.status} ${textErr}`);
  }

  const data = await res.json();
  const reply = data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text ?? '';
  return reply.trim();
}

export async function chatCompletion(messages: Array<{ role: string; content: string | Array<any> }>, model = 'gpt-4o-mini') {
  const rawUseProxy = (import.meta as any).env?.VITE_USE_PROXY;
  const useProxy = rawUseProxy === undefined ? true : rawUseProxy === 'true';
  const proxyBase = (import.meta as any).env?.VITE_PROXY_URL || 'http://localhost:3001';
  const key = (import.meta as any).env?.VITE_OPENAI_API_KEY;

  // Prefer proxy by default to avoid CORS errors
  if (useProxy) {
    const endpoints = [`${proxyBase}/api/chat`, '/api/chat'];
    let lastErr: any = null;
    for (const endpoint of endpoints) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages, model }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          lastErr = new Error(`Proxy error ${endpoint}: ${res.status} ${JSON.stringify(err)}`);
          continue;
        }
        const data = await res.json();
        return (data.reply || '').trim();
      } catch (err: any) {
        lastErr = err;
        continue;
      }
    }
    throw new Error(`All proxy endpoints failed: ${lastErr?.message || lastErr}`);
  }

  if (!key) {
    throw new Error('VITE_OPENAI_API_KEY is not set. Add it to your .env file or enable proxy.');
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 800,
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const textErr = await res.text();
    throw new Error(`OpenAI API error: ${res.status} ${textErr}`);
  }

  const data = await res.json();
  const reply = data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text ?? '';
  return reply.trim();
}

/**
 * Analyzes a medical image (prescription, report, etc.) for food and lifestyle recommendations.
 */
export async function analyzeMedicalImage(base64Image: string, userNotes?: string, model = 'gpt-4o') {
  const prompt = `Analyze this medical image (e.g., prescription, report, or food item).
  
  Please provide a structured response focusing strictly on:
  1. **Foods**: Recommended foods and foods to avoid based on the medical context.
  2. **Lifestyle**: Lifestyle changes, exercises, or habits to adopt/avoid.
  3. **Key Observations**: Briefly state what the document/image shows (medication, diagnosis, etc.).
  
  Keep it simple, actionable, and bullet-pointed. Do not provide medical diagnosis; advise consulting a healthcare professional.
  ${userNotes ? `\nUser Notes: ${userNotes}` : ''}`;

  const messages = [
    {
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        {
          type: 'image_url',
          image_url: {
            url: base64Image,
          },
        },
      ],
    },
  ];

  return chatCompletion(messages, model);
}