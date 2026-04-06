import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { toast } from 'react-toastify';
import type { IRequirement } from '../Interfaces/types';
import { reqFields } from '../pages/Marketing/Requirements/requirementsValues';
import { generatePayLoadFromPrompt } from '../services/requirementApi';

const ARRAY_FIELDS = new Set<keyof IRequirement>([
  'rate',
  'taxType',
  'remote',
  'duration',
]);

function pickExtractedRequirementFields(
  raw: Record<string, unknown>
): Partial<IRequirement> {
  const out: Partial<IRequirement> = {};
  for (const key of reqFields) {
    if (key === 'interviews') continue;
    const v = raw[key as string];
    if (v === undefined || v === null) continue;
    if (ARRAY_FIELDS.has(key)) {
      (out as Record<string, unknown>)[key as string] = Array.isArray(v)
        ? v
        : [String(v)];
    } else if (key === 'mComment' && Array.isArray(v)) {
      (out as Record<string, unknown>)[key as string] = v;
    } else if (
      typeof v === 'string' ||
      typeof v === 'number' ||
      typeof v === 'boolean'
    ) {
      (out as Record<string, unknown>)[key as string] = v;
    }
  }
  const emp = raw.employementType ?? raw.employmentType;
  if (emp != null && typeof emp === 'string') {
    out.employementType = emp;
  }
  return out;
}

export type RequirementAiChatContextValue = {
  pendingAiPrefill: Partial<IRequirement> | null;
  setPendingAiPrefill: (payload: Partial<IRequirement> | null) => void;
  clearPendingAiPrefill: () => void;
  jobDescription: string;
  setJobDescription: (value: string) => void;
  instruction: string;
  setInstruction: (value: string) => void;
  generating: boolean;
  hasGenerated: boolean;
  generateRequirement: () => Promise<void>;
  resetRequirementAiChatForm: () => void;
};

const RequirementAiChatContext =
  createContext<RequirementAiChatContextValue | null>(null);

export function RequirementAiChatProvider({ children }: { children: ReactNode }) {
  const [pendingAiPrefill, setPendingAiPrefill] =
    useState<Partial<IRequirement> | null>(null);

  const [jobDescription, setJobDescription] = useState('');
  const [instruction, setInstruction] = useState('');
  const [generating, setGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const clearPendingAiPrefill = useCallback(() => {
    setPendingAiPrefill(null);
  }, []);

  const resetRequirementAiChatForm = useCallback(() => {
    setJobDescription('');
    setInstruction('');
    setHasGenerated(false);
    setGenerating(false);
  }, []);

  const generateRequirement = useCallback(async () => {
    const jd = jobDescription.trim();
    if (!jd) {
      toast.error('Please paste or enter a job description (JD).');
      return;
    }
    setGenerating(true);
    try {
      const raw = await generatePayLoadFromPrompt(jd, instruction.trim());
      const picked = pickExtractedRequirementFields(raw);
      setPendingAiPrefill(picked);
      setHasGenerated(true);
      toast.success(
        'Requirement fields generated. Review the form in the drawer.'
      );
    } catch (e) {
      console.error(e);
      toast.error(
        'Could not generate requirement from this content. Try again.'
      );
    } finally {
      setGenerating(false);
    }
  }, [jobDescription, instruction]);

  const value = useMemo(
    () => ({
      pendingAiPrefill,
      setPendingAiPrefill,
      clearPendingAiPrefill,
      jobDescription,
      setJobDescription,
      instruction,
      setInstruction,
      generating,
      hasGenerated,
      generateRequirement,
      resetRequirementAiChatForm,
    }),
    [
      pendingAiPrefill,
      clearPendingAiPrefill,
      jobDescription,
      instruction,
      generating,
      hasGenerated,
      generateRequirement,
      resetRequirementAiChatForm,
    ]
  );

  return (
    <RequirementAiChatContext.Provider value={value}>
      {children}
    </RequirementAiChatContext.Provider>
  );
}

export function useRequirementAiChat() {
  const ctx = useContext(RequirementAiChatContext);
  if (!ctx) {
    throw new Error(
      'useRequirementAiChat must be used within RequirementAiChatProvider'
    );
  }
  return ctx;
}
