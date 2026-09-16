# Automation Demo

Demonstration project for automating a small-business service request workflow.

## Objective

Automate the flow:

Request → Structured record → Work order → Status tracking → Management report

## Current stack

- Google Forms
- Google Sheets
- Google Apps Script
- Google Docs / Google Drive

## Project structure

- `docs/00-overview.md` — business problem and project objective
- `docs/01-requirements.md` — functional and non-functional requirements
- `docs/02-data-model.md` — workflow data structure
- `docs/03-demo-script.md` — demonstration sequence
- `src/Code.gs` — automation logic

## Success criterion

A submitted service request must:

1. create a structured record;
2. receive a unique request ID;
3. generate a work-order document;
4. allow status tracking;
5. appear in the operational summary.

## Scope

This is a demonstration project, not a production system.

The first version excludes:

- authentication;
- WhatsApp integration;
- CRM integration;
- billing;
- AI agents;
- custom web interface.