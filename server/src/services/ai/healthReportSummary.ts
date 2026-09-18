import { DailyHealthReport } from '../../types/index.js';
import { SafetyEngine } from '../safety/safetyEngine.js';

export function generateDailyHealthSummary(
  current: {
    energy_level: number;
    sleep_hours: number;
    sleep_quality: string;
    water_intake_liters: number;
    exercise_minutes: number;
    mood: string;
    symptoms_reported: string[];
    vitals?: {
      temperature_f?: number;
      bp_systolic?: number;
      bp_diastolic?: number;
      blood_glucose_mgdl?: number;
      resting_heart_rate?: number;
    };
  },
  previous?: DailyHealthReport
): {
  ai_summary: string;
  ai_changes: string[];
  ai_recommendations: string[];
} {
  const changes: string[] = [];
  const recommendations: string[] = [];

  // Sleep analysis
  if (previous) {
    const sleepDiff = current.sleep_hours - previous.sleep_hours;
    if (Math.abs(sleepDiff) >= 0.5) {
      if (sleepDiff > 0) {
        changes.push(`Sleep increased by ${sleepDiff.toFixed(1)} hours compared with your previous entry.`);
      } else {
        changes.push(`Sleep decreased by ${Math.abs(sleepDiff).toFixed(1)} hours compared with your previous entry.`);
      }
    }

    const waterDiff = current.water_intake_liters - previous.water_intake_liters;
    if (Math.abs(waterDiff) >= 0.3) {
      if (waterDiff > 0) {
        changes.push(`Water intake increased by ${waterDiff.toFixed(1)} liters.`);
      } else {
        changes.push(`Water intake was lower by ${Math.abs(waterDiff).toFixed(1)} liters compared with your previous entry.`);
      }
    }

    const newSymptoms = current.symptoms_reported.filter(s => !previous.symptoms_reported.includes(s));
    const resolvedSymptoms = previous.symptoms_reported.filter(s => !current.symptoms_reported.includes(s));

    if (newSymptoms.length > 0) {
      changes.push(`New symptom reported: ${newSymptoms.join(', ')}.`);
    }
    if (resolvedSymptoms.length > 0) {
      changes.push(`Previously noted symptom resolved: ${resolvedSymptoms.join(', ')}.`);
    }
  } else {
    changes.push('Initial baseline health log recorded.');
  }

  // Recommendations based on user data
  if (current.sleep_hours < 7) {
    recommendations.push('Aim for 7–9 hours of continuous sleep to support physical and immune recovery.');
  }
  if (current.water_intake_liters < 2.0) {
    recommendations.push('Maintain regular hydration throughout the day (general guideline: 2.0 to 2.5 liters daily).');
  }
  if (current.exercise_minutes >= 30) {
    recommendations.push('Great job meeting the daily target of 30 minutes of physical activity.');
  } else {
    recommendations.push('Consider incorporating light movement, such as a 15-minute brisk walk or light stretching.');
  }

  // Vitals safety check
  let vitalsNote = 'Reported vitals appear within expected resting parameters.';
  if (current.vitals) {
    const { bp_systolic, bp_diastolic, blood_glucose_mgdl, temperature_f } = current.vitals;

    if (bp_systolic && bp_systolic >= 140) {
      changes.push(`Reported systolic blood pressure (${bp_systolic} mmHg) is in the elevated range.`);
      recommendations.push('Consider re-checking your blood pressure after 10 minutes of quiet rest. Share persistent elevations with your healthcare provider.');
    }
    if (temperature_f && temperature_f >= 100.4) {
      changes.push(`Reported body temperature (${temperature_f}°F) indicates a mild fever.`);
      recommendations.push('Rest, stay well hydrated, and monitor temperature progression. Seek medical attention if fever exceeds 103°F or lasts >3 days.');
    }
    if (blood_glucose_mgdl && blood_glucose_mgdl > 140) {
      changes.push(`Reported blood glucose (${blood_glucose_mgdl} mg/dL) is elevated relative to typical fasting values.`);
      recommendations.push('Review glucose patterns in relation to recent meal timing with your clinical team.');
    }
  }

  // Overall summary
  let stability = 'relatively stable';
  if (current.symptoms_reported.length > 1 || (current.energy_level && current.energy_level <= 2)) {
    stability = 'moderately varied, reflecting mild tiredness or symptoms';
  } else if (current.energy_level >= 4 && current.sleep_hours >= 7) {
    stability = 'well-balanced and positive';
  }

  const ai_summary = `Your reported health information appears ${stability}. ${vitalsNote}`;

  return {
    ai_summary: SafetyEngine.sanitizeAIOutput(ai_summary).sanitizedText,
    ai_changes: changes,
    ai_recommendations: recommendations
  };
}
