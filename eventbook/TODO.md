
## Stage 2 — Smart group ticket booking

- [x] Logged-in users can create a group for an event; the creator becomes group leader and receives a unique invitation code. Friends can join with the code, and the group dashboard displays the shareable invitation code.
- [x] Each member can enter a maximum budget and preferred ticket categories. Exact budgets and preferences are private by default; matching exposes aggregate affordability and each member can see their own budget.
- [x] The backend compares ticket prices against member budgets without unnecessary AI and explains whether everyone or how many members can afford each category.
- [x] Members can vote once per category choice. The leader can finalize the selection; ties are resolved transparently by highest vote count and then deterministic category-name order.
- [x] Each member individually confirms participation. The backend validates inventory again, creates one booking per confirmed member linked to the group, prevents duplicate confirmation, and reports insufficient inventory without overselling.
- [x] The group dashboard displays group code, members, status, budget/matching results, votes, selected category, confirmation state, and the individual final price.
- [x] Add GroupBooking persistence with groupCode, groupLeaderId, eventId, members, groupStatus, selectedTicketCategory, and createdAt, using MongoDB when configured and demo-memory mode for local development.
- [x] Implement group routes for create, join, read/status, budget, matches, vote, finalize, and confirm while enforcing membership and leader authorization.
- [x] Preserve the existing individual booking flow and add a direct “Plan this event with a group” entry point from Event Details.
- [ ] Configure `MONGODB_URI` and run the Stage 2 flow against MongoDB Atlas; current smoke evidence is against the explicitly reported demo-memory mode.
