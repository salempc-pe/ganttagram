import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';
import './ConfirmModal.css';

export const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = '¿Estás seguro?',
    message = 'Esta acción no se puede deshacer.',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'danger'
}) => {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay confirm-modal-overlay" onClick={onClose}>
            <div
                className="modal-content confirm-modal animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-modal-title"
                aria-describedby="confirm-modal-desc"
            >
                <div className="confirm-modal-header">
                    <div className={`icon-bg ${variant}`}>
                        <AlertTriangle size={24} aria-hidden="true" />
                    </div>
                    <button
                        className="btn-close-minimal"
                        onClick={onClose}
                        aria-label="Cerrar ventana de confirmación"
                    >
                        <X size={20} aria-hidden="true" />
                    </button>
                </div>

                <div className="confirm-modal-body">
                    <h3 id="confirm-modal-title">{title}</h3>
                    <p id="confirm-modal-desc">{message}</p>
                </div>

                <div className="confirm-modal-footer">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="font-bold uppercase tracking-wider"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        variant={variant}
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className="font-bold uppercase tracking-wider shadow-lg"
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
};
