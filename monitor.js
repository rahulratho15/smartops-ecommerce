/* TechVault — Monitoring & Logging Module */

function slog(t, d) {
    // Access global variables via window object to prevent ReferenceError in strict mode
    // and provide fallbacks for undefined values.
    const apiEndpoint = window.API ? window.API + '/log' : null;
    if (!apiEndpoint) {
        // If API is not defined, we cannot send logs. Fail silently as per original .catch() behavior.
        return;
    }

    const sessionId = window.currentUser ? window.currentUser.email : 'anon';
    const version = window.VER || 'unknown'; // Provide a default for VER if it's undefined

    fetch(apiEndpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType: t, sessionId: sessionId, version: version, data: d, timestamp: Date.now() })
    }).catch(function () { /* Fail silently */ });
}

function startPolling() {
    checkDashboard();
    setInterval(checkDashboard, 5000);
}

function checkDashboard() {
    // Access global variables via window object to prevent ReferenceError in strict mode
    // and provide fallbacks for undefined values.
    const dashApiEndpoint = window.DASH_API ? window.DASH_API + '/dashboard/decisions' : null;
    if (!dashApiEndpoint) {
        // If DASH_API is not defined, we cannot poll. Fail silently as per original .catch() behavior.
        return;
    }

    fetch(dashApiEndpoint)
        .then(function (r) { return r.json(); })
        .then(function (data) {
            // Initialize lastDecisionCount if it's not set, to prevent ReferenceError and ensure comparison works.
            // It's assumed lastDecisionCount is a global variable managed by init.js or similar.
            if (typeof window.lastDecisionCount === 'undefined') {
                window.lastDecisionCount = 0;
            }

            var total = data.stats ? data.stats.total : 0;
            if (total > window.lastDecisionCount && data.decisions && data.decisions.length > 0) {
                var latest = data.decisions[0];
                console.log('%c[SmartOps] ══════════════════════════════════════════', 'color: #667eea; font-weight: bold');
                console.log('%c[SmartOps] 🤖 AI DECISION DETECTED', 'color: #667eea; font-weight: bold; font-size: 16px');
                console.log('%c[SmartOps] ──────────────────────────────────────────', 'color: #667eea');
                console.log('%c[SmartOps] Action: ' + latest.action, 'color: #22c55e; font-weight: bold; font-size: 14px');
                console.log('%c[SmartOps] Scenario: ' + latest.scenario, 'color: #60a5fa');
                console.log('%c[SmartOps] Reasoning: ' + (latest.reasoning || 'N/A'), 'color: #d4d4d4');
                console.log('%c[SmartOps] Confidence: ' + ((latest.confidence || 0) * 100).toFixed(0) + '%', 'color: #fbbf24');
                if (latest.executionDetails) {
                    console.log('%c[SmartOps] ✅ Result: ' + latest.executionDetails, 'color: #22c55e; font-weight: bold');
                }
                if (latest.thinkingChain) {
                    console.log('%c[SmartOps] 🧠 AI Thinking Chain:', 'color: #a78bfa; font-weight: bold');
                    if (latest.thinkingChain.observations) console.log('%c  📋 Observations: ' + latest.thinkingChain.observations, 'color: #a78bfa');
                    if (latest.thinkingChain.analysis) console.log('%c  🔬 Analysis: ' + latest.thinkingChain.analysis, 'color: #a78bfa');
                    if (latest.thinkingChain.hypothesis) console.log('%c  💡 Hypothesis: ' + latest.thinkingChain.hypothesis, 'color: #a78bfa');
                    if (latest.thinkingChain.riskAssessment) console.log('%c  ⚠️ Risk: ' + latest.thinkingChain.riskAssessment, 'color: #f97316');
                }
                if (latest.actionPlan && latest.actionPlan.steps) {
                    console.log('%c[SmartOps] 📋 Action Plan:', 'color: #60a5fa; font-weight: bold');
                    latest.actionPlan.steps.forEach(function (s, i) { console.log('%c  ' + (i + 1) + '. ' + s, 'color: #60a5fa'); });
                }
                console.log('%c[SmartOps] ══════════════════════════════════════════', 'color: #667eea; font-weight: bold');

                if (latest.action === 'SELF_HEAL' && latest.executionStatus === 'EXECUTED') {
                    console.log('%c[SmartOps] 🎉 BUG FIXED! Refresh the page and try adding Smart Ring Pro again — it should work now!', 'color: #22c55e; font-weight: bold; font-size: 16px');
                    var co = document.getElementById('crash-overlay');
                    if (co) co.remove();
                }
                window.lastDecisionCount = total; // Update global variable
            }
        })
        .catch(function () { /* Fail silently */ });
}

/* ── Error handlers ── */
window.onerror = function (m, u, l) { slog('CRASH_ERROR', { message: m, url: u, line: l }); };
window.addEventListener('unhandledrejection', function (e) { slog('CRASH_ERROR', { message: e.reason && e.reason.message || 'Promise rejected' }); });