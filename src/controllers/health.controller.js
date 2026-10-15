const db = require("../db/database");

/**
 * GET /api/health
 * Reports real backend status — never fake this.
 */
async function getHealthController(req, res) {
    let dbConnected = false;
    try {
        db.prepare("SELECT 1").get();
        dbConnected = true;
    } catch (e) {
        dbConnected = false;
    }

    res.status(dbConnected ? 200 : 503).json({
        status: dbConnected ? "OPERATIONAL" : "DEGRADED",
        checks: {
            api: "OPERATIONAL",
            database: dbConnected ? "CONNECTED" : "DISCONNECTED"
        },
        timestamp: new Date().toISOString()
    })
}

module.exports = { getHealthController }
