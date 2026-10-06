# Optional Formspree contact form

The starter ships with the form **disabled** and no destination. Set it up in
the client's own Formspree account if the client wants messages. Do not use a
form from the starter or another artist.

1. Create a form inside the client's Formspree project and verify the
   recipient address in Formspree. Copy its HTTPS action URL in the exact form
   `https://formspree.io/f/FORM_ID` to `contact.formEndpoint` in
   `src/config/site.json`. Do not commit service login credentials or API keys.
2. Set `features.contactForm: true` in `src/config/modules.json`. Keep the
   Contact section enabled. With an empty endpoint the form remains hidden;
   a malformed nonempty endpoint fails the build.
3. In the project's **Settings → Restrict to Domain**, enter the client's
   domain without `https://`. If tests must submit from a preview hostname,
   check that it is authorized or perform the delivery test on the final
   domain. Keep spam protection enabled. Enable Formspree CAPTCHA/abuse protection when
   appropriate for the client's traffic and threat level. Review submission
   retention and delete messages that are no longer needed. The site uses
   `Referrer-Policy: strict-origin-when-cross-origin` so Formspree can inspect
   the origin. A browser that omits the referrer may cause a restricted
   submission to be sent to spam.
4. Send one clearly labelled test message from the actual site. Check the
   website's translated success state, the Formspree inbox, spam folder and
   the intended recipient's email. A visible website success message only
   means Formspree accepted the request; it does not prove email delivery.
   Test required fields, invalid email, and failure handling too. Remove the
   test message if appropriate.
5. Confirm that the client knows where submissions arrive and who maintains
   the Formspree account. If the form is no longer wanted, disable the
   feature and clear the endpoint.

The form has a hidden `_gotcha` honeypot. With JavaScript it sends a `POST`
and shows status without a page change; without JavaScript it uses an HTML
form submission to Formspree. Neither path can be tested end to end in the
neutral starter because it has no real endpoint.

See Formspree's [Restrict to Domain guide](https://help.formspree.io/articles/form-and-project-settings/restrict-to-domain)
for the current domain and referrer rules.
