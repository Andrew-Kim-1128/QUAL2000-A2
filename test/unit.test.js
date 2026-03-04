// unit tests file

const test = require("node:test");
const assert = require("node:assert/strict");
const { createApp } = require("../src/app");

// ----- mock storage for unity testing -----
const createMemoryStorage = (initial = { events: {} }) => {
    // cloned initial state of db
    let db = structuredClone(initial);

    return {
        async load() {
            return structuredClone(db); // return a copy
        },
        async save(next) {
            db = structuredClone(next); // update internal state
        },
    };
};

// ----- unit tests -----

// email validation test
test("valid email test", () => {
    const app = createApp(createMemoryStorage());

    // valid should return true
    assert.equal(app._isValidEmail("andrew@kim.com"), true);

    // invalid should return false
    assert.equal(app._isValidEmail("badder"), false);
});

// date validation test
test("valid date test", () => {
    const app = createApp(createMemoryStorage());

    // valid date should pass
    assert.equal(app._isValidDate("2026-03-01"), true);

    // invalid date should fail
    assert.equal(app._isValidDate("2026-02-31"), false);
});

// unique eventId test
test("unique eventId test", async () => {
    const app = createApp(createMemoryStorage());

    // create first event
    await app.createEvent({
        id: "e1",
        name: "test",
        date: "2026-03-10",
        capacity: 0,
    });

    // duplicate id should reject
    await assert.rejects(
        () =>
            app.createEvent({
                id: "e1",
                name: "test2",
                date: "2026-03-11",
                capacity: 0,
            }),
        /taken/i, // error msg contains case-insensitive "taken"
    );
});

// duplicate registration test
test("duplicate register test", async () => {
    const app = createApp(createMemoryStorage());

    await app.createEvent({
        id: "e1",
        name: "test",
        date: "2026-03-10",
        capacity: 0,
    });

    // first register should succeed
    await app.registerAttendee("e1", {
        email: "andrew@kim.com",
        name: "Andrew",
    });

    // second register should fail
    await assert.rejects(
        () =>
            app.registerAttendee("e1", {
                email: "andrew@kim.com",
                name: "AndyRew",
            }),
        /exists/i,
    );
});

// capacity enforcement test
test("capacity enforcement test", async () => {
    const app = createApp(createMemoryStorage());

    // create event with capacity = 1
    await app.createEvent({
        id: "e1",
        name: "capTest",
        date: "2026-03-10",
        capacity: 1,
    });

    // first registration should be allowed
    await app.registerAttendee("e1", {
        email: "one@a.com",
        name: "one",
    });

    // second registration should be rejected due to capacity limit
    await assert.rejects(
        () =>
            app.registerAttendee("e1", {
                email: "two@b.com",
                name: "two",
            }),
        /capacity/i,
    );
});

// check-in test (prevent duplicate check-in)
test("check-in req. registration & prevent duplicate", async () => {
    const app = createApp(createMemoryStorage());

    await app.createEvent({
        id: "e1",
        name: "checkin",
        date: "2026-03-10",
        capacity: 0,
    });

    // cannot checkin if unregistered
    await assert.rejects(() => app.checkInAttendee("e1", "missing@a.com"), /not registered/i);

    // register attendee
    await app.registerAttendee("e1", {
        email: "andrew@kim.com",
        name: "andrew",
    });

    // first check-in should succeed
    await app.checkInAttendee("e1", "andrew@kim.com");

    // second check-in should fail
    await assert.rejects(() => app.checkInAttendee("e1", "andrew@kim.com"), /already checked in/i);
});
