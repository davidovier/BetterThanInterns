export type WorkflowDelta = {
  new_steps?: NewStep[];
  updated_steps?: UpdatedStep[];
  new_links?: NewLink[];
};

export type NewStep = {
  temp_id: string;
  title: string;
  description?: string;
  owner?: string;
  inputs?: string[];
  outputs?: string[];
  frequency?: string;
  duration?: string;
};

export type UpdatedStep = {
  id: string;
  updates: {
    title?: string;
    description?: string;
    owner?: string;
    inputs?: string[];
    outputs?: string[];
    frequency?: string;
    duration?: string;
  };
};

export type NewLink = {
  from_step: string; // ID or temp_id
  to_step: string; // ID or temp_id
  label?: string;
  link_type?: string;
};

export type ProcessStep = {
  id: string;
  title: string;
  description?: string;
  owner?: string;
  inputs: string[];
  outputs: string[];
  frequency?: string;
  duration?: string;
  positionX: number;
  positionY: number;
};

export type ProcessLink = {
  id: string;
  fromStepId: string;
  toStepId: string;
  label?: string;
  linkType: string;
};

export type ChatMessageType = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
};
