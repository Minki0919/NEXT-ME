import type { ChangeEvent } from "react";

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number" | "time";
}) {
  return (
    <section className="question-block">
      <h2>{label}</h2>
      <input
        className="line-input"
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
      />
    </section>
  );
}

export function SingleSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <section className="question-block">
      <h2>{label}</h2>
      <div className="chip-grid">
        {options.map((option) => (
          <button
            type="button"
            key={option}
            className={`choice-chip ${value === option ? "selected" : ""}`}
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </section>
  );
}

export function MultiSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const toggle = (option: string) => {
    onChange(value.includes(option) ? value.filter((item) => item !== option) : [...value, option]);
  };

  return (
    <section className="question-block">
      <h2>{label}</h2>
      <div className="chip-grid compact">
        {options.map((option) => (
          <button
            type="button"
            key={option}
            className={`choice-chip ${value.includes(option) ? "selected" : ""}`}
            onClick={() => toggle(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </section>
  );
}
