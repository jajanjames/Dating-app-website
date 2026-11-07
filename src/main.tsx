import './index.css';

type Gender = 'MALE' | 'FEMALE' | 'OTHER';

interface StoredWaitlistUser {
  name: string;
  countryCode: string;
  phoneNumber: string;
  gender: Gender;
  verifiedAt: string;
}

const WAITLIST_STORAGE_KEY = 'naam_waitlist_verified_v1';

async function postWaitlistApi<T>(
  endpoint: 'submit' | 'verify-otp' | 'resend-otp',
  payload: Record<string, unknown>
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/users/${endpoint}`, {
      method: 'POST',
      headers: {
        accept: '*/*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // Fallback if running without local proxy
    response = await fetch(`https://naam.gredin.app/users/${endpoint}`, {
      method: 'POST',
      headers: {
        accept: '*/*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  }

  let data: Record<string, unknown> = {};
  try {
    data = (await response.json()) as Record<string, unknown>;
  } catch {
    // Ignore non-JSON body
  }

  if (!response.ok) {
    const rawMsg = data.message;
    const message = Array.isArray(rawMsg)
      ? rawMsg.join(', ')
      : typeof rawMsg === 'string' && rawMsg.trim().length > 0
        ? rawMsg
        : `Request failed (${response.status}). Please check your details and try again.`;
    throw new Error(message);
  }

  return data as T;
}

document.addEventListener('DOMContentLoaded', () => {
  // 1. Expandable Mobile Pill Menu Sheet Controller
  const menuBtn = document.querySelector<HTMLButtonElement>('[data-mobile-menu-btn]');
  const menuPanel = document.querySelector<HTMLElement>('[data-mobile-menu-panel]');
  const iconOpen = document.querySelector<SVGElement>('[data-menu-icon-open]');
  const iconClose = document.querySelector<SVGElement>('[data-menu-icon-close]');

  const setMobileMenuOpen = (open: boolean) => {
    if (!menuBtn || !menuPanel) return;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuPanel.setAttribute('data-open', String(open));
    if (open) {
      menuPanel.classList.remove('hidden');
      requestAnimationFrame(() => {
        menuPanel.setAttribute('data-open', 'true');
      });
    } else {
      menuPanel.setAttribute('data-open', 'false');
      window.setTimeout(() => {
        if (menuPanel.getAttribute('data-open') === 'false') {
          menuPanel.classList.add('hidden');
        }
      }, 180);
    }

    if (iconOpen && iconClose) {
      iconOpen.classList.toggle('hidden', open);
      iconClose.classList.toggle('hidden', !open);
    }
  };

  if (menuBtn && menuPanel) {
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = menuBtn.getAttribute('aria-expanded') === 'true';
      setMobileMenuOpen(!isOpen);
    });

    const mobileLinks = menuPanel.querySelectorAll<HTMLAnchorElement>('a');
    mobileLinks.forEach((link) => {
      link.addEventListener('click', () => {
        setMobileMenuOpen(false);
      });
    });

    document.addEventListener('click', (e) => {
      if (
        menuBtn.getAttribute('aria-expanded') === 'true' &&
        !menuPanel.contains(e.target as Node) &&
        !menuBtn.contains(e.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') {
        setMobileMenuOpen(false);
        menuBtn.focus();
      }
    });
  }

  // 2. 2-Step Naam Waitlist Modal & Live API Controller (https://naam.gredin.app/users/*)
  const modal = document.getElementById('waitlist-modal');
  const openBtns = document.querySelectorAll<HTMLElement>('[data-open-waitlist]');
  const closeBtns = document.querySelectorAll<HTMLElement>('[data-close-waitlist]');
  const step1El = document.getElementById('wl-step-1');
  const step2El = document.getElementById('wl-step-2');
  const step3El = document.getElementById('wl-step-3');

  const submitForm = document.getElementById('wl-submit-form') as HTMLFormElement | null;
  const nameInput = document.getElementById('wl-name') as HTMLInputElement | null;
  const countryCodeSelect = document.getElementById('wl-country-code') as HTMLSelectElement | null;
  const phoneInput = document.getElementById('wl-phone') as HTMLInputElement | null;
  const genderInput = document.getElementById('wl-gender') as HTMLInputElement | null;
  const genderBtns = document.querySelectorAll<HTMLButtonElement>('button[data-wl-gender]');
  const step1Error = document.getElementById('wl-step1-error');
  const submitBtn = document.getElementById('wl-submit-btn') as HTMLButtonElement | null;

  const verifyForm = document.getElementById('wl-verify-form') as HTMLFormElement | null;
  const otpInput = document.getElementById('wl-otp') as HTMLInputElement | null;
  const displayPhoneEl = document.getElementById('wl-display-phone');
  const editPhoneBtn = document.getElementById('wl-edit-phone-btn');
  const step2Feedback = document.getElementById('wl-step2-feedback');
  const verifyBtn = document.getElementById('wl-verify-btn') as HTMLButtonElement | null;
  const resendBtn = document.getElementById('wl-resend-btn') as HTMLButtonElement | null;

  const confirmedNameEl = document.getElementById('wl-confirmed-name');
  const confirmedPhoneEl = document.getElementById('wl-confirmed-phone');
  const waitlistBtnLabels = document.querySelectorAll<HTMLElement>('[data-waitlist-btn-text]');

  let currentName = '';
  let currentCountryCode = '+91';
  let currentPhoneNumber = '';
  let currentGender: Gender = 'FEMALE';
  let resendTimer: number | null = null;

  const updateButtonLabelsIfVerified = () => {
    try {
      const raw = localStorage.getItem(WAITLIST_STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as StoredWaitlistUser;
      if (saved && saved.phoneNumber) {
        waitlistBtnLabels.forEach((el) => {
          el.textContent = 'Waitlist Joined ✓';
        });
      }
    } catch {
      // Ignore storage read errors
    }
  };

  updateButtonLabelsIfVerified();

  const showStep = (step: 1 | 2 | 3) => {
    if (!step1El || !step2El || !step3El) return;
    step1El.classList.toggle('hidden', step !== 1);
    step2El.classList.toggle('hidden', step !== 2);
    step3El.classList.toggle('hidden', step !== 3);

    if (step === 1) {
      window.setTimeout(() => nameInput?.focus(), 60);
    } else if (step === 2) {
      window.setTimeout(() => otpInput?.focus(), 60);
    }
  };

  const startResendCooldown = () => {
    if (!resendBtn) return;
    if (resendTimer !== null) {
      window.clearInterval(resendTimer);
    }
    let remaining = 30;
    resendBtn.disabled = true;
    resendBtn.textContent = `Resend OTP (${remaining}s)`;

    resendTimer = window.setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        if (resendTimer !== null) window.clearInterval(resendTimer);
        resendTimer = null;
        resendBtn.disabled = false;
        resendBtn.textContent = 'Resend OTP';
      } else {
        resendBtn.textContent = `Resend OTP (${remaining}s)`;
      }
    }, 1000);
  };

  const openWaitlistModal = () => {
    if (!modal) return;
    setMobileMenuOpen(false);
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      modal.setAttribute('data-open', 'true');
    });

    try {
      const raw = localStorage.getItem(WAITLIST_STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as StoredWaitlistUser;
        if (saved && saved.phoneNumber && confirmedNameEl && confirmedPhoneEl) {
          confirmedNameEl.textContent = saved.name;
          confirmedPhoneEl.textContent = `${saved.countryCode} ${saved.phoneNumber}`;
          showStep(3);
          return;
        }
      }
    } catch {
      // Continue to step 1
    }

    showStep(1);
  };

  const closeWaitlistModal = () => {
    if (!modal) return;
    modal.setAttribute('data-open', 'false');
    document.body.style.overflow = '';
    window.setTimeout(() => {
      if (modal.getAttribute('data-open') === 'false') {
        modal.classList.add('hidden');
      }
    }, 200);
  };

  openBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openWaitlistModal();
    });
  });

  closeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      closeWaitlistModal();
    });
  });

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeWaitlistModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.getAttribute('data-open') === 'true') {
        closeWaitlistModal();
      }
    });
  }

  // Auto-open waitlist modal if navigated with #waitlist hash (e.g. from Privacy/Terms pages)
  if (window.location.hash === '#waitlist') {
    openWaitlistModal();
  }

  // Gender Pill Selector in Step 1
  genderBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const val = (btn.getAttribute('data-wl-gender') || 'FEMALE') as Gender;
      currentGender = val;
      if (genderInput) {
        genderInput.value = val;
      }
      genderBtns.forEach((b) => {
        const active = b.getAttribute('data-wl-gender') === val;
        b.className = active
          ? 'rounded-[10px] bg-[#111111] py-2.5 text-[13px] font-semibold text-white transition-all whitespace-nowrap cursor-pointer'
          : 'rounded-[10px] py-2.5 text-[13px] font-medium text-[#52525B] hover:text-[#1D1D1F] transition-all whitespace-nowrap cursor-pointer';
      });
    });
  });

  // Sanitize phone input to digits only
  if (phoneInput) {
    phoneInput.addEventListener('input', () => {
      phoneInput.value = phoneInput.value.replace(/\D/g, '').slice(0, 14);
    });
  }

  // Sanitize OTP input to digits only
  if (otpInput) {
    otpInput.addEventListener('input', () => {
      otpInput.value = otpInput.value.replace(/\D/g, '').slice(0, 6);
    });
  }

  // Step 1 Submit Handler -> POST /users/submit
  if (submitForm) {
    submitForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!nameInput || !countryCodeSelect || !phoneInput || !submitBtn) return;

      const name = nameInput.value.trim();
      const countryCode = countryCodeSelect.value.trim();
      const phoneNumber = phoneInput.value.replace(/\D/g, '');
      const gender = currentGender;

      if (step1Error) {
        step1Error.classList.add('hidden');
        step1Error.textContent = '';
      }

      if (name.length < 2) {
        if (step1Error) {
          step1Error.textContent = 'Please enter your full name.';
          step1Error.classList.remove('hidden');
        }
        nameInput.focus();
        return;
      }

      if (phoneNumber.length < 6 || phoneNumber.length > 14) {
        if (step1Error) {
          step1Error.textContent = 'Please enter a valid WhatsApp phone number.';
          step1Error.classList.remove('hidden');
        }
        phoneInput.focus();
        return;
      }

      submitBtn.disabled = true;
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Sending OTP on WhatsApp...';

      try {
        await postWaitlistApi<{ userId?: string; message?: string }>('submit', {
          name,
          countryCode,
          phoneNumber,
          gender,
        });

        currentName = name;
        currentCountryCode = countryCode;
        currentPhoneNumber = phoneNumber;

        if (displayPhoneEl) {
          displayPhoneEl.textContent = `${countryCode} ${phoneNumber}`;
        }
        if (otpInput) {
          otpInput.value = '';
        }
        if (step2Feedback) {
          step2Feedback.classList.add('hidden');
          step2Feedback.textContent = '';
        }

        showStep(2);
        startResendCooldown();
      } catch (err) {
        if (step1Error) {
          step1Error.textContent =
            err instanceof Error ? err.message : 'Unable to send OTP right now. Please try again.';
          step1Error.classList.remove('hidden');
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText || 'Send WhatsApp OTP';
      }
    });
  }

  // Change Phone Number button in Step 2
  if (editPhoneBtn) {
    editPhoneBtn.addEventListener('click', () => {
      showStep(1);
    });
  }

  // Step 2 Resend OTP Handler -> POST /users/resend-otp
  if (resendBtn) {
    resendBtn.addEventListener('click', async () => {
      if (!currentPhoneNumber || resendBtn.disabled) return;
      resendBtn.disabled = true;
      resendBtn.textContent = 'Sending...';

      if (step2Feedback) {
        step2Feedback.classList.add('hidden');
      }

      try {
        await postWaitlistApi('resend-otp', {
          phoneNumber: currentPhoneNumber,
        });

        if (step2Feedback) {
          step2Feedback.textContent = `A new OTP has been sent to ${currentCountryCode} ${currentPhoneNumber} on WhatsApp.`;
          step2Feedback.className =
            'rounded-[12px] bg-[#DCFCE7] px-3.5 py-2.5 text-[12.5px] font-medium text-[#15803D]';
        }
        startResendCooldown();
      } catch (err) {
        resendBtn.disabled = false;
        resendBtn.textContent = 'Resend OTP';
        if (step2Feedback) {
          step2Feedback.textContent =
            err instanceof Error ? err.message : 'Failed to resend OTP. Please try again.';
          step2Feedback.className =
            'rounded-[12px] bg-[#FFF0F5] px-3.5 py-2.5 text-[12.5px] font-medium text-[#F01264]';
        }
      }
    });
  }

  // Step 2 Verify OTP Handler -> POST /users/verify-otp
  if (verifyForm) {
    verifyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!otpInput || !verifyBtn) return;

      const otp = otpInput.value.replace(/\D/g, '');
      if (otp.length < 4) {
        if (step2Feedback) {
          step2Feedback.textContent = 'Please enter the verification code sent to your WhatsApp.';
          step2Feedback.className =
            'rounded-[12px] bg-[#FFF0F5] px-3.5 py-2.5 text-[12.5px] font-medium text-[#F01264]';
        }
        otpInput.focus();
        return;
      }

      verifyBtn.disabled = true;
      const originalText = verifyBtn.textContent;
      verifyBtn.textContent = 'Verifying OTP...';

      if (step2Feedback) {
        step2Feedback.classList.add('hidden');
      }

      try {
        await postWaitlistApi('verify-otp', {
          phoneNumber: currentPhoneNumber,
          otp,
        });

        const record: StoredWaitlistUser = {
          name: currentName,
          countryCode: currentCountryCode,
          phoneNumber: currentPhoneNumber,
          gender: currentGender,
          verifiedAt: new Date().toISOString(),
        };

        try {
          localStorage.setItem(WAITLIST_STORAGE_KEY, JSON.stringify(record));
        } catch {
          // Ignore storage write error
        }

        if (confirmedNameEl) {
          confirmedNameEl.textContent = currentName;
        }
        if (confirmedPhoneEl) {
          confirmedPhoneEl.textContent = `${currentCountryCode} ${currentPhoneNumber}`;
        }

        updateButtonLabelsIfVerified();
        showStep(3);
      } catch (err) {
        if (step2Feedback) {
          step2Feedback.textContent =
            err instanceof Error ? err.message : 'Invalid or expired OTP. Please try again.';
          step2Feedback.className =
            'rounded-[12px] bg-[#FFF0F5] px-3.5 py-2.5 text-[12.5px] font-medium text-[#F01264]';
        }
      } finally {
        verifyBtn.disabled = false;
        verifyBtn.textContent = originalText || 'Verify & Join Waitlist';
      }
    });
  }

  // 3. Bento Cards: Desktop Cursor Spotlight + Mobile Scroll-Triggered Awakening
  const bentoCards = document.querySelectorAll<HTMLElement>('.bento-card');

  bentoCards.forEach((card) => {
    const visual = card.querySelector<HTMLElement>('.bento-visual');

    card.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);

      if (visual) {
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const deltaX = ((x - centerX) / centerX) * 5;
        const deltaY = ((y - centerY) / centerY) * 4;
        visual.style.transform = `translate3d(${deltaX.toFixed(2)}px, ${(deltaY - 5).toFixed(2)}px, 0) scale(1.03)`;
      }
    });

    card.addEventListener('pointerleave', () => {
      if (visual) {
        visual.style.transform = '';
      }
    });
  });

  if ('IntersectionObserver' in window && bentoCards.length > 0) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const card = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            card.setAttribute('data-in-view', 'true');
          } else {
            card.setAttribute('data-in-view', 'false');
          }
        });
      },
      {
        root: null,
        rootMargin: '-10% 0px -10% 0px',
        threshold: 0.45,
      }
    );

    bentoCards.forEach((card) => observer.observe(card));
  }

  // 4. Bento Card 1: Verified Profile Like Toggle
  const verifiedCard = document.querySelector<HTMLElement>('[data-bento="verified"]');
  const likeLabel = document.querySelector<HTMLElement>('[data-like-label]');
  let isLiked = false;

  if (verifiedCard && likeLabel) {
    const visual = verifiedCard.querySelector<HTMLElement>('.bento-visual');
    verifiedCard.addEventListener('click', () => {
      isLiked = !isLiked;
      verifiedCard.setAttribute('data-active', String(isLiked));
      likeLabel.textContent = isLiked
        ? 'Liked Meera, 26 (Kochi) · Match Ready ♥'
        : 'Selfie Verified · Meera, 26 (Kochi) · Send a Like ♥';
      likeLabel.parentElement?.classList.toggle('bg-[#FFF0F5]', isLiked);
      likeLabel.parentElement?.classList.toggle('text-[#F01264]', isLiked);
      if (visual) {
        visual.style.transform = isLiked ? 'translate3d(0, -6px, 0) scale(1.04) rotate(-1deg)' : '';
      }
    });
  }

  // 5. Bento Card 2: Women-First Privacy Blur Shield Toggle
  const privacyCard = document.querySelector<HTMLElement>('[data-bento="privacy"]');
  const blurTarget = document.querySelector<HTMLElement>('[data-blur-target]');
  const blurLabel = document.querySelector<HTMLElement>('[data-blur-label]');
  let isBlurred = false;

  if (privacyCard && blurTarget && blurLabel) {
    privacyCard.addEventListener('click', () => {
      isBlurred = !isBlurred;
      privacyCard.setAttribute('data-active', String(isBlurred));
      blurTarget.style.filter = isBlurred ? 'blur(6px) contrast(0.96)' : 'none';
      blurLabel.textContent = isBlurred
        ? 'Photo Blurred · Tap to Reveal'
        : 'Shield Active · Tap to Blur Photo';
    });
  }

  // 6. Bento Card 3: Global Time-Zone Hub Cycle
  const globalCard = document.querySelector<HTMLElement>('[data-bento="global"]');
  const timezoneLabel = document.querySelector<HTMLElement>('[data-timezone-label]');
  const hubs = [
    '20+ Countries · 50+ Cities · 0 Fake Profiles',
    'Kochi & Bangalore (IST) · 4,200+ Active',
    'Dubai & GCC (GST) · 3,100+ Active',
    'London, Toronto & NYC · 2,700+ Active',
  ];
  let hubIndex = 0;

  if (globalCard && timezoneLabel) {
    const visual = globalCard.querySelector<HTMLElement>('.bento-visual');
    globalCard.addEventListener('click', () => {
      hubIndex = (hubIndex + 1) % hubs.length;
      globalCard.setAttribute('data-active', hubIndex > 0 ? 'true' : 'false');
      timezoneLabel.textContent = hubs[hubIndex];
      if (visual) {
        visual.style.transform = hubIndex % 2 === 1 ? 'translate3d(0, -5px, 0) scale(1.035)' : '';
      }
    });
  }

  // 7. Bento Card 4: Block Contacts Cycle
  const contactsCard = document.querySelector<HTMLElement>('[data-bento="contacts"]');
  const contactsLabel = document.querySelector<HTMLElement>('[data-contacts-label]');
  const contactStates = [
    'Hide from known contacts on the app ✓',
    'Family, Friends & Relatives Blocked ✓',
    'SHA-256 On-Device Contact Shield ✓',
  ];
  let contactIndex = 0;

  if (contactsCard && contactsLabel) {
    contactsCard.addEventListener('click', () => {
      contactIndex = (contactIndex + 1) % contactStates.length;
      contactsCard.setAttribute('data-active', contactIndex > 0 ? 'true' : 'false');
      contactsLabel.textContent = contactStates[contactIndex];
    });
  }

  // 8. Bento Card 5: Switch Modes (Casual / Serious / Marriage)
  const modesCard = document.querySelector<HTMLElement>('[data-bento="modes"]');
  const intentionBtns = document.querySelectorAll<HTMLButtonElement>('button[data-intention]');
  const modesStatus = document.querySelector<HTMLElement>('[data-modes-status]');
  const modeDescriptions: Record<string, string> = {
    Casual: 'Kochi · Chaya Dates & Malayalam Indie',
    Serious: 'Worldwide · Meaningful Malayali Connections',
    Marriage: 'Global · Long-Term Partner on Your Own Terms',
  };

  const selectIntention = (selected: string) => {
    if (modesCard) {
      modesCard.setAttribute('data-active', 'true');
    }
    intentionBtns.forEach((b) => {
      const isCurrent = b.getAttribute('data-intention') === selected;
      b.className = isCurrent
        ? 'rounded-full bg-[#6C3CE9] px-3 py-1 text-[11px] font-semibold text-white transition-colors whitespace-nowrap'
        : 'rounded-full px-3 py-1 text-[11px] font-medium text-[#52525B] hover:text-[#1D1D1F] transition-colors whitespace-nowrap';
    });
    if (modesStatus && modeDescriptions[selected]) {
      modesStatus.textContent = modeDescriptions[selected];
    }
  };

  intentionBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const selected = btn.getAttribute('data-intention') || 'Serious';
      selectIntention(selected);
    });
  });

  if (modesCard && intentionBtns.length > 0) {
    const order = ['Casual', 'Serious', 'Marriage'];
    let currentIdx = 1;
    modesCard.addEventListener('click', () => {
      currentIdx = (currentIdx + 1) % order.length;
      selectIntention(order[currentIdx]);
    });
  }
});
