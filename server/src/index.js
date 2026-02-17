const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');
const demoData = require('./data/demoData');

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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
  // In a real app, this would start the Gmail sync job
  res.json({ status: 'sync_started', message: 'Syncing emails...' });
});

app.listen(port, () => {
  console.log(`Artemis Server running on port ${port}`);
});
