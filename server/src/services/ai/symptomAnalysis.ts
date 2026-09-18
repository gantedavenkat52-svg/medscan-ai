import { PossibleCondition, SymptomAssessment, UrgencyLevel } from '../../types/index.js';
import { SafetyEngine } from '../safety/safetyEngine.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Embedded Clinical Knowledge Base for non-diagnostic educational fallback
const CLINICAL_KNOWLEDGE_BASE: Record<string, PossibleCondition[]> = {
  headache: [
    {
      condition_name: 'Tension-Type Headache',
      simple_explanation: 'A common type of headache causing diffuse, mild-to-moderate dull ache often described as a tight band around the head.',
      why_associated: 'Frequently linked to stress, screen-related eye strain, dehydration, or poor posture.',
      common_additional_symptoms: ['Neck and shoulder stiffness', 'Mild sensitivity to light or noise'],
      when_to_seek_care: 'If headache is sudden, severe ("worst headache of life"), or accompanied by high fever and stiff neck.'
    },
    {
      condition_name: 'Migraine without Aura',
      simple_explanation: 'A neurological condition characterized by throbbing or pulsing head discomfort, usually on one side of the head.',
      why_associated: 'Triggered by sensory stimuli, hormonal fluctuations, irregular sleep, or certain foods.',
      common_additional_symptoms: ['Nausea', 'Sensitivity to light (photophobia) and sound', 'Visual disturbances'],
      when_to_seek_care: 'If accompanied by neurological deficits, sudden vision loss, or confusion.'
    }
  ],
  fever: [
    {
      condition_name: 'Common Viral Upper Respiratory Tract Infection',
      simple_explanation: 'A self-limited viral infection of the nose, throat, or airways.',
      why_associated: 'The body raises its core temperature as an active immunological response to viral presence.',
      common_additional_symptoms: ['Runny or congested nose', 'Sore throat', 'Mild body aches', 'Fatigue'],
      when_to_seek_care: 'If fever exceeds 103°F (39.4°C), lasts more than 3 consecutive days, or causes shortness of breath.'
    }
  ],
  cough: [
    {
      condition_name: 'Acute Bronchial Irritation / Post-Viral Cough',
      simple_explanation: 'Inflammation of the airways following a cold or exposure to environmental irritants (smoke, dry air).',
      why_associated: 'Cough reflex remains hypersensitive while airway mucosal lining heals.',
      common_additional_symptoms: ['Throat tickle', 'Clear or whitish phlegm', 'Chest soreness from coughing'],
      when_to_seek_care: 'If coughing produces blood, causes wheezing or chest tightness, or persists longer than 3 weeks.'
    },
    {
      condition_name: 'Allergic Rhinitis with Post-Nasal Drip',
      simple_explanation: 'Allergic inflammation of nasal passages causing mucus to drip down the back of the throat.',
      why_associated: 'Post-nasal drainage irritates the vocal cords and pharynx, triggering throat clearing and dry cough.',
      common_additional_symptoms: ['Sneezing', 'Itchy, watery eyes', 'Nasal congestion'],
      when_to_seek_care: 'If symptoms interfere with breathing or do not respond to basic allergen avoidance.'
    }
  ],
  fatigue: [
    {
      condition_name: 'Lifestyle-Related Fatigue or Sleep Disruption',
      simple_explanation: 'A state of persistent tiredness resulting from inadequate sleep quality, high mental workload, or physical stress.',
      why_associated: 'Without deep restorative sleep stages, cellular and cognitive recovery is compromised.',
      common_additional_symptoms: ['Brain fog', 'Reduced stamina', 'Mood irritability'],
      when_to_seek_care: 'If fatigue remains debilitating despite good sleep, or occurs with unintended weight changes or swollen lymph nodes.'
    },
    {
      condition_name: 'Nutritional Insufficiency (e.g., Vitamin D or Iron Deficiency)',
      simple_explanation: 'Lower levels of essential micronutrients needed for cellular energy metabolism and oxygen delivery.',
      why_associated: 'Commonly manifests as lingering daytime tiredness and reduced physical endurance.',
      common_additional_symptoms: ['Pale skin', 'Brittle nails', 'Occasional lightheadedness'],
      when_to_seek_care: 'Consult a healthcare professional for targeted blood testing (such as Ferritin, CBC, or Vitamin D levels).'
    }
  ],
  nausea: [
    {
      condition_name: 'Acute Gastric Irritation or Viral Gastroenteritis',
      simple_explanation: 'Temporary inflammation of the stomach lining caused by viral agents or irritating foods.',
      why_associated: 'Triggers the vomiting center in the brainstem and reduces normal stomach motility.',
      common_additional_symptoms: ['Abdominal cramping', 'Loss of appetite', 'Occasional loose stools'],
      when_to_seek_care: 'If unable to keep fluids down for >24 hours, or if accompanied by high fever or severe localized abdominal pain.'
    }
  ],
  back_pain: [
    {
      condition_name: 'Acute Lumbar Muscular Strain',
      simple_explanation: 'Stretching or micro-tearing of muscle fibers or tendons in the lower back from lifting, twisting, or prolonged sitting.',
      why_associated: 'Directly accounts for localized lower back ache and stiffness aggravated by bending.',
      common_additional_symptoms: ['Muscle spasms', 'Tenderness to touch', 'Stiffness when standing'],
      when_to_seek_care: 'If pain radiates down past the knee, causes numbness/weakness in legs, or affects bowel/bladder control (emergency).'
    }
  ]
};

export async function analyzeSymptoms(
  userId: string,
  symptoms: string[],
  context: {
    age_range?: string;
    duration?: string;
    severity?: number;
    onset?: string;
    existing_conditions?: string[];
    medications?: string[];
  },
  geminiApiKey?: string
): Promise<SymptomAssessment> {
  // Step 1: Immediate Medical Safety Engine Evaluation
  const emergencyCheck = SafetyEngine.checkEmergency(symptoms, JSON.stringify(context));

  if (emergencyCheck.isEmergency) {
    return {
      id: `symp-${Date.now()}`,
      user_id: userId,
      symptoms,
      context,
      symptom_summary: `Reported symptoms: ${symptoms.join(', ')}`,
      urgency: 'urgent',
      red_flags_detected: emergencyCheck.matchedRedFlags,
      possible_conditions: [
        {
          condition_name: 'Potentially Urgent Clinical Situation',
          simple_explanation: 'Your reported symptoms match red-flag indicators that require prompt, direct medical examination by healthcare professionals.',
          why_associated: emergencyCheck.matchedRedFlags.join('; '),
          common_additional_symptoms: ['Diaphoresis (sweating)', 'Sudden weakness', 'Severe acute distress'],
          when_to_seek_care: 'IMMEDIATELY. Call 911 in the United States or your local emergency number, or proceed to the nearest emergency department.'
        }
      ],
      recommendations: [
        'Call 911 in the United States or your local emergency number immediately.',
        'Do not drive yourself to the hospital if experiencing acute symptoms; request an ambulance.',
        'Do not wait to see if symptoms improve on their own.'
      ],
      disclaimer: SafetyEngine.MANDATORY_DISCLAIMER,
      created_at: new Date().toISOString()
    };
  }

  const urgency = SafetyEngine.calculateUrgency(symptoms, context.severity, context.duration);

  // Step 2: Try Gemini API if key is available
  if (geminiApiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `You are the MedScan AI health information service. You provide purely educational information.
CRITICAL MANDATE:
- You are NOT a diagnostic tool and MUST NOT claim that a user has a disease.
- Never use phrasing like "You have X". Instead use "Possible conditions associated with these symptoms include..."
- Never prescribe medication or specific drug dosages.
- Always be conservative and safety-oriented.

Analyze these user-reported symptoms and context:
Symptoms: ${JSON.stringify(symptoms)}
Context: ${JSON.stringify(context)}

Respond ONLY with valid JSON in this exact structure:
{
  "symptom_summary": "Brief factual summary of user reported symptoms",
  "possible_conditions": [
    {
      "condition_name": "Name of possible condition",
      "simple_explanation": "Plain language explanation",
      "why_associated": "Why it might correlate with these symptoms",
      "common_additional_symptoms": ["symptom 1", "symptom 2"],
      "when_to_seek_care": "When professional care is indicated"
    }
  ],
  "recommendations": [
    "Educational next step 1",
    "Educational next step 2"
  ]
}`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      // Extract JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        // Run output through Safety Sanitizer
        const sanitizedSummary = SafetyEngine.sanitizeAIOutput(parsed.symptom_summary).sanitizedText;
        const sanitizedConditions: PossibleCondition[] = (parsed.possible_conditions || []).map((c: any) => ({
          condition_name: SafetyEngine.sanitizeAIOutput(c.condition_name).sanitizedText,
          simple_explanation: SafetyEngine.sanitizeAIOutput(c.simple_explanation).sanitizedText,
          why_associated: SafetyEngine.sanitizeAIOutput(c.why_associated).sanitizedText,
          common_additional_symptoms: c.common_additional_symptoms || [],
          when_to_seek_care: SafetyEngine.sanitizeAIOutput(c.when_to_seek_care).sanitizedText
        }));

        return {
          id: `symp-${Date.now()}`,
          user_id: userId,
          symptoms,
          context,
          symptom_summary: sanitizedSummary,
          urgency,
          red_flags_detected: [],
          possible_conditions: sanitizedConditions,
          recommendations: parsed.recommendations || [
            'Monitor symptom progression over the next 24-48 hours.',
            'Keep a record of any newly developing symptoms.',
            'Consider consulting a qualified healthcare professional for a personalized clinical evaluation.'
          ],
          disclaimer: SafetyEngine.MANDATORY_DISCLAIMER,
          created_at: new Date().toISOString()
        };
      }
    } catch (apiError) {
      console.warn('Gemini API call unsuccessful, falling back to Clinical Knowledge Engine:', apiError);
    }
  }

  // Step 3: Clinical Knowledge Base Fallback
  const matchedConditions: PossibleCondition[] = [];
  const symptomsText = symptoms.join(' ').toLowerCase();

  for (const [key, conditions] of Object.entries(CLINICAL_KNOWLEDGE_BASE)) {
    if (symptomsText.includes(key.replace('_', ' '))) {
      matchedConditions.push(...conditions);
    }
  }

  if (matchedConditions.length === 0) {
    matchedConditions.push({
      condition_name: 'Nonspecific Mild Clinical Symptoms',
      simple_explanation: 'Many symptoms can occur temporarily due to physical fatigue, ambient temperature shifts, stress, or mild immune responses.',
      why_associated: 'Correlates with reported symptoms without specific systemic patterns.',
      common_additional_symptoms: ['Mild malaise', 'Temporary energy fluctuations'],
      when_to_seek_care: 'If symptoms persist beyond 5 to 7 days or increase in severity.'
    });
  }

  const recommendations = [
    'Ensure adequate rest and maintain regular oral fluid intake.',
    'Note down when symptoms occur, their intensity, and any factors that alleviate or worsen them.',
    'Consider consulting a primary care physician if symptoms persist or interfere with daily activities.',
    'Seek immediate medical care if you develop high fever, severe unmanageable pain, or difficulty breathing.'
  ];

  return {
    id: `symp-${Date.now()}`,
    user_id: userId,
    symptoms,
    context,
    symptom_summary: `Reported symptoms: ${symptoms.join(', ')} (${context.duration || 'recent onset'}, severity ${context.severity || 4}/10)`,
    urgency,
    red_flags_detected: [],
    possible_conditions: matchedConditions.slice(0, 3),
    recommendations,
    disclaimer: SafetyEngine.MANDATORY_DISCLAIMER,
    created_at: new Date().toISOString()
  };
}
