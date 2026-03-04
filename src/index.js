// CL interface
// ** logic is in app.js **

const path = require("node:path");
const { createFileStorage } = require("./fileStorage");
const { createApp } = require("./app");

// if exists, use db path, else default to ./data/db.json (absolute path)
const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "db.json");

// prints user instructions
const usage = () => {
    console.log(`
        user commands: 
            create-event <id> "<name>" <yyyy-mm-dd> [capacity]
            register     <eventId> <email> "<name>"
            checkin      <eventId> <email>
            report       <eventId>
            list-events
        `);
};

const main = async () => {
    // extract cmd and args from terminal input
    // [node, filename, command, arg1, arg2, ...]
    const [cmd, ...args] = process.argv.slice(2); // removes node + filename
    if (!cmd || cmd === "help") {
        usage();
        return;
    }

    // create storage instance, then inject storage into app
    const app = createApp(createFileStorage(DB_PATH));

    try {
        // ----- create event cmd -----
        if (cmd === "create-event") {
            // expected args
            const [id, name, date, cap] = args;

            // show help if required args missing
            if (!id || !name || !date) return usage();

            // optional capacity
            const capacity = cap ? Number.parseInt(cap, 10) : 0;

            // call app.js and print result
            console.log(await app.createEvent({ id, name, date, capacity }));
            return;
        }

        // ----- register attendee -----
        if (cmd === "register") {
            // expected args
            const [eventId, email, name] = args;
            if (!eventId || !email || !name) return usage();

            // result
            console.log(await app.registerAttendee(eventId, { email, name }));
            return;
        }

        // ----- check-in attendee -----
        if (cmd === "checkin") {
            // args
            const [eventId, email] = args;
            if (!eventId || !email) return usage();

            // mark checked in
            const checked = await app.checkInAttendee(eventId, email);

            // result
            console.log(`Checked in: ${checked.email} | ${checked.name}`);
            return;
        }

        // ----- generate report -----
        if (cmd === "report") {
            // args
            const [eventId] = args;
            if (!eventId) return usage();

            // result (generate report)
            console.log(JSON.stringify(await app.generateReport(eventId), null, 2));
            return;
        }

        // ----- list events -----
        if (cmd === "list-events") {
            // retrieve list of events
            const events = await app.listEvents();

            // print each event
            for (const event of events) {
                console.log(
                    `${event.id} | ${event.date} | ${event.name} | capacity: ${event.capacity} | registered: ${event.registeredCount}`,
                );
            }
            return;
        }

        // if cmd not recognized, show commands and flag exitcode
        console.log("Invalid command...");
        usage();
        process.exitCode = 1;
    } catch (error) {
        console.error("Error: ", error.message);
        // failed
        process.exitCode = 1;
    }
};

main();
