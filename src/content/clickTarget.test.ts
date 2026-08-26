import { afterEach, describe, expect, it } from 'vitest';
import {
  canUseTextSelector,
  getClickTargetText,
  resolveClickTarget,
} from './clickTarget';

afterEach(() => {
  document.body.replaceChildren();
});

describe('resolveClickTarget', () => {
  it.each(['main', 'section', 'form']) (
    'ignores the structural <%s> container when it only has aggregate text',
    (tagName) => {
      document.body.innerHTML = `<${tagName}>
        <h2>Gender (Radio Buttons)</h2>
        <span>Male</span><span>Female</span><span>Other</span>
        <h2>Skills (Checkboxes)</h2>
        <span>Selenium</span><span>Playwright</span><span>Cypress</span>
      </${tagName}>`;
      const container = document.querySelector(tagName)!;

      expect(resolveClickTarget(container)).toBeUndefined();
    },
  );

  it('resolves a nested child to its native interactive ancestor', () => {
    document.body.innerHTML = '<button><span>Salvar</span></button>';
    const button = document.querySelector('button')!;
    const child = document.querySelector('span')!;

    expect(resolveClickTarget(child)).toBe(button);
  });

  it.each([
    '<div role="button"><span>Abrir</span></div>',
    '<div tabindex="0"><span>Abrir</span></div>',
    '<div data-testid="custom-trigger"><span>Abrir</span></div>',
    '<div style="cursor: pointer"><span>Abrir</span></div>',
  ])('preserves an identifiable custom component: %s', (markup) => {
    document.body.innerHTML = markup;
    const component = document.querySelector('div')!;
    const child = document.querySelector('span')!;

    expect(resolveClickTarget(child)).toBe(component);
  });

  it('preserves a structural tag when it explicitly identifies a custom component', () => {
    document.body.innerHTML = `
      <section data-testid="settings-card"><span>Abrir configurações</span></section>
    `;
    const section = document.querySelector('section')!;
    const child = document.querySelector('span')!;

    expect(resolveClickTarget(child)).toBe(section);
  });

  it('does not treat a structural id alone as an interaction signal', () => {
    document.body.innerHTML = `
      <main id="forms"><h2>Forms</h2><span>Login</span><span>Registration</span></main>
    `;
    const main = document.querySelector('main')!;

    expect(resolveClickTarget(main)).toBeUndefined();
  });

  it('keeps a short text leaf as a compatibility fallback', () => {
    document.body.innerHTML = '<div><span>Ajuda</span></div>';
    const leaf = document.querySelector('span')!;

    expect(resolveClickTarget(leaf)).toBe(leaf);
  });

  it('ignores a label proxy so the associated control owns the semantic action', () => {
    document.body.innerHTML = `
      <label>Notifications <input type="checkbox" /></label>
    `;
    const label = document.querySelector('label')!;
    const input = document.querySelector('input')!;

    expect(resolveClickTarget(label)).toBeUndefined();
    expect(resolveClickTarget(input)).toBe(input);
  });
});

describe('click target text', () => {
  it('does not expose aggregate descendant text for an untyped custom target', () => {
    document.body.innerHTML = `
      <div data-testid="settings-card"><span>Conta</span><span>Segurança</span></div>
    `;
    const component = document.querySelector('div')!;

    expect(getClickTargetText(component)).toBeUndefined();
    expect(canUseTextSelector(component)).toBe(false);
  });

  it('keeps the accessible text of a component with an interactive role', () => {
    document.body.innerHTML = '<div role="button"><span>Abrir menu</span></div>';
    const component = document.querySelector('div')!;

    expect(getClickTargetText(component)).toBe('Abrir menu');
    expect(canUseTextSelector(component, 'button')).toBe(true);
  });

  it('does not treat a structural ARIA role as permission for aggregate text', () => {
    document.body.innerHTML = `
      <section role="region" data-testid="settings">
        <span>Conta</span><span>Segurança</span>
      </section>
    `;
    const region = document.querySelector('section')!;

    expect(getClickTargetText(region)).toBeUndefined();
    expect(canUseTextSelector(region, 'region')).toBe(false);
  });
});
