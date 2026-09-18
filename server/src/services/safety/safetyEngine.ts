import { UrgencyLevel } from '../../types/index.js';

export interface EmergencyCheckResult {
  isEmergency: boolean;
  matchedRedFlags: string[];
  emergencyMessage?: string;
}

export interface SanitizedAIResponse {
  sanitizedText: string;
  hadDiagnosticClaims: boolean;
  hadPrescriptionClaims: boolean;
}

export class SafetyEngine {
  private static EMERGENCY_PATTERNS = [
    {
      regex: /(chest\s+(pain|tightness|pressure|discomfort|squeezing)|pain\s+radiating\s+to\s+(left\s+arm|jaw|back|neck))/i,
      flag: 'Acute Chest Discomfort / Potential Cardiac Event'
    },
    {
      regex: /(difficulty\s+breathing|can't\s+breathe|cannot\s+breathe|shortness\s+of\s+breath|severe\s+gasping|turning\s+blue)/i,
      flag: 'Acute Respiratory Distress'
    },
    {
      regex: /(face\s+droop|slurred\s+speech|speech\s+difficulty|arm\s+numbness\s+one\s+side|sudden\s+weakness\s+one\s+side|facial\s+paralysis)/i,
      flag: 'Possible Acute Stroke Signs (FAST)'
    },
    {
      regex: /(passed\s+out|lost\s+consciousness|unconscious|fainted\s+and\s+hit\s+head|seizure\s+for\s+the\s+first\s+time|convulsion)/i,
      flag: 'Loss of Consciousness / Seizure'
    },
    {
      regex: /(worst\s+headache\s+of\s+my\s+life|thunderclap\s+headache|sudden\s+severe\s+explosive\s+headache)/i,
      flag: 'Thunderclap Headache / Possible Intracranial Event'
    },
    {
      regex: /(throat\s+closing|swelling\s+of\s+(tongue|lips|throat)|anaphylax|hives\s+and\s+wheezing)/i,
      flag: 'Severe Allergic Reaction / Anaphylaxis'
    },
    {
      regex: /(coughing\s+up\s+blood|vomiting\s+blood|blood\s+in\s+vomit|uncontrolled\s+bleeding|gushing\s+blood)/i,
      flag: 'Severe Acute Bleeding / Hemorrhage'
    },
    {
      regex: /(kill\s+myself|commit\s+suicide|end\s+my\s+life|suicidal\s+thoughts|want\s+to\s+die)/i,
      flag: 'Crisis / Mental Health Emergency'
    },
    {
      regex: /(stiff\s+neck\s+with\s+(high\s+)?fever|neck\s+stiffness\s+and\s+confusion|inability\s+to\s+touch\s+chin\s+to\s+chest\s+with\s+fever)/i,
      flag: 'Meningeal Signs / Potential Central Nervous System Infection'
    }
  ];

  public static MANDATORY_DISCLAIMER =
    'This information is educational and does not constitute a medical diagnosis. A qualified healthcare professional should evaluate your symptoms.';

  public static EMERGENCY_PROMPT_ALERT =
    'Your reported symptoms may require urgent medical evaluation. In the United States, call 911. Elsewhere, call your local emergency number or go to the nearest emergency department immediately. Do not wait for an online assessment.';

  /**
   * Evaluates symptoms and context to check for emergency red flags
   */
  public static checkEmergency(symptoms: string[], textContext: string = ''): EmergencyCheckResult {
    const combinedText = [...symptoms, textContext].join(' ');
    const matchedRedFlags: string[] = [];

    for (const item of this.EMERGENCY_PATTERNS) {
      if (item.regex.test(combinedText)) {
        matchedRedFlags.push(item.flag);
      }
    }

    if (matchedRedFlags.length > 0) {
      return {
        isEmergency: true,
        matchedRedFlags,
        emergencyMessage: this.EMERGENCY_PROMPT_ALERT
      };
    }

    return {
      isEmergency: false,
      matchedRedFlags: []
    };
  }

  /**
   * Determines conservative urgency based on symptoms, severity, and context
   */
  public static calculateUrgency(
    symptoms: string[],
    severity?: number,
    duration?: string,
    redFlags: string[] = []
  ): UrgencyLevel {
    if (redFlags.length > 0) {
      return 'urgent';
    }

    // High severity (>= 8/10) automatically warrants professional consult
    if (severity && severity >= 8) {
      return 'consult';
    }

    const text = (symptoms.join(' ') + ' ' + (duration || '')).toLowerCase();

    // Consult indicators
    const consultIndicators = [
      'fever', 'persistent', 'worsening', 'weeks', 'months', 'lump',
      'unexplained weight loss', 'blood', 'dizziness', 'fainting',
      'severe', 'vision changes', 'blurred vision', 'infection'
    ];

    const hasConsultIndicator = consultIndicators.some(kw => text.includes(kw));

    if (hasConsultIndicator || (severity && severity >= 5)) {
      return 'consult';
    }

    return 'routine';
  }

  /**
   * Sanitizes output text to prevent diagnostic claims and illegal prescription advice
   */
  public static sanitizeAIOutput(text: string): SanitizedAIResponse {
    let sanitizedText = text;
    let hadDiagnosticClaims = false;
    let hadPrescriptionClaims = false;

    // Replace definitive diagnostic statements
    const diagnosticReplacements: [RegExp, string][] = [
      [/you\s+have\s+([a-zA-Z\s]{3,30})/gi, 'symptoms may be associated with $1'],
      [/you\s+are\s+suffering\s+from\s+([a-zA-Z\s]{3,30})/gi, 'symptoms are sometimes observed in $1'],
      [/our\s+diagnosis\s+is\s+([a-zA-Z\s]{3,30})/gi, 'a possible condition for clinical review is $1'],
      [/diagnosed\s+with\s+([a-zA-Z\s]{3,30})/gi, 'evaluated for $1'],
      [/the\s+disease\s+you\s+have\s+is\s+([a-zA-Z\s]{3,30})/gi, 'a possible consideration is $1']
    ];

    for (const [pattern, replacement] of diagnosticReplacements) {
      if (pattern.test(sanitizedText)) {
        hadDiagnosticClaims = true;
        sanitizedText = sanitizedText.replace(pattern, replacement);
      }
    }

    // Intercept prescriptive phrasing
    const prescriptionReplacements: [RegExp, string][] = [
      [/take\s+(\d+\s*mg|\d+\s*tablets?)\s+of\s+([a-zA-Z]+)/gi, 'discuss potential medications such as $2 with your physician'],
      [/i\s+prescribe\s+([a-zA-Z\s]+)/gi, 'a healthcare provider may evaluate treatments such as $1'],
      [/stop\s+taking\s+your\s+([a-zA-Z\s]+)/gi, 'consult your doctor before making any adjustments to your $1']
    ];

    for (const [pattern, replacement] of prescriptionReplacements) {
      if (pattern.test(sanitizedText)) {
        hadPrescriptionClaims = true;
        sanitizedText = sanitizedText.replace(pattern, replacement);
      }
    }

    return {
      sanitizedText,
      hadDiagnosticClaims,
      hadPrescriptionClaims
    };
  }
}
