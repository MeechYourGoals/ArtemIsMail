module.exports = {
  emails: [
    {
      id: "demo-1",
      gmailId: "g-1",
      threadId: "t-1",
      snippet: "Please review the attached term sheet by EOD.",
      subject: "URGENT: Series B Term Sheet - Review Needed",
      body: "Hi Artemis,\n\nHere is the updated term sheet from Sequoia. We need your comments by 5 PM today to stay on track for closing.\n\nBest,\nSarah (General Counsel)",
      from: "sarah@company.com",
      to: "me@company.com",
      date: new Date().toISOString(),
      isRead: false,
      score: 95,
      priority: "CRITICAL",
      signals: JSON.stringify([
        { name: "sender_vip", weight: 40, evidence: "Sarah (GC) is in VIP list" },
        { name: "urgent_language", weight: 30, evidence: "Subject contains 'URGENT'" },
        { name: "deadline_detected", weight: 20, evidence: "Body mentions '5 PM today'" }
      ]),
      decision: {
        suggestedAction: "DRAFT_REPLY",
        confidence: "HIGH",
        reasoning: "Legal document with explicit deadline today from VIP.",
        draftReply: "Hi Sarah,\n\nReceived. I will review the term sheet and get back to you with comments before 5 PM.\n\nBest,\nArtemis"
      }
    },
    {
      id: "demo-2",
      gmailId: "g-2",
      threadId: "t-2",
      snippet: "Great catching up! Let's schedule the follow-up.",
      subject: "Re: Coffee & Partnership",
      body: "Hey! Loved our chat. When are you free next week to discuss the pilot?",
      from: "mark@partner.com",
      to: "me@company.com",
      date: new Date(Date.now() - 3600000).toISOString(),
      isRead: false,
      score: 75,
      priority: "IMPORTANT",
      signals: JSON.stringify([
        { name: "direct_to_user", weight: 30, evidence: "Direct email to you" },
        { name: "question_detected", weight: 20, evidence: "Asking for availability" }
      ]),
      decision: {
        suggestedAction: "DRAFT_REPLY",
        confidence: "HIGH",
        reasoning: "Scheduling request from potential partner.",
        draftReply: "Hi Mark,\n\nGreat connecting with you too! I'm free Tuesday after 2 PM or Thursday morning. Let me know what works.\n\nBest,\nArtemis"
      }
    },
    {
      id: "demo-3",
      gmailId: "g-3",
      threadId: "t-3",
      snippet: "Your weekly digest of tech news.",
      subject: "TechCrunch Weekly",
      body: "Top stories this week: AI takes over email...",
      from: "news@techcrunch.com",
      to: "me@company.com",
      date: new Date(Date.now() - 7200000).toISOString(),
      isRead: true,
      score: 15,
      priority: "NOISE",
      signals: JSON.stringify([
        { name: "newsletter_detected", weight: -50, evidence: "List-Unsubscribe header found" }
      ]),
      decision: {
        suggestedAction: "ARCHIVE",
        confidence: "HIGH",
        reasoning: "Standard newsletter, already read.",
        draftReply: null
      }
    }
  ]
};
