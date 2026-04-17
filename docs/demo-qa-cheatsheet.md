# Demo Q&A Cheatsheet

Use this right before submission, demo day, or an interview walkthrough.

## One-line explanation

> This project turns portfolio evidence into issuer-reviewed verifiable credentials so a recruiter can inspect and verify claims instead of just reading them.

## If asked "What problem does this solve?"

- Normal portfolios are mostly self-asserted claims.
- GitHub links help, but they do not give a recruiter a signed, portable proof object.
- This MVP shows how identity, evidence, review, issuance, and verification can connect into one story.

## If asked "Why include manual achievements too?"

- A real developer portfolio is broader than GitHub.
- Awards, bootcamp completions, certifications, hackathon results, and external proof often matter.
- The system treats them as reviewable evidence instead of leaving them as plain text bullets.

## If asked "What makes the verification meaningful?"

A recruiter can check:
- whether the credential signature is valid
- which issuer signed it
- whether the issuer still marks it active
- whether the credential has expired

## If asked "What is actually verifiable here?"

The signed credential and its registry-backed status are verifiable.
The portfolio narrative itself is still presentation, but the important claims can be backed by issued credentials.

## If asked "What is still MVP-only?"

Be honest:
- SQLite/local-first persistence
- simplified admin review model
- limited GitHub evidence ingestion depth compared with a production-grade pipeline
- UI optimized for clear demonstration rather than polished design-system completeness

## If asked "What would you build next?"

Good answers:
1. stronger GitHub evidence ingestion and historical attribution
2. production-grade auth and multi-user issuer workflow
3. cleaner trust registry / issuer directory model
4. better design polish and portfolio customization

## If asked "Why DID/VC instead of a normal database?"

- A normal database can store claims, but it does not make them portable proof.
- DID/VC lets the claim travel with signature and issuer context.
- The recruiter verification step becomes a first-class part of the product, not a hidden backend check.

## Safe final claim

You can call this:
- demo-ready
- submission-ready MVP
- portfolio-first DID/VC prototype

Avoid overselling it as:
- production-ready
- fully hardened
- complete trust infrastructure
