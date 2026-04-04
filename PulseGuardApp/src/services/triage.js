/**
 * Smart Triage — combines BPM + HRV + Stress into one verdict
 * Also handles Visual Assessment mode from Gemini AI
 */
export function computeTriage(result) {
  if (!result) return { level: 'UNKNOWN', action: 'No data', details: [] };

  // --- Visual Assessment Mode triage ---
  if (result.active_mode === 'visual_assessment' && result.visual_assessment) {
    const va = result.visual_assessment;
    const score = va.visual_stress_score || 0;
    const urgency = va.urgency || '';
    const details = [];

    if (va.overall_assessment) details.push(va.overall_assessment);
    if (va.recommended_action) details.push(va.recommended_action);

    // Map urgency/score to triage level
    if (urgency === 'CRITICAL' || urgency === 'HIGH' || score >= 7) {
      return { level: 'CRITICAL', action: 'Immediate medical attention recommended',
        details: details.length ? details : ['High visual distress indicators detected'] };
    }
    if (urgency === 'MODERATE' || score >= 4) {
      return { level: 'ELEVATED', action: 'Monitor closely — some distress signs detected',
        details: details.length ? details : ['Moderate visual distress indicators present'] };
    }
    return { level: 'STABLE', action: 'No visual signs of distress detected',
      details: details.length ? details : ['Patient appears calm and healthy'] };
  }

  // --- Biometric Mode triage ---
  const { bpm, stress_level, hrv, sqi_level } = result;

  if (sqi_level === 'LOW') {
    return { level: 'UNKNOWN', action: 'Signal quality too low',
      details: ['Try again with better lighting and hold still'] };
  }

  const rmssd = hrv?.rmssd;
  const lfhf  = hrv?.lf_hf_ratio;
  const details = [];

  // CRITICAL
  if (bpm > 120) details.push(`Heart rate very high: ${bpm} BPM`);
  if (bpm && bpm < 45) details.push(`Heart rate very low: ${bpm} BPM`);
  if (stress_level === 'HIGH' && bpm > 100) details.push('High stress with elevated heart rate');
  if (rmssd != null && rmssd < 12) details.push(`Very low HRV: RMSSD ${rmssd.toFixed(1)} ms`);
  if (details.length > 0) return { level: 'CRITICAL', action: 'Immediate attention needed', details };

  // ELEVATED
  if (stress_level === 'MODERATE') details.push('Moderate stress detected');
  if (stress_level === 'HIGH') details.push('High stress detected');
  if (bpm > 100) details.push(`Elevated heart rate: ${bpm} BPM`);
  if (bpm && bpm < 50) details.push(`Low heart rate: ${bpm} BPM`);
  if (rmssd != null && rmssd < 20) details.push(`Low HRV: RMSSD ${rmssd.toFixed(1)} ms`);
  if (lfhf != null && lfhf > 4.0) details.push(`High sympathetic activity: LF/HF ${lfhf.toFixed(1)}`);
  if (details.length > 0) return { level: 'ELEVATED', action: 'Monitor closely', details };

  // STABLE
  return { level: 'STABLE', action: 'All vitals normal',
    details: ['Heart rate, HRV, and stress within healthy ranges'] };
}
