# Demo Talk Track

Use this when you need to explain the project clearly in a short presentation or live demo.

## 1-minute version

> This project is a **Verifiable Developer Portfolio MVP**. Instead of only showing GitHub links or self-written claims, it lets a developer collect portfolio evidence, connect GitHub activity, submit that evidence for issuer review, and receive verifiable credentials. A recruiter can then open a verification page and independently check the issuer signature, registry status, and expiry. The goal is not production deployment yet, but a convincing end-to-end simulation of how a verifiable portfolio could work.

## 3-minute version

> Traditional developer portfolios are mostly static pages with unverifiable claims. This project explores a different approach: portfolio data becomes evidence, evidence goes through issuer review, and approved claims become verifiable credentials.
>
> The first part of the product is the **developer dashboard**. Here, the user edits profile information, curates featured projects, adds non-GitHub achievements such as awards or completions, and connects GitHub evidence. This is important because the portfolio is not meant to be a GitHub stats clone. It combines authored work, curated narrative, and external proof.
>
> The second part is the **issuer workflow**. Instead of turning every claim into an automatic credential, the developer submits a credential request. An issuer or admin reviews the evidence, approves or rejects it, and then issues a credential. This makes the proof stronger than a normal portfolio bullet point.
>
> The third part is the **recruiter verification flow**. A recruiter can open the public portfolio, inspect issued credentials, and follow a verification page that explains whether the signature is valid, whether the issuer still marks the credential as active, and whether it has expired. So the project demonstrates portable proof, not just a hidden database record.
>
> Overall, this is a local-first MVP intended for simulation, demonstration, and portfolio presentation. It is not a production SaaS yet, but it does show the complete product story end to end.

## What to emphasize in a demo

- It is a **portfolio-first** product, not just a DID/VC toy example.
- GitHub activity is used as **evidence**, not as the whole portfolio.
- Manual achievements matter too: awards, completions, certifications, and external proof.
- Credentials are **issuer-reviewed**, not blindly auto-generated.
- Recruiters get a **verification page they can actually read**.

## If asked "Why not just use GitHub?"

> GitHub alone shows activity, but it does not provide a recruiter-friendly, issuer-reviewed, portable credential. This MVP is about turning evidence into a signed claim that can be verified through signature, status, and expiry.

## If asked "Is this production-ready?"

> Not yet. This is a demo-ready and submission-ready MVP. It focuses on showing the product concept clearly rather than solving production-scale security, multi-tenant auth, or full GitHub event ingestion.

## If asked "What is the core value?"

> The core value is that a developer can present work and achievements as verifiable proof instead of unverifiable claims, and a recruiter can inspect that proof through a clean verification flow.
