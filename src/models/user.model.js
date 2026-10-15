const db = require("../db/database");
const bcrypt = require("bcryptjs");

async function findUserByEmail(email) {
    return db.prepare("SELECT * FROM users WHERE email = ?").get(email);
}

async function createUser(userData) {
    const { email, name, password, systemUser } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare(`
        INSERT INTO users (email, name, password, system_user)
        VALUES (?, ?, ?, ?)
    `);
    const info = stmt.run(email, name, hashedPassword, systemUser ? 1 : 0);
    return { id: info.lastInsertRowid, email, name, systemUser: !!systemUser };
}

async function findUserById(id) {
    return db.prepare("SELECT * FROM users WHERE id = ?").get(id);
}

async function comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
}

module.exports = { findUserByEmail, createUser, findUserById, comparePassword };
