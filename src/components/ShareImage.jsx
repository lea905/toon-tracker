import React, { useEffect, useRef, useState } from 'react';
import { CATEGORIES } from '../categories';
import './ShareImage.css';

const WIDTH = 1080;
const HEIGHT = 1350;
const FONT = "'Inter Variable', 'Inter', system-ui, sans-serif";

const loadImage = (src) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
});

const roundRect = (ctx, x, y, w, h, r) => {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
};

const drawBar = (ctx, y, label, seen, total, color) => {
    const percent = total ? seen / total : 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = `600 34px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText(label, 90, y);
    ctx.fillStyle = '#aaaaaa';
    ctx.font = `500 30px ${FONT}`;
    ctx.textAlign = 'right';
    ctx.fillText(`${seen} / ${total}`, WIDTH - 90, y);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    roundRect(ctx, 90, y + 18, WIDTH - 180, 16, 8);
    if (percent > 0) {
        ctx.fillStyle = color;
        roundRect(ctx, 90, y + 18, Math.max(16, (WIDTH - 180) * percent), 16, 8);
    }
};

async function drawProgressImage(canvas, { movies, seenState, stats }) {
    const ctx = canvas.getContext('2d');
    await document.fonts.ready;

    const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    gradient.addColorStop(0, '#2a1640');
    gradient.addColorStop(0.55, '#141420');
    gradient.addColorStop(1, '#121212');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Affiches des films vus les plus récents.
    const recentSeen = movies
        .filter(m => seenState[m.id] && !m.upcoming && m.poster)
        .sort((a, b) => b.year - a.year)
        .slice(0, 5);
    const posters = await Promise.all(recentSeen.map(m => loadImage(m.poster)));
    const posterW = 168;
    const posterH = 252;
    const gap = 20;
    const stripWidth = posters.length * posterW + Math.max(0, posters.length - 1) * gap;
    posters.forEach((img, i) => {
        if (!img) return;
        const x = (WIDTH - stripWidth) / 2 + i * (posterW + gap);
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(x, 70, posterW, posterH, 14);
        ctx.clip();
        ctx.drawImage(img, x, 70, posterW, posterH);
        ctx.restore();
    });

    const top = posters.length ? 400 : 120;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = `800 52px ${FONT}`;
    ctx.fillText('Mon Toon Tracker', WIDTH / 2, top);

    const percent = stats.releasedTotal ? Math.round((stats.seenTotal / stats.releasedTotal) * 100) : 0;
    ctx.fillStyle = '#2e9d5b';
    ctx.font = `900 150px ${FONT}`;
    ctx.fillText(`${percent} %`, WIDTH / 2, top + 170);
    ctx.fillStyle = '#cccccc';
    ctx.font = `500 36px ${FONT}`;
    ctx.fillText(`${stats.seenTotal} films vus sur ${stats.releasedTotal}`, WIDTH / 2, top + 230);

    let y = top + 320;
    drawBar(ctx, y, '⭐ Grands Classiques', stats.classiques.seen, stats.classiques.total, '#f2c94c');
    y += 78;
    for (const c of CATEGORIES) {
        const g = stats.byCategory.get(c.value);
        if (!g) continue;
        drawBar(ctx, y, c.label, g.seen, g.total, '#2e9d5b');
        y += 78;
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f2c94c';
    ctx.font = `700 34px ${FONT}`;
    ctx.fillText(
        `🏆 ${stats.unlockedCount} / ${stats.badgeCount} badges · ${stats.completedSagas} saga${stats.completedSagas > 1 ? 's' : ''} terminée${stats.completedSagas > 1 ? 's' : ''}`,
        WIDTH / 2,
        Math.min(y + 30, HEIGHT - 80),
    );

    ctx.fillStyle = '#777777';
    ctx.font = `500 26px ${FONT}`;
    ctx.fillText(new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }), WIDTH / 2, HEIGHT - 36);
}

const ShareImage = ({ movies, seenState, stats, onBack }) => {
    const canvasRef = useRef(null);
    const [blob, setBlob] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        drawProgressImage(canvasRef.current, { movies, seenState, stats })
            .then(() => new Promise(resolve => canvasRef.current.toBlob(resolve, 'image/png')))
            .then(result => { if (!cancelled) setBlob(result); })
            .catch(() => { if (!cancelled) setError("Impossible de générer l'image."); });
        return () => { cancelled = true; };
        // L'image est dessinée une seule fois, à l'ouverture.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fileName = `ma-progression-toon-tracker-${new Date().toISOString().slice(0, 10)}.png`;
    const file = blob ? new File([blob], fileName, { type: 'image/png' }) : null;
    const canShare = Boolean(file && navigator.canShare?.({ files: [file] }));

    const download = () => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
    };

    const share = async () => {
        try {
            await navigator.share({ files: [file], title: 'Ma progression Toon Tracker' });
        } catch {
            // Partage annulé : rien à faire.
        }
    };

    return (
        <div className="share-image">
            <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} className="share-canvas" aria-label="Aperçu de l'image de progression" />
            {error && <p className="share-error">{error}</p>}
            <div className="share-actions">
                <button className="header-btn" onClick={onBack}>← Retour</button>
                {canShare && (
                    <button className="primary-btn" onClick={share} disabled={!blob}>Partager</button>
                )}
                <button className={canShare ? 'header-btn' : 'primary-btn'} onClick={download} disabled={!blob}>
                    Télécharger l'image
                </button>
            </div>
        </div>
    );
};

export default ShareImage;
