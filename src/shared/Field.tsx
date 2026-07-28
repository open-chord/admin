import type { InputHTMLAttributes } from "react";

export function Field(props: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...input } = props;

  return (
    <label className="field">
      <span>{label}</span>
      <input {...input} min={input.type === "number" ? 1 : input.min} />
    </label>
  );
}
