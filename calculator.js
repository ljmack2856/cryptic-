// ══════════════════════════════════════════════
//  PROFIT CALCULATOR
//  Plans: Bronze, Silver, Gold, Premium, Executive
//  Each plan has: min, max (USD), dailyRate (%)
// ══════════════════════════════════════════════

const PLANS = {
  bronze:    { label: 'Bronze',    min: 50,    max: 800,    dailyRate: 0.05  }, // 5% daily
  silver:    { label: 'Silver',    min: 900,   max: 3000,   dailyRate: 0.08  }, // 8% daily
  gold:      { label: 'Gold',      min: 3000,  max: 5000,   dailyRate: 0.10  }, // 10% daily
  premium:   { label: 'Premium',   min: 5000,  max: 20000,  dailyRate: 0.13  }, // 13% daily
  executive: { label: 'Executive', min: 20000, max: Infinity, dailyRate: 0.15 }, // 15% daily
};

function fmt(n) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function runCalculator() {
  const planSelect  = document.getElementById('calcPlan');
  const amountInput = document.getElementById('calcAmount');
  const hintEl      = document.getElementById('calcHint');
  const profitEl    = document.getElementById('calcProfit');
  const breakdown   = document.getElementById('calcBreakdown');
  const calcBtn     = document.getElementById('calcBtn');

  if (!planSelect || !amountInput) return; // calculator not on this page

  // Update hint whenever plan changes
  function updateHint() {
    const plan = PLANS[planSelect.value];
    const maxLabel = plan.max === Infinity ? 'No limit' : fmt(plan.max);
    hintEl.textContent = `Range: ${fmt(plan.min)} – ${maxLabel}`;
    hintEl.style.color = '#666';
    amountInput.classList.remove('error');
  }
  planSelect.addEventListener('change', updateHint);
  updateHint(); // init

  calcBtn.addEventListener('click', () => {
    const plan   = PLANS[planSelect.value];
    const amount = parseFloat(amountInput.value);

    // Validation
    if (isNaN(amount) || amount <= 0) {
      hintEl.textContent = 'Please enter a valid amount.';
      hintEl.style.color = '#e05c2a';
      amountInput.classList.add('error');
      return;
    }
    if (amount < plan.min) {
      hintEl.textContent = `Minimum for ${plan.label} is ${fmt(plan.min)}.`;
      hintEl.style.color = '#e05c2a';
      amountInput.classList.add('error');
      return;
    }
    if (plan.max !== Infinity && amount > plan.max) {
      hintEl.textContent = `Maximum for ${plan.label} is ${fmt(plan.max)}.`;
      hintEl.style.color = '#e05c2a';
      amountInput.classList.add('error');
      return;
    }

    amountInput.classList.remove('error');
    hintEl.textContent = `✓ Valid ${plan.label} investment`;
    hintEl.style.color = '#1a7a3f';

    const daily   = amount * plan.dailyRate;
    const weekly  = daily * 7;
    const monthly = daily * 30;

    // Show daily profit as main display
    profitEl.textContent = fmt(daily) + ' / day';

    // Breakdown cards
    document.getElementById('bdDaily').textContent   = fmt(daily);
    document.getElementById('bdWeekly').textContent  = fmt(weekly);
    document.getElementById('bdMonthly').textContent = fmt(monthly);
    breakdown.classList.add('visible');

    // Animate profit number
    profitEl.style.transition = 'color 0.3s';
    profitEl.style.color = '#1a7a3f';
  });
}

// Run on DOM ready
document.addEventListener('DOMContentLoaded', runCalculator);