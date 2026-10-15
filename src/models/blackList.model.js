const db = require("../db/database");

async function addToken(token) {
    db.prepare("INSERT INTO token_blacklist (token) VALUES (?)").run(token);
}

async function findToken(token) {
    return db.prepare("SELECT * FROM token_blacklist WHERE token = ?").get(token);
}

module.exports = { addToken, findToken };
