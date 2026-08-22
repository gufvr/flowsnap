import { describe, expect, it } from "vitest";
import type {
  SelectorAnalysis,
  SelectorCandidate,
  SelectorValidationStatus,
} from "../recordingTypes";
import {
  createClickDescription,
  type ClickDescriptionInput,
} from "./createClickDescription";

function createCandidate(
  candidate: Partial<SelectorCandidate> &
    Pick<SelectorCandidate, "strategy" | "value" | "score">,
  status: SelectorValidationStatus = "valid",
): SelectorCandidate {
  return {
    isUnique: status === "valid",
    validation: {
      status,
      matchCount: status === "valid" ? 1 : status === "ambiguous" ? 2 : 0,
      matchesTarget: status !== "invalid",
    },
    ...candidate,
  };
}

function createSelectors(...candidates: SelectorCandidate[]): SelectorAnalysis {
  const [recommended, ...alternatives] = candidates;
  if (!recommended) throw new Error("A candidate is required for the test.");
  return { recommended, alternatives };
}

function createCssFallback() {
  return createCandidate({ strategy: "css", value: "body > div", score: 40 });
}

describe("createClickDescription", () => {
  it("describes a field using its label before technical selectors", () => {
    const description = createClickDescription({
      element: { tagName: "input", inputType: "text" },
      selectors: createSelectors(
        createCandidate({
          strategy: "testId",
          attribute: "data-testid",
          value: "login-username",
          score: 100,
        }),
        createCandidate({ strategy: "label", value: "Username", score: 85 }),
      ),
    });

    expect(description).toEqual({
      action: "click",
      target: { type: "field", name: "Username" },
      source: "label",
      text: 'Clicou no campo "Username"',
      locale: "pt-BR",
    });
  });

  it("describes a password field without reading its value", () => {
    const input = {
      element: {
        tagName: "input",
        inputType: "password",
        value: "SuperSecretPassword!",
      },
      selectors: createSelectors(
        createCandidate({ strategy: "label", value: "Password", score: 85 }),
      ),
    };

    const description = createClickDescription(input);

    expect(description).toMatchObject({
      target: { type: "field", name: "Password" },
      source: "label",
      text: 'Clicou no campo "Password"',
    });
    expect(JSON.stringify(description)).not.toContain("SuperSecretPassword!");
  });

  it("describes a button using its accessible name", () => {
    const description = createClickDescription({
      element: { tagName: "button" },
      selectors: createSelectors(
        createCandidate({
          strategy: "role",
          role: "button",
          name: "Login",
          value: "button:Login",
          score: 90,
        }),
      ),
    });

    expect(description).toMatchObject({
      target: { type: "button", name: "Login" },
      source: "accessibleName",
      text: 'Clicou no botão "Login"',
    });
  });

  it("describes a link using its own visible text", () => {
    const description = createClickDescription({
      element: { tagName: "a", text: "Forgot password?" },
      selectors: createSelectors(createCssFallback()),
    });

    expect(description).toMatchObject({
      target: { type: "link", name: "Forgot password?" },
      source: "text",
      text: 'Clicou no link "Forgot password?"',
    });
  });

  it("accepts an ambiguous label when it still matches the target", () => {
    const description = createClickDescription({
      element: { tagName: "input", inputType: "text" },
      selectors: createSelectors(
        createCandidate(
          { strategy: "label", value: "Username", score: 85 },
          "ambiguous",
        ),
        createCssFallback(),
      ),
    });

    expect(description).toMatchObject({
      target: { type: "field", name: "Username" },
      source: "label",
    });
  });

  it("ignores an invalid label and uses a valid id", () => {
    const description = createClickDescription({
      element: { tagName: "input", inputType: "text" },
      selectors: createSelectors(
        createCandidate(
          { strategy: "label", value: "Wrong field", score: 85 },
          "invalid",
        ),
        createCandidate({
          strategy: "id",
          value: "user_email",
          score: 80,
        }),
      ),
    });

    expect(description).toMatchObject({
      target: { type: "field", name: "User email" },
      source: "id",
      text: 'Clicou no campo "User email"',
    });
  });

  it("humanizes a test id fallback", () => {
    const description = createClickDescription({
      element: { tagName: "button" },
      selectors: createSelectors(
        createCandidate({
          strategy: "testId",
          attribute: "data-testid",
          value: "login-submit",
          score: 100,
        }),
      ),
    });

    expect(description).toMatchObject({
      target: { type: "button", name: "Login submit" },
      source: "testId",
      text: 'Clicou no botão "Login submit"',
    });
  });

  it("humanizes a camelCase id fallback", () => {
    const description = createClickDescription({
      element: { tagName: "a" },
      selectors: createSelectors(
        createCandidate({
          strategy: "id",
          value: "forgotPasswordLink",
          score: 80,
        }),
      ),
    });

    expect(description).toMatchObject({
      target: { type: "link", name: "Forgot password link" },
      source: "id",
      text: 'Clicou no link "Forgot password link"',
    });
  });

  it("falls back to the tag without inventing a target name", () => {
    const description = createClickDescription({
      element: { tagName: "div" },
      selectors: createSelectors(createCssFallback()),
    });

    expect(description).toEqual({
      action: "click",
      target: { type: "element" },
      source: "tagName",
      text: "Clicou em um elemento",
      locale: "pt-BR",
    });
  });

  it.each([
    {
      element: { tagName: "button" },
      expectedType: "button",
      expectedText: "Clicou em um botão",
    },
    {
      element: { tagName: "a" },
      expectedType: "link",
      expectedText: "Clicou em um link",
    },
    {
      element: { tagName: "input", inputType: "text" },
      expectedType: "field",
      expectedText: "Clicou em um campo",
    },
    {
      element: { tagName: "div" },
      expectedType: "element",
      expectedText: "Clicou em um elemento",
    },
  ])(
    "uses the unnamed $expectedType fallback",
    ({ element, expectedType, expectedText }) => {
      const description = createClickDescription({
        element,
        selectors: createSelectors(createCssFallback()),
      });

      expect(description).toMatchObject({
        target: { type: expectedType },
        source: "tagName",
        text: expectedText,
      });
      expect(description.target).not.toHaveProperty("name");
    },
  );

  it.each<{
    element: ClickDescriptionInput["element"];
    role?: string;
    expectedType: string;
    expectedText: string;
  }>([
    {
      element: { tagName: "input", inputType: "checkbox" },
      expectedType: "checkbox",
      expectedText: "Clicou em uma caixa de seleção",
    },
    {
      element: { tagName: "input", inputType: "radio" },
      expectedType: "radio",
      expectedText: "Clicou em uma opção",
    },
    {
      element: { tagName: "select" },
      expectedType: "select",
      expectedText: "Clicou em um seletor",
    },
    {
      element: { tagName: "div" },
      role: "combobox",
      expectedType: "select",
      expectedText: "Clicou em um seletor",
    },
  ])(
    "identifies $expectedType from semantic element information",
    ({ element, role, expectedType, expectedText }) => {
      const roleCandidate = role
        ? createCandidate({
            strategy: "role",
            role,
            value: role,
            score: 90,
          })
        : createCssFallback();

      const description = createClickDescription({
        element,
        selectors: createSelectors(roleCandidate),
      });

      expect(description.target.type).toBe(expectedType);
      expect(description.text).toBe(expectedText);
    },
  );

  it("normalizes whitespace and limits the target name", () => {
    const longName = `  ${"Nome   muito   longo ".repeat(10)}  `;
    const description = createClickDescription({
      element: { tagName: "button", text: longName },
      selectors: createSelectors(createCssFallback()),
    });

    expect(description.target.name).not.toContain("  ");
    expect(description.target.name).toHaveLength(80);
  });
});
