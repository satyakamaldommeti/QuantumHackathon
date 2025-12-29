// Load env from root
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
// Also load env from current server directory (overrides root if conflict, or fills missing)
require('dotenv').config();
const express = require('express');
// const fetch = require('node-fetch'); // Using native fetch in Node 18+
const cors = require('cors');
const connectDB = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB
connectDB();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const OPENAI_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_KEY) {
  console.warn('Warning: OPENAI_API_KEY is not set. The proxy will return 500 for AI calls.');
}

// Import routes
const conversationsRouter = require('./routes/conversations');
const profilesRouter = require('./routes/profiles');
const documentsRouter = require('./routes/documents');
const emergencyRouter = require('./routes/emergency');

// API Routes
app.use('/api/conversations', conversationsRouter);
app.use('/api/profiles', profilesRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/emergency', emergencyRouter);

app.post('/api/chat', async (req, res) => {
  try {
    if (!OPENAI_KEY) {
      console.error('Proxy request received but OPENAI_API_KEY not set');
      return res.status(500).json({ error: 'Server missing OPENAI_API_KEY' });
    }

    const { messages, model = 'gpt-4o-mini' } = req.body || {};
    if (!Array.isArray(messages)) return res.status(400).json({ error: 'messages array required' });

    // Log a brief preview for debugging (do not log full user data in production)
    try { console.log(`Proxying chat request model=${model} messages=${messages?.length || 0}`); } catch (e) { }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 800,
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data });
    }

    const reply = data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text ?? '';
    return res.json({ reply, raw: data });
  } catch (err) {
    console.error('Proxy /api/chat error', err);
    return res.status(500).json({ error: 'Proxy error' });
  }
});

app.post('/api/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`✅ Aidspeak proxy listening on http://localhost:${3001}`);
});

