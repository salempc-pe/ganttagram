import clsx from 'clsx';
import './Button.css';

export const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    className,
    ...props
}) => {
    return (
        <button
            className={clsx(
                'btn',
                `btn-${variant}`,
                `btn-${size}`,
                {
                    'btn-disabled': disabled,
                    'btn-loading': loading,
                },
                className
            )}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <span className="btn-spinner"></span>
            ) : (
                children
            )}
        </button>
    );
};
