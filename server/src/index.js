require('dotenv').config();
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');
const demoData = require('./data/demoData');
const { analyzeEmailWithAI } = require('./ai/analyzer');

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const getUserId = (req) => req.headers['x-user-id'] || null;

// API Routes
app.get('/api/emails', async (req, res) => {
  const mode = req.query.mode;
  console.log(`Fetching emails in mode: ${mode}`);

  if (mode === 'demo') {
    return res.json(demoData.emails);
  }

  try {
    const emails = await prisma.email.findMany({
      orderBy: { date: 'desc' },
      include: { decision: true }
    });
    res.json(emails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
});

// Mock Sync trigger
app.post('/api/sync', async (req, res) => {
  res.json({ status: 'sync_started', message: 'Syncing emails...' });
});

// User settings (custom instructions)
app.get('/api/settings', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    let settings = await prisma.userSettings.findUnique({ where: { userId } });
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: { userId, customInstructions: '' }
      });
    }
    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.put('/api/settings', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { customInstructions } = req.body || {};
  try {
    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: { customInstructions: String(customInstructions ?? '') },
      create: { userId, customInstructions: String(customInstructions ?? '') }
    });
    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Knowledge base
app.get('/api/knowledge', async (req, res) => {
  const userId = getUserId(req);
  try {
    const items = await prisma.knowledgeItem.findMany({
      where: userId ? { OR: [{ userId }, { userId: null }] } : { userId: null },
      orderBy: { createdAt: 'desc' }
    });
    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch knowledge' });
  }
});

app.post('/api/knowledge', async (req, res) => {
  const userId = getUserId(req);
  const { title, content, type } = req.body || {};
  if (!title || !content) return res.status(400).json({ error: 'title and content required' });

  try {
    const item = await prisma.knowledgeItem.create({
      data: {
        title: String(title),
        content: String(content),
        type: String(type || 'NOTE'),
        userId: userId || null
      }
    });
    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create knowledge item' });
  }
});

app.delete('/api/knowledge/:id', async (req, res) => {
  const userId = getUserId(req);
  const { id } = req.params;
  try {
    const item = await prisma.knowledgeItem.findFirst({
      where: { id, ...(userId ? { userId } : {}) }
    });
    if (!item) return res.status(404).json({ error: 'Not found' });
    await prisma.knowledgeItem.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete' });
  }
});

// AI analyze email
app.post('/api/ai/analyze', async (req, res) => {
  const userId = getUserId(req);
  const { subject, body, from, to } = req.body || {};
  if (!subject && !body) return res.status(400).json({ error: 'subject or body required' });

  try {
    let customInstructions = '';
    let knowledgeContext = '';

    if (userId) {
      const settings = await prisma.userSettings.findUnique({ where: { userId } });
      customInstructions = settings?.customInstructions || '';

      const knowledgeItems = await prisma.knowledgeItem.findMany({
        where: { OR: [{ userId }, { userId: null }] },
        take: 20
      });
      knowledgeContext = knowledgeItems.map(k => `[${k.title}]\n${k.content}`).join('\n\n');
    }

    const decision = await analyzeEmailWithAI({
      subject: subject || '',
      body: body || '',
      from: from || '',
      to: to || '',
      customInstructions,
      knowledgeContext
    });

    res.json(decision);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'AI analysis failed' });
  }
});

app.listen(port, () => {
  console.log(`Artemis Server running on port ${port}`);
});
