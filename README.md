# QUAL2000-A2

# Event Check-in and Attendance console app

## Install using: npm install

## operation: npm run start -- <command>

## commands:

    create-event <id> "<name>" <yyyy-mm-dd> [capacity]
    register     <eventId> <email> "<name>"
    checkin      <eventId> <email>
    report       <eventId>
    list-events

## example commands:

    npm run start -- create-event e1 "code-athon" 2026-04-20 10
    npm run start -- register e1 test@example.com "testy"

## test command:

    npm test

## CI runs on push/pull request: .github/workflows/CI-testing.yml
