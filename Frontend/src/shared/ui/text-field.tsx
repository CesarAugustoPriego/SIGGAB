import type { InputHTMLAttributes } from 'react';

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'children'> {
  label: string;
  rightHint?: string;
  rightHintAction?: () => void;
}

export function TextField({
  label,
  rightHint,
  rightHintAction,
  className = '',
  id,
  ...inputProps
}: TextFieldProps) {
  const inputId = id || `field-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <label className={`ui-field ${className}`} htmlFor={inputId}>
      <span className="ui-field__head">
        <span className="ui-field__label">{label}</span>
        {rightHint ? (
          rightHintAction ? (
            <button
              type="button"
              className="ui-field__hint-action"
              onClick={rightHintAction}
              aria-label={rightHint}
            >
              {rightHint}
            </button>
          ) : (
            <span className="ui-field__hint">{rightHint}</span>
          )
        ) : null}
      </span>
      <input id={inputId} {...inputProps} className="ui-field__input" />
    </label>
  );
}
