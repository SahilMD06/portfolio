/**
 * Uniform result shape for every admin server action, so forms and dialogs can
 * render success and validation errors the same way regardless of entity.
 */
export interface ActionResult {
  ok: boolean;
  message?: string;
  /** Field name -> first validation message for that field. */
  fieldErrors?: Record<string, string>;
}

export const ACTION_IDLE: ActionResult = { ok: false };
