export type StepDescriptionAction = "click" | "focusNavigation" | "fieldFill";

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

export interface FocusNavigationStepDescription {
  action: "focusNavigation";
  target: StepDescriptionTarget;
  source: DescriptionSource;
  text: string;
  locale: "pt-BR";
}

export interface FieldFillStepDescription {
  action: "fieldFill";
  target: StepDescriptionTarget;
  source: DescriptionSource;
  text: string;
  locale: "pt-BR";
}

export type StepDescription =
  | ClickStepDescription
  | FocusNavigationStepDescription
  | FieldFillStepDescription;
