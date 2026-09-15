# Chrome Web Store privacy practices

This document contains the proposed answers for StepScript's Chrome Web Store
Privacy practices tab. Review the dashboard wording at submission time and keep
these answers consistent with the published privacy policy and actual extension
behavior.

## Single purpose

> Record user-initiated browser interactions locally and convert the recorded
> steps into Playwright or Cypress test code.

## Permission justifications

### `activeTab`

StepScript uses `activeTab` to identify the tab explicitly selected by the user
when opening the Side Panel and starting a recording. Access is limited to the
user-initiated recording workflow.

### `scripting`

StepScript uses `scripting` to inject its packaged recorder into the authorized
tab only after the user starts recording. It does not inject remote code.

### `sidePanel`

StepScript uses `sidePanel` to provide its primary interface for controlling a
recording, reviewing steps, adding assertions, and generating test code.

### `storage`

StepScript uses `storage` to keep recorded steps and recording state in
`chrome.storage.local` and short-lived active-tab and element-picker context in
`chrome.storage.session`. StepScript does not use `chrome.storage.sync` or send
this information to an external service.

### `webNavigation`

StepScript uses `webNavigation` to detect supported URL changes, full document
navigations, history traversal, and reloads in the tab currently being
recorded. It also uses those events to safely resume the packaged recorder after
a supported navigation. Subframes and tabs outside the active recording are
ignored.

### Optional host permissions

StepScript declares optional access to HTTP and HTTPS sites so it can request
access only to the current site's origin after the user starts a recording.
This access is necessary to capture interactions and resume the
recorder across same-origin navigations. StepScript does not request access to all
sites at installation time.

## Remote code

Select **No, I am not using remote code**.

All executable JavaScript, styles, fonts, and icons used by StepScript are
included in the extension package. The extension does not download or execute
remote code.

## Data disclosure

Select every category exposed by the current dashboard that corresponds to the
following locally processed information:

- **Personally identifiable information:** ordinary fields, page text, and URLs
  may contain names, usernames, email addresses, telephone numbers, or similar
  identifiers.
- **Web history / web browsing activity:** StepScript stores full URLs and
  navigation events for the tab during an active recording.
- **User activity:** StepScript records user-initiated clicks, focus navigation,
  supported key presses, selections, and control changes.
- **Website content:** StepScript processes labels, accessible names, visible
  text, attributes, element details, and selector candidates.
- **Form data:** if the dashboard presents this as a separate category, select
  it because StepScript can store ordinary form values and selection states.

StepScript is designed not to retain recognized passwords, one-time codes,
payment values, personal identification values, tokens, or similar secrets.
Those controls are classified before their values are read and are represented
only by a protected marker. Because detection is heuristic, do not describe
this safeguard as an absolute guarantee. Review the dashboard's current
definitions for **Authentication information** and **Financial and payment
information** at submission time and answer conservatively if they encompass
potential content in ordinary fields, URLs, or page text.

Do not select health information, precise location, or personal communications
unless the product behavior changes to intentionally process those categories.
If a future recorder feature begins processing them, update the product,
policy, disclosure, and dashboard answers together before release.

## Data usage certifications

Certify that StepScript:

- does not sell or transfer user data to third parties;
- does not use or transfer user data for personalized advertising;
- does not use user data for creditworthiness or lending purposes;
- uses user data only to provide or improve its disclosed recording and
  test-generation purpose; and
- does not allow humans to read recorded user data.

The data is processed and stored locally in the user's Chrome profile. Copy and
download operations occur only when explicitly requested by the user.

## Limited Use statement

> StepScript's use of information received from Chrome APIs adheres to the Chrome
> Web Store User Data Policy, including the Limited Use requirements. StepScript
> uses that information only to provide or improve its user-facing recording
> and test-generation features. StepScript does not sell user data, use it for
> advertising, transfer it to third parties, or allow humans to access it.

## Privacy policy URL

Use this exact address in the Privacy policy field after the manual GitHub Pages
deployment has completed and the page has been verified without authentication:

> https://gufvr.github.io/flowsnap/privacy.html

The Side Panel uses the same address as its primary policy link and preserves a
local packaged copy at `privacy.html`. The public page is hosted by GitHub Pages,
which may process ordinary request metadata such as an IP address when the user
opens it. StepScript does not attach recorded data to that request.

Do not submit the public address to the Chrome Web Store until it returns the
current policy over HTTPS without requiring authentication.

## Publication and maintenance

`public/privacy.html` is the only editable policy source. The extension build
copies it into the distribution package, and the manual GitHub Pages workflow
uses the same file for the public artifact. Do not maintain a separate policy
body in documentation or in a deployment branch.

For every policy change:

1. Update `public/privacy.html` and its effective date.
2. Run the focused policy checks, full test suite, lint, build, and package
   verification.
3. Commit and push the reviewed source changes.
4. Manually run the **Publish privacy policy** workflow.
5. Verify the public title, effective date, Limited Use statement, styles, and
   HTTPS address.
6. Only then submit an extension or Privacy practices update that depends on
   the revised policy.

The workflow is deliberately manual and must not be changed to deploy on every
push without a separate review of that operational decision.

## Official references

- [Chrome Web Store Privacy practices fields](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy)
- [Chrome Web Store User Data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq)
- [Chrome Web Store Program Policies](https://developer.chrome.com/docs/webstore/program-policies/policies)
- [Chrome extensions Storage API](https://developer.chrome.com/docs/extensions/reference/api/storage)
