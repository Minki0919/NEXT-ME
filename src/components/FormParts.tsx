import type { ReactNode } from "react";
import { assets } from "../assets";

/** 일반 프로필 3단계 화면의 공통 헤더 */
export function StepHeader({ step, total = 3 }: { step: number; total?: number }) {
  return (
    <header className="step-header">
      <h1>맞춤 프로필 작성</h1>
      <div className="step-dots" aria-label={`${total}단계 중 ${step}단계`}>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={i < step ? "active" : ""} />
        ))}
      </div>
    </header>
  );
}

/** 최신 Figma의 스킨/퍼스널컬러 화면처럼 제목 + 3개의 핑크 진행점을 표시합니다. */
export function DetailHeader({ title }: { title: string }) {
  return (
    <header className="step-header detail-step-header">
      <h1>{title}</h1>
      <div className="step-dots detail-dots" aria-hidden="true">
        <span className="active" />
        <span className="active" />
        <span className="active" />
      </div>
    </header>
  );
}

export function Question({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`survey-question ${className}`.trim()}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function Chips({
  options,
  value,
  onChange,
  multiple = false,
}: {
  options: readonly string[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
}) {
  const selected = Array.isArray(value) ? value : [value];

  function choose(option: string) {
    if (!multiple) {
      onChange(option);
      return;
    }

    const next = selected.includes(option)
      ? selected.filter((item) => item !== option)
      : [...selected, option];

    onChange(next);
  }

  return (
    <div className="chip-grid">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={selected.includes(option) ? "chip selected" : "chip"}
          onClick={() => choose(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

/**
 * 최신 Figma(스킨 타입/퍼스널 컬러)에서 사용한 한 줄 드롭다운 UI입니다.
 * 화면에는 질문 문구와 선택값을 보여주고 실제 선택은 native select가 담당해서
 * 모바일에서도 안정적으로 열리도록 했습니다.
 */
export function DropdownQuestion({
  title,
  options,
  value,
  onChange,
  disabled = false,
}: {
  title: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className={`survey-dropdown-question ${value ? "answered" : ""}`}>
      <span className="survey-dropdown-title">{title}</span>
      {value && <span className="survey-dropdown-value">{value}</span>}
      <span className="survey-dropdown-line" aria-hidden="true" />
      <img className="survey-dropdown-chevron" src={assets.formChevronDown} alt="" />
      <select
        className="survey-dropdown-native"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        aria-label={title}
      >
        <option value="" disabled>
          선택해 주세요
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function BottomNext({
  children = "다음으로 넘어가기",
  onClick,
  disabled = false,
  missingItems = [],
}: {
  children?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  missingItems?: string[];
}) {
  const noticeId = missingItems.length > 0 ? "bottom-action-missing-fields" : undefined;

  return (
    <>
      <MissingFieldsNotice id={noticeId} items={missingItems} className="bottom-action-missing" />
      <button
        type="button"
        className="figma-bottom-button"
        onClick={onClick}
        disabled={disabled}
        aria-describedby={noticeId}
      >
        {children}
      </button>
    </>
  );
}

export function MissingFieldsNotice({
  items,
  id,
  className = "",
}: {
  items: string[];
  id?: string;
  className?: string;
}) {
  if (items.length === 0) return null;

  return (
    <p id={id} className={`missing-fields-notice ${className}`.trim()} role="status">
      <strong>입력 필요</strong>
      <span>{items.join(" · ")}</span>
    </p>
  );
}
