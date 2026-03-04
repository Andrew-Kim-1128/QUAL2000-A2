// integration tests file
/*
- check file storage 
- logic + storage integration
- i/o behavior
*/

const test = require("node:test");
const assert = require("node:assert/strict");
const os = require("node:os");
const path = require("node:path");
const fs = require("node:fs/promises");

const { createFileStorage } = require("../src/fileStorage");
const { createApp } = require("../src/app");

// helper to create temp database for each test (isolate and remove interference)
// creates temp dir in OS temp (node:os) folder
const tempDb = async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "event-checkin-"));

    // return directory, and db file path
    return {
        dir,
        dbPath: path.join(dir, "db.json"),
    };
};

// ----- integration tests -----

// data storage (persistence) test
test("register persists and readable later", async () => {
    // create tempDb
    const { dir, dbPath } = await tempDb();

    // instance 1 writes data
    const appOne = createApp(createFileStorage(dbPath));

    await appOne.createEvent({
        id: "e1",
        name: "persistPlease",
        date: "2026-03-10",
        capacity: 0,
    });

    await appOne.registerAttendee("e1", {
        email: "andrew@kim.com",
        name: "A",
    });

    // create instance 2 and generate report
    const appTwo = createApp(createFileStorage(dbPath));

    const report = await appTwo.generateReport("e1");

    // verify data persistence
    assert.equal(report.totalRegistered, 1);

    // clean up temp dir (recursive: del everything in folder, force: even if doesn't exist)
    await fs.rm(dir, { recursive: true, force: true });
});

// check-in updates persistent data test
test("check-in updates report", async () => {
    const { dir, dbPath } = await tempDb();
    const app = createApp(createFileStorage(dbPath));

    // setup event + registration
    await app.createEvent({
        id: "e1",
        name: "report",
        date: "2026-03-10",
        capacity: 0,
    });

    await app.registerAttendee("e1", {
        email: "andrew@kim.com",
        name: "andrew",
    });

    // checkin + gen report
    await app.checkInAttendee("e1", "andrew@kim.com");

    const report = await app.generateReport("e1");

    // confirm check-in count update
    assert.equal(report.totalCheckedIn, 1);

    // clean up
    await fs.rm(dir, { recursive: true, force: true });
});

// full work-flow test
/*
- create event
- register multiple attendees
- check in attendees
- generate report totals
*/

test("full workflow test", async () => {
    const { dir, dbPath } = await tempDb();
    const app = createApp(createFileStorage(dbPath));

    await app.createEvent({
        id: "e2",
        name: "fulltest",
        date: "2026-03-10",
        capacity: 10,
    });

    await app.registerAttendee("e2", { email: "one@one.com", name: "one" });
    await app.registerAttendee("e2", { email: "two@two.com", name: "two" });
    await app.registerAttendee("e2", { email: "tree@tree.com", name: "tree" });

    await app.checkInAttendee("e2", "two@two.com");
    await app.checkInAttendee("e2", "tree@tree.com");

    const report = await app.generateReport("e2");

    //verify: total registrations + checkins
    assert.equal(report.totalRegistered, 3);
    assert.equal(report.totalCheckedIn, 2);

    // cleanup
    await fs.rm(dir, { recursive: true, force: true });
});
