# QUAL2000-A2: Event Check-in and Attendance console app

# Install and operation

Install using: npm install
operation: npm run start -- (command)

## Commands:

    create-event <id> "<name>" <yyyy-mm-dd> [capacity]
    register     <eventId> <email> "<name>"
    checkin      <eventId> <email>
    report       <eventId>
    list-events

## Example commands:

    npm run start -- create-event e1 "code-athon" 2026-04-20 10
    npm run start -- register e1 test@example.com "testy"

## Test command:

    npm test

## CI runs on push/pull request: .github/workflows/CI-testing.yml
