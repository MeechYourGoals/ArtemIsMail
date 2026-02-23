const assert = require('node:assert');
const test = require('node:test');

test('Mock Data Integrity', () => {
  const demoData = require('../src/data/demoData');
  assert.ok(demoData.emails.length > 0);
  assert.strictEqual(demoData.emails[0].priority, 'CRITICAL');
});
