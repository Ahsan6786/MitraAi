
export interface ScreeningTool {
  id: string;
  name: string;
  full_name: string;
  purpose: string;
  questions_count: number;
  questions: { id: number; text: string; depressive_answer?: string }[];
  scoring_options: { value: number; label: string }[];
  interpretation: { range: string; severity: string; recommendation?: string; }[];
}

export const screeningToolsData = {
  "phq-9": {
    id: "phq-9",
    name: "PHQ-9",
    full_name: "Patient Health Questionnaire-9",
    purpose: "Depression screening",
    questions_count: 9,
    questions: [
      { id: 1, text: "Little interest or pleasure in doing things?" },
      { id: 2, text: "Feeling down, depressed, or hopeless?" },
      { id: 3, text: "Trouble falling or staying asleep, or sleeping too much?" },
      { id: 4, text: "Feeling tired or having little energy?" },
      { id: 5, text: "Poor appetite or overeating?" },
      { id: 6, text: "Feeling bad about yourself — or that you are a failure or have let yourself or your family down?" },
      { id: 7, text: "Trouble concentrating on things, such as reading the newspaper or watching television?" },
      { id: 8, text: "Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual?" },
      { id: 9, text: "Thoughts that you would be better off dead, or of hurting yourself in some way?" },
    ],
    scoring_options: [
      { value: 0, label: "Not at all" },
      { value: 1, label: "Several days" },
      { value: 2, label: "More than half the days" },
      { value: 3, label: "Nearly every day" },
    ],
    interpretation: [
      { range: "0-4", severity: "Minimal or no depression", recommendation: "No immediate concern. Maintain a healthy lifestyle." },
      { range: "5-9", severity: "Mild depression", recommendation: "Try self-help: daily exercise, meditation, journaling, hobbies, and social interaction." },
      { range: "10-14", severity: "Moderate depression", recommendation: "Consult a doctor or therapist. Self-help can support but professional advice is needed." },
      { range: "15-19", severity: "Moderately severe depression", recommendation: "Professional help is strongly recommended. Please consult a doctor or therapist." },
      { range: "20-27", severity: "Severe depression", recommendation: "Seek professional help immediately (psychiatrist/psychologist)." },
    ],
  },
  "gad-7": {
    id: "gad-7",
    name: "GAD-7",
    full_name: "Generalized Anxiety Disorder-7",
    purpose: "Anxiety screening",
    questions_count: 7,
    questions: [
      { id: 1, text: "Feeling nervous, anxious, or on edge?" },
      { id: 2, text: "Not being able to stop or control worrying?" },
      { id: 3, text: "Worrying too much about different things?" },
      { id: 4, text: "Trouble relaxing?" },
      { id: 5, text: "Being so restless that it is hard to sit still?" },
      { id: 6, text: "Becoming easily annoyed or irritable?" },
      { id: 7, text: "Feeling afraid as if something awful might happen?" },
    ],
    scoring_options: [
      { value: 0, label: "Not at all" },
      { value: 1, label: "Several days" },
      { value: 2, label: "More than half the days" },
      { value: 3, label: "Nearly every day" },
    ],
    interpretation: [
      { range: "0-4", severity: "Minimal anxiety", recommendation: "Your anxiety level appears to be within a normal range." },
      { range: "5-9", severity: "Mild anxiety", recommendation: "Consider incorporating relaxation techniques like mindfulness or deep breathing into your routine." },
      { range: "10-14", severity: "Moderate anxiety", recommendation: "It may be helpful to speak with a healthcare provider or a therapist about your symptoms." },
      { range: "15-21", severity: "Severe anxiety", recommendation: "It is highly recommended to seek professional help to manage your anxiety symptoms." },
    ],
  },
};

export type ScreeningToolId = keyof typeof screeningToolsData;
