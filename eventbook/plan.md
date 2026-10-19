# EventBook — Stage 1 Implementation Plan

## Scope and sequencing

This plan covers **Stage 1 only**: a working basic event ticket booking system. It intentionally does not implement group rooms, budgets, matching, voting, or any other Stage 2 feature. Stage 2 will extend this same codebase only after Stage 1 has been locally configured and tested.

## Architecture overview

EventBook will be a single JavaScript repository with two runtime responsibilities:

- **Frontend:** React + Vite, served from `client/`, using React Router for the requested pages and Axios for API calls. A small auth context stores the JWT in browser storage for this demo app and injects it into requests.
- **Backend:** Node.js + Express in `server/`, exposing `/api/*` JSON routes and serving the built Vite app in production. Controllers and route middleware keep authentication, ownership, admin authorization, validation, inventory updates, and error handling explicit.
- **Database:** MongoDB Atlas through Mongoose. `User`, `Event`, and `Booking` schemas include validation, timestamps, references, and secure ticket identifiers. Seed events are marked with `isSeed: true` so they are distinguishable from user-created events.
- **Booking safety:** The booking route validates the client request against the current event document, atomically decrements the requested ticket category only when enough inventory remains, then creates the booking. If booking creation fails after the decrement, the route restores inventory. Cancellation restores inventory only once for eligible bookings.
- **Authentication:** Email/password registration and login use bcrypt password hashing and JWT signing. Protected routes verify the token; admin routes require the backend-resolved `role: admin`; booking reads/cancellation enforce `userId` ownership.
- **QR tickets:** A random secure ticket identifier is stored on each booking. The server returns a QR data URL encoding only a verification URL with that identifier. The verification endpoint returns validity and booking/event basics, never password or unnecessary personal data, and does not perform check-in.

## Project structure

```text
/eventbook
├── client/
│   ├── src/
│   │   ├── components/       # Header, event cards, forms, loading/error UI
│   │   ├── context/          # Auth context and API client
│   │   ├── pages/            # Home, explore, details, auth, checkout, tickets, admin
│   │   ├── styles/           # Global responsive visual system
│   │   ├── App.jsx           # Route table and guards
│   │   └── main.jsx          # Vite entry point
│   └── index.html
├── server/
│   ├── config/               # Environment and Mongo connection
│   ├── middleware/           # auth, admin, validation, error handling
│   ├── models/               # User, Event, Booking Mongoose models
│   ├── routes/               # auth, events, bookings, tickets, admin APIs
│   ├── services/             # QR creation and seed data
│   ├── utils/                # IDs, safe parsing, response helpers
│   └── index.js              # Express bootstrap and static serving
├── public/manus-routes.json  # Managed Preview route manifest
├── .env.example              # Placeholder configuration, no secrets
├── Dockerfile                # Production container build
├── package.json              # Workspace scripts and pinned toolchain
├── plan.md
└── TODO.md
```

## Database schema

### User

`name` (required string), `email` (required unique normalized string), `passwordHash` (required string, never returned), `role` (`user` or `admin`, default `user`), and `createdAt`.

### Event

`title`, `description`, `category`, `image`, `venue`, `date`, `ticketCategories`, `createdAt`, and `isSeed`. Each `ticketCategories` entry has `name`, `price` (non-negative number), and `availableInventory` (non-negative integer).

### Booking

`bookingId` (unique public ID), `userId` (User reference), `eventId` (Event reference), `ticketCategory`, `quantity` (positive integer), `totalAmount`, `status` (`confirmed` or `cancelled`), `secureTicketIdentifier` (unique random value), `createdAt`, and `cancelledAt` when applicable.

## API contract

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/events`, `GET /api/events/:id`, `POST /api/events`, `PUT /api/events/:id`, `DELETE /api/events/:id`
- `POST /api/bookings`, `GET /api/bookings/my`, `GET /api/bookings/:id`, `PATCH /api/bookings/:id/cancel`
- `GET /api/tickets/verify/:ticketId`
- `GET /api/admin/dashboard`, `GET /api/admin/bookings`

The server returns consistent `{ success, data, message }` or `{ success: false, message, errors? }` JSON and uses HTTP status codes for validation, authentication, authorization, not-found, conflict, and server errors.

## Design direction

Three possible directions were considered:

1. **Editorial ticket ledger** — probability 0.07; paper-like surfaces, dense event information, and strong typographic hierarchy.
2. **Neon night market** — probability 0.06; dark base, saturated coral and electric-blue accents, energetic event discovery.
3. **Civic-modern calendar** — probability 0.05; calm slate surfaces, warm amber accent, practical forms and clear status states.

### Selected: Civic-modern calendar

- **Design movement:** contemporary civic service design with a warm editorial edge.
- **Core principles:** trustworthy first, fast scanning, obvious next actions, and helpful empty/error states.
- **Color philosophy:** deep ink for authority, warm paper for approachability, amber for booking/action emphasis, and muted teal/green only for successful confirmations.
- **Layout paradigm:** asymmetric two-column content on desktop with a narrow event index rail and a flexible detail canvas; mobile collapses to a single reading flow.
- **Signature elements:** rounded “ticket stub” metadata blocks, small uppercase section labels, and a thin amber route-line motif connecting event discovery to checkout.
- **Interaction philosophy:** every action explains its consequence; availability and demo-checkout status stay visible, and destructive cancellation is explicit.
- **Animation:** short, purposeful fades and 150–220ms lift/slide transitions for cards and confirmation panels; no continuous motion that distracts from prices or dates.
- **Typography system:** `DM Sans` for interface text and `Fraunces` for display headings, with numeric prices using tabular figures.
- **Brand essence:** the clearest way to move from “what’s on” to a verified ticket; calm, practical, human.
- **Brand voice:** direct and reassuring. Example lines: “Pick a night worth remembering.” and “Demo booking confirmed — no payment was collected.”
- **Wordmark & logo:** a compact ticket-stub mark with a punched corner forming an `E`, paired with the EventBook wordmark.
- **Signature brand color:** warm amber `#F4A340`.

## Build and run workflow

1. Install Node.js 20+ and run `npm install` from the project root.
2. Copy `.env.example` to `.env` and provide a MongoDB Atlas connection string plus a long JWT secret. The application refuses to claim database-backed operation when `MONGODB_URI` is missing.
3. Run `npm run dev` to start the Express API and Vite development server on port 3000.
4. On first start, the server connects to MongoDB and inserts clearly marked seed events if the collection is empty. An admin can be created with the documented seed command or by setting the documented admin bootstrap values before first registration.
5. Use the browser Preview for the responsive UI and use the API health response plus the test checklist to verify behavior. Do not use real payments; checkout is explicitly a demo.
6. Run `npm run build` for the production client bundle and `npm start` to serve it through Express.
7. Before delivery, run diagnostics, build checks, API smoke tests that do not mutate shared production data, and a read-only requirements trace. Only tested outcomes are marked complete in `TODO.md`.

## Stage 1 completion boundary

Stage 1 is complete only when registration/login, event loading/search/filtering, safe booking and inventory changes, QR verification, ownership protection, cancellation, admin authorization/CRUD, responsive routes, and the build have been tested. Until the MongoDB environment is supplied and those checks pass, the implementation must be described as configured but not fully verified.
