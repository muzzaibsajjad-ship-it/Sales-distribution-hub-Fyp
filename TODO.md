# TODO: Redesign Users List (View User)

## Plan
Design the Users List page inspired by FOPaymentConfirmations style but adapted for user management.

### Steps:
1. **Backend**: Update `getUsers` in `userController.js` to populate `assignedArea` and include `createdAt`, `stockTarget`, `bookerTarget`, `routes`, `targetMonth`.
2. **Backend**: Add `getUserById` controller + route (`GET /users/:id`).
3. **Frontend API**: Add `getUserByIdApi` in `api.js`.
4. **Frontend**: Completely redesign `UsersList.jsx`:
   - Header with icon + title + tabs (All / Active / Inactive)
   - Search/filter bar
   - Desktop table: dark red header, white rows, status/role badges
   - Mobile responsive cards
   - View user modal with full details (role-specific sections)
   - Keep toggle status and delete actions

### Files to Edit:
- `Backend/controllers/userController.js`
- `Backend/routes/userRoutes.js`
- `Frontend/src/api/api.js`
- `Frontend/src/components/UsersList.jsx`

