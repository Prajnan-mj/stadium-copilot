Extract the seating details from this event-ticket image. Return JSON only, matching
the schema. If a field is not clearly readable, use null and lower the confidence.
Do not guess. Fields: section (string), row (string|null), seat (string|null),
confidence (0-1).
