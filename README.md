# Facility Reservation and Approval System

## Systems Analysis and Design - Laboratory Exercise 4

A role-based facility reservation and approval system developed using:

- HTML
- CSS
- JavaScript
- Supabase
- GitHub
- GitHub Pages

## User Roles

### Administrator

- Manage facilities
- Approve reservations
- Reject reservations
- View audit logs
- Monitor reservation activities

### Facility Staff

- View reservations
- Start facility usage
- Mark reservations as completed
- Monitor facility schedules

### Requester

- View facilities
- Submit reservation requests
- View reservation status
- Cancel eligible pending requests
- View reservation history

## Reservation Workflow

Reservation Submitted
        ↓
Pending
        ↓
Administrator Review
        ↓
Approved / Rejected
        ↓
Scheduled
        ↓
In Use
        ↓
Completed

## Business Rules

1. Only active facilities may be reserved.
2. Reservation start time must precede end time.
3. Overlapping approved schedules are prohibited.
4. Only Administrators may approve reservations.
5. Rejected reservations cannot become Scheduled.
6. Approved reservations reserve the selected time slot.
7. Completed reservations cannot be edited.
8. Facilities under maintenance cannot be reserved.
9. Requesters may modify only their own pending requests.
10. Important reservation and status changes are recorded in audit logs.

## Test Accounts

Administrator:
admin@adssu.edu.ph
admin123

Facility Staff:
staff@adssu.edu.ph
staff123

Requester:
jahaziel@adssu.edu.ph
jahaziel123

## Deployment

The project can be deployed using GitHub Pages.

Supabase is used for:

- Authentication
- Database
- Role management
- Reservation records
- Audit logs
