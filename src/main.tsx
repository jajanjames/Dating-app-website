import './index.css';

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

    // Close menu when any navigation link inside the mobile sheet is clicked
    const mobileLinks = menuPanel.querySelectorAll<HTMLAnchorElement>('a');
    mobileLinks.forEach((link) => {
      link.addEventListener('click', () => {
        setMobileMenuOpen(false);
      });
    });

    // Close menu on outside click or Escape key
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

  // 2. Progressive Enhancement for Store Download CTAs
  const storeLinks = document.querySelectorAll<HTMLAnchorElement>('a[data-store]');
  const feedbackEl = document.getElementById('download-feedback');

  storeLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      const store = link.getAttribute('data-store');
      const downloadSection = document.getElementById('download');

      if (downloadSection) {
        event.preventDefault();
        downloadSection.scrollIntoView({ behavior: 'smooth' });
      }

      if (feedbackEl) {
        const storeName = store === 'ios' ? 'Apple App Store (iOS)' : 'Google Playstore (Android)';
        feedbackEl.textContent = `Opening Naam Dating (നാം) on ${storeName}...`;
        feedbackEl.classList.remove('hidden');
      }
    });
  });

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

  // Scroll-triggered IntersectionObserver so mobile users see live controls awaken as they scroll
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
