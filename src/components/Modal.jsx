import React, { useEffect, useRef } from 'react';
import './Modal.css';

// Fenêtre par-dessus la page : se ferme avec Échap, la croix ou un clic sur le fond.
const Modal = ({ title, onClose, children }) => {
    const dialogRef = useRef(null);

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        dialogRef.current?.focus();
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = previousOverflow;
        };
    }, [onClose]);

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div
                className="modal"
                role="dialog"
                aria-modal="true"
                aria-label={title}
                tabIndex={-1}
                ref={dialogRef}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button className="modal-close" onClick={onClose} aria-label="Fermer">×</button>
                </div>
                {children}
            </div>
        </div>
    );
};

export default Modal;
