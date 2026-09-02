import type { RecorderController } from '../../content/recorder';

export function createPracticePage(controller: RecorderController) {
  const root = document.createElement('main');
  const usernameLabel = document.createElement('label');
  const username = document.createElement('input');
  const passwordLabel = document.createElement('label');
  const password = document.createElement('input');
  const login = document.createElement('button');
  const rememberLabel = document.createElement('label');
  const remember = document.createElement('input');
  const standardLabel = document.createElement('label');
  const standard = document.createElement('input');
  const countryLabel = document.createElement('label');
  const country = document.createElement('select');
  const experienceLabel = document.createElement('label');
  const experience = document.createElement('input');
  const colorLabel = document.createElement('label');
  const color = document.createElement('input');
  const noisyContainer = document.createElement('section');

  username.id = 'username';
  usernameLabel.htmlFor = username.id;
  usernameLabel.textContent = 'Username';
  password.id = 'password';
  password.type = 'password';
  passwordLabel.htmlFor = password.id;
  passwordLabel.textContent = 'Password';
  login.type = 'button';
  login.textContent = 'Login';
  remember.type = 'checkbox';
  rememberLabel.textContent = 'Remember me';
  rememberLabel.append(remember);
  standard.type = 'radio';
  standard.name = 'plan';
  standardLabel.textContent = 'Standard';
  standardLabel.append(standard);
  countryLabel.textContent = 'Country';
  country.append(new Option('Choose', ''), new Option('Brazil', 'BR'));
  countryLabel.append(country);
  experienceLabel.textContent = 'Experience (Range Slider)';
  experience.type = 'range';
  experience.value = '5';
  experienceLabel.append(experience);
  colorLabel.textContent = 'Color Picker';
  color.type = 'color';
  color.value = '#000000';
  colorLabel.append(color);
  noisyContainer.innerHTML = `
    <h2>Gender (Radio Buttons)</h2>
    <span>Male</span><span>Female</span><span>Other</span>
    <h2>Skills (Checkboxes)</h2>
    <span>Selenium</span><span>Playwright</span><span>Cypress</span>
  `;

  root.append(
    usernameLabel,
    username,
    passwordLabel,
    password,
    login,
    rememberLabel,
    standardLabel,
    countryLabel,
    experienceLabel,
    colorLabel,
    noisyContainer,
  );
  root.addEventListener('click', controller.handleClick, true);
  root.addEventListener('keydown', controller.handleKeyDown, true);
  root.addEventListener('keyup', controller.handleKeyUp, true);
  root.addEventListener('focusin', controller.handleFocusIn, true);
  root.addEventListener('input', controller.handleInput, true);
  root.addEventListener('change', controller.handleChange, true);
  root.addEventListener('pointerdown', controller.handlePointerDown, true);
  document.body.append(root);

  return {
    root,
    username,
    password,
    login,
    rememberLabel,
    remember,
    standard,
    country,
    experience,
    color,
    noisyContainer,
  };
}

export type PracticePage = ReturnType<typeof createPracticePage>;

