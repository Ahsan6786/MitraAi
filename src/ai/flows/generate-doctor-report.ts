
'use server';

/**
 * @fileOverview A flow for generating a professional doctor's report based on a user's journal entry.
 *
 * - generateDoctorReport - A function that creates a draft report.
 * - GenerateDoctorReportInput - The input type for the function.
 * - GenerateDoctorReportOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateDoctorReportInputSchema = z.object({
  entry: z.string().describe("The user's journal entry content or transcription."),
  mood: z.string().describe("The AI-detected mood for the entry."),
});
export type GenerateDoctorReportInput = z.infer<typeof GenerateDoctorReportInputSchema>;

const GenerateDoctorReportOutputSchema = z.object({
  report: z.string().describe("A professionally toned draft report for a doctor to review."),
});
export type GenerateDoctorReportOutput = z.infer<typeof GenerateDoctorReportOutputSchema>;

export async function generateDoctorReport(input: GenerateDoctorReportInput): Promise<GenerateDoctorReportOutput> {
  return generateDoctorReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDoctorReportPrompt',
  input: { schema: GenerateDoctorReportInputSchema },
  output: { schema: GenerateDoctorReportOutputSchema },
  prompt: `You are a medical assistant helping a doctor write a summary and feedback for a patient's journal entry.
  
  The user's journal entry is:
  "{{{entry}}}"

  The AI-detected mood for this entry is: "{{mood}}".

  Based on the entry and mood, write a brief, empathetic, and professional report. The report should:
  1. Acknowledge the user's feelings.
  2. Provide gentle observations or insights.
  3. Suggest one or two simple, actionable steps or coping strategies.
  4. Maintain a supportive and clinical tone.
  
  Do not diagnose. The report is for the patient to see.
  `,
});

const generateDoctorReportFlow = ai.defineFlow(
  {
    name: 'generateDoctorReportFlow',
    inputSchema: GenerateDoctorReportInputSchema,
    outputSchema: GenerateDoctorReportOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
