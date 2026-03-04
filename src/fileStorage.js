// file storage handlers (local db)

const fs = require("node:fs/promises"); // node fileSystem
const path = require("node:path");

// method to read JSON file
const readJson = async (filePath, fallback) => {
    try {
        const file = await fs.readFile(filePath, "utf-8");
        return JSON.parse(file);
    } catch (error) {
        // empty db error
        if (error && (error.code === "ENOENT" || error.name === "SyntaxError")) {
            return fallback;
        }
        throw error;
    }
};

// method to write JSON to file
const writeJson = async (filePath, value) => {
    // ensure directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    // formatting and write to file (value, filters, spaces)
    await fs.writeFile(filePath, JSON.stringify(value, null, 2), "utf-8");
};

// method to create storage file
const createFileStorage = (dbFilePath) => {
    return {
        async load() {
            return readJson(dbFilePath, { events: {} });
        },
        async save(db) {
            return writeJson(dbFilePath, db);
        },
    };
};

module.exports = { createFileStorage };
