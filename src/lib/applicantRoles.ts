// What an applicant told us they want to do — distinct from whether they
// filled in a vehicle, so intent is explicit rather than inferred.

export const APPLICANT_ROLES = [
  { value: "DRIVER", label: "Driver", description: "I have a vehicle" },
  { value: "HELPER", label: "Helper", description: "No vehicle needed" },
] as const;

export type ApplicantRole = (typeof APPLICANT_ROLES)[number]["value"];

export function isApplicantRole(value: string): value is ApplicantRole {
  return (APPLICANT_ROLES as readonly { value: string }[]).some((r) => r.value === value);
}

export function getApplicantRoleLabel(value: string): string {
  return APPLICANT_ROLES.find((r) => r.value === value)?.label ?? value;
}
