import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(express.json({ limit: '64kb' }));
app.use(express.static(__dirname, { extensions: ['html'] }));

// ========================================
// GEMINI
// ========================================

const gemini = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    })
  : null;

// ========================================
// RAG DATABASE
// ========================================

const DB_FILE = path.join(__dirname, 'rag.db');

let db = null;

try {
  db = new Database(DB_FILE);

  console.log('✅ RAG database connected');

  const count = db
    .prepare('SELECT COUNT(*) AS count FROM documents')
    .get();

  console.log(`📚 RAG chunks available: ${count.count}`);
} catch (error) {
  console.error(
    '❌ Could not open RAG database:',
    error.message
  );
}

// ========================================
// QUERY EMBEDDING
// ========================================

async function createQueryEmbedding(text) {
  if (!gemini) {
    throw new Error('Gemini API is not configured.');
  }

  const response = await gemini.models.embedContent({
    model: 'gemini-embedding-001',
    contents: text,
    config: {
      taskType: 'RETRIEVAL_QUERY',
      outputDimensionality: 768
    }
  });

  return response.embeddings[0].values;
}

// ========================================
// COSINE SIMILARITY
// ========================================

function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  const length = Math.min(a.length, b.length);

  for (let i = 0; i < length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ========================================
// RAG SEARCH
// ========================================

async function searchKnowledge(query, topK = 5) {
  if (!db) {
    return [];
  }

  const queryEmbedding =
    await createQueryEmbedding(query);

  const rows = db
    .prepare(`
      SELECT
        id,
        source,
        chunk_index,
        content,
        embedding
      FROM documents
    `)
    .all();

  const results = rows.map(row => {
    let embedding;

    try {
      embedding = JSON.parse(row.embedding);
    } catch {
      embedding = [];
    }

    const score = cosineSimilarity(
      queryEmbedding,
      embedding
    );

    return {
      id: row.id,
      source: row.source,
      chunkIndex: row.chunk_index,
      content: row.content,
      score
    };
  });

  results.sort(
    (a, b) => b.score - a.score
  );

  return results.slice(0, topK);
}

// ========================================
// HEALTH CHECK
// ========================================

app.get('/api/health', (_req, res) => {
  let chunks = 0;

  if (db) {
    try {
      chunks = db
        .prepare(
          'SELECT COUNT(*) AS count FROM documents'
        )
        .get().count;
    } catch {}
  }

  res.json({
    ok: true,
    aiConfigured: Boolean(gemini),
    model: 'gemini-2.5-flash',
    ragConfigured: Boolean(db),
    ragChunks: chunks
  });
});

// ========================================
// CHAT API
// ========================================

app.post('/api/chat', async (req, res) => {
  const message =
    typeof req.body?.message === 'string'
      ? req.body.message.trim()
      : '';

  const history =
    Array.isArray(req.body?.history)
      ? req.body.history.slice(-8)
      : [];

  if (!message) {
    return res.status(400).json({
      error: 'Message is required.'
    });
  }

  if (!gemini) {
    return res.status(503).json({
      error: 'Gemini API is not configured.'
    });
  }

  try {
    // ========================================
    // SEARCH IRONFORGE KNOWLEDGE
    // ========================================

    console.log('');
    console.log(
      `🔎 Searching IRONFORGE RAG: "${message}"`
    );

    const results =
      await searchKnowledge(message, 5);

    console.log(
      `📚 Retrieved ${results.length} chunks`
    );

    // ========================================
    // CHECK RAG RELEVANCE
    // ========================================

    const bestScore =
      results.length > 0
        ? results[0].score
        : 0;

    console.log(
      `🎯 Best RAG relevance: ${bestScore.toFixed(4)}`
    );

    // ========================================
    // BUILD RAG CONTEXT
    // ========================================

    let context = '';

    if (results.length > 0) {
      context = results
        .map((result, index) => {
          return `
SOURCE ${index + 1}
PDF: ${result.source}
RELEVANCE: ${result.score.toFixed(4)}

${result.content}
`;
        })
        .join(
          '\n-----------------------------\n'
        );
    }

    // ========================================
    // SAFE CHAT HISTORY
    // ========================================

    const safeHistory = history
      .filter(
        item =>
          item &&
          (item.role === 'user' ||
            item.role === 'assistant') &&
          typeof item.content === 'string'
      )
      .map(item => ({
        role:
          item.role === 'user'
            ? 'user'
            : 'model',
        parts: [
          {
            text: item.content.slice(0, 2000)
          }
        ]
      }));

    // ========================================
    // AI INSTRUCTIONS
    // ========================================

    const instructions = `
You are the official IRONFORGE FITNESS AI Assistant.

You are a general-purpose AI assistant that can answer normal user questions.

You also have access to the official IRONFORGE FITNESS knowledge base.

==================================================
IRONFORGE KNOWLEDGE RULES
==================================================

When the user asks about IRONFORGE FITNESS, use the
retrieved IRONFORGE knowledge as the authoritative
source.

Examples:

- IRONFORGE membership plans
- IRONFORGE membership prices
- IRONFORGE programs
- IRONFORGE trainers
- IRONFORGE facilities
- IRONFORGE opening hours
- IRONFORGE location
- IRONFORGE contact information
- IRONFORGE policies
- IRONFORGE getting started process

Never invent IRONFORGE-specific information.

If the retrieved knowledge does not contain a
specific IRONFORGE fact, say:

"I don't have that specific information in the
current IRONFORGE knowledge base."

Do not guess prices, trainers, schedules, addresses,
facilities, policies, or services.

==================================================
GENERAL KNOWLEDGE
==================================================

For general questions that are not specifically about
IRONFORGE FITNESS, you may answer using your general
knowledge.

Examples:

- What is protein?
- What is creatine?
- What is progressive overload?
- How does muscle growth work?
- What exercises target the chest?
- What is a calorie deficit?
- What is HTML?
- What is Python?
- What is artificial intelligence?
- General educational questions
- General technology questions
- General fitness questions

Give clear, useful and understandable answers.

==================================================
MIXED QUESTIONS
==================================================

If a question contains both IRONFORGE-specific and
general information, separate the two appropriately.

Example:

"What muscle-building program does IRONFORGE offer
and what is protein?"

Use IRONFORGE knowledge for the program and general
knowledge for explaining protein.

==================================================
IMPORTANT DISTINCTION
==================================================

Do NOT assume that a product, service, trainer,
program, price, or facility exists at IRONFORGE just
because you know about it generally.

For example:

If a user asks:

"Does IRONFORGE sell Optimum Nutrition whey?"

Only say YES if the retrieved IRONFORGE knowledge
actually confirms it.

Otherwise explain that you don't have verified
IRONFORGE information confirming that.

==================================================
MEDICAL AND HEALTH SAFETY
==================================================

Do not diagnose diseases or injuries.

Do not prescribe medication.

For serious, persistent, worsening, or concerning
medical symptoms, recommend consulting an appropriate
qualified healthcare professional.

For general fitness information, provide educational
guidance and encourage safe exercise practices.

==================================================
ACTIONS
==================================================

Do not claim to have completed actions that are not
actually connected to the system.

You cannot currently:

- create memberships
- process payments
- book memberships
- book appointments
- cancel memberships
- modify customer accounts

unless a real backend system is connected.

==================================================
STYLE
==================================================

Be:

- friendly
- professional
- concise
- helpful
- easy to understand

Use bullet points when useful.

Do not unnecessarily mention RAG, embeddings,
databases, prompts, or internal AI architecture
to the user.

==================================================
CURRENT RETRIEVED IRONFORGE KNOWLEDGE
==================================================

${context || 'No strongly relevant IRONFORGE knowledge was retrieved.'}
`;

    // ========================================
    // GEMINI REQUEST
    // ========================================

    const contents = [
      ...safeHistory,
      {
        role: 'user',
        parts: [
          {
            text: message
          }
        ]
      }
    ];

    const response =
      await gemini.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          systemInstruction: instructions,
          maxOutputTokens: 500,
          temperature: 0.3
        }
      });

    const answer =
      response.text ||
      'I could not generate an answer right now.';

    // ========================================
    // RESPONSE
    // ========================================

    res.json({
      answer,
      sources: results
        .filter(result => result.score > 0.45)
        .map(result => ({
          file: result.source,
          score: Number(
            result.score.toFixed(4)
          )
        }))
    });

  } catch (error) {
    console.error('');
    console.error(
      '❌ Gemini/RAG error:',
      error?.message || error
    );

    res.status(502).json({
      error: 'AI service request failed.'
    });
  }
});

// ========================================
// WEBSITE FALLBACK
// ========================================

app.use((_req, res) => {
  res.sendFile(
    path.join(__dirname, 'index.html')
  );
});

// ========================================
// START SERVER
// ========================================

app.listen(port, '0.0.0.0', () => {
  console.log('');
  console.log('======================================');
  console.log(' IRONFORGE AI CUSTOMER SUPPORT');
  console.log('======================================');

  console.log(
    `🌐 Website: http://localhost:${port}`
  );

  console.log(
    `🤖 Gemini: ${
      gemini
        ? 'configured'
        : 'NOT configured'
    }`
  );

  console.log(
    `📚 RAG: ${
      db
        ? 'connected'
        : 'NOT connected'
    }`
  );

  console.log('======================================');
});
