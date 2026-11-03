# Contact form delivery validation

Base: Sensemodo v23, c17eaae6faf34461c874d77e9cdaa52cc0ce1670.

The old handler aborted after 18 seconds and treated every exception as failed delivery. One controlled POST returned HTTP 200 with `success: "true"` after 43.355 seconds, and the exact test ID was found in the recipient mailbox. A prior POST timed out at 60 seconds but was also delivered. Therefore a timeout is an unknown outcome, and repeating it can duplicate an enquiry.

The form now shows a waiting message after 18 seconds and continues observing the original request for at most 180 seconds. Success requires the provider's affirmative JSON acknowledgement and a successful HTTP status. Provider rejection, activation, unreadable replies and uncertain network outcomes have separate states. Unknown delivery retains the entered text and reference; identical uncertain submissions are blocked for the rest of the open page session. Closing or reloading the page ends this in-memory protection. There is no automatic retry or new client-side storage of enquiry details.

This is a client confirmation fix, not durable queueing. FormSubmit remains an external dependency. No country coverage or universal delivery guarantee is established. No backend, database, secrets, provider, account, or hosting access policy was added.

Local checks:

- `node qa/contact-delivery.cjs`: mocked transport states, timeout while reading the response, and slow confirmation without aborting.
- `node qa/contact-flow.cjs`: EN/RU/SR/ES handler states, text preservation, duplicate prevention beyond two minutes, and accepted-delivery handling even if the confirmation display fails.
- `node qa/contact-browser.cjs`: actual isolated Chromium, seven provider scenarios on four languages. All outbound requests are intercepted; no real enquiries. Set PLAYWRIGHT_MODULE and BROWSER_PATH to existing local installations if required. Chromium sandbox remains enabled.

`qa/contact-real-browser.cjs` performs a real external test only with an explicit fresh `SM-UI-...` or `SM-LIVE-...` UTC ID and saves a journal before submission. It must never repeat an existing ID. Candidate mode substitutes this checkout's site assets while retaining the production origin; live mode loads deployed assets. Both use the unchanged authorized FormSubmit endpoint. Do not invoke it automatically in routine QA.

A live v24 JSON request encountered a CORS failure without a readable provider acknowledgement. The next candidate uses URLSearchParams and the browser-generated application/x-www-form-urlencoded content type, retaining Accept: application/json. This encoding is consistent with the jQuery example embedded by https://formsubmit.co/ajax-documentation (https://gist.github.com/kesarawimal/38ebe436a03719ccfbf61dfc6cd11758) and jQuery default serialization documented at https://api.jquery.com/jQuery.ajax/. It is a standard CORS-safelisted request encoding; browser CORS validation remains enabled for the response. There is no fallback POST or automatic retry.
