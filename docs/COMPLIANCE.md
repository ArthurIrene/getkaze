# COMPLIANCE.md: Data protection checklist (Rwanda)

Status: v1.0 (7 Nov 2026). Law No. 058/2021 on the protection of personal data and privacy. Supervisory authority: NCSA, Data Protection and Privacy Office. This is a working checklist, not legal advice; confirm with a lawyer.

## 1. What applies to us
- **Registration (required):** we handle personal data (owner and staff logins, client records, later guest data). Register as **data controller** (our client records) and **data processor** (businesses' guest data). Certificate issued within about 30 working days.
- **Storage outside Rwanda (separate permission):** needed because Supabase and Cloudflare store data outside Rwanda. About where servers are, not where our office is.
- **Office:** the RDB-registered company address is used on the forms; no physical office needed (confirm with lawyer).

## 2. Steps in order
1. Designate a data protection officer (likely you).
2. Prepare registration details: identity and contact point; personal data processed and categories of people; purposes; recipients; countries data goes to; risks and security measures.
3. File registration as controller and processor (forms on the NCSA Data Protection Office website).
4. While waiting: write the Data Protection Impact Assessment (DPIA) for hosting outside Rwanda (official guide and form on the DPO website); collect hosting agreements (Supabase and Cloudflare data processing agreements); list hosting countries for primary storage and backups.
5. When the registration number arrives: apply for authorization to store outside Rwanda.
6. Short lawyer consult: consent clause, client agreement, privacy notice, data roles.

## 3. Storage authorization: what the form asks
- Organization details, registration number(s), data protection officer.
- Categories of people, personal data per category, reasons for storing outside Rwanda, number of people concerned.
- Sensitive data: not applicable for us (confirm).
- Each hosting provider, countries (primary and disaster recovery), type of hosting, third parties, data protection laws of those countries.
- Security measures: ours and the providers'.
- Supporting documents: application letter to the NCSA CEO, hosting agreements, DPIA, other documents.
- Send as PDFs in a zip to registration@dpo.gov.rw and dpp@ncsa.gov.rw, organization name in the subject.

## 4. Ongoing duties
- Report any change to registration details within 15 working days.
- Renew the certificate at least 45 working days before expiry.
- Report data breaches to NCSA within 48 hours; inform affected clients.
- Privacy notice on our site and every client site.
- Support guests' rights: access, correction, deletion, portability (editor and export).
- Tell NCSA before adding a new hosting provider or country.

## 5. Going live rule (D-033)
- Go live once registration is filed: store only owner logins, with consent clause in the client agreement.
- Guest data (bookings, customers, stored orders) only after storage authorization, or on a Rwanda host.

## 6. Clients
- **Managed clients:** each business is the controller of its guests' data and likely needs its own registration. Lawyer question: does our storage authorization cover them?
- **Owned clients:** they own the hosting, so they need their own registration and, if hosted abroad, their own storage authorization. During the 3-month support window we act as processor under a processing agreement.
- **Optional paid service:** compliance pack (privacy notice, draft DPIA, registration help). Form-filling support, not legal advice.

## 7. Rwanda hosting fallback
Quotes to collect: Strettch Cloud (MTN data center, RWF billing, MoMo; young, in beta) and AOS (National Data Centre, established). Typical need: 2 vCPU, 4 GB RAM server plus backup storage, behind Cloudflare Tunnel.
