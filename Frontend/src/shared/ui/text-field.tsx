import type { InputHTMLAttributes, ReactNode } from 'react';

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'children'> {
  label: string;
  rightHint?: string;
  rightHintAction?: () => void;
  leftIcon?: ReactNode;
  trailing?: ReactNode;
  inputClassName?: string;
}

export function TextField({
  label,
  rightHint,
  rightHintAction,
  leftIcon,
  trailing,
  inputClassName = '',
  className = '',
  id,
  ...inputProps
}: TextFieldProps) {
  const inputId = id || `field-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <label className={`ui-field ${className}`.trim()} htmlFor={inputId}>
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

      <div className={`ui-field__input-wrap ${leftIcon ? 'has-icon' : ''}`.trim()}>
        {leftIcon ? <span className="ui-field__icon">{leftIcon}</span> : null}
        <input id={inputId} {...inputProps} className={`ui-field__input ${inputClassName}`.trim()} />
        {trailing}
      </div>
    </label>
  );
}
