// app.js file
// ** contains all logic and validation **

// ----- validation helpers -----
const isValidEmail = (email) => {
    if (typeof email !== "string") {
        return false;
    }

    const trimmedEmail = email.trim();
    if (trimmedEmail.length < 5) {
        return false;
    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail); // googled regex
};

const isValidDate = (dateString) => {
    if (typeof dateString !== "string") {
        return false;
    }

    const matchFormat = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
    if (!matchFormat) {
        return false;
    }

    const year = Number(matchFormat[1]);
    const month = Number(matchFormat[2]);
    const day = Number(matchFormat[3]);

    const dateTime = new Date(Date.UTC(year, month - 1, day)); // in js, months are 0-11

    return dateTime.getUTCFullYear() === year && dateTime.getUTCMonth() === month - 1 && dateTime.getUTCDate() === day;
};

// ----- app -----
const createApp = (storage) => {
    if (!storage || typeof storage.load !== "function" || typeof storage.save !== "function") {
        throw new Error("Requires a fileStorage with load and save!");
    }

    // create new event in db
    const createEvent = async ({ id, name, date, capacity = 0 }) => {
        if (!id || typeof id !== "string") {
            throw new Error("Event id required!");
        }
        if (!name || typeof name !== "string") {
            throw new Error("Event name required!");
        }
        if (!isValidDate(date)) {
            throw new Error("Event date yyyy-mm-dd!");
        }
        if (!Number.isInteger(capacity) || capacity < 0) {
            throw new Error("capacity must be >= 0 int!");
        }

        // ----- storage -----
        const db = await storage.load();
        if (db.events[id]) {
            throw new Error("Event id taken!");
        }

        //events storage format
        db.events[id] = {
            id,
            name: name.trim(),
            date,
            capacity,
            registered: {},
        };

        await storage.save(db);

        return db.events[id];
    };

    // register attendee to specified event by id
    const registerAttendee = async (eventId, { email, name }) => {
        if (!eventId) {
            throw new Error("Event id required!");
        }
        if (!isValidEmail(email)) {
            throw new Error("Invalid Email!");
        }
        if (!name || typeof name !== "string" || !name.trim()) {
            throw new Error("Name required!");
        }

        const db = await storage.load();
        const event = db.events[eventId];
        if (!event) {
            throw new Error("Event not found!");
        }

        const parsedEmail = email.trim().toLowerCase();
        if (event.registered[parsedEmail]) {
            throw new Error("Email already exists!");
        }

        const registeredCount = Object.keys(event.registered).length;
        if (event.capacity > 0 && registeredCount >= event.capacity) {
            throw new Error("Event is at full capacity!");
        }

        event.registered[parsedEmail] = {
            email: parsedEmail,
            name: name.trim(),
            checkedInAt: null,
        };

        await storage.save(db);

        return event.registered[parsedEmail];
    };

    // mark a registered attendee as checked in
    const checkInAttendee = async (eventId, email) => {
        if (!eventId) {
            throw new Error("Event id required!");
        }
        if (!isValidEmail(email)) {
            throw new Error("Invalid email!");
        }

        // retrieve events from db
        const db = await storage.load();
        const event = db.events[eventId];
        if (!event) {
            throw new Error("Event not found!");
        }

        const parsedEmail = email.trim().toLowerCase();
        const attendee = event.registered[parsedEmail];
        if (!attendee) {
            throw new Error("Attendee not registered!");
        }
        if (attendee.checkedInAt) {
            throw new Error("Attendee already checked in!");
        }

        attendee.checkedInAt = new Date().toISOString();
        await storage.save(db);

        return attendee;
    };

    // build a report for a specified event by id
    const generateReport = async (eventId) => {
        if (!eventId) {
            throw new Error("Event id required!");
        }

        const db = await storage.load();
        const event = db.events[eventId];
        if (!event) {
            throw new Error("Event not found!");
        }

        const allAttendees = Object.values(event.registered);
        const checkedIn = allAttendees.filter((a) => a.checkedInAt);

        return {
            eventId: event.id,
            eventName: event.name,
            eventDate: event.date,
            totalRegistered: allAttendees.length,
            totalCheckedIn: checkedIn.length,
            checkedInAttendees: checkedIn.map((a) => ({
                email: a.email,
                name: a.name,
                checkedInAt: a.checkedInAt,
            })),
        };
    };

    // list all events
    const listEvents = async () => {
        const db = await storage.load();
        return Object.values(db.events).map((e) => ({
            id: e.id,
            name: e.name,
            date: e.date,
            capacity: e.capacity,
            registeredCount: Object.keys(e.registered).length,
        }));
    };

    // ----- output -----
    return {
        createEvent,
        registerAttendee,
        checkInAttendee,
        generateReport,
        listEvents,
        _isValidEmail: isValidEmail,
        _isValidDate: isValidDate,
    };
};

module.exports = { createApp };
