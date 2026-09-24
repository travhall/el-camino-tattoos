import type { ReactNode } from "react";

/** What the control needs from its Field: spread these onto the input. */
export type FieldControlProps = {
  id: string;
  className: string;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
};

/**
 * A label, a control, and optional hint and error text, wired together. The
 * control is a render prop so it can be an input, select or textarea while
 * Field owns the ids: the error and hint are announced with the control
 * (`aria-describedby`, error first), and `aria-invalid` is set only while
 * there is an error. Mirrors the Field component in Figma.
 */
export function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  children: (control: FieldControlProps) => ReactNode;
}) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy =
    [error && errorId, hint && hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="field">
      <label htmlFor={id} className="field__label">
        {label}
      </label>
      {children({
        id,
        className: "field__control",
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
      })}
      {error && (
        <p id={errorId} className="field__error">
          {error}
        </p>
      )}
      {hint && (
        <p id={hintId} className="field__hint">
          {hint}
        </p>
      )}
    </div>
  );
}
