import { GoogleGenerativeAI } from '@google/generative-ai';
import { SafetyEngine } from '../safety/safetyEngine.js';

const EDUCATIONAL_QA_FALLBACK: Array<{
  keywords: string[];
  answer: string;
}> = [
  {
    keywords: ['hba1c', 'a1c', 'glycated hemoglobin'],
    answer: `**What is an HbA1c test?**\n\nHbA1c (Hemoglobin A1c or glycated hemoglobin) is a routine blood test that measures your average blood sugar (glucose) levels over the past 2 to 3 months.\n\n**How does it work?**\nWhen glucose circulates in your blood, some of it naturally binds to hemoglobin—the oxygen-carrying protein inside red blood cells. Because red blood cells live for approximately 90 to 120 days, measuring the percentage of hemoglobin with attached glucose gives a reliable picture of medium-term blood sugar balance, rather than just a single moment in time.\n\n**Typical clinical reference intervals:**\n• **Normal:** Below 5.7%\n• **Prediabetes range:** 5.7% to 6.4%\n• **Diabetes threshold:** 6.5% or higher on two separate tests\n\n*Note: Laboratories may use slightly different reference ranges, and target goals can vary based on individual age and health history. Always discuss your results with your physician.*`
  },
  {
    keywords: ['cbc', 'complete blood count'],
    answer: `**What is a Complete Blood Count (CBC)?**\n\nA Complete Blood Count (CBC) is one of the most widely ordered blood tests in medicine. It evaluates the cells circulating in your bloodstream.\n\n**Key components evaluated:**\n1. **Red Blood Cells (RBC) & Hemoglobin:** Carry oxygen from lungs to body tissues.\n2. **Hematocrit:** The proportion of red blood cells in your total blood volume.\n3. **White Blood Cells (WBC):** Support your immune defense against bacteria, viruses, and inflammation.\n4. **Platelets:** Crucial for blood clotting and wound healing.\n\n**Why is it ordered?**\nDoctors order a CBC for routine health checkups, to investigate symptoms like fatigue, weakness, or unexplained bruising, or to monitor responses to medical treatments.`
  },
  {
    keywords: ['headache', 'causes of headache', 'what causes a headache'],
    answer: `**Common Causes of Headaches (Educational Overview):**\n\nHeadaches are very common and can arise from numerous everyday physiological factors:\n\n1. **Tension & Muscular Strain:** The most common variety, often caused by sustained desk posture, stress, lack of sleep, or digital screen eye fatigue.\n2. **Dehydration or Skipped Meals:** When fluid balance or blood sugar dips, head pain can be an early signal.\n3. **Caffeine Changes:** Missing a usual morning coffee or consuming excessive caffeine can both provoke headaches.\n4. **Sinus & Allergy Irritation:** Inflammation of facial sinus cavities due to weather or seasonal allergens.\n5. **Migraine:** A neurological pattern involving throbbing pain, light sensitivity, or nausea.\n\n**When to seek urgent medical care:**\nSeek emergency care if a headache is sudden and explosively severe ("worst headache of life"), comes on after head trauma, or is accompanied by high fever, stiff neck, confusion, weakness, or trouble speaking.`
  },
  {
    keywords: ['cholesterol', 'high cholesterol', 'ldl', 'lipid'],
    answer: `**Understanding Cholesterol & Lipid Panels:**\n\nCholesterol is a waxy, fat-like substance that your body needs to build healthy cell membranes, produce vitamin D, and make essential hormones.\n\n**Key types:**\n• **LDL (Low-Density Lipoprotein):** Often called "bad" cholesterol because elevated levels over years can slowly deposit inside arterial walls.\n• **HDL (High-Density Lipoprotein):** Often called "good" cholesterol because it carries excess cholesterol back to your liver to be eliminated.\n• **Triglycerides:** A type of fat stored in fat cells used for energy between meals.\n\n**General Next Steps:**\nElevated cholesterol is managed through heart-healthy nutrition, physical activity, and medical therapies prescribed by a physician. Talk with your doctor to review your complete cardiovascular risk profile.`
  },
  {
    keywords: ['what should i ask my doctor', 'questions for doctor', 'questions to ask doctor', 'ask doctor'],
    answer: `**Helpful Questions to Ask Your Doctor:**\n\nWhen reviewing symptoms, lab tests, or a new treatment plan, consider taking these questions to your visit:\n\n1. **About Your Symptoms / Lab Results:**\n   • *"What do my specific test numbers mean in the context of my overall health?"*\n   • *"Are any of these findings outside standard ranges, and what might be causing that?"*\n   • *"Do you recommend repeating this test or doing any follow-up imaging?"*\n\n2. **About Next Steps & Lifestyle:**\n   • *"Are there specific nutrition, sleep, or exercise adjustments that could help?"*\n   • *"What warning signs or symptoms should prompt me to contact your office right away?"*\n   • *"When would you like to schedule our next follow-up appointment?"*`
  }
];

export async function askAssistant(
  userId: string,
  userMessage: string,
  geminiApiKey?: string
): Promise<{
  answer: string;
  isEmergency: boolean;
  disclaimer: string;
}> {
  // Step 1: Safety engine emergency check
  const emergencyCheck = SafetyEngine.checkEmergency([], userMessage);
  if (emergencyCheck.isEmergency) {
    return {
      answer: `⚠️ **Urgent Medical Notice**\n\n${emergencyCheck.emergencyMessage}\n\n**Identified concern:** ${emergencyCheck.matchedRedFlags.join(', ')}.\n\nPlease do not rely on an AI chat assistant for acute or potentially life-threatening symptoms. Call 911 in the United States or your local emergency number now.`,
      isEmergency: true,
      disclaimer: SafetyEngine.MANDATORY_DISCLAIMER
    };
  }

  // Step 2: Try Gemini API if key is available
  if (geminiApiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `You are MedScan Assistant, an AI health-information and education assistant.
CRITICAL SAFETY & CLINICAL RULES:
1. Explain medical terminology in simple, friendly, accessible language.
2. Provide general educational health information ONLY.
3. NEVER diagnose the user with any medical condition (never say "You have X" or "This means you suffer from X").
4. NEVER prescribe medication, recommend specific prescription dosages, or advise altering prescribed treatments.
5. Encourage appropriate consultation with a qualified healthcare professional.
6. Ask thoughtful clarifying questions when helpful.
7. If the user asks about an emergency symptom, immediately direct them to emergency services.

User question: "${userMessage}"`;

      const result = await model.generateContent(prompt);
      const rawAnswer = result.response.text();

      // Sanitize output
      const sanitized = SafetyEngine.sanitizeAIOutput(rawAnswer).sanitizedText;

      return {
        answer: sanitized,
        isEmergency: false,
        disclaimer: SafetyEngine.MANDATORY_DISCLAIMER
      };
    } catch (err) {
      console.warn('Gemini Assistant call failed, using clinical QA fallback:', err);
    }
  }

  // Step 3: Clinical QA Fallback
  const lower = userMessage.toLowerCase();
  for (const item of EDUCATIONAL_QA_FALLBACK) {
    if (item.keywords.some(kw => lower.includes(kw))) {
      return {
        answer: item.answer,
        isEmergency: false,
        disclaimer: SafetyEngine.MANDATORY_DISCLAIMER
      };
    }
  }

  // General fallback response
  return {
    answer: `Thank you for your question. As MedScan Assistant, I provide educational health information to help you understand medical concepts and prepare for clinical visits.\n\nRegarding your question about "${userMessage.slice(0, 80)}":\n\nMedical markers, symptoms, and physiological terms are always best evaluated in the context of an individual's personal health history, age, medications, and physical exam findings. A symptom or test value that is typical for one person may require closer review in another.\n\n**Suggested Next Steps:**\n• Take note of any specific symptoms, when they began, and how frequently they occur.\n• Bring your questions and recent lab reports to your primary care physician or specialist.\n• If you are experiencing sudden, severe, or worsening pain or difficulty breathing, please seek immediate medical evaluation.`,
    isEmergency: false,
    disclaimer: SafetyEngine.MANDATORY_DISCLAIMER
  };
}
