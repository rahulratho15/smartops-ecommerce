/* TechVault — Monitoring & Logging Module */

// Define default values for global constants if they are not already defined.
// This makes the module more resilient if config.js or init.js hasn't loaded yet,
// or if these globals are simply missing.
const API_BASE_URL = typeof API !== 'undefined' ? API : '/api';
const DASHBOARD_API_URL = typeof DASH_API !== 'undefined' ? DASH_API : '/dashboard-api';
const APP_VERSION = typeof VER !== 'undefined' ? VER : 'unknown';

// Initialize lastDecisionCount for the polling mechanism.
// This variable tracks the last known count of AI decisions to detect new ones.
let lastDecisionCount = 0;

/**
 * Sends a log event to the monitoring API.
 * @param {string} eventType - The type of the event (e.g., 'CRASH_ERROR', 'USER_ACTION').
 * @param {object} data - An object containing details about the event.
 */
function slog(eventType, data) {
    try {
        // Determine session ID, defaulting to 'anon' if currentUser is not defined or logged in.
        const sessionId = (typeof currentUser !== 'undefined' && currentUser && currentUser.email) ? currentUser.email : 'anon';
        
        fetch(API_BASE_URL + '/log', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                eventType: eventType, 
                sessionId: sessionId, 
                version: APP_VERSION, 
                data: data, 
                timestamp: Date.now() 
            })
        }).catch(function (fetchError) {
            // If the fetch request itself fails (e.g., network error), log to console.
            console.error('SmartOps Monitor: Failed to send log via fetch:', fetchError);
        });
    } catch (e) {
        // If the slog function itself crashes (e.g., due to JSON.stringify failing with a circular reference in 'data',
        // or some other unexpected error during payload construction), log to console.
        console.error('SmartOps Monitor: Error within slog function:', e, 'Original data:', data);
    }
}

/**
 * Starts polling the dashboard for new AI decisions.
 * Calls checkDashboard immediately and then every 5 seconds.
 */
function startPolling() {
    checkDashboard();
    setInterval(checkDashboard, 5000);
}

/**
 * Fetches AI decisions from the dashboard API and logs new ones to the console.
 */
function checkDashboard() {
    fetch(DASHBOARD_API_URL + '/dashboard/decisions')
        .then(function (response) { 
            // Check if the HTTP response was successful (status code 200-299).
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} from ${DASHBOARD_API_URL}/dashboard/decisions`);
            }
            return response.json(); 
        })
        .then(function (data) {
            var total = data.stats ? data.stats.total : 0;
            // Only log if there are new decisions and the data structure is as expected.
            if (total > lastDecisionCount && data.decisions && data.decisions.length > 0) {
                var latest = data.decisions[0];
                console.log('%c[SmartOps] ══════════════════════════════════════════', 'color: #667eea; font-weight: bold');
                console.log('%c[SmartOps] 🤖 AI DECISION DETECTED', 'color: #667eea; font-weight: bold; font-size: 16px');
                console.log('%c[SmartOps] ─────────��────────────────────────────────', 'color: #667eea');
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
        .catch(function (error) { 
            // Log errors from checkDashboard fetch to console.
            console.error('SmartOps Monitor: Error fetching dashboard decisions:', error);
            // Also send this error to the logging API.
            slog('DASHBOARD_FETCH_ERROR', { message: error.message, stack: error.stack, url: DASHBOARD_API_URL + '/dashboard/decisions' });
        });
}

/* ── Global Error handlers ── */

// Catches uncaught JavaScript errors.
window.onerror = function (message, url, line) { 
    slog('CRASH_ERROR', { message: message, url: url, line: line }); 
    // Return true to prevent the default browser error handling (e.g., logging to console).
    return true; 
};

// Catches unhandled promise rejections.
window.addEventListener('unhandledrejection', function (event) { 
    slog('CRASH_ERROR', { 
        message: event.reason && event.reason.message || 'Promise rejected', 
        stack: event.reason && event.reason.stack 
    }); 
});