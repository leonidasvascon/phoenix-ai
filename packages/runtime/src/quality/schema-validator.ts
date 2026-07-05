export type ValidationResult = {
  valid: boolean;
  reason?: string;
};

export function validateAgentOutput(output: Record<string, unknown>): ValidationResult {
  if (!output || typeof output !== "object" || Array.isArray(output)) {
    return {
      valid: false,
      reason: "Output must be a JSON object."
    };
  }

  if (Object.keys(output).length === 0) {
    return {
      valid: false,
      reason: "Output JSON object is empty."
    };
  }

  return {
    valid: true
  };
}

