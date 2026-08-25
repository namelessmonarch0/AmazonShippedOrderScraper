'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

// Requiring the userscript under Node executes it with no `window`/`document`
// globals in scope, so it exports its pure functions (section 4) and returns
// before the browser-wiring section (5) ever runs -- no panel gets created,
// no localStorage gets touched.
const core = require('../amazon-sku-auto-scanner.user.js');

const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');

function loadFixtureDoc(name) {
  const html = fs.readFileSync(path.join(FIXTURES_DIR, name), 'utf8');
  return new JSDOM(html).window.document;
}

function loadFixtureTable(name) {
  const doc = loadFixtureDoc(name);
  return doc.querySelector('#orders-table');
}

// ---------------------------------------------------------------------------
// calculateTotalForSKU -- counting rules confirmed with the user:
//   shipped -> count every item row against its own SKU
//   cancelled -> count 0
//   refunds -> ignored entirely, still counts as shipped
// ---------------------------------------------------------------------------

test('calculateTotalForSKU: single-item shipped order counts 1', () => {
  const table = loadFixtureTable('order-single-item-shipped.html');
  assert.equal(core.calculateTotalForSKU('JOURNAL-BFL-COLOR', table), 1);
});

test('calculateTotalForSKU: SKU match is case-insensitive but exact (no substring match)', () => {
  const table = loadFixtureTable('order-single-item-shipped.html');
  assert.equal(core.calculateTotalForSKU('journal-bfl-color', table), 1);
  assert.equal(core.calculateTotalForSKU('JOURNAL-BFL', table), 0);
  assert.equal(core.calculateTotalForSKU('JOURNAL-BFL-COLOR-X', table), 0);
});

test('calculateTotalForSKU: two-item order, same SKU, refund applied -- refund is ignored', () => {
  const table = loadFixtureTable('order-two-item-same-sku-refunded.html');
  assert.equal(core.calculateTotalForSKU('JOURNAL-BFL-COLOR', table), 2);
});

test('calculateTotalForSKU: mixed-SKU order credits each item to its own SKU', () => {
  const table = loadFixtureTable('order-mixed-sku.html');
  assert.equal(core.calculateTotalForSKU('JOURNAL-BFL-COLOR', table), 1);
  assert.equal(core.calculateTotalForSKU('WALLET-USA4-BL', table), 1);
  assert.equal(core.calculateTotalForSKU('WALLET-USA5-BL', table), 0); // unrelated SKU, prefix-adjacent
});

test('calculateTotalForSKU: cancelled order counts 0', () => {
  const table = loadFixtureTable('order-cancelled.html');
  assert.equal(core.calculateTotalForSKU('JOURNAL-BFL-COLOR', table), 0);
});

test('calculateTotalForSKU: exact-match guards against real prefix pairs in the SKU list', () => {
  // Regression guard for a real pair in skusToTest: BIBLE-USA1-L-RU vs
  // BIBLE-USA1-L-RU-FBA. A startsWith/includes comparison would conflate
  // them; exact equality (case-insensitive) must not.
  const dom = new JSDOM(`
    <table id="orders-table"><tbody>
      <tr>
        <td><div><div><span class="order-status-column"><div><span class="main-status shipped-status"><span>Shipped</span></span></div></span></div></div></td>
        <td><div class=""><div><span class="">SKU</span>:  BIBLE-USA1-L-RU-FBA</div></div><div class=""><div><span class="">Quantity Shipped</span>:  <b>5</b></div></div></td>
      </tr>
    </tbody></table>
  `);
  const table = dom.window.document.querySelector('#orders-table');
  assert.equal(core.calculateTotalForSKU('BIBLE-USA1-L-RU', table), 0);
  assert.equal(core.calculateTotalForSKU('BIBLE-USA1-L-RU-FBA', table), 5);
});

test('calculateTotalForSKU: a Quantity Refunded field is never summed, even if present', () => {
  // Not seen live, but the app bundle renders quantityRefunded with
  // identical markup to quantityShipped -- guard the whitelist explicitly.
  const dom = new JSDOM(`
    <table id="orders-table"><tbody>
      <tr>
        <td><div><div><span class="order-status-column"><div><span class="main-status shipped-status"><span>Shipped</span></span></div></span></div></div></td>
        <td>
          <div class=""><div><span class="">SKU</span>:  JOURNAL-BFL-COLOR</div></div>
          <div class=""><div><span class="">Quantity Shipped</span>:  <b>2</b></div></div>
          <div class=""><div><span class="">Quantity Refunded</span>:  <b>1</b></div></div>
        </td>
      </tr>
    </tbody></table>
  `);
  const table = dom.window.document.querySelector('#orders-table');
  assert.equal(core.calculateTotalForSKU('JOURNAL-BFL-COLOR', table), 2);
});

// ---------------------------------------------------------------------------
// resultsState -- the settle-detection fix for root causes #2 and #3.
// ---------------------------------------------------------------------------

test('resultsState: pre-hydration app shell is loading, never empty', () => {
  const doc = loadFixtureDoc('results-loading-app-shell.html');
  assert.equal(core.resultsState(doc), 'loading');
});

test('resultsState: transient spinner-over-stale-empty-text is loading, NOT empty', () => {
  // This is the exact regression: the old waitForResultsChange() saw this
  // state (different from the previous full table) and called it "done".
  const doc = loadFixtureDoc('results-loading-transient-empty.html');
  assert.equal(core.resultsState(doc), 'loading');
});

test('resultsState: genuinely empty results (no spinner, app mounted) is empty', () => {
  const doc = loadFixtureDoc('results-empty-verified.html');
  assert.equal(core.resultsState(doc), 'empty');
});

test('resultsState: settled table with rows is rows', () => {
  const doc = loadFixtureDoc('results-ready-with-pagination.html');
  assert.equal(core.resultsState(doc), 'rows');
});

// ---------------------------------------------------------------------------
// Pagination: summary-label math, with the disabled-anchor fallback.
// ---------------------------------------------------------------------------

test('parseOrdersSummary + computeExpectedPageCount: page 1 of 151 orders at 100/page', () => {
  const doc = loadFixtureDoc('results-ready-with-pagination.html');
  const summary = core.parseOrdersSummary(doc);
  assert.deepEqual(summary, { start: 1, end: 100, total: 151 });
  assert.equal(core.computeExpectedPageCount(summary), 2);
});

test('isNextPageAvailable: true when the Next anchor is present', () => {
  const doc = loadFixtureDoc('results-ready-with-pagination.html');
  assert.equal(core.isNextPageAvailable(doc), true);
});

test('isNextPageAvailable: false on the last page (disabled item has no anchor)', () => {
  const doc = loadFixtureDoc('results-ready-last-page.html');
  assert.equal(core.isNextPageAvailable(doc), false);
});

test('parseOrdersSummary: returns null when the label is absent', () => {
  const doc = loadFixtureDoc('order-single-item-shipped.html');
  assert.equal(core.parseOrdersSummary(doc), null);
  assert.equal(core.computeExpectedPageCount(null), null);
});

// ---------------------------------------------------------------------------
// URL building
// ---------------------------------------------------------------------------

test('buildSearchUrl: encodes sku and uses qt=sku', () => {
  const url = core.buildSearchUrl('https://sellercentral.amazon.com', 'JOURNAL-BFL-COLOR', 3);
  const parsed = new URL(url);
  assert.equal(parsed.pathname, '/orders-v3/search');
  assert.equal(parsed.searchParams.get('q'), 'JOURNAL-BFL-COLOR');
  assert.equal(parsed.searchParams.get('qt'), 'sku');
  assert.equal(parsed.searchParams.get('page'), '3');
});

// ---------------------------------------------------------------------------
// CSV output -- every row must carry an explicit, unambiguous status.
// ---------------------------------------------------------------------------

test('buildCsvString: emits every configured SKU with a status column', () => {
  const csv = core.buildCsvString(
    {
      'A': { qty: 5, status: core.STATUS.OK },
      'B': { qty: 0, status: core.STATUS.EMPTY_VERIFIED }
    },
    ['A', 'B', 'C'],
    '2026-08-25T00:00:00.000Z'
  );
  const lines = csv.trim().split('\n');
  assert.match(lines[0], /^# Generated:/);
  assert.equal(lines[1], 'SKU,Quantity,Status');
  assert.equal(lines[2], '"A","5","OK"');
  assert.equal(lines[3], '"B","0","EMPTY_VERIFIED"');
  assert.equal(lines[4], '"C","","NOT_SCANNED"'); // never scanned -- never a bare 0
});

// ---------------------------------------------------------------------------
// waitUntilReady -- readiness requires N consecutive stable polls, not one.
// ---------------------------------------------------------------------------

test('waitUntilReady: resolves ready=true once state settles and stays stable', async () => {
  const doc = loadFixtureDoc('results-loading-app-shell.html');
  const apploading = doc.getElementById('apploading');

  // Real (short) delays so Date.now() actually advances past the
  // READY_MIN_WAIT_MS floor and stableCount accumulates across distinct
  // polls, the same way it would against the live DOM.
  let polls = 0;
  const fakeSleep = ms => new Promise(resolve => setTimeout(() => {
    polls++;
    if (polls === 2) {
      // Simulate hydration completing after a couple of polls.
      apploading.innerHTML = '';
      const table = doc.createElement('table');
      table.id = 'orders-table';
      table.innerHTML = '<tr><td>row</td></tr>';
      doc.body.appendChild(table);
    }
    resolve();
  }, ms));

  const result = await core.waitUntilReady(doc, 5000, fakeSleep);
  assert.equal(result.ready, true);
  assert.equal(result.state, 'rows');
});

test('waitUntilReady: resolves ready=false on timeout if never settles', async () => {
  const doc = loadFixtureDoc('results-loading-app-shell.html');
  const fakeSleep = ms => new Promise(resolve => setTimeout(resolve, ms)); // never changes the DOM
  const result = await core.waitUntilReady(doc, 300, fakeSleep);
  assert.equal(result.ready, false);
});
