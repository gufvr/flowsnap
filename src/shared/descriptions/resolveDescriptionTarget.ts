import type {
  SelectorAnalysis,
  SelectorCandidate,
} from "../recordingTypes";
import type {
  DescriptionSource,
  StepDescriptionTarget,
  StepTargetType,
} from "../stepDescriptionTypes";

const MAX_TARGET_NAME_LENGTH = 80;

export interface DescriptionTargetInput {
  element: {
    tagName: string;
    text?: string;
    inputType?: string;
  };
  selectors: SelectorAnalysis;
}

export interface ResolvedDescriptionTarget {
  target: StepDescriptionTarget;
  source: DescriptionSource;
}

interface TargetName {
  name?: string;
  source: DescriptionSource;
}

function getCandidates(selectors: SelectorAnalysis) {
  return [selectors.recommended, ...selectors.alternatives];
}

function canDescribeTarget(candidate: SelectorCandidate) {
  return (
    candidate.validation.status !== "invalid" &&
    candidate.validation.matchesTarget
  );
}

function findCandidate(
  candidates: SelectorCandidate[],
  strategy: SelectorCandidate["strategy"],
) {
  return candidates.find(
    (candidate) =>
      candidate.strategy === strategy && canDescribeTarget(candidate),
  );
}

function normalizeName(value: string | undefined) {
  const normalized = value?.replace(/\s+/g, " ").trim();
  return normalized?.slice(0, MAX_TARGET_NAME_LENGTH) || undefined;
}

function humanizeTechnicalName(value: string) {
  const normalized = value
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("pt-BR");

  if (!normalized) return undefined;

  return normalizeName(
    `${normalized.charAt(0).toLocaleUpperCase("pt-BR")}${normalized.slice(1)}`,
  );
}

function identifyTargetType(
  input: DescriptionTargetInput,
  candidates: SelectorCandidate[],
): StepTargetType {
  const role = findCandidate(candidates, "role")?.role;

  if (role === "button") return "button";
  if (role === "link") return "link";
  if (role === "checkbox") return "checkbox";
  if (role === "radio") return "radio";
  if (role === "combobox" || role === "listbox") return "select";
  if (["textbox", "searchbox", "spinbutton", "slider"].includes(role ?? "")) {
    return "field";
  }

  const tagName = input.element.tagName.toLocaleLowerCase("en-US");
  const inputType = input.element.inputType?.toLocaleLowerCase("en-US");

  if (tagName === "button") return "button";
  if (tagName === "a") return "link";
  if (tagName === "select") return "select";
  if (tagName === "textarea") return "field";

  if (tagName === "input") {
    if (["button", "image", "reset", "submit"].includes(inputType ?? "")) {
      return "button";
    }

    if (inputType === "checkbox") return "checkbox";
    if (inputType === "radio") return "radio";
    return "field";
  }

  return "element";
}

function chooseTargetName(
  input: DescriptionTargetInput,
  candidates: SelectorCandidate[],
): TargetName {
  const label = findCandidate(candidates, "label");
  const labelName = normalizeName(label?.value);
  if (labelName) return { name: labelName, source: "label" };

  const role = findCandidate(candidates, "role");
  const accessibleName = normalizeName(role?.name);
  if (accessibleName) {
    return { name: accessibleName, source: "accessibleName" };
  }

  const text = normalizeName(input.element.text);
  if (text) return { name: text, source: "text" };

  const testId = findCandidate(candidates, "testId");
  const testIdName = testId ? humanizeTechnicalName(testId.value) : undefined;
  if (testIdName) return { name: testIdName, source: "testId" };

  const id = findCandidate(candidates, "id");
  const idName = id ? humanizeTechnicalName(id.value) : undefined;
  if (idName) return { name: idName, source: "id" };

  return { source: "tagName" };
}

export function resolveDescriptionTarget(
  input: DescriptionTargetInput,
): ResolvedDescriptionTarget {
  const candidates = getCandidates(input.selectors);
  const type = identifyTargetType(input, candidates);
  const { name, source } = chooseTargetName(input, candidates);

  return {
    target: {
      type,
      ...(name ? { name } : {}),
    },
    source,
  };
}
