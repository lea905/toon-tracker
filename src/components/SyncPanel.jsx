import React, { useState } from 'react';
import Modal from './Modal';
import { formatCode } from '../sync';
import './SyncPanel.css';

const timeFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

const STATUS_TEXT = {
    syncing: 'Synchronisation…',
    ok: 'Synchronisé',
    idle: 'En attente',
    offline: 'Hors ligne : la synchro reprendra au retour du réseau',
    error: 'Erreur de synchro',
};

const SyncPanel = ({ sync, onExport, onImport, onClose }) => {
    const [joining, setJoining] = useState(false);
    const [input, setInput] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);

    const run = async (action) => {
        setBusy(true);
        setError(null);
        try {
            await action();
            setJoining(false);
            setInput('');
        } catch (e) {
            setError(e.message);
        } finally {
            setBusy(false);
        }
    };

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(formatCode(sync.code));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setError('Copie impossible : recopie le code à la main.');
        }
    };

    return (
        <Modal title="Synchro et sauvegarde" onClose={onClose}>
            <section className="sync-section">
                <h3>☁️ Synchro entre appareils</h3>

                {sync.code ? (
                    <>
                        <p className="sync-help">
                            Tape ce code sur tes autres appareils (bouton « Synchro » → « J'ai déjà un code ») :
                            tes films vus y seront mis à jour automatiquement.
                        </p>
                        <div className="sync-code-row">
                            <code className="sync-code">{formatCode(sync.code)}</code>
                            <button className="header-btn" onClick={copy}>{copied ? 'Copié ✓' : 'Copier'}</button>
                        </div>
                        <p className={`sync-status sync-status-${sync.status}`}>
                            <span className="sync-dot" aria-hidden="true" />
                            {sync.error ?? STATUS_TEXT[sync.status]}
                            {sync.lastSync && sync.status !== 'syncing' && (
                                <span className="sync-last"> · dernière synchro le {timeFormat.format(sync.lastSync)}</span>
                            )}
                        </p>
                        <p className="sync-warning">
                            Garde ce code pour toi : toute personne qui le connaît peut voir et modifier ta progression.
                        </p>
                        <div className="sync-actions">
                            <button className="primary-btn" onClick={sync.syncNow} disabled={sync.status === 'syncing'}>
                                Synchroniser maintenant
                            </button>
                            <button
                                className="header-btn"
                                onClick={() => {
                                    if (window.confirm('Arrêter la synchro sur cet appareil ?\nTes films vus restent enregistrés ici.')) {
                                        sync.disconnect();
                                    }
                                }}
                            >
                                Arrêter sur cet appareil
                            </button>
                        </div>
                    </>
                ) : joining ? (
                    <form
                        className="sync-join"
                        onSubmit={(e) => { e.preventDefault(); run(() => sync.joinCode(input)); }}
                    >
                        <label htmlFor="sync-code-input" className="sync-help">
                            Tape le code affiché sur ton autre appareil :
                        </label>
                        <input
                            id="sync-code-input"
                            className="search-input sync-input"
                            placeholder="XXXX-XXXX-XXXX"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            autoComplete="off"
                            autoCapitalize="characters"
                            spellCheck={false}
                            autoFocus
                        />
                        <p className="sync-help">
                            Les films vus sur cet appareil et sur l'autre seront réunis.
                        </p>
                        <div className="sync-actions">
                            <button type="submit" className="primary-btn" disabled={busy || !input.trim()}>
                                {busy ? 'Connexion…' : 'Synchroniser'}
                            </button>
                            <button type="button" className="header-btn" onClick={() => { setJoining(false); setError(null); }}>
                                Annuler
                            </button>
                        </div>
                    </form>
                ) : (
                    <>
                        <p className="sync-help">
                            Retrouve tes films vus sur ton téléphone, ton ordi, ta tablette… Sans compte ni mot de passe :
                            un simple code à taper sur chaque appareil.
                        </p>
                        <div className="sync-actions">
                            <button className="primary-btn" onClick={() => run(sync.createCode)} disabled={busy}>
                                {busy ? 'Création…' : 'Activer la synchro'}
                            </button>
                            <button className="header-btn" onClick={() => { setJoining(true); setError(null); }}>
                                J'ai déjà un code
                            </button>
                        </div>
                    </>
                )}

                {error && <p className="sync-error" role="alert">{error}</p>}
            </section>

            <section className="sync-section">
                <h3>💾 Sauvegarde dans un fichier</h3>
                <p className="sync-help">Pour garder une copie de ta progression, ou la transférer sans synchro.</p>
                <div className="sync-actions">
                    <button className="header-btn" onClick={onExport}>Exporter</button>
                    <button className="header-btn" onClick={onImport}>Importer</button>
                </div>
            </section>
        </Modal>
    );
};

export default SyncPanel;
