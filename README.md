# Service Request Workflow Automation

A demonstration project for automating a repetitive small-business service workflow using Google Workspace.

The system converts a service request into a structured operational record, assigns a unique request ID, generates a work-order document automatically, tracks execution status and summarizes the operation in a live report.

## Problem

Small service businesses often receive requests through unstructured channels and then manually repeat the same information across spreadsheets, documents and status controls.

A typical workflow may require:

1. receiving the request;
2. registering client and service information;
3. creating a work order;
4. tracking execution status;
5. checking deadlines;
6. consolidating operational information for reporting.

This creates repeated transcription and makes the process harder to track consistently.

## Solution

The project implements the following workflow:

```text
Service Request
      ↓
Google Form
      ↓
Raw Response
      ↓
Apps Script Trigger
      ↓
Operational Record
      ↓
Unique Request ID
      ↓
Generated Work Order
      ↓
Status Tracking
      ↓
Operational Report
```

The automated transformation can be summarized as:

```text
Request → Structured record → Work order → Status tracking → Management report
```

## Architecture

The first implementation uses Google Workspace as a lightweight automation platform.

```text
Google Forms
     │
     ▼
Responses Sheet
     │
     │ onFormSubmit
     ▼
Google Apps Script
     │
     ├── Generates request ID
     │
     ├── Creates operational record
     │
     └── Generates work order
     │
     ▼
Operation Sheet
     │
     ├── Status
     ├── Priority
     ├── Deadline
     ├── Work-order link
     └── Completion date
     │
     ├──────────────► Google Docs
     │                 Work Order
     │
     ▼
Operational Report
```

## Main Features

### Structured request intake

Requests are submitted through Google Forms and preserved in a raw response sheet.

The intake layer is kept separate from the operational layer.

### Automatic request identification

Each processed request receives a sequential identifier:

```text
SR-0001
SR-0002
SR-0003
...
```

The request ID acts as the operational key linking the spreadsheet record and generated work order.

### Automatic work-order generation

Google Apps Script creates a work-order document from a Google Docs template and replaces the document placeholders with request data.

The generated document is stored automatically in a dedicated Drive folder and its URL is written back to the operational record.

### Duplicate protection

Before creating a new work order, the automation checks whether:

- the operational record already contains a work-order URL; or
- a document containing the request ID already exists in the output folder.

This provides basic idempotency for document generation.

### Operational status tracking

Requests can move through the following states:

```text
Recebido
Em análise
Em execução
Concluído
```

When a request is changed to `Concluído`, an `onEdit(e)` trigger automatically records its completion date.

### Operational reporting

The report sheet is calculated directly from operational data and currently includes:

- total requests;
- open requests;
- completed requests;
- overdue requests;
- requests by status;
- requests by priority;
- average completion time.

An overdue request is defined as:

```text
Deadline < Today
AND
Status != Completed
```

## Data Model

The central entity is the service request.

| Field | Purpose |
|---|---|
| Request ID | Unique operational identifier |
| Timestamp | Request creation time |
| Client | Client name |
| Phone | Contact phone |
| Email | Contact email |
| Company | Client organization |
| Service Type | Requested service category |
| Description | Service description |
| Priority | Normal or Urgent |
| Owner | Internal responsible person |
| Status | Current workflow state |
| Due Date | Expected completion date |
| Work Order URL | Generated document link |
| Completed At | Completion date |

## Demonstrated Workflow

A complete execution follows this sequence:

```text
Form submission
      ↓
Response recorded
      ↓
Apps Script trigger
      ↓
Operational row created
      ↓
SR-XXXX assigned
      ↓
Work order generated
      ↓
Document URL stored
      ↓
Status updated manually
      ↓
Completion date recorded
      ↓
Report updated automatically
```

## Technology Stack

- Google Forms
- Google Sheets
- Google Apps Script
- Google Docs
- Google Drive

The project intentionally avoids external servers, databases and APIs in its first version.

This keeps infrastructure requirements minimal while still demonstrating an end-to-end administrative automation.

## Repository Structure

```text
automation-demo-work-order/
├── README.md
├── apps-script/
│   └── Code.gs
├── assets/
│   ├── form.png
│   ├── operation.png
│   ├── work-order.png
│   └── report.png
└── docs/
    ├── 00-overview.md
    ├── 01-requirements.md
    ├── 02-data-model.md
    └── 03-demo-script.md
```

## Repository and Runtime

The executable version of the project runs inside Google Workspace.

This repository contains:

- a versioned snapshot of the Apps Script source code;
- the system documentation;
- sanitized screenshots of the working demonstration.

Google Workspace files themselves are not stored in Git.

## Scope

This project is a demonstration system rather than a production application.

The current version intentionally excludes:

- authentication and role management;
- WhatsApp integration;
- CRM integration;
- billing;
- external APIs;
- SQL databases;
- custom web interfaces;
- AI agents.

These features are outside the objective of the demonstration.

## What This Project Demonstrates

The purpose of the project is not simply to automate spreadsheet entry.

It demonstrates how a repetitive administrative process can be transformed from:

```text
Repeated manual transcription
```

into:

```text
Structured intake
      +
Automatic document generation
      +
Operational tracking
      +
Management visibility
```

The underlying design principle is:

> automate the repetitive process rather than perform the repetitive task.
