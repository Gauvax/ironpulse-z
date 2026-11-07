// IronPulse — Graphiques SVG simples, lisibles et fluides pour mobile
window.IronPulse = window.IronPulse || {};

(function (ns) {
  function formatShortDate(isoStr) {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    } catch {
      return isoStr.slice(5, 10);
    }
  }

  function renderExerciseChart(timeline, metricKey) {
    // metricKey: 'best1RM' | 'maxWeight' | 'volume'
    if (!timeline || timeline.length === 0) {
      return `
        <div class="h-44 flex flex-col items-center justify-center text-slate-400 text-xs border border-dashed border-slate-700/70 rounded-xl p-4">
          <span>Aucune donnée enregistrée pour cet exercice.</span>
          <span class="text-slate-500 mt-1">Validez une séance contenant cet exercice pour afficher la courbe.</span>
        </div>
      `;
    }

    const values = timeline.map((pt) => Number(pt[metricKey]) || 0);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || Math.max(maxVal * 0.1, 5);

    const width = 340;
    const height = 165;
    const padLeft = 36;
    const padRight = 18;
    const padTop = 24;
    const padBottom = 30;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    const points = timeline.map((pt, idx) => {
      const x =
        timeline.length === 1
          ? padLeft + plotW / 2
          : padLeft + (idx / (timeline.length - 1)) * plotW;
      const normalized = range === 0 ? 0.5 : (values[idx] - (minVal - range * 0.15)) / (range * 1.3);
      const y = padTop + plotH - Math.max(0, Math.min(1, normalized)) * plotH;
      return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, val: values[idx], date: formatShortDate(pt.date), bestSet: pt.bestSetStr };
    });

    const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
    const areaPoints =
      points.length > 1
        ? `${points[0].x},${padTop + plotH} ${polylinePoints} ${points[points.length - 1].x},${padTop + plotH}`
        : '';

    const gridLines = [0, 0.5, 1].map((t) => {
      const y = Math.round(padTop + t * plotH);
      const valLabel = Math.round(maxVal - t * (maxVal - minVal));
      return `
        <line x1="${padLeft}" y1="${y}" x2="${width - padRight}" y2="${y}" stroke="#1E293B" stroke-dasharray="3 3" stroke-width="1" />
        <text x="${padLeft - 6}" y="${y + 3}" text-anchor="end" fill="#64748B" font-size="9">${valLabel}</text>
      `;
    }).join('');

    const dotsAndLabels = points.map((p) => `
      <g>
        <circle cx="${p.x}" cy="${p.y}" r="4.5" fill="#10B981" stroke="#0B0F17" stroke-width="2" />
        <text x="${p.x}" y="${p.y - 8}" text-anchor="middle" fill="#E2E8F0" font-size="9.5" font-weight="600">${p.val}</text>
        <text x="${p.x}" y="${height - 8}" text-anchor="middle" fill="#94A3B8" font-size="9">${p.date}</text>
      </g>
    `).join('');

    return `
      <div class="w-full overflow-hidden">
        <svg viewBox="0 0 ${width} ${height}" class="w-full h-auto select-none">
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#10B981" stop-opacity="0.35"/>
              <stop offset="100%" stop-color="#10B981" stop-opacity="0.0"/>
            </linearGradient>
          </defs>
          ${gridLines}
          ${areaPoints ? `<polygon points="${areaPoints}" fill="url(#areaGrad)" />` : ''}
          ${points.length > 1 ? `<polyline fill="none" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="${polylinePoints}" />` : ''}
          ${dotsAndLabels}
        </svg>
      </div>
    `;
  }

  function renderWorkoutVolumeBars(history) {
    const recent = [...(history || [])]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7);

    if (recent.length === 0) {
      return `<div class="text-xs text-slate-400 py-6 text-center">Aucune séance enregistrée.</div>`;
    }

    const items = recent.map((w) => {
      const stats = ns.Storage.computeWorkoutStats(w);
      return {
        date: formatShortDate(w.date),
        name: w.name,
        volume: stats.totalVolume,
        sets: stats.completedSets
      };
    });

    const maxVol = Math.max(...items.map((i) => i.volume), 100);

    const barsHtml = items.map((item) => {
      const pct = Math.max(12, Math.round((item.volume / maxVol) * 100));
      const kVol = item.volume >= 1000 ? `${(item.volume / 1000).toFixed(1)}t` : `${item.volume}kg`;
      return `
        <div class="flex flex-col items-center flex-1 min-w-0">
          <span class="text-[10px] font-semibold text-emerald-400 mb-1">${kVol}</span>
          <div class="w-full max-w-[28px] h-24 bg-slate-800/80 rounded-t-lg flex items-end overflow-hidden p-0.5">
            <div class="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md transition-all duration-300" style="height: ${pct}%"></div>
          </div>
          <span class="text-[10px] text-slate-400 mt-1.5 truncate w-full text-center">${item.date}</span>
        </div>
      `;
    }).join('');

    return `
      <div class="flex items-end justify-between gap-2 pt-2 pb-1 px-1">
        ${barsHtml}
      </div>
    `;
  }

  function renderMuscleBalanceBars(muscleBalance) {
    const entries = Object.entries(muscleBalance || {});
    const totalSets = entries.reduce((acc, [, v]) => acc + v, 0) || 1;

    const colorMap = {
      Pectoraux: 'bg-rose-500',
      Dos: 'bg-blue-500',
      Jambes: 'bg-violet-500',
      Épaules: 'bg-amber-500',
      Bras: 'bg-pink-500',
      Abdominaux: 'bg-teal-500'
    };

    return entries.map(([muscle, sets]) => {
      const pct = Math.round((sets / totalSets) * 100);
      const barClass = colorMap[muscle] || 'bg-emerald-500';
      return `
        <div class="mb-2.5 last:mb-0">
          <div class="flex justify-between text-xs mb-1">
            <span class="font-medium text-slate-200">${muscle}</span>
            <span class="text-slate-400">${sets} séries (${pct}%)</span>
          </div>
          <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div class="${barClass} h-full rounded-full transition-all duration-300" style="width: ${Math.max(sets > 0 ? 6 : 0, pct)}%"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  ns.Charts = {
    formatShortDate,
    renderExerciseChart,
    renderWorkoutVolumeBars,
    renderMuscleBalanceBars
  };
})(window.IronPulse);
