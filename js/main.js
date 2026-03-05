/**
 * Eko Plamen – Main JavaScript
 *
 * Features:
 *  - Mobile navigation toggle
 *  - Smooth scroll + active link highlight
 *  - Scroll-triggered fade-in animations
 *  - Contact form validation + EmailJS submission
 *
 * EmailJS configuration:
 *  Replace the three placeholder values (PUBLIC_KEY, SERVICE_ID, TEMPLATE_ID)
 *  with your own from https://www.emailjs.com/
 *
 * Template variables expected by EmailJS template:
 *   {{from_name}}    – full name of sender
 *   {{from_email}}   – sender's email
 *   {{phone}}        – sender's phone (optional)
 *   {{subject}}      – selected subject
 *   {{message}}      – message body
 *   {{to_email}}     – your destination email (set in template or here)
 */

/* ------------------------------------------------------------------ */
/*  EmailJS configuration                                              */
/*  To enable email sending:                                           */
/*  1. Create a free account at https://www.emailjs.com/              */
/*  2. Create a service, template, and get your public key            */
/*  3. Replace the three values below with your own credentials       */
/*  WARNING: Do NOT commit real credentials to a public repository.   */
/*  Consider loading these from a server-side config or environment.  */
/* ------------------------------------------------------------------ */
const EMAILJS_PUBLIC_KEY  = 'YOUR_PUBLIC_KEY';   // e.g. 'abc123XYZ'
const EMAILJS_SERVICE_ID  = 'YOUR_SERVICE_ID';   // e.g. 'service_xxxxxxx'
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';  // e.g. 'template_xxxxxxx'

/* ------------------------------------------------------------------ */
/*  Initialise EmailJS                                                 */
/* ------------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', () => {
  if (typeof emailjs !== 'undefined') {
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  }

  initNavToggle();
  initScrollAnimations();
  initContactForm();
  initFooterYear();
});

/* ------------------------------------------------------------------ */
/*  Mobile navigation toggle                                           */
/* ------------------------------------------------------------------ */
function initNavToggle() {
  const toggle = document.getElementById('navToggle');
  const menu   = document.getElementById('navMenu');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    menu.classList.toggle('is-open', !expanded);
    toggle.setAttribute('aria-label', expanded ? 'Odpri meni' : 'Zapri meni');
  });

  // Close menu when a nav link is clicked
  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      toggle.setAttribute('aria-expanded', 'false');
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-label', 'Odpri meni');
    });
  });

  // Close menu on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) {
      toggle.setAttribute('aria-expanded', 'false');
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-label', 'Odpri meni');
      toggle.focus();
    }
  });
}

/* ------------------------------------------------------------------ */
/*  Scroll-triggered fade-in animations                               */
/* ------------------------------------------------------------------ */
function initScrollAnimations() {
  const targets = document.querySelectorAll(
    '.product-card, .process-step, .about-text, .section__header, .contact-info, .contact-form-wrap, .stat'
  );

  targets.forEach(el => el.classList.add('fade-in'));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  targets.forEach(el => observer.observe(el));
}

/* ------------------------------------------------------------------ */
/*  Footer year                                                        */
/* ------------------------------------------------------------------ */
function initFooterYear() {
  const el = document.getElementById('footerYear');
  if (el) el.textContent = new Date().getFullYear();
}

/* ------------------------------------------------------------------ */
/*  Contact form                                                       */
/* ------------------------------------------------------------------ */
function initContactForm() {
  const form       = document.getElementById('contactForm');
  const submitBtn  = document.getElementById('submitBtn');
  const successEl  = document.getElementById('formSuccess');
  const errorEl    = document.getElementById('formErrorGlobal');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Clear previous feedback
    clearFormFeedback(form);
    successEl.hidden = true;
    errorEl.hidden   = true;

    if (!validateForm(form)) return;

    // Show loading state
    submitBtn.classList.add('btn--loading');
    submitBtn.disabled = true;

    const params = buildEmailParams(form);

    try {
      await sendEmail(params);
      successEl.hidden = false;
      form.reset();
      successEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (err) {
      console.error('EmailJS error:', err);
      errorEl.hidden = false;
      errorEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } finally {
      submitBtn.classList.remove('btn--loading');
      submitBtn.disabled = false;
    }
  });
}

/* ---- Validation ---- */
function validateForm(form) {
  let valid = true;

  const firstName = form.querySelector('#firstName');
  if (!firstName.value.trim()) {
    showFieldError('firstNameError', 'Prosimo, vnesite vaše ime.');
    markInvalid(firstName);
    valid = false;
  }

  const email = form.querySelector('#email');
  if (!email.value.trim()) {
    showFieldError('emailError', 'Prosimo, vnesite vaš e-poštni naslov.');
    markInvalid(email);
    valid = false;
  } else if (!isValidEmail(email.value.trim())) {
    showFieldError('emailError', 'Vnesite veljaven e-poštni naslov (npr. ime@primer.si).');
    markInvalid(email);
    valid = false;
  }

  const subject = form.querySelector('#subject');
  if (!subject.value) {
    showFieldError('subjectError', 'Prosimo, izberite zadevo.');
    markInvalid(subject);
    valid = false;
  }

  const message = form.querySelector('#message');
  if (!message.value.trim()) {
    showFieldError('messageError', 'Prosimo, napišite vaše sporočilo.');
    markInvalid(message);
    valid = false;
  } else if (message.value.trim().length < 10) {
    showFieldError('messageError', 'Sporočilo je prekratko (najmanj 10 znakov).');
    markInvalid(message);
    valid = false;
  }

  const privacy = form.querySelector('#privacy');
  if (!privacy.checked) {
    showFieldError('privacyError', 'Strinjanje s politiko zasebnosti je obvezno.');
    valid = false;
  }

  if (!valid) {
    // Focus first invalid field
    const firstInvalid = form.querySelector('.is-invalid, input:invalid, select:invalid, textarea:invalid');
    if (firstInvalid) firstInvalid.focus();
  }

  return valid;
}

function showFieldError(id, message) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message;
  el.classList.add('visible');
}

function markInvalid(el) {
  el.classList.add('is-invalid');
  el.addEventListener('input', () => {
    el.classList.remove('is-invalid');
    const errorEl = document.getElementById(el.id + 'Error');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.remove('visible');
    }
  }, { once: true });
}

function clearFormFeedback(form) {
  form.querySelectorAll('.form-error').forEach(el => {
    el.textContent = '';
    el.classList.remove('visible');
  });
  form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
}

function isValidEmail(email) {
  // Uses browser-native validation as primary check via the input type="email".
  // This regex provides an additional guard: requires at least two characters in
  // the TLD and disallows consecutive dots in domain parts.
  return /^[^\s@]+@[^\s@][^\s@]*\.[a-zA-Z]{2,}$/.test(email) &&
         !/\.{2,}/.test(email.split('@')[1] || '');
}

/* ---- Build params for EmailJS ---- */
function buildEmailParams(form) {
  const firstName = form.querySelector('#firstName').value.trim();
  const lastName  = form.querySelector('#lastName').value.trim();
  const fullName  = lastName ? `${firstName} ${lastName}` : firstName;

  const subjectSelect = form.querySelector('#subject');
  const subjectLabel  = subjectSelect.options[subjectSelect.selectedIndex]?.text || subjectSelect.value;

  return {
    from_name:  fullName,
    from_email: form.querySelector('#email').value.trim(),
    phone:      form.querySelector('#phone').value.trim() || 'Ni navedeno',
    subject:    subjectLabel,
    message:    form.querySelector('#message').value.trim(),
  };
}

/* ---- Send via EmailJS (or fallback to mailto) ---- */
async function sendEmail(params) {
  // If EmailJS is properly configured, use it
  if (
    typeof emailjs !== 'undefined' &&
    EMAILJS_PUBLIC_KEY  !== 'YOUR_PUBLIC_KEY' &&
    EMAILJS_SERVICE_ID  !== 'YOUR_SERVICE_ID' &&
    EMAILJS_TEMPLATE_ID !== 'YOUR_TEMPLATE_ID'
  ) {
    return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, params);
  }

  // Fallback: open default mail client with pre-filled message
  const body = encodeURIComponent(
    `Ime: ${params.from_name}\n` +
    `E-pošta: ${params.from_email}\n` +
    `Telefon: ${params.phone}\n` +
    `Zadeva: ${params.subject}\n\n` +
    `${params.message}`
  );
  const subject = encodeURIComponent(`[Eko Plamen] ${params.subject}`);
  window.location.href = `mailto:info@ekoplamen.si?subject=${subject}&body=${body}`;

  // Simulate a slight delay so the UI shows the success state after mailto opens
  return new Promise(resolve => setTimeout(resolve, 800));
}