// ==UserScript==
// @name         Amazon SKU Auto-Scanner (URL-driven + CSV Export)
// @namespace    http://tampermonkey.net/
// @version      7.0
// @description  Automates SKU scraping via direct URL navigation (search + pagination), with settle-based readiness detection and automatic CSV export
// @author       You
// @match        *://sellercentral.amazon.com/*
// @noframes
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  // Guard against a second injection (e.g. into an iframe despite @noframes)
  // racing this one on the same localStorage keys. No-op under Node (tests).
  if (typeof window !== 'undefined') {
    if (window.__amazonScannerLoaded) return;
    window.__amazonScannerLoaded = true;
  }

  // ==========================================
  // 1. CONFIGURATION (YOUR FULL LIST)
  // ==========================================
  const skusToTest = [
    "JOURNAL-BFL-COLOR", "WHNB-BFL-COLOR", "WALLET-USA4-BL", "WALLET-USA4-RU", "WALLET-USA3-RU",
    "WALLET-USA1-BL", "WALLET-USA2-RU", "WALLET-USAC-RU", "WALLET-USA5-RU", "WALLET-USA5-BL",
    "WALLET-USAC-BL", "WALLET-USA2-BL", "WALLET-USA1-RU", "WALLET-USA3-BL", "WALLET-USA5-LB",
    "WALLET-USAC-GR", "WALLET-USAC-RH", "WALLET-USA4-LB", "WALLET-USA5-GR", "WALLET-USAC-LB",
    "WALLET-USA5-DB", "WALLET-USA5-RH", "WALLET-USA3-LB", "WALLET-USAC-DB", "WALLET-USA4-GR",
    "WALLET-USA4-RH", "WALLET-USA4-DB", "WALLET-USA3-DB", "WALLET-USA3-GR", "WALLET-USA3-RH",
    "WALLET-USA2-LB", "WALLET-USA2-GR", "WALLET-USA2-RH", "WALLET-USA1-RH", "WALLET-USA2-DB",
    "WALLET-USA1-GR", "WALLET-USA1-LB", "WALLET-USA1-DB", "PSCVR-BFL-CLRFL", "BIBLE-COVER-6",
    "BIBLE-COVER-5", "BIBLE-COVER-3", "ORNAMENT-CRMC-HART", "ORNAMENT-CRMC-SFLK", "ORNAMENT-CRMC-ELLP",
    "ORNAMENT-CRMC-STAR", "ORNAMENT-CRMC-TREE", "ORNAMENT-ACRL-TREE", "ORNAMENT-ACRL-SOCK", "ORNAMENT-ACRL-SNFL",
    "ORNAMENT-ACRL-ROND", "ORNAMENT-ACRL-BONE", "ORNAMENT-ACRL-RCTN", "ORNAMENT-ACRL-HEART", "ORNAMENT-ACRL-PAW",
    "ORNAMENT-ACRL-ELLP", "COFFEE-MUG-FD01-11oz", "COFFEE-MUG-CP02-15oz", "COFFEE-MUG-CP02-11oz", "COFFEE-MUG-CP01B-15oz",
    "COFFEE-MUG-CP01B-11oz", "COFFEE-MUG-CP01D-15oz", "COFFEE-MUG-CP01D-11oz", "COFFEE-MUG-M1-15oz", "COFFEE-MUG-M1-11oz",
    "COFFEE-MUG-C2-11oz", "COFFEE-MUG-C2-15oz", "COFFEE-MUG-C1-11oz", "COFFEE-MUG-C1-15oz", "COFFEE-MUG-15oz",
    "COFFEE-MUG-11oz", "JEWELRY-BOX-FLLET", "JEWELRY-BOX-BFL", "JOURNAL-WDNG-CUSTOM", "JOURNAL-TCHR-CUSTOM",
    "TUMBLER-LEAFS", "TUMBLER-BFCLR", "TUMBLER-FLLET", "JOURNAL-TCHR3-RST", "JOURNAL-TCHR1-OLV",
    "JOURNAL-TCHR2-TEL", "JOURNAL-TCHR2-DBR", "JOURNAL-TCHR1-RSE", "JOURNAL-TCHR1-DBR", "JOURNAL-TCHR3-RHD",
    "JOURNAL-TCHR4-RHD", "JOURNAL-TCHR2-RST", "JOURNAL-TCHR4-OLV", "JOURNAL-TCHR2-OLV", "JOURNAL-TCHR1-RST",
    "JOURNAL-TCHR2-GRY", "JOURNAL-TCHR1-RHD", "JOURNAL-TCHR3-BLK", "JOURNAL-TCHR2-RSE", "JOURNAL-TCHR1-GRY",
    "JOURNAL-TCHR1-PNK", "JOURNAL-TCHR4-TEL", "JOURNAL-TCHR4-BLK", "JOURNAL-TCHR3-RSE", "JOURNAL-TCHR1-BLK",
    "JOURNAL-TCHR3-PNK", "JOURNAL-TCHR4-DBR", "JOURNAL-TCHR2-RHD", "JOURNAL-TCHR4-GRY", "JOURNAL-TCHR4-RSE",
    "JOURNAL-TCHR2-PNK", "JOURNAL-TCHR4-PNK", "JOURNAL-TCHR3-OLV", "JOURNAL-TCHR3-GRY", "JOURNAL-TCHR4-RST",
    "JOURNAL-TCHR1-TEL", "JOURNAL-TCHR3-DBR", "JOURNAL-TCHR3-TEL", "JOURNAL-TCHR2-BLK", "BIBLE-USA1-L-OL",
    "BIBLE-ES04-M-BL", "BIBLE-USA3-L-OL", "BIBLE-ES04-L-PN", "BIBLE-USA2-M-BL", "BIBLE-USA7-L-RH",
    "BIBLE-ES02-L-RU", "BIBLE-ES03-L-BL", "BIBLE-USA6-L-OL", "BIBLE-ES04-M-RH", "BIBLE-ES03-M-PN",
    "BIBLE-USA2-M-OL", "BIBLE-USA4-M-RH", "BIBLE-UCUS-M-RH", "BIBLE-USA1-L-RU-FBA", "BIBLE-USA5-L-RU",
    "BIBLE-USA2-L-RU", "BIBLE-USA7-L-PN", "BIBLE-USA7-L-OL", "BIBLE-USA2-L-BL", "BIBLE-USA4-L-RH",
    "BIBLE-ES02-L-OL", "BIBLE-USA1-M-RU", "BIBLE-USA6-L-RU", "BIBLE-ES03-L-RU", "BIBLE-USA3-L-RH",
    "BIBLE-ES04-L-BL", "BIBLE-USA6-M-RU", "BIBLE-USA1-M-OL", "BIBLE-USA5-M-PN", "BIBLE-USA2-M-RU",
    "BIBLE-USA6-M-BL", "BIBLE-USA2-L-PN", "BIBLE-USA4-M-BL", "BIBLE-USA4-L-OL", "BIBLE-USA2-M-BL-FBA",
    "BIBLE-USA3-L-BL", "BIBLE-ES01-L-RU", "BIBLE-ES03-M-RU", "BIBLE-USA5-M-RU", "BIBLE-USA7-L-BL",
    "BIBLE-ES02-M-OL", "BIBLE-USA2-M-PN", "BIBLE-ES03-M-BL", "BIBLE-ES02-M-RH", "BIBLE-USA4-L-BL",
    "BIBLE-USA7-M-BL", "BIBLE-USA7-M-PN", "BIBLE-USA4-L-PN", "BIBLE-USA3-M-PN", "BIBLE-UCUS-L-RH",
    "BIBLE-USA5-M-BL", "BIBLE-USA3-M-OL", "BIBLE-USA6-L-RH", "BIBLE-USA5-M-RH", "BIBLE-ES03-M-RH",
    "BIBLE-ES02-L-RH", "BIBLE-USA5-L-BL", "BIBLE-ES02-L-BL", "BIBLE-USA1-L-PN", "BIBLE-ES02-M-PN",
    "BIBLE-ES01-L-RH", "BIBLE-ES04-M-OL", "BIBLE-USA1-L-BL", "BIBLE-UCUS-L-OL", "BIBLE-USA6-M-PN",
    "BIBLE-USA1-M-RH", "BIBLE-ES04-L-RH", "BIBLE-USA2-L-RH", "BIBLE-USA1-M-PN",
    "BIBLE-ES01-L-BL", "BIBLE-USA1-L-RU", "BIBLE-USA6-L-PN", "BIBLE-ES04-M-RU", "BIBLE-USA3-M-RH",
    "BIBLE-UCUS-M-PN", "BIBLE-USA7-M-OL", "BIBLE-USA3-M-RU", "BIBLE-ES01-L-OL", "BIBLE-UCUS-L-BL",
    "BIBLE-UCUS-M-OL", "BIBLE-ES01-M-RU", "BIBLE-USA2-L-RU-FBA", "BIBLE-ES01-M-PN", "BIBLE-USA2-L-OL",
    "BIBLE-USA7-L-RU", "BIBLE-USA2-M-RH", "BIBLE-USA4-L-RU", "BIBLE-ES01-M-BL", "BIBLE-USA7-M-RH",
    "BIBLE-ES04-L-RU", "BIBLE-USA1-M-RU-FBA", "BIBLE-ES02-L-PN", "BIBLE-ES02-M-RU", "BIBLE-ES01-M-RH",
    "BIBLE-USA6-L-BL", "BIBLE-ES03-M-OL", "BIBLE-ES01-L-PN", "BIBLE-UCUS-L-PN", "BIBLE-USA5-L-PN",
    "BIBLE-USA4-M-PN", "BIBLE-USA6-M-OL", "BIBLE-ES03-L-PN", "BIBLE-USA5-L-OL", "BIBLE-USA4-M-OL",
    "BIBLE-UCUS-M-RU", "BIBLE-ES03-L-OL", "BIBLE-UCUS-L-RU", "BIBLE-USA5-L-RH", "BIBLE-ES02-M-BL",
    "BIBLE-ES04-M-PN", "BIBLE-USA2-M-RU-FBA", "BIBLE-USA4-M-RU", "BIBLE-USA1-M-BL", "BIBLE-USA1-L-RH",
    "BIBLE-USA2-L-BL-FBA", "BIBLE-USA3-L-RU", "BIBLE-USA6-M-RH", "BIBLE-ES03-L-RH", "BIBLE-USA7-M-RU",
    "BIBLE-USA5-M-OL", "BIBLE-USA3-M-BL", "BIBLE-ES01-M-OL", "BIBLE-UCUS-M-BL", "BIBLE-USA3-L-PN"
  ];

  // ==========================================
  // 2. CONSTANTS
  // ==========================================

  // Overall per-page-load timeout: how long to wait for a navigated page to
  // settle (app hydrated, results present or genuinely empty, DOM stable)
  // before giving up and retrying.
  const PAGE_READY_TIMEOUT_MS = 20000;
  const POLL_INTERVAL_MS = 250;
  // The results DOM must report the *same* signature this many consecutive
  // polls in a row before we trust it -- a single differing poll is not
  // enough (that's exactly how the previous version scraped a page that had
  // gone from "old results" to "spinner + stale empty text" and mistook the
  // transition itself for "done").
  const READY_STABLE_POLLS = 3;
  // Floor wait so a DOM that happens to look stable on the very first poll
  // (e.g. two SKUs that legitimately render an identical empty state) can't
  // satisfy readiness before the app has had any real chance to render.
  const READY_MIN_WAIT_MS = 600;

  const MAX_RETRIES = 3;
  // Per-SKU page cap. Seller Central pages at 100 orders/page; this bounds
  // runaway loops without being tight enough to truncate a real long tail
  // (raised from 50 -- an unfiltered date range alone showed ~66 pages).
  const MAX_PAGES_PER_SKU = 200;

  const KEY_INDEX = 'amazon_scan_index';
  const KEY_PAGE = 'amazon_scan_page';
  const KEY_PARTIAL = 'amazon_scan_partial';
  const KEY_RESULTS = 'amazon_scan_results';
  const KEY_ACTIVE = 'amazon_scan_active';
  const KEY_ORIGIN = 'amazon_scan_origin';
  const KEY_RETRY = 'amazon_scan_retry';

  // Confirmed verbatim from a live capture (2026-08-25). Only used to
  // recognize a *candidate* empty state -- resultsState() below never trusts
  // this text alone, since the same text is also present while the next
  // search is still loading (see results-loading-transient-empty.html).
  const EMPTY_RESULTS_TEXT = 'No orders were found that match the given search criteria.';

  const STATUS = {
    OK: 'OK',
    EMPTY_VERIFIED: 'EMPTY_VERIFIED',
    TIMEOUT: 'TIMEOUT',
    INCOMPLETE_PAGES: 'INCOMPLETE_PAGES',
    NOT_SCANNED: 'NOT_SCANNED'
  };

  // Confirmed live: SKU value is plain text; Quantity value is wrapped in
  // <b>. "Quantity Shipped" appears even on single-item orders, so its
  // presence doesn't itself signal a multi-item order. Any other
  // Quantity-prefixed label (e.g. a refunded/cancelled variant, per the app
  // bundle's quantityRefunded/quantityCancelled render paths) is
  // deliberately NOT in this set -- confirmed counting rule is "refunds are
  // ignored; a refunded unit still counts as shipped", so only the
  // as-shipped quantity may contribute.
  const QUANTITY_LABELS = new Set(['Quantity', 'Quantity Shipped']);

  // ==========================================
  // 3. PURE HELPERS
  // ==========================================
  // Everything in this section takes an explicit root/document and touches
  // no globals, so it runs identically under the browser and under Node
  // (see test/scanner-core.test.js). Nothing here performs a browser action
  // (navigation, clicking, storage) -- that's all in section 5.

  function buildSearchUrl(origin, sku, page) {
    const params = new URLSearchParams({ page: String(page), q: sku, qt: 'sku' });
    return origin + '/orders-v3/search?' + params.toString();
  }

  function isAppLoading(doc) {
    const el = doc.getElementById ? doc.getElementById('apploading') : null;
    return !!(el && el.children && el.children.length > 0);
  }

  function isSpinnerActive(doc) {
    return !!doc.querySelector('.a-spinner');
  }

  function isEmptyResultsTextPresent(doc) {
    const body = doc.body || doc;
    return (body.textContent || '').includes(EMPTY_RESULTS_TEXT);
  }

  // Accepts either a Document, or a <table id="orders-table"> element
  // directly (fixtures may hand either).
  function resolveOrdersTable(root) {
    if (!root) return null;
    if (root.id === 'orders-table') return root;
    if (typeof root.querySelector === 'function') {
      const t = root.querySelector('#orders-table');
      if (t) return t;
    }
    return null;
  }

  // Tri-state read of where the page currently is: 'loading' | 'empty' | 'rows'.
  // Order of checks matters: an active spinner or un-hydrated app shell wins
  // over any text/table content already in the DOM, since that content may
  // be stale (root cause #2 -- see results-loading-transient-empty.html).
  function resultsState(doc) {
    if (isAppLoading(doc)) return 'loading';
    if (isSpinnerActive(doc)) return 'loading';
    const table = resolveOrdersTable(doc);
    if (table && table.querySelectorAll('tr').length > 0) return 'rows';
    if (isEmptyResultsTextPresent(doc)) return 'empty';
    return 'loading'; // neither confirmed rows nor confirmed-empty yet
  }

  // Cheap fingerprint used only to detect that a settled state is *stable*
  // across consecutive polls, not to decide whether it's ready in the first
  // place -- resultsState() owns that decision.
  function resultsSignature(doc) {
    const table = resolveOrdersTable(doc);
    if (table) {
      return 'rows:' + table.querySelectorAll('tr').length + '|' + table.textContent.slice(0, 300);
    }
    if (isEmptyResultsTextPresent(doc)) return 'empty';
    return 'unknown';
  }

  // Reads "Showing orders X - Y of Z total orders." Confirmed verbatim
  // (2026-08-25). Returns null if absent so callers can fall back.
  function parseOrdersSummary(doc) {
    const label = doc.querySelector ? doc.querySelector('.showingXOfYOrdersLabel') : null;
    if (!label) return null;
    const m = label.textContent.match(/Showing orders\s+(\d+)\s*-\s*(\d+)\s+of\s+(\d+)\s+total orders/i);
    if (!m) return null;
    return { start: parseInt(m[1], 10), end: parseInt(m[2], 10), total: parseInt(m[3], 10) };
  }

  function computeExpectedPageCount(summary) {
    if (!summary) return null;
    const pageSize = summary.end - summary.start + 1;
    if (!(pageSize > 0)) return null;
    return Math.max(1, Math.ceil(summary.total / pageSize));
  }

  // Fallback for when the summary label is missing: read (never click) the
  // pagination widget's own disabled state. Confirmed live: a disabled
  // pagination item drops its <a> entirely (`<li class="a-disabled">` has no
  // anchor -- true for both "Previous" on page 1 and "Next" on the last
  // page), so an absent anchor is itself the disabled signal.
  function isNextPageAvailable(doc) {
    const next = doc.querySelector ? doc.querySelector('li.a-last a') : null;
    return !!next;
  }

  function csvEscape(val) {
    return '"' + String(val).replace(/"/g, '""') + '"';
  }

  // Pure CSV string builder: always emits every configured SKU in list
  // order with an explicit Status, so an interrupted or degraded scan
  // produces a CSV that's obviously incomplete rather than one that
  // silently looks finished. `resultsObj` maps sku -> { qty, status }.
  function buildCsvString(resultsObj, skuList, generatedAt) {
    let csv = '# Generated: ' + generatedAt + ' -- verify the Order Manager date range (From/To) matches prior runs before comparing totals.\n';
    csv += 'SKU,Quantity,Status\n';
    for (const sku of skuList) {
      const entry = Object.prototype.hasOwnProperty.call(resultsObj, sku) ? resultsObj[sku] : null;
      const qty = entry && entry.qty !== undefined && entry.qty !== null ? entry.qty : '';
      const status = entry && entry.status ? entry.status : STATUS.NOT_SCANNED;
      csv += csvEscape(sku) + ',' + csvEscape(qty) + ',' + csvEscape(status) + '\n';
    }
    return csv;
  }

  // Reads the innermost `<div><span>LABEL</span>: VALUE</div>` pattern
  // confirmed live for SKU / ASIN / Quantity / Quantity Shipped / Item
  // subtotal. Deliberately requires NO nested <div> descendant, so ancestor
  // wrapper divs (whose textContent transitively concatenates every field
  // below them, e.g. "SKU:  JOURNAL-BFL-COLORQuantity Shipped:  1") are
  // never mistaken for the field itself.
  function extractLabelValue(div) {
    if (div.querySelector('div')) return null; // not a leaf field div
    const span = div.querySelector(':scope > span');
    if (!span) return null;
    const label = span.textContent.trim();
    const b = div.querySelector('b');
    let value;
    if (b) {
      value = b.textContent.trim();
    } else {
      value = div.textContent.slice(span.textContent.length).replace(/^:\s*/, '').trim();
    }
    return { label: label, value: value };
  }

  // Confirmed live: each line item is its own <tr>; SKU and its own
  // Quantity live together in that <tr>'s product <td>. An order's status
  // markup (.shipped-status / .canceled-status) appears only on the order's
  // FIRST <tr> -- there is no `.order-header` boundary in this markup at
  // all -- so later item rows of the same order correctly inherit status by
  // simply not overwriting `currentStatus`. Every new order re-asserts its
  // own status on its own first row, so this can't leak across orders.
  //
  // Confirmed counting rules: shipped orders count every item row against
  // its own SKU (mixed-SKU orders are common); cancelled orders count 0;
  // refunds are ignored entirely (a refunded unit still counts as shipped).
  function calculateTotalForSKU(targetSku, root) {
    const table = resolveOrdersTable(root) || root;
    const rows = table.querySelectorAll('tr');
    let total = 0;
    let currentStatus = null;

    rows.forEach(row => {
      const statusEl = row.querySelector('.main-status');
      if (statusEl) {
        if (statusEl.classList.contains('shipped-status')) currentStatus = 'shipped';
        else if (statusEl.classList.contains('canceled-status')) currentStatus = 'cancelled';
      }

      let rowSku = null;
      let rowQty = null;
      row.querySelectorAll('div').forEach(div => {
        const field = extractLabelValue(div);
        if (!field) return;
        if (field.label === 'SKU') {
          rowSku = field.value;
        } else if (QUANTITY_LABELS.has(field.label)) {
          const val = parseInt(field.value, 10);
          if (!isNaN(val)) rowQty = val;
        }
      });

      if (rowSku === null) return;
      if (rowSku.toLowerCase() !== targetSku.toLowerCase()) return;

      if (currentStatus !== 'shipped') {
        if (currentStatus === null) {
          console.warn(`SKU "${targetSku}" matched a row with no known shipped/cancelled status yet -- not counted. Unexpected markup?`, row);
        }
        return; // cancelled, or ambiguous: never counted, per confirmed rules
      }

      if (rowQty === null) {
        console.warn(`SKU "${targetSku}" matched a shipped row but no quantity value was found in it -- this row was not counted.`, row);
        return;
      }
      total += rowQty;
    });

    return total;
  }

  async function waitUntilReady(doc, timeoutMs, sleepFn) {
    const sleep = sleepFn || (ms => new Promise(resolve => setTimeout(resolve, ms)));
    const start = Date.now();
    let lastSig = null;
    let stableCount = 0;

    while (Date.now() - start < timeoutMs) {
      const state = resultsState(doc);
      if (state !== 'loading') {
        const sig = resultsSignature(doc);
        if (sig === lastSig) {
          stableCount++;
        } else {
          stableCount = 1;
          lastSig = sig;
        }
        if (stableCount >= READY_STABLE_POLLS && (Date.now() - start) >= READY_MIN_WAIT_MS) {
          return { ready: true, state: state };
        }
      } else {
        stableCount = 0;
        lastSig = null;
      }
      await sleep(POLL_INTERVAL_MS);
    }
    return { ready: false, state: resultsState(doc) };
  }

  // ==========================================
  // 4. EXPORTS FOR TESTS (no-op in the browser)
  // ==========================================
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      STATUS,
      EMPTY_RESULTS_TEXT,
      QUANTITY_LABELS,
      buildSearchUrl,
      isAppLoading,
      isSpinnerActive,
      isEmptyResultsTextPresent,
      resolveOrdersTable,
      resultsState,
      resultsSignature,
      parseOrdersSummary,
      computeExpectedPageCount,
      isNextPageAvailable,
      csvEscape,
      buildCsvString,
      extractLabelValue,
      calculateTotalForSKU,
      waitUntilReady
    };
  }

  // ==========================================
  // 5. BROWSER WIRING (no-op under Node/tests)
  // ==========================================
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  // ---- 5a. Control panel UI ----
  const panel = document.createElement('div');
  panel.style.cssText = 'position:fixed; bottom:20px; left:20px; z-index:999999; background:#fff; border:2px solid #333; padding:15px; border-radius:8px; box-shadow:0 4px 10px rgba(0,0,0,0.5); font-family:sans-serif; min-width: 250px;';

  const title = document.createElement('h4');
  title.textContent = "Amazon Auto-Scanner";
  title.style.cssText = 'margin:0 0 5px 0; color:#333; font-size: 16px;';

  const statusTxt = document.createElement('p');
  statusTxt.style.cssText = 'margin:0 0 15px 0; font-size:13px; font-weight:bold; color:#008296;';

  const btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex; gap:8px; flex-wrap: wrap; margin-bottom: 8px;';

  const btnStyle = 'padding:10px 12px; color:white; border:none; border-radius:5px; font-size:13px; font-weight:bold; cursor:pointer; flex: 1; text-align: center;';

  const btnStart = document.createElement('button');
  btnStart.textContent = "Start Fresh";
  btnStart.style.cssText = btnStyle + 'background-color:#d9534f;';

  const btnResume = document.createElement('button');
  btnResume.textContent = "Resume";
  btnResume.style.cssText = btnStyle + 'background-color:#28a745;';

  const btnStop = document.createElement('button');
  btnStop.textContent = "Stop";
  btnStop.style.cssText = btnStyle + 'background-color:#6c757d;';

  const btnExport = document.createElement('button');
  btnExport.textContent = "📥 Download CSV";
  btnExport.style.cssText = btnStyle + 'background-color:#008296; min-width: 100%; margin-top: 5px;';

  btnRow.appendChild(btnStart);
  btnRow.appendChild(btnResume);
  btnRow.appendChild(btnStop);

  panel.appendChild(title);
  panel.appendChild(statusTxt);
  panel.appendChild(btnRow);
  panel.appendChild(btnExport);
  document.body.appendChild(panel);

  function readState() {
    return {
      index: parseInt(localStorage.getItem(KEY_INDEX), 10) || 0,
      page: parseInt(localStorage.getItem(KEY_PAGE), 10) || 1,
      partial: parseInt(localStorage.getItem(KEY_PARTIAL), 10) || 0,
      active: localStorage.getItem(KEY_ACTIVE) === 'true',
      origin: localStorage.getItem(KEY_ORIGIN) || window.location.origin,
      retry: parseInt(localStorage.getItem(KEY_RETRY), 10) || 0
    };
  }

  function renderStatus() {
    const s = readState();
    if (s.index >= skusToTest.length) {
      statusTxt.textContent = "Status: ✅ Scan Complete";
      statusTxt.style.color = '#28a745';
    } else if (s.active) {
      statusTxt.textContent = `Status: ⏳ SKU ${s.index + 1}/${skusToTest.length}: ${skusToTest[s.index]} (page ${s.page})`;
      statusTxt.style.color = '#008296';
    } else {
      statusTxt.textContent = `Status: ⏸ Paused at SKU ${s.index + 1}/${skusToTest.length}: ${skusToTest[s.index]} (page ${s.page})`;
      statusTxt.style.color = '#008296';
    }
  }
  renderStatus();

  // ---- 5b. Event listeners ----
  btnStart.addEventListener('click', () => {
    if (confirm("Are you sure you want to wipe memory and start from SKU #1?")) {
      localStorage.setItem(KEY_INDEX, 0);
      localStorage.setItem(KEY_PAGE, 1);
      localStorage.setItem(KEY_PARTIAL, 0);
      localStorage.setItem(KEY_RESULTS, JSON.stringify({}));
      localStorage.setItem(KEY_ACTIVE, 'true');
      localStorage.setItem(KEY_RETRY, 0);
      localStorage.setItem(KEY_ORIGIN, window.location.origin);
      window.location.assign(buildSearchUrl(window.location.origin, skusToTest[0], 1));
    }
  });

  btnResume.addEventListener('click', () => {
    const s = readState();
    localStorage.setItem(KEY_ACTIVE, 'true');
    if (s.index >= skusToTest.length) return;
    window.location.assign(buildSearchUrl(s.origin, skusToTest[s.index], s.page));
  });

  btnStop.addEventListener('click', () => {
    localStorage.setItem(KEY_ACTIVE, 'false');
    renderStatus();
  });

  btnExport.addEventListener('click', () => {
    const finalData = JSON.parse(localStorage.getItem(KEY_RESULTS)) || {};
    if (Object.keys(finalData).length === 0) {
      alert("No results found yet. Run the scan first.");
      return;
    }
    downloadCsv(finalData);
  });

  function downloadCsv(resultsObj) {
    const csvString = buildCsvString(resultsObj, skusToTest, new Date().toISOString());
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute("href", url);
    link.setAttribute("download", `Amazon_SKU_Totals_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function recordResult(sku, qty, status) {
    const results = JSON.parse(localStorage.getItem(KEY_RESULTS)) || {};
    results[sku] = { qty: qty, status: status };
    localStorage.setItem(KEY_RESULTS, JSON.stringify(results));
  }

  function goToSku(index) {
    localStorage.setItem(KEY_INDEX, index);
    localStorage.setItem(KEY_PAGE, 1);
    localStorage.setItem(KEY_PARTIAL, 0);
    localStorage.setItem(KEY_RETRY, 0);
    if (index >= skusToTest.length) {
      finishScan();
      return;
    }
    const origin = readState().origin;
    window.location.assign(buildSearchUrl(origin, skusToTest[index], 1));
  }

  function goToPage(index, page, partial) {
    localStorage.setItem(KEY_PAGE, page);
    localStorage.setItem(KEY_PARTIAL, partial);
    localStorage.setItem(KEY_RETRY, 0);
    const origin = readState().origin;
    window.location.assign(buildSearchUrl(origin, skusToTest[index], page));
  }

  function finishScan() {
    localStorage.setItem(KEY_ACTIVE, 'false');
    statusTxt.textContent = "Status: ✅ Scan Complete";
    statusTxt.style.color = '#28a745';
    const finalData = JSON.parse(localStorage.getItem(KEY_RESULTS)) || {};
    console.clear();
    console.log("✅ AUTOMATED SCAN COMPLETE ✅");
    console.table(finalData);
    downloadCsv(finalData);
  }

  // Central failure handler for the current (sku, page): retries via a
  // clean re-navigation to the SAME URL up to MAX_RETRIES times (preserving
  // the partial total accumulated so far) before giving up and recording the
  // SKU with an explicit, non-zero-looking status.
  function failCurrent(index, page, partial, reason) {
    const s = readState();
    const attempt = s.retry + 1;
    if (attempt < MAX_RETRIES) {
      localStorage.setItem(KEY_RETRY, attempt);
      console.warn(`Retry ${attempt}/${MAX_RETRIES - 1} for "${skusToTest[index]}" page ${page}: ${reason}`);
      statusTxt.textContent = `Status: ⚠ Retry ${attempt}/${MAX_RETRIES - 1} — ${skusToTest[index]} p${page} (${reason})`;
      window.location.assign(buildSearchUrl(s.origin, skusToTest[index], page));
    } else {
      console.error(`Giving up on "${skusToTest[index]}" page ${page} after ${MAX_RETRIES} attempts: ${reason}`);
      recordResult(skusToTest[index], partial, STATUS.TIMEOUT);
      goToSku(index + 1);
    }
  }

  // ---- 5c. Core execution: one page-load = one iteration ----
  async function processCurrentPage() {
    const s = readState();
    if (s.index >= skusToTest.length) {
      finishScan();
      return;
    }

    const sku = skusToTest[s.index];
    statusTxt.textContent = `Status: ⏳ Loading SKU ${s.index + 1}/${skusToTest.length}: ${sku} (page ${s.page})...`;

    const result = await waitUntilReady(document, PAGE_READY_TIMEOUT_MS);
    if (!result.ready) {
      failCurrent(s.index, s.page, s.partial, `Page never settled (state=${result.state})`);
      return;
    }

    if (result.state === 'empty') {
      if (s.page === 1) {
        recordResult(sku, 0, STATUS.EMPTY_VERIFIED);
      } else {
        // A later page came back empty even though we expected more --
        // record what was actually accumulated rather than losing it, but
        // this is unexpected enough to be worth a console flag.
        console.warn(`"${sku}" page ${s.page} came back empty; expected more results. Recording partial total ${s.partial}.`);
        recordResult(sku, s.partial, STATUS.OK);
      }
      goToSku(s.index + 1);
      return;
    }

    // result.state === 'rows'
    const pageTotal = calculateTotalForSKU(sku, document);
    const newPartial = s.partial + pageTotal;

    const summary = parseOrdersSummary(document);
    const expectedPages = computeExpectedPageCount(summary);
    const hasNext = expectedPages !== null ? s.page < expectedPages : isNextPageAvailable(document);

    if (s.page >= MAX_PAGES_PER_SKU) {
      console.warn(`Hit the ${MAX_PAGES_PER_SKU}-page cap for "${sku}"; stopping early. Total may be incomplete.`);
      recordResult(sku, newPartial, STATUS.INCOMPLETE_PAGES);
      goToSku(s.index + 1);
      return;
    }

    if (hasNext) {
      goToPage(s.index, s.page + 1, newPartial);
    } else {
      recordResult(sku, newPartial, STATUS.OK);
      goToSku(s.index + 1);
    }
  }

  // ---- 5d. Boot ----
  const boot = readState();
  if (boot.active && boot.index < skusToTest.length) {
    setTimeout(() => {
      processCurrentPage();
    }, 500);
  } else if (boot.index >= skusToTest.length) {
    console.table(JSON.parse(localStorage.getItem(KEY_RESULTS) || '{}'));
  }

})();
