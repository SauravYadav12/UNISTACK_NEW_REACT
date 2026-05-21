import { LogOperation } from './requirement';

/**
 * Activity-log types for interviews. Mirrors `CreateRequirementLogPayload`
 * and `RequirementLog` — same shape, just keyed by `interviewRef` instead
 * of `requirementRef`, so the client log-renderer can be a thin wrapper
 * around the same diff component.
 */
export interface CreateInterviewLogPayload {
  interviewRef: string;
  operation: LogOperation;
  userName: string;
  userRef: string;
  oldData?: Partial<any>;
  newData: Partial<any>;
}

export interface InterviewLog extends CreateInterviewLogPayload {
  _id: string;
  createdAt: string;
  updatedAt: string;
}
