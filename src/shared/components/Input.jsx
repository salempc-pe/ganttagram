import clsx from 'clsx';
import './Input.css';

export const Input = ({
    label,
    error,
    className,
    required = false,
    ...props
}) => {
    return (
        <div className={clsx('input-wrapper', className)}>
            {label && (
                <label className="input-label">
                    {label}
                </label>
            )}
            <input
                className={clsx('input', {
                    'input-error': error,
                })}
                required={required}
                {...props}
            />
            {error && <span className="input-error-message">{error}</span>}
        </div>
    );
};
