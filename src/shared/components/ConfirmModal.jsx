import React from 'react';
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
    if (!isOpen) return null;

    return (
        <div className="modal-overlay confirm-modal-overlay">
            <div className="modal-content confirm-modal animate-in zoom-in-95 duration-200">
                <div className="confirm-modal-header">
                    <div className={`icon-bg ${variant}`}>
                        <AlertTriangle size={24} />
                    </div>
                    <button className="btn-close-minimal" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="confirm-modal-body">
                    <h3>{title}</h3>
                    <p>{message}</p>
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
