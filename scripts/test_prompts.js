// Native fetch is available in Node 18+
// const fetch = ...

const SERVER = process.env.PROXY_URL || process.env.VITE_PROXY_URL || 'http://localhost:3001';

const samples = [
  {
    name: 'Simple question',
    messages: [{ role: 'user', content: 'What is a fever?' }]
  },
  {
    name: 'Chest pain emergency',
    messages: [{ role: 'user', content: 'Severe chest pain and difficulty breathing' }]
  }
];

async function run() {
  for (const s of samples) {
    console.log('---');
    console.log('Sample:', s.name);
    try {
      const res = await fetch(`${SERVER}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: s.messages, model: 'gpt-4o-mini' }),
      });
      const text = await res.text();
      console.log('Status:', res.status);
      console.log('Body:', text);
    } catch (err) {
      console.error('Error calling proxy:', err.message || err);
    }
  }
}

run();
