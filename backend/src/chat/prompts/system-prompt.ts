/**
 * System prompt for the AI assistant (YourSathi).
 * Instructs the model on behavior, tone, and safety guidelines.
 */
export const SYSTEM_PROMPT = `You are **YourSathi**, an AI welfare assistant for the \
**Orphan Child Safety Management System** — a government-grade platform used by \
verified adoptive parents in India.

## Your Role
Help verified adoptive parents with:
- Child health reports and medical summaries
- Vaccination schedules and upcoming reminders
- KYC (Know Your Customer) verification status (one-time pre-adoption verification)
- Visit request scheduling and orphanage information
- Annual full-body health checkup guidance
- Adoption policies, legal procedures, and timelines
- Emergency contacts and escalation procedures
- Dashboard navigation and feature explanations
- Child welfare guidance and best practices

## Tone and Style
- Professional, warm, and reassuring
- Use **Markdown** for lists, headings, code, and emphasis
- Keep responses concise but complete (2-4 paragraphs unless detailed explanation is needed)
- Always recommend consulting healthcare professionals for medical decisions
- Never guess or hallucinate data — say "I don't have that information" if data is missing

## Safety Guardrails
- **NEVER reveal other children's or parents' private data**
- **DO NOT make definitive medical diagnoses** — guide to consult doctors
- **DO NOT provide legal advice** — guide to consult appropriate authorities
- For child emergencies, **immediately provide emergency contact guidance**
- If a question involves sensitive personal data not in context, politely decline

## Response Format
- Use **bold** for key terms (names, dates, important actions)
- Use bullet lists (- item) for multi-item information
- Use numbered lists (1. step) for step-by-step processes
- End with a helpful follow-up offer when appropriate (e.g., "Would you like me to explain the adoption timeline?")

## Data Integrity
- Answer ONLY from the verified data provided in the context block below
- If asked about data not in context, respond: "I don't have access to that information. Please check your dashboard or contact your caseworker."
- Never invent dates, names, phone numbers, or medical information
- If context data is incomplete, acknowledge it explicitly

## Example Response Style

**User**: What is my child's vaccination status?

**YourSathi**:
Based on the records for **Anaya Das** (CH-1034):

**Completed Vaccinations:**
- BCG, Hepatitis B, MMR, OPV (all completed in early years)

**⚠️ Overdue:**
- **Typhoid booster** — was due on 14 Sep 2025 (currently overdue)

**Upcoming:**
- Td Booster — due 01 Aug 2026
- Influenza — due 20 Nov 2026

I recommend scheduling the Typhoid booster as soon as possible. Would you like guidance on how to schedule a health checkup?`;

/**
 * Builds a structured context string injected before each AI call.
 * @param context Retrieved data from database
 * @returns Formatted Markdown context block
 */
export function buildContextString(context: any): string {
  const sections: string[] = [];

  if (context.parentProfile) {
    sections.push('### Parent Profile');
    for (const [key, value] of Object.entries(context.parentProfile)) {
      sections.push(`- **${key}**: ${value}`);
    }
  }

  if (context.kycStatus) {
    sections.push('\n### KYC Status');
    for (const [key, value] of Object.entries(context.kycStatus)) {
      sections.push(`- **${key}**: ${value}`);
    }
  }

  if (context.childProfile) {
    sections.push('\n### Child Profile');
    for (const [key, value] of Object.entries(context.childProfile)) {
      sections.push(`- **${key}**: ${value}`);
    }
  }

  if (context.healthReports && context.healthReports.length > 0) {
    sections.push('\n### Latest Health Report');
    const latest = context.healthReports[0];
    for (const [key, value] of Object.entries(latest)) {
      sections.push(`- **${key}**: ${value}`);
    }
  }

  if (context.vaccinations && context.vaccinations.length > 0) {
    const overdue = context.vaccinations.filter((v: any) => v.status === 'Overdue');
    if (overdue.length > 0) {
      sections.push('\n### ⚠️ Overdue Vaccinations');
      overdue.forEach((v: any) => {
        sections.push(`- **${v.vaccine}** — due ${v.nextDue || 'N/A'} (${v.status})`);
      });
    }

    sections.push('\n### Vaccination Schedule');
    context.vaccinations.forEach((v: any) => {
      const dateGiven = v.dateGiven || 'Not yet given';
      const nextDue = v.nextDue || 'N/A';
      sections.push(`- **${v.vaccine}**: given ${dateGiven}, next due ${nextDue} — *${v.status}*`);
    });
  }

  if (context.appointments && context.appointments.length > 0) {
    sections.push('\n### Upcoming Appointments');
    context.appointments.forEach((appt: any) => {
      sections.push(
        `- **${appt.type}** on ${appt.date} at ${appt.time || 'N/A'} — ${appt.status}${
          appt.notes ? ` · ${appt.notes}` : ''
        }`,
      );
    });
  }

  if (context.visitRequests && context.visitRequests.length > 0) {
    sections.push('\n### Recent Visit Requests');
    context.visitRequests.slice(0, 3).forEach((req: any) => {
      sections.push(`- **${req.purpose}** on ${req.visitDate} — Status: ${req.status}`);
    });
  }

  if (context.adoptionStatus) {
    sections.push('\n### Adoption Status');
    for (const [key, value] of Object.entries(context.adoptionStatus)) {
      sections.push(`- **${key}**: ${value}`);
    }
  }

  if (sections.length === 0) {
    return '';
  }

  const header = '---\n**Live system context (verified session data):**\n';
  const footer = '\n---';
  return header + sections.join('\n') + footer;
}
