/* TechVault — Monitoring & Logging Module */

function slog(t, d) {
    fetch(API + '/log', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType: t, sessionId: currentUser ? currentUser.email : 'anon', version: VER, data: d, timestamp: Date.now() })
    }).catch(function () { });
}

function startPolling() {
    checkDashboard();
    setInterval(checkDashboard, 5000);
}

function checkDashboard() {
    fetch(DASH_API + '/dashboard/decisions')
        .then(function (r) { return r.json(); })
        .then(function (data) {
            var total = data.stats ? data.stats.total : 0;
            if (total > lastDecisionCount && data.decisions && data.decisions.length > 0) {
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
                lastDecisionCount = total;
            }
        })
        .catch(function () { });
}

/* ── Error handlers ── */
window.onerror = function (m, u, l) { slog('CRASH_ERROR', { message: m, url: u, line: l }); };
window.addEventListener('unhandledrejection', function (e) { slog('CRASH_ERROR', { message: e.reason && e.reason.message || 'Promise rejected' }); });
