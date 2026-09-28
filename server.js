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

  console.log('? RAG database connected');

  const count = db
    .prepare('SELECT COUNT(*) AS count FROM documents')
    .get();

  console.log(`?? RAG chunks available: ${count.count}`);
} catch (error) {
  console.error(
    '? Could not open RAG database:',
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
    model: 'gemini-3.8-flash',
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
    // DECIDE WHETHER RAG SHOULD BE USED
    // ========================================

    const lowerMessage =
      message.toLowerCase();

    // ----------------------------------------
    // IRONFORGE-SPECIFIC TERMS
    // ----------------------------------------

    const ironforgeTerms = [
      'ironforge',
      'iron forge',

      'membership',
      'member',
      'membership plan',
      'membership plans',
      'membership price',
      'membership prices',

      'gym plan',
      'gym plans',

      'training program',
      'training programs',
      'program',
      'programs',

      'trainer',
      'trainers',
      'personal trainer',
      'personal training',

      'coach',
      'coaches',
      'coaching',

      'opening hours',
      'opening time',
      'opening times',
      'hours',
      'timings',
      'gym hours',

      'location',
      'address',

      'contact',
      'contact details',
      'phone',
      'phone number',
      'email',

      'facility',
      'facilities',
      'equipment',

      'class',
      'classes',

      'policy',
      'policies',

      'getting started',
      'start membership',
      'join the gym',
      'joining the gym',

      'gym access'
    ];

    // ----------------------------------------
    // GENERAL TOPICS THAT MUST NOT TRIGGER
    // IRONFORGE RAG
    // ----------------------------------------

    const generalTopicTerms = [
      'protein',
      'whey',
      'casein',
      'creatine',
      'pre workout',
      'pre-workout',
      'supplement',
      'supplements',
      'amino acid',
      'amino acids',

      'muscle growth',
      'muscle gain',
      'fat loss',
      'weight loss',
      'weight gain',
      'calorie',
      'calories',
      'macros',
      'carbohydrate',
      'carbs',
      'fat',
      'fats',

      'workout',
      'exercise',
      'exercises',
      'chest exercise',
      'back exercise',
      'leg exercise',
      'shoulder exercise',
      'biceps',
      'triceps',

      'progressive overload',

      'html',
      'css',
      'javascript',
      'python',
      'java',
      'c',
      'c++',
      'sql',
      'programming',
      'coding',

      'ai',
      'artificial intelligence',
      'machine learning',
      'technology',
      'computer'
    ];

    const isIronforgeQuestion =
      ironforgeTerms.some(term =>
        lowerMessage.includes(term)
      );

    const isGeneralTopic =
      generalTopicTerms.some(term =>
        lowerMessage.includes(term)
      );

    // ----------------------------------------
    // SPECIAL PROTEIN CHECK
    // ----------------------------------------
    //
    // "protein" must NEVER be confused with
    // "PRO" membership.
    //
    // Example:
    //
    // "Which is the best protein?"
    //       -> GENERAL
    //
    // "Which protein is best for muscle growth?"
    //       -> GENERAL
    //
    // "What is the PRO membership?"
    //       -> IRONFORGE
    //
    // ----------------------------------------

    const isProteinQuestion =
      /\bprotein\b/i.test(message);

    // ----------------------------------------
    // FINAL RAG DECISION
    // ----------------------------------------

    const useRag =
      isIronforgeQuestion &&
      !isGeneralTopic &&
      !isProteinQuestion;

    console.log('');
    console.log(
      `?? User question: "${message}"`
    );

    console.log(
      `?? RAG routing: ${
        useRag
          ? 'IRONFORGE'
          : 'GENERAL'
      }`
    );

    // ========================================
    // RAG SEARCH
    // ========================================
    //
    // IMPORTANT:
    //
    // RAG SEARCH ONLY HAPPENS WHEN THE QUESTION
    // IS ACTUALLY ABOUT IRONFORGE.
    //
    // This prevents:
    //
    // protein
    // creatine
    // Python
    // AI
    // exercise
    //
    // from retrieving unrelated IRONFORGE chunks.
    // ========================================

    let results = [];

    if (useRag) {

      console.log(
        '?? Searching IRONFORGE knowledge base...'
      );

      results =
        await searchKnowledge(message, 5);

      console.log(
        `?? Retrieved ${results.length} IRONFORGE chunks`
      );

    } else {

      console.log(
        '?? General question — RAG search skipped'
      );

    }

    // ========================================
    // CHECK RAG RELEVANCE
    // ========================================

    const bestScore =
      results.length > 0
        ? results[0].score
        : 0;

    console.log(
      `?? Best RAG relevance: ${bestScore.toFixed(4)}`
    );

    // ========================================
    // BUILD RAG CONTEXT
    // ========================================

    let context = '';

    if (
      useRag &&
      results.length > 0
    ) {

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

    const safeHistory =
      history
        .filter(
          item =>
            item &&
            (
              item.role === 'user' ||
              item.role === 'assistant'
            ) &&
            typeof item.content === 'string'
        )
        .map(item => ({
          role:
            item.role === 'user'
              ? 'user'
              : 'model',

          parts: [
            {
              text:
                item.content.slice(0, 2000)
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

When the user's question is specifically about
IRONFORGE FITNESS, use the retrieved IRONFORGE
knowledge as the authoritative source.

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

For general questions that are NOT specifically
about IRONFORGE FITNESS, answer using your general
knowledge.

Examples:

- What is protein?
- Which protein is best?
- Which whey protein is best?
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

IMPORTANT:

The word "protein" refers to nutrition unless the
user explicitly connects it to IRONFORGE FITNESS.

Do NOT interpret "protein" as "PRO membership".

For example:

User:
"Which is the best protein?"

This is a GENERAL FITNESS/NUTRITION question.

Do NOT answer with:

"PRO is $59/month."

Instead, answer the protein question normally.

==================================================
PRO MEMBERSHIP VS PROTEIN
==================================================

"PRO membership" or "IRONFORGE PRO" refers to an
IRONFORGE membership plan.

"protein" refers to nutrition.

These are completely different concepts.

Never confuse:

PRO

with:

protein

If the user asks:

"What is the PRO membership?"

Use IRONFORGE knowledge.

If the user asks:

"Which protein is best?"

Answer the general nutrition question.

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

${
  context ||
  'No IRONFORGE knowledge is being used for this question.'
}
`;

    // ========================================
    // GEMINI REQUEST
    // ========================================

    const contents = [
      ...(useRag ? safeHistory : []),

      {
        role: 'user',

        parts: [
          {
            text: message
          }
        ]
      }
    ];

    let response;

    // ========================================
    // GEMINI RETRY
    // ========================================

    for (
      let attempt = 1;
      attempt <= 3;
      attempt++
    ) {

      try {

        response =
          await gemini.models.generateContent({
            model: 'gemini-3.8-flash',

            contents,

            config: {
              systemInstruction:
                instructions,

              maxOutputTokens: 500
            }
          });

        break;

      } catch (error) {

        const status =
          error?.status ||
          error?.code ||
          error?.response?.status;

        const isTemporary =
          status === 503 ||
          status === 429 ||
          String(
            error?.message || ''
          ).includes('503') ||
          String(
            error?.message || ''
          ).includes('429');

        if (
          !isTemporary ||
          attempt === 3
        ) {
          throw error;
        }

        const delay =
          Math.min(
            1000 * 2 ** (attempt - 1),
            8000
          );

        console.log(
          `Gemini temporarily unavailable. Retry ${attempt}/3 in ${delay}ms...`
        );

        await new Promise(
          resolve =>
            setTimeout(
              resolve,
              delay
            )
        );
      }
    }

    // ========================================
    // AI ANSWER
    // ========================================

    const answer =
      response.text ||
      'I could not generate an answer right now.';

    // ========================================
    // RESPONSE
    // ========================================

    res.json({

      answer,

      // Only return sources when RAG was actually
      // used for this question.
      sources: useRag
        ? results
            .filter(
              result =>
                result.score > 0.45
            )
            .map(result => ({
              file: result.source,

              score: Number(
                result.score.toFixed(4)
              )
            }))
        : []

    });

  } catch (error) {

    console.error('');

    console.error(
      '? Gemini/RAG error:',
      error?.message || error
    );

    res.status(502).json({
      error:
        'AI service request failed.'
    });
  }
});

// ========================================
// WEBSITE FALLBACK
// ========================================

app.use((_req, res) => {

  res.sendFile(
    path.join(
      __dirname,
      'index.html'
    )
  );

});

// ========================================
// START SERVER
// ========================================

app.listen(
  port,
  '0.0.0.0',
  () => {

    console.log('');

    console.log(
      '======================================'
    );

    console.log(
      ' IRONFORGE AI CUSTOMER SUPPORT'
    );

    console.log(
      '======================================'
    );

    console.log(
      `?? Website: http://localhost:${port}`
    );

    console.log(
      `?? Gemini: ${
        gemini
          ? 'configured'
          : 'NOT configured'
      }`
    );

    console.log(
      `?? RAG: ${
        db
          ? 'connected'
          : 'NOT connected'
      }`
    );

    console.log(
      '======================================'
    );

  }
);




