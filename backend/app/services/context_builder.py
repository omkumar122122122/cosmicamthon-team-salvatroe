"""
services/context_builder.py
───────────────────────────────────────────────────────────────────────────────
Converts a RetrievedContext object into a structured Markdown string
that is prepended to the Gemini system instruction.

Keeping this as a separate module means:
  - context shape changes only affect this file
  - Gemini service stays clean
  - Easy to unit-test the context output
"""

from app.services.retrieval_service import RetrievedContext


def build_context_string(ctx: RetrievedContext) -> str:
    """
    Serialise all retrieved data into a compact Markdown context block.
    Empty / None sections are omitted automatically.

    Returns:
        str — ready to inject into the Gemini system instruction.
    """
    sections: list[str] = []

    # ── Parent profile ─────────────────────────────────────────
    if ctx.parent_profile:
        sections.append("### Parent Profile")
        for k, v in ctx.parent_profile.items():
            sections.append(f"- **{k}**: {v}")

    # ── KYC status ─────────────────────────────────────────────
    if ctx.kyc_status:
        sections.append("\n### KYC Status")
        for k, v in ctx.kyc_status.items():
            sections.append(f"- **{k}**: {v}")

    # ── Child profile ──────────────────────────────────────────
    if ctx.child_profile:
        sections.append("\n### Child Profile")
        for k, v in ctx.child_profile.items():
            sections.append(f"- **{k}**: {v}")

    # ── Latest health report ───────────────────────────────────
    if ctx.latest_health_report:
        sections.append("\n### Latest Health Report")
        for k, v in ctx.latest_health_report.items():
            sections.append(f"- **{k}**: {v}")

    # ── Overdue vaccinations (highlight these first) ──────────
    if ctx.overdue_vaccinations:
        sections.append("\n### ⚠️ Overdue Vaccinations")
        for v in ctx.overdue_vaccinations:
            sections.append(
                f"- **{v['vaccine']}** — due {v.get('next_due', 'N/A')} ({v['status']})"
            )

    # ── Full vaccination schedule ──────────────────────────────
    if ctx.vaccination_schedule:
        sections.append("\n### Vaccination Schedule")
        for v in ctx.vaccination_schedule:
            date_given = v.get("date_given") or "Not yet given"
            next_due   = v.get("next_due")   or "N/A"
            sections.append(
                f"- **{v['vaccine']}**: given {date_given}, next due {next_due} — *{v['status']}*"
            )

    # ── Upcoming appointments ──────────────────────────────────
    if ctx.upcoming_appointments:
        sections.append("\n### Upcoming Appointments")
        for appt in ctx.upcoming_appointments:
            sections.append(
                f"- **{appt['type']}** on {appt['date']} at {appt.get('time','N/A')}"
                f" — {appt['status']}"
                + (f" · {appt.get('notes','')}" if appt.get("notes") else "")
            )

    if not sections:
        return ""

    header = "---\n**Live system context (verified session data):**\n"
    footer = "\n---"
    return header + "\n".join(sections) + footer
