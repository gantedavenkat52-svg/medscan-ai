import { LabReport, LabResult } from '../../types/index.js';
import { SafetyEngine } from '../safety/safetyEngine.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Standard clinical test definitions for explanation and possible causes
export const TEST_ENCYCLOPEDIA: Record<string, {
  explanation: string;
  defaultUnit: string;
  defaultRange: string;
  highReasons: string[];
  lowReasons: string[];
}> = {
  'Hemoglobin': {
    explanation: 'A protein in red blood cells that carries oxygen from the lungs to the rest of the body.',
    defaultUnit: 'g/dL',
    defaultRange: '12.0 - 15.5 g/dL',
    highReasons: ['Dehydration', 'Living at high altitude', 'Smoking', 'Bone marrow overproduction'],
    lowReasons: ['Iron deficiency', 'Blood loss', 'Vitamin B12 or folate deficiency', 'Chronic kidney disease']
  },
  'White Blood Cell Count (WBC)': {
    explanation: 'Cells of the immune system that defend the body against infections, inflammation, and foreign pathogens.',
    defaultUnit: 'x10^3/uL',
    defaultRange: '4.5 - 11.0 x10^3/uL',
    highReasons: ['Infection (bacterial or viral)', 'Physical or emotional stress', 'Inflammation', 'Certain medications'],
    lowReasons: ['Viral infections', 'Autoimmune conditions', 'Bone marrow issues', 'Medication side effects']
  },
  'Platelets': {
    explanation: 'Tiny blood cell fragments that form clots to stop bleeding when blood vessels are damaged.',
    defaultUnit: 'x10^3/uL',
    defaultRange: '150 - 450 x10^3/uL',
    highReasons: ['Recent surgery or injury', 'Iron deficiency anemia', 'Chronic inflammation', 'Infection'],
    lowReasons: ['Viral illness', 'Immune-mediated destruction', 'Enlarged spleen', 'Nutritional deficiencies']
  },
  'Fasting Blood Glucose': {
    explanation: 'The concentration of glucose (sugar) circulating in blood after fasting, indicating how the body regulates energy.',
    defaultUnit: 'mg/dL',
    defaultRange: '70 - 99 mg/dL',
    highReasons: ['Insulin resistance / prediabetes', 'Recent meal consumption', 'Acute physical stress or illness', 'Steroid medications'],
    lowReasons: ['Prolonged fasting / skipped meals', 'Intense physical exertion', 'Medication effect']
  },
  'HbA1c': {
    explanation: 'Glycated hemoglobin reflects average blood glucose levels over the preceding 2 to 3 months.',
    defaultUnit: '%',
    defaultRange: '< 5.7 %',
    highReasons: ['Extended periods of elevated blood sugar', 'Altered insulin sensitivity', 'Lifestyle or dietary patterns'],
    lowReasons: ['Recent blood loss', 'Hemoglobin variants', 'Hemolytic anemia']
  },
  'Total Cholesterol': {
    explanation: 'A lipid substance produced by the liver and obtained through food, essential for cell membranes and hormones.',
    defaultUnit: 'mg/dL',
    defaultRange: '< 200 mg/dL',
    highReasons: ['Diet rich in saturated fats', 'Genetic factors', 'Sedentary habits', 'Thyroid underactivity'],
    lowReasons: ['Malnutrition', 'Liver disease', 'Hyperthyroidism']
  },
  'HDL Cholesterol ("Good")': {
    explanation: 'High-Density Lipoprotein sweeps cholesterol away from blood vessels back to the liver for clearance.',
    defaultUnit: 'mg/dL',
    defaultRange: '> 40 mg/dL (M) / > 50 mg/dL (F)',
    highReasons: ['Aerobic exercise', 'Healthy unsaturated fat intake', 'Favorable genetics'],
    lowReasons: ['Sedentary lifestyle', 'Smoking', 'Metabolic syndrome', 'High triglyceride levels']
  },
  'LDL Cholesterol ("Bad")': {
    explanation: 'Low-Density Lipoprotein delivers cholesterol to peripheral tissues; elevated levels over years may accumulate in arteries.',
    defaultUnit: 'mg/dL',
    defaultRange: '< 100 mg/dL',
    highReasons: ['Saturated and trans-fat consumption', 'Familial hypercholesterolemia', 'Low physical activity'],
    lowReasons: ['Nutritional deficits', 'Severe illness']
  },
  'Serum Creatinine': {
    explanation: 'A normal waste product of daily muscle turnover that is filtered and eliminated entirely by healthy kidneys.',
    defaultUnit: 'mg/dL',
    defaultRange: '0.6 - 1.2 mg/dL',
    highReasons: ['Dehydration', 'Heavy protein/creatine intake', 'Reduced renal filtration capacity', 'Intense exercise'],
    lowReasons: ['Low muscle mass', 'Severe malnutrition']
  },
  '25-Hydroxy Vitamin D': {
    explanation: 'The circulating form of Vitamin D, essential for bone mineralization, calcium balance, and immune regulation.',
    defaultUnit: 'ng/mL',
    defaultRange: '30.0 - 100.0 ng/mL',
    highReasons: ['Excessive high-dose supplementation'],
    lowReasons: ['Limited sunlight exposure', 'Low dietary intake of fatty fish/dairy', 'Absorption difficulties']
  },
  'Thyroid Stimulating Hormone (TSH)': {
    explanation: 'A hormone secreted by the pituitary gland directing the thyroid gland how much thyroxine to produce.',
    defaultUnit: 'uIU/mL',
    defaultRange: '0.4 - 4.0 uIU/mL',
    highReasons: ['Underactive thyroid (hypothyroidism)', 'Recovery from illness', 'Medication interactions'],
    lowReasons: ['Overactive thyroid (hyperthyroidism)', 'Pituitary dysfunction', 'High thyroid hormone supplementation']
  }
};

export async function interpretLabReport(
  rawResults: Array<{
    test_name: string;
    result_value: string | number;
    unit?: string;
    reference_range?: string;
  }>,
  labName: string = 'Diagnostic Laboratory',
  reportType: string = 'General Panel',
  ocrConfidence: number = 95.0,
  geminiApiKey?: string
): Promise<{
  report_type: string;
  lab_name: string;
  ocr_confidence: number;
  is_low_confidence: boolean;
  overall_summary: string;
  results: LabResult[];
}> {
  const is_low_confidence = ocrConfidence < 75.0;
  const processedResults: LabResult[] = [];

  for (const item of rawResults) {
    const canonicalKey = Object.keys(TEST_ENCYCLOPEDIA).find(k =>
      k.toLowerCase() === item.test_name.toLowerCase() ||
      item.test_name.toLowerCase().includes(k.toLowerCase())
    ) || item.test_name;

    const encyclopediaEntry = TEST_ENCYCLOPEDIA[canonicalKey];

    const unit = item.unit || encyclopediaEntry?.defaultUnit || '';
    const refRange = item.reference_range || encyclopediaEntry?.defaultRange || 'Laboratory reference range';
    const numVal = parseFloat(String(item.result_value).replace(/[^0-9.]/g, ''));

    // Determine status relative to reference range
    let status: 'within_range' | 'review' = 'within_range';
    let isHigh = false;
    let isLow = false;

    // Simple parser for standard range formats like "70 - 99", "< 200", "> 50"
    if (!isNaN(numVal)) {
      if (refRange.includes('-')) {
        const parts = refRange.split('-').map(p => parseFloat(p.trim().replace(/[^0-9.]/g, '')));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          if (numVal < parts[0]) {
            status = 'review';
            isLow = true;
          } else if (numVal > parts[1]) {
            status = 'review';
            isHigh = true;
          }
        }
      } else if (refRange.includes('<')) {
        const upper = parseFloat(refRange.replace(/[^0-9.]/g, ''));
        if (!isNaN(upper) && numVal > upper) {
          status = 'review';
          isHigh = true;
        }
      } else if (refRange.includes('>')) {
        const lower = parseFloat(refRange.replace(/[^0-9.]/g, ''));
        if (!isNaN(lower) && numVal < lower) {
          status = 'review';
          isLow = true;
        }
      }
    }

    const testExplanation = encyclopediaEntry?.explanation ||
      `This laboratory test evaluates ${item.test_name} levels in the sample.`;

    const generalInterpretation = status === 'within_range'
      ? `Your reported value of ${item.result_value} ${unit} is within the reference range shown on this report (${refRange}).`
      : `Your reported value of ${item.result_value} ${unit} is outside the reference range shown on this report (${refRange}).`;

    const possibleReasons = encyclopediaEntry
      ? (isHigh ? encyclopediaEntry.highReasons : (isLow ? encyclopediaEntry.lowReasons : ['Standard physiological variation', 'Individual baseline differences']))
      : ['Individual baseline physiological variations', 'Recent diet, hydration, or activity level', 'Clinical conditions evaluated by a physician'];

    const suggestedNextStep = status === 'within_range'
      ? 'Continue maintaining your general wellness routines and repeat routine testing as recommended by your doctor.'
      : 'Consider discussing this result with your healthcare professional. Laboratory values are interpreted alongside your medical history, symptoms, and other diagnostic findings.';

    processedResults.push({
      id: `res-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      lab_report_id: '',
      test_name: canonicalKey,
      result_value: item.result_value,
      unit,
      reference_range: refRange,
      status,
      test_explanation: testExplanation,
      general_interpretation: generalInterpretation,
      possible_reasons: possibleReasons,
      suggested_next_step: suggestedNextStep
    });
  }

  const reviewCount = processedResults.filter(r => r.status === 'review').length;
  const overallSummary = reviewCount === 0
    ? `All ${processedResults.length} analyzed laboratory markers fall within the printed reference ranges on this report.`
    : `${processedResults.length} laboratory markers were analyzed. ${reviewCount} marker(s) fall outside the printed reference ranges shown on this report. Abnormal values have multiple causes and should be evaluated by a healthcare professional in clinical context.`;

  return {
    report_type: reportType,
    lab_name: labName,
    ocr_confidence: ocrConfidence,
    is_low_confidence,
    overall_summary: overallSummary,
    results: processedResults
  };
}
