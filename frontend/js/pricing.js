/* ============================================================
   pricing.js — Ultra-Modern SaaS Pricing & Instant Checkout
   ============================================================ */
(async function () {
  const user = await requireAuth();
  if (!user) return;

  const page = renderShell({
    active: 'pricing',
    title: 'Pricing & Pro Plans',
    subtitle: 'Unlock AI task breakdown, unlimited subtasks, and executive analytics',
    search: false,
  });

  let planData = { plan: 'free', isPro: false, subscription: {} };
  let dynamicPlans = [];

  try {
    const [res, plansRes] = await Promise.all([
      API.get('/billing/plan'),
      API.get('/billing/plans'),
    ]);
    if (res.success) planData = res.data;
    if (plansRes.success && plansRes.plans) dynamicPlans = plansRes.plans;
  } catch (_) {}

  const isPro = !!planData.isPro;
  const isPending = planData.subscription && planData.subscription.status === 'pending_approval';

  // Fallback defaults
  const plansMap = {
    monthly: { price: 299, badge: 'Flexible', name: 'Monthly Pro', equiv: '₹299 billed monthly' },
    quarterly: { price: 599, badge: 'Popular • Save 33%', name: 'Quarterly Pro', equiv: '₹199 / mo equivalent' },
    yearly: { price: 1999, badge: 'Best Value • Save 45%', name: 'Yearly Pro', equiv: 'Just ₹166 / mo equivalent' },
  };

  dynamicPlans.forEach((p) => {
    if (plansMap[p.key]) {
      plansMap[p.key] = {
        price: p.price,
        badge: p.badge || plansMap[p.key].badge,
        name: p.name || plansMap[p.key].name,
        equiv: p.equivalentText || plansMap[p.key].equiv,
      };
    }
  });

  const m = plansMap.monthly;
  const q = plansMap.quarterly;
  const y = plansMap.yearly;

  const currentCycle = planData.subscription ? planData.subscription.billingCycle : null;

  page.innerHTML = `
    <div class="pricing-wrapper">
      
      <!-- Hero Section -->
      <div class="pricing-hero">
        <span class="hero-pill">
          ${icon('sparkle', 14)} Supercharge Your Productivity
        </span>
        <h1>Invest in your workflow</h1>
        <p>
          From solo ambitious goals to daily structured routines. Choose a plan that fits your pace with AI planning, unlimited workspaces, and priority tools.
        </p>

        <!-- Trust Ribbon -->
        <div class="trust-ribbon">
          <span class="trust-item">
            ${icon('check', 16)} 1-Click AI Breakdown
          </span>
          <span class="trust-item">
            ${icon('check', 16)} Instant QR Checkout
          </span>
          <span class="trust-item">
            ${icon('check', 16)} Zero Lock-in • Cancel Anytime
          </span>
        </div>

        ${
          isPending
            ? `<div class="alert alert-info" style="margin-top:24px;text-align:left;background:rgba(2,132,199,0.12);border:1px solid #0284c7;color:#38bdf8;border-radius:12px;padding:14px 18px">
                <b>Payment Submitted:</b> Your Transaction Ref (<code>${esc(planData.subscription.transactionId)}</code>) for <b>${esc(planData.subscription.billingCycle || 'Pro')}</b> is pending administrator verification. Pro features will activate shortly!
              </div>`
            : ''
        }
      </div>

      <!-- 4-Tier Pricing Grid -->
      <div class="pricing-grid">
        
        <!-- 1. Free Plan -->
        <div class="price-card ${!isPro ? 'current-active' : ''}">
          <div class="card-top">
            <span class="plan-name" style="color:var(--text-bright, var(--text))">Free Forever</span>
          </div>
          <p class="plan-desc">Essential tools for basic daily task management.</p>
          
          <div class="price-row">
            <span class="price-symbol">₹</span>
            <span class="price-num">0</span>
            <span class="price-period">/ forever</span>
          </div>
          <div class="price-equiv" style="color:var(--text-muted)">Free for individual starters</div>

          <div class="feature-list">
            <div class="feat-item">
              <span class="feat-icon check">${icon('check', 12)}</span>
              <span>Up to 15 Active Tasks</span>
            </div>
            <div class="feat-item">
              <span class="feat-icon check">${icon('check', 12)}</span>
              <span>10 Subtasks per task</span>
            </div>
            <div class="feat-item">
              <span class="feat-icon check">${icon('check', 12)}</span>
              <span>Basic 7-day completion charts</span>
            </div>
            <div class="feat-item">
              <span class="feat-icon check">${icon('check', 12)}</span>
              <span>Light &amp; Dark theme switch</span>
            </div>
            <div class="feat-item" style="opacity:0.45">
              <span class="feat-icon cross">${icon('x', 12)}</span>
              <span style="text-decoration:line-through">AI Subtask Generator</span>
            </div>
            <div class="feat-item" style="opacity:0.45">
              <span class="feat-icon cross">${icon('x', 12)}</span>
              <span style="text-decoration:line-through">Lifetime Analytics &amp; Heatmap</span>
            </div>
          </div>

          <button class="plan-btn btn-current" disabled>
            ${!isPro ? '✓ Current Plan' : 'Free Tier'}
          </button>
        </div>

        <!-- 2. Monthly Pro Plan -->
        <div class="price-card">
          <div class="card-top">
            <span class="plan-name" style="color:#0284c7">
              ${icon('zap', 16)} ${esc(m.name)}
            </span>
            ${m.badge ? `<span class="discount-badge badge-cyan">${esc(m.badge)}</span>` : ''}
          </div>
          <p class="plan-desc">Month-to-month full power access for agile sprints.</p>

          <div class="price-row" style="color:#0284c7">
            <span class="price-symbol">₹</span>
            <span class="price-num">${m.price}</span>
            <span class="price-period">/ month</span>
          </div>
          <div class="price-equiv" style="color:#0284c7">${esc(m.equiv)}</div>

          <div class="feature-list">
            <div class="feat-item">
              <span class="feat-icon check">${icon('check', 12)}</span>
              <span><b>1-Click AI Task Breakdown</b></span>
            </div>
            <div class="feat-item">
              <span class="feat-icon check">${icon('check', 12)}</span>
              <span><b>Unlimited Active Tasks</b></span>
            </div>
            <div class="feat-item">
              <span class="feat-icon check">${icon('check', 12)}</span>
              <span>GitHub-style Productivity Heatmap</span>
            </div>
            <div class="feat-item">
              <span class="feat-icon check">${icon('check', 12)}</span>
              <span>Velocity &amp; Completion Analytics</span>
            </div>
            <div class="feat-item">
              <span class="feat-icon check">${icon('check', 12)}</span>
              <span>Cyberpunk &amp; OLED Dark Themes</span>
            </div>
            <div class="feat-item">
              <span class="feat-icon check">${icon('check', 12)}</span>
              <span>Verified Pro Badge</span>
            </div>
          </div>

          <button class="plan-btn btn-cyan btn-pay" data-plan="${esc(m.name)}" data-amount="${m.price}" data-cycle="monthly">
            ${isPro && currentCycle === 'monthly' ? '🌟 Active Plan' : `Get Monthly — ₹${m.price}`}
          </button>
        </div>

        <!-- 3. Quarterly Pro Plan (Featured) -->
        <div class="price-card featured-emerald">
          <div class="card-top">
            <span class="plan-name" style="color:#10b981">
              ${icon('sparkle', 16)} ${esc(q.name)}
            </span>
            ${q.badge ? `<span class="discount-badge badge-emerald">${esc(q.badge)}</span>` : ''}
          </div>
          <p class="plan-desc">3-month sprint for high-velocity goal achievers.</p>

          <div class="price-row" style="color:#10b981">
            <span class="price-symbol">₹</span>
            <span class="price-num">${q.price}</span>
            <span class="price-period">/ 3 mos</span>
          </div>
          <div class="price-equiv" style="color:#10b981">${esc(q.equiv)}</div>

          <div class="feature-list">
            <div class="feat-item">
              <span class="feat-icon check">${icon('check', 12)}</span>
              <span><b>1-Click AI Task Breakdown</b></span>
            </div>
            <div class="feat-item">
              <span class="feat-icon check">${icon('check', 12)}</span>
              <span><b>Unlimited Tasks &amp; Workspaces</b></span>
            </div>
            <div class="feat-item">
              <span class="feat-icon check">${icon('check', 12)}</span>
              <span>Lifetime Activity Heatmap</span>
            </div>
            <div class="feat-item">
              <span class="feat-icon check">${icon('check', 12)}</span>
              <span>Category Distribution Analytics</span>
            </div>
            <div class="feat-item">
              <span class="feat-icon check">${icon('check', 12)}</span>
              <span>All Premium Color Themes</span>
            </div>
            <div class="feat-item">
              <span class="feat-icon check">${icon('check', 12)}</span>
              <span>Verified Pro Gold Badge</span>
            </div>
          </div>

          <button class="plan-btn btn-emerald btn-pay" data-plan="${esc(q.name)}" data-amount="${q.price}" data-cycle="quarterly">
            ${isPro && currentCycle === 'quarterly' ? '🌟 Active Plan' : `Get Quarterly — ₹${q.price}`}
          </button>
        </div>

        <!-- 4. Yearly Pro Plan (Best Value) -->
        <div class="price-card featured-purple">
          <div class="card-top">
            <span class="plan-name" style="color:#8b5cf6">
              ${icon('zap', 16)} ${esc(y.name)}
            </span>
            ${y.badge ? `<span class="discount-badge badge-purple">${esc(y.badge)}</span>` : ''}
          </div>
          <p class="plan-desc">12 full months of uninterrupted mastery &amp; growth.</p>

          <div class="price-row" style="color:#8b5cf6">
            <span class="price-symbol">₹</span>
            <span class="price-num">${y.price}</span>
            <span class="price-period">/ year</span>
          </div>
          <div class="price-equiv" style="color:#8b5cf6">${esc(y.equiv)}</div>

          <div class="feature-list">
            <div class="feat-item">
              <span class="feat-icon check">${icon('check', 12)}</span>
              <span><b>1-Click AI Task Breakdown</b></span>
            </div>
            <div class="feat-item">
              <span class="feat-icon check">${icon('check', 12)}</span>
              <span><b>Unlimited Everything</b></span>
            </div>
            <div class="feat-item">
              <span class="feat-icon check">${icon('check', 12)}</span>
              <span>Lifetime Multi-Year Analytics</span>
            </div>
            <div class="feat-item">
              <span class="feat-icon check">${icon('check', 12)}</span>
              <span>Priority Feature Access</span>
            </div>
            <div class="feat-item">
              <span class="feat-icon check">${icon('check', 12)}</span>
              <span>Instant Export &amp; Cloud Backup</span>
            </div>
            <div class="feat-item">
              <span class="feat-icon check">${icon('check', 12)}</span>
              <span>👑 VIP Pro Diamond Badge</span>
            </div>
          </div>

          <button class="plan-btn btn-purple btn-pay" data-plan="${esc(y.name)}" data-amount="${y.price}" data-cycle="yearly">
            ${isPro && currentCycle === 'yearly' ? '🌟 Active Plan' : `Get Yearly — ₹${y.price}`}
          </button>
        </div>

      </div>
    </div>
  `;

  document.querySelectorAll('.btn-pay').forEach((btn) => {
    btn.onclick = () => {
      const plan = btn.dataset.plan;
      const amount = Number(btn.dataset.amount);
      const cycle = btn.dataset.cycle;
      window.openPaymentModal(plan, amount, cycle);
    };
  });
})();

/** Global Payment Modal for Razorpay / UPI QR */
window.openPaymentModal = function (planTitle = 'TaskFlow Pro', amount = 299, cycle = 'monthly') {
  const existing = document.getElementById('paymentModalOverlay');
  if (existing) existing.remove();

  // Standard UPI URI with pre-filled & locked amount
  const upiId = 'gaikwaddikshant55-2@oksbi';
  const payeeName = 'Dikshant Gaikwad';
  const upiNote = `TaskFlow Pro ${planTitle}`;
  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(upiNote)}`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(upiDeepLink)}`;

  const modal = document.createElement('div');
  modal.id = 'paymentModalOverlay';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="qr-modal">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">
        <div>
          <h2 style="font-size:18px;font-weight:800;margin:0 0 2px 0;color:var(--text-bright, var(--text))">Auto-Amount UPI Checkout</h2>
          <div style="font-size:12px;color:var(--text-muted)">Amount ₹${amount} is pre-locked into this QR code</div>
        </div>
        <button id="closeQrModal" class="icon-btn" style="color:var(--text-muted);font-size:22px;border:none;background:none;cursor:pointer">&times;</button>
      </div>

      <!-- Plan Tag Pill -->
      <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(16,185,129,0.1);padding:12px 16px;border-radius:14px;border:1px solid rgba(16,185,129,0.25);margin-bottom:18px">
        <div>
          <div style="font-weight:800;font-size:14.5px;color:var(--text-bright, var(--text))">${esc(planTitle)}</div>
          <div style="font-size:12px;color:#10b981;font-weight:600">✓ Amount Auto-Fetched on Scan</div>
        </div>
        <div style="font-size:22px;font-weight:900;color:#10b981;font-family:'JetBrains Mono', monospace">
          ₹${amount}
        </div>
      </div>

      <!-- Dynamic Amount-Locked QR Display -->
      <div style="text-align:center;padding:18px;background:#ffffff;border-radius:20px;border:1px solid #cbd5e1;margin-bottom:18px">
        <div style="position:relative;display:inline-block">
          <img
            id="dynamicUpiQr"
            src="${qrApiUrl}"
            alt="Scan to Pay ₹${amount}"
            onerror="this.onerror=null; this.src='assets/images/upi-qr.png';"
            style="max-width:220px;width:100%;height:auto;display:inline-block;border-radius:8px"
          />
        </div>
        
        <!-- UPI ID Pill with Copy button -->
        <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:12px;padding:8px 14px;background:#f1f5f9;border-radius:10px;font-size:13px;color:#0f172a;font-weight:600;font-family:'JetBrains Mono', monospace;border:1px solid #e2e8f0">
          <span>${upiId}</span>
          <button type="button" id="copyUpiBtn" style="background:#10b981;color:#022c22;border:none;font-weight:800;cursor:pointer;font-size:11px;padding:4px 8px;border-radius:6px;transition:all 0.15s ease" title="Copy UPI ID">
            Copy
          </button>
        </div>

        <!-- Direct Tap to Pay on Mobile -->
        <div style="margin-top:10px">
          <a href="${upiDeepLink}" style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:#0284c7;font-weight:700;text-decoration:none">
            <span>⚡ Tap to open in GPay / PhonePe / Paytm</span>
          </a>
        </div>
      </div>

      <!-- Reference Form -->
      <form id="paymentRefForm">
        <div style="margin-bottom:16px">
          <label style="display:block;font-size:12px;font-weight:700;margin-bottom:6px;color:var(--text-muted)">
            Enter 12-Digit UPI / UTR Reference Number:
          </label>
          <input
            type="text"
            id="utrInput"
            class="input"
            placeholder="e.g. 428901234567"
            required
            style="font-family:'JetBrains Mono', monospace;font-size:14px;height:44px;width:100%;border-radius:10px"
          />
        </div>

        <button type="submit" id="submitPaymentBtn" class="plan-btn btn-emerald" style="height:46px;font-size:14px">
          Submit Reference for Instant Activation
        </button>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  const closeBtn = document.getElementById('closeQrModal');
  closeBtn.onclick = () => modal.remove();

  const copyBtn = document.getElementById('copyUpiBtn');
  if (copyBtn) {
    copyBtn.onclick = () => {
      navigator.clipboard.writeText('gaikwaddikshant55-2@oksbi');
      copyBtn.textContent = 'Copied!';
      copyBtn.style.color = '#38bdf8';
      setTimeout(() => {
        copyBtn.textContent = 'Copy';
        copyBtn.style.color = '#10b981';
      }, 1500);
    };
  }

  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };

  const form = document.getElementById('paymentRefForm');
  const utrInput = document.getElementById('utrInput');
  const submitBtn = document.getElementById('submitPaymentBtn');

  form.onsubmit = async (e) => {
    e.preventDefault();
    const utr = utrInput.value.trim();
    if (!utr) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting reference…';

    try {
      const res = await API.post('/billing/submit-payment', {
        transactionId: utr,
        amount,
        billingCycle: cycle,
      });

      if (!res.success) throw new Error(res.message || 'Payment submission failed');

      modal.innerHTML = `
        <div class="qr-modal" style="text-align:center;padding:36px 24px">
          <div style="width:56px;height:56px;border-radius:50%;background:rgba(16,185,129,0.15);color:#10b981;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px">
            <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 style="font-size:20px;font-weight:800;color:var(--text-bright, var(--text));margin-bottom:8px">Reference Received!</h2>
          <p style="font-size:13.5px;color:var(--text-muted);line-height:1.5;margin-bottom:24px">
            Your transaction (<b>${esc(utr)}</b>) for <b>₹${amount}</b> has been queued for administrator verification.
          </p>
          <button id="okDoneBtn" class="plan-btn btn-emerald" style="height:44px">Done</button>
        </div>
      `;

      document.getElementById('okDoneBtn').onclick = () => {
        modal.remove();
        location.reload();
      };
    } catch (err) {
      alert(err.message || 'Submission error. Please try again.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Reference for Instant Activation';
    }
  };
};
