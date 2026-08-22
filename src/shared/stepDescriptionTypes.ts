export type StepDescriptionAction = "click";

export type StepTargetType =
  | "button"
  | "link"
  | "field"
  | "checkbox"
  | "radio"
  | "select"
  | "element";

export type DescriptionSource =
  | "label"
  | "accessibleName"
  | "text"
  | "testId"
  | "id"
  | "tagName";

export interface StepDescriptionTarget {
  type: StepTargetType;
  name?: string;
}

export interface ClickStepDescription {
  action: "click";
  target: StepDescriptionTarget;
  source: DescriptionSource;
  text: string;
  locale: "pt-BR";
}

export type StepDescription = ClickStepDescription;
