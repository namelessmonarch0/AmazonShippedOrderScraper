// ==UserScript==
// @name         Amazon SKU Auto-Scanner (Invincible Mode + CSV Export)
// @namespace    http://tampermonkey.net/
// @version      6.0
// @description  Automates SKU scraping with hard-reloading and automatic CSV export
// @author       You
// @match        *://sellercentral.amazon.com/*
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

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

  const waitTime = 3500;
  const nextButtonSelector = '.a-last a';

  const KEY_INDEX = 'amazon_scan_index';
  const KEY_RESULTS = 'amazon_scan_results';
  const KEY_ACTIVE = 'amazon_scan_active';
  const KEY_URL = 'amazon_clean_url';

  if (!localStorage.getItem(KEY_URL)) {
    localStorage.setItem(KEY_URL, window.location.origin + window.location.pathname);
  }

  // ==========================================
  // 2. CREATE CONTROL PANEL UI
  // ==========================================
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

  let currentIndex = parseInt(localStorage.getItem(KEY_INDEX)) || 0;
  let isActive = localStorage.getItem(KEY_ACTIVE) === 'true';

  if (currentIndex >= skusToTest.length) {
    statusTxt.textContent = "Status: ✅ Scan Complete";
    statusTxt.style.color = '#28a745';
  } else if (isActive) {
    statusTxt.textContent = `Status: ⏳ Loading page for SKU ${currentIndex + 1}/${skusToTest.length}: ${skusToTest[currentIndex]}...`;
  } else {
    statusTxt.textContent = `Status: ⏸ Paused at SKU ${currentIndex + 1}/${skusToTest.length}: ${skusToTest[currentIndex]}`;
  }

  // ==========================================
  // 3. EVENT LISTENERS
  // ==========================================
  btnStart.addEventListener('click', () => {
    if (confirm("Are you sure you want to wipe memory and start from SKU #1?")) {
      localStorage.setItem(KEY_INDEX, 0);
      localStorage.setItem(KEY_RESULTS, JSON.stringify({}));
      localStorage.setItem(KEY_ACTIVE, 'true');
      localStorage.setItem(KEY_URL, window.location.origin + window.location.pathname);
      window.location.assign(localStorage.getItem(KEY_URL));
    }
  });

  btnResume.addEventListener('click', () => {
    localStorage.setItem(KEY_ACTIVE, 'true');
    window.location.assign(localStorage.getItem(KEY_URL));
  });

  btnStop.addEventListener('click', () => {
    localStorage.setItem(KEY_ACTIVE, 'false');
    statusTxt.textContent = `Status: ⏸ Paused at SKU ${currentIndex + 1}/${skusToTest.length}: ${skusToTest[currentIndex]}`;
  });

  btnExport.addEventListener('click', () => {
    const finalData = JSON.parse(localStorage.getItem(KEY_RESULTS)) || {};
    if (Object.keys(finalData).length === 0) {
        alert("No results found yet. Run the scan first.");
        return;
    }
    generateCSV(finalData);
  });

  // ==========================================
  // 4. HELPER FUNCTIONS
  // ==========================================
  const exactSleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // NEW: CSV Generation Function
  function generateCSV(resultsObj) {
    let csvString = "SKU,Quantity\n"; // Headers
    for (const [sku, qty] of Object.entries(resultsObj)) {
      csvString += `"${sku}","${qty}"\n`; // Add each item safely
    }

    // Create a Blob and trigger a download
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    // Generate a readable file name with today's date
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute("href", url);
    link.setAttribute("download", `Amazon_SKU_Totals_${dateStr}.csv`);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function forceClick(element) {
    if (!element) return;
    const eventOptions = { bubbles: true, cancelable: true, view: window };
    element.dispatchEvent(new MouseEvent('mousedown', eventOptions));
    element.dispatchEvent(new MouseEvent('mouseup', eventOptions));
    element.dispatchEvent(new MouseEvent('click', eventOptions));
  }

  function setNativeValue(element, value) {
    const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    const prototype = Object.getPrototypeOf(element);
    const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, "value").set;
    if (valueSetter && valueSetter !== prototypeValueSetter) prototypeValueSetter.call(element, value);
    else if (valueSetter) valueSetter.call(element, value);
    else element.value = value;

    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async function ensureDropdownIsSKU() {
    for (let attempt = 1; attempt <= 3; attempt++) {
      const prompt = document.querySelector('.a-dropdown-prompt');
      if (prompt && prompt.textContent.toLowerCase().includes('sku')) return true;

      const hiddenSelects = document.querySelectorAll('select');
      for (const select of hiddenSelects) {
        Array.from(select.options).forEach(opt => {
          if (opt.text.toLowerCase().includes('sku')) {
            select.value = opt.value;
            select.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
      }

      if (prompt) {
        forceClick(prompt);
        await exactSleep(800);
        const dropdownLinks = document.querySelectorAll('.a-popover-inner a.a-dropdown-link, .a-popover-wrapper a.a-dropdown-link, a.a-dropdown-link');
        for (const link of dropdownLinks) {
          if (link.textContent.toLowerCase().includes('sku')) {
            forceClick(link);
            await exactSleep(800);
            break;
          }
        }
      }
    }
    const finalPrompt = document.querySelector('.a-dropdown-prompt');
    if (finalPrompt && finalPrompt.textContent.toLowerCase().includes('sku')) return true;
    return false;
  }

  function calculateTotalForSKU(targetSku) {
    const rows = document.querySelectorAll('#orders-table tr');
    let pageQuantity = 0;
    let currentStatus = null;
    let currentSkuMatched = false;

    rows.forEach(row => {
      if (row.querySelector('.order-header')) {
        currentStatus = null;
        currentSkuMatched = false;
      }
      const hasShipped = row.querySelector('.shipped-status');
      const hasCancelled = row.querySelector('.canceled-status');
      if (hasShipped || hasCancelled) currentStatus = (hasShipped && !hasCancelled) ? 'shipped' : 'cancelled';

      const divs = row.querySelectorAll('div');
      for (const div of divs) {
        if (div.textContent.includes('SKU')) {
          const skuMatch = div.textContent.match(/SKU\s*:\s*(\S+)/i);
          if (skuMatch && skuMatch[1].toLowerCase() === targetSku.toLowerCase()) currentSkuMatched = true;
          else currentSkuMatched = false;
        }
      }

      if (currentSkuMatched && currentStatus === 'shipped') {
        const bTags = row.querySelectorAll('b');
        bTags.forEach(b => {
          const parentText = b.parentElement.textContent.trim();
          if ((parentText.startsWith('Quantity') || parentText.startsWith('Quantity Shipped')) && !parentText.includes('Total')) {
            const val = parseInt(b.textContent.trim(), 10);
            if (!isNaN(val)) {
              pageQuantity += val;
              currentSkuMatched = false;
            }
          }
        });
      }
    });
    return pageQuantity;
  }

  function finishAndGoToNext(sku, result) {
    let finalResults = JSON.parse(localStorage.getItem(KEY_RESULTS)) || {};
    finalResults[sku] = result;
    localStorage.setItem(KEY_RESULTS, JSON.stringify(finalResults));
    localStorage.setItem(KEY_INDEX, currentIndex + 1);

    window.location.assign(localStorage.getItem(KEY_URL));
  }

  // ==========================================
  // 5. CORE EXECUTION LOGIC
  // ==========================================
  async function processCurrentSKU() {
    if (currentIndex >= skusToTest.length) {
      localStorage.setItem(KEY_ACTIVE, 'false');
      statusTxt.textContent = "Status: ✅ Scan Complete";
      statusTxt.style.color = '#28a745';
      console.clear();
      console.log("✅ AUTOMATED SCAN COMPLETE ✅");

      const finalData = JSON.parse(localStorage.getItem(KEY_RESULTS));
      console.table(finalData);

      // NEW: Automatically trigger the CSV download when finished!
      generateCSV(finalData);
      return;
    }

    const sku = skusToTest[currentIndex];
    console.log(`\n--- [${currentIndex + 1}/${skusToTest.length}] Searching for: ${sku} ---`);

    statusTxt.textContent = `Status: ⏳ Waiting for Amazon to load... (SKU ${currentIndex + 1}/${skusToTest.length}: ${sku})`;
    let searchInput = null;
    for(let i=0; i < 40; i++) {
        searchInput = document.getElementById('myo-search-input');
        if(searchInput) break;
        await exactSleep(500);
    }

    if (!searchInput) {
      console.error("Search box not found after 20 seconds! Amazon is loading too slowly.");
      localStorage.setItem(KEY_ACTIVE, 'false');
      statusTxt.textContent = "Status: ❌ Paused (Search Box Missing)";
      return;
    }

    statusTxt.textContent = `Status: ⏳ Scanning SKU ${currentIndex + 1} of ${skusToTest.length}: ${sku}`;

    const isDropdownVerified = await ensureDropdownIsSKU();
    if (!isDropdownVerified) {
      console.error("Amazon refused to change the dropdown to SKU. Refreshing page to clear glitch...");
      window.location.assign(localStorage.getItem(KEY_URL));
      return;
    }

    searchInput.focus();
    setNativeValue(searchInput, sku);
    await exactSleep(500);

    const searchButton = document.querySelector('#myo-search-button .a-button-input') || document.querySelector('#myo-search-button-announce');
    forceClick(searchButton);

    await exactSleep(waitTime);

    const pageText = document.body.textContent;

    if (pageText.includes("MYO0002") || pageText.includes("order ID is correct") || pageText.includes("Order Not Found Error")) {
      console.error(`Amazon rejected "${sku}" as an Order ID despite the verification. Skipping to next to avoid loop.`);
      finishAndGoToNext(sku, "Error: Dropdown Glitch");
      return;
    }

    if (pageText.includes("0 orders found") || pageText.includes("No results found")) {
      console.log(`No orders found for ${sku}.`);
      finishAndGoToNext(sku, 0);
      return;
    }

    let skuTotal = 0;
    let pageNum = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      console.log(`Scanning page ${pageNum}...`);
      skuTotal += calculateTotalForSKU(sku);

      const nextBtnLink = document.querySelector(nextButtonSelector);
      const parentLi = nextBtnLink ? nextBtnLink.closest('li') : null;
      const isDisabled = !nextBtnLink || (parentLi && parentLi.classList.contains('a-disabled'));

      if (!isDisabled) {
        forceClick(nextBtnLink);
        pageNum++;
        await exactSleep(waitTime);
      } else {
        hasNextPage = false;
      }
    }

    console.log(`Total found for ${sku}: ${skuTotal}`);
    finishAndGoToNext(sku, skuTotal);
  }

  // Boot up sequence
  if (isActive && currentIndex < skusToTest.length) {
    setTimeout(() => {
        processCurrentSKU();
    }, 1500);
  } else if (currentIndex >= skusToTest.length) {
    console.table(JSON.parse(localStorage.getItem(KEY_RESULTS)));
  }

})();
