export type LogOperation = 'create' | 'update' | 'delete';

export interface CreateRequirementLogPayload {
  requirementRef: Types.ObjectId;
  operation: LogOperation;
  userName: string;
  userRef: Types.ObjectId;
  oldData?: Partial<any>;
  newData: Partial<any>;
}

export interface RequirementLog extends CreateRequirementLogPayload {
  _id: string;
  createdAt: string;
  updatedAt: string;
}
