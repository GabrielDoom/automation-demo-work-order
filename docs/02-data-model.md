# Data Model

## Main entity

The central entity is a service request.

| Field | Type | Source | Required |
|---|---|---|---|
| Request ID | String | Automatic | Yes |
| Timestamp | DateTime | Form | Yes |
| Client | String | Form | Yes |
| Phone | String | Form | Yes |
| Email | String | Form | No |
| Company | String | Form | No |
| Service Type | String | Form | Yes |
| Description | Text | Form | Yes |
| Priority | Enum | Form | Yes |
| Owner | String | Internal | No |
| Status | Enum | Internal | Yes |
| Due Date | Date | Form/Internal | No |
| Work Order URL | URL | Automatic | No |
| Completed At | DateTime | Automatic/Internal | No |

## Enumerations

### Priority

- Low
- Normal
- High
- Urgent

### Status

- Received
- Under Analysis
- In Progress
- Completed
- Cancelled

## Initial status

Every new request must start with:

`Received`

## Identifier

The first implementation will use a sequential identifier:

`SR-0001`

Examples:

- SR-0001
- SR-0002
- SR-0003

## Derived information

The reporting layer may calculate:

- total requests;
- open requests;
- requests in progress;
- completed requests;
- overdue requests;
- average completion time.