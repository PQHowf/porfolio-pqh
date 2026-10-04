/**
 * PORTFOLIO - PHẠM QUỐC HUY
 * Interactivity & Dual View Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  /* ==========================================================================
     1. THEME SETTING
     ========================================================================== */
  document.documentElement.setAttribute('data-theme', 'light');

  /* ==========================================================================
     2. HEADER SCROLL & SCROLL-SPY
     ========================================================================== */
  const siteHeader = document.getElementById('site-header');
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.desktop-nav .nav-link');

  window.addEventListener('scroll', () => {
    // Header shadow
    if (window.scrollY > 40) {
      siteHeader.classList.add('scrolled');
    } else {
      siteHeader.classList.remove('scrolled');
    }

    // Active Section Spy
    let currentId = '';
    const scrollPos = window.scrollY + 120;

    sections.forEach(sec => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        currentId = sec.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentId}`) {
        link.classList.add('active');
      }
    });
  });

  /* ==========================================================================
     3. MOBILE DRAWER NAVIGATION
     ========================================================================== */
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileDrawer = document.getElementById('mobile-drawer');
  const closeDrawerBtn = document.getElementById('close-drawer-btn');
  const drawerBackdrop = document.getElementById('drawer-backdrop');
  const mobileLinks = document.querySelectorAll('.mobile-link');

  function openDrawer() {
    mobileDrawer.classList.add('open');
    drawerBackdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    mobileDrawer.classList.remove('open');
    drawerBackdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openDrawer);
  if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', closeDrawer);
  if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeDrawer);

  mobileLinks.forEach(link => {
    link.addEventListener('click', closeDrawer);
  });

  /* ==========================================================================
     4. VIDEO PLAYBACK & SEAMLESS AUDIO MANAGEMENT
     ========================================================================== */
  const phoneCards = document.querySelectorAll('.phone-showcase-card, .editor-card');
  let userHasInteracted = false;
  let lastUnmuteTimestamp = 0;

  function hasUserInteracted() {
    if (typeof navigator !== 'undefined' && navigator.userActivation) {
      if (navigator.userActivation.hasBeenActive) return true;
    }
    return userHasInteracted;
  }

  // Stop any other currently playing videos so sounds never clash
  function stopAllOtherVideos(exceptCard) {
    phoneCards.forEach(c => {
      if (c !== exceptCard) {
        const v = c.querySelector('.showcase-video');
        if (v && !v.paused) {
          v.pause();
        }
      }
    });
  }

  // Pre-configure all videos with full volume
  phoneCards.forEach(card => {
    const video = card.querySelector('.showcase-video');
    const soundIcon = card.querySelector('.sound-icon');
    if (video) {
      video.muted = false;
      video.volume = 1.0;
    }
    if (soundIcon) {
      soundIcon.textContent = '🔊';
    }
  });

  // Helper to show/hide the "Click để bật tiếng" badge on the video
  function showUnmuteBadge(card) {
    const screenFrame = card.querySelector('.phone-screen, .video-16-9-wrapper');
    if (!screenFrame || screenFrame.querySelector('.unmute-badge')) return;
    const badge = document.createElement('div');
    badge.className = 'unmute-badge';
    badge.innerHTML = '<span class="unmute-badge-icon">🔊</span> Nhấp để bật tiếng';
    screenFrame.appendChild(badge);
  }

  function hideUnmuteBadge(card) {
    const badge = card.querySelector('.unmute-badge');
    if (badge) {
      badge.remove();
    }
  }

  // Unmute a specific card smoothly
  function unmuteCard(card) {
    const video = card.querySelector('.showcase-video');
    const soundIcon = card.querySelector('.sound-icon');
    if (video) {
      video.muted = false;
      video.volume = 1.0;
    }
    if (soundIcon) {
      soundIcon.textContent = '🔊';
    }
    hideUnmuteBadge(card);
    lastUnmuteTimestamp = Date.now();
  }

  // Global user gesture listener: unlocks audio across the entire site
  function handleGlobalGesture(e) {
    userHasInteracted = true;
    phoneCards.forEach(c => {
      const v = c.querySelector('.showcase-video');
      if (v && !v.paused && v.muted) {
        if (c.contains(e.target)) {
          unmuteCard(c);
        }
      }
    });
  }

  ['pointerdown', 'touchstart', 'click', 'keydown'].forEach(evt => {
    window.addEventListener(evt, handleGlobalGesture, { passive: true });
  });

  phoneCards.forEach(card => {
    const video = card.querySelector('.showcase-video');
    const soundBtn = card.querySelector('.sound-toggle-btn');
    const soundIcon = soundBtn?.querySelector('.sound-icon');
    const openBtn = card.querySelector('.open-modal-btn');
    const screenFrame = card.querySelector('.phone-screen, .video-16-9-wrapper');

    if (!video) return;

    // Play video with audio
    function playVideoWithAudio(forceUnmute = false) {
      stopAllOtherVideos(card);

      if (forceUnmute || hasUserInteracted()) {
        video.muted = false;
        video.volume = 1.0;
        if (soundIcon) soundIcon.textContent = '🔊';
      }

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            if (!video.muted) {
              if (soundIcon) soundIcon.textContent = '🔊';
              hideUnmuteBadge(card);
            }
          })
          .catch(() => {
            // Browser Autoplay Policy blocked unmuted playback on initial hover.
            // Fall back to playing muted smoothly, show clear status & badge to user:
            video.muted = true;
            if (soundIcon) soundIcon.textContent = '🔇';
            showUnmuteBadge(card);
            video.play().catch(() => {});
          });
      }
    }

    // Hover to play
    card.addEventListener('mouseenter', () => {
      playVideoWithAudio(false);
    });

    card.addEventListener('mouseleave', () => {
      video.pause();
      hideUnmuteBadge(card);
      // Keep unmuted for next time
      video.muted = false;
      if (soundIcon) soundIcon.textContent = '🔊';
    });

    // Ensure play button overlay is hidden whenever video is playing
    video.addEventListener('play', () => {
      card.classList.add('is-playing');
      const overlayBtn = card.querySelector('.video-overlay-btn');
      if (overlayBtn) {
        overlayBtn.style.opacity = '0';
        overlayBtn.style.visibility = 'hidden';
      }
    });

    video.addEventListener('pause', () => {
      card.classList.remove('is-playing');
      const overlayBtn = card.querySelector('.video-overlay-btn');
      if (overlayBtn) {
        overlayBtn.style.opacity = '';
        overlayBtn.style.visibility = '';
      }
    });

    // Clicking the video screen directly guarantees play WITH SOUND
    if (screenFrame) {
      screenFrame.addEventListener('click', (e) => {
        if (e.target.closest('.sound-toggle-btn')) return;
        userHasInteracted = true;

        // If this gesture already unmuted via pointerdown / global listener, don't pause!
        if (Date.now() - lastUnmuteTimestamp < 400) {
          return;
        }

        // CRITICAL FIX: If the video is currently playing muted (e.g. from first hover),
        // clicking it MUST IMMEDIATELY UNMUTE IT and continue playing!
        // DO NOT PAUSE IT!
        if (!video.paused && video.muted) {
          unmuteCard(card);
          return;
        }

        // If paused, play with audio
        if (video.paused) {
          playVideoWithAudio(true);
        } else {
          // If already playing unmuted, clicking pauses it
          video.pause();
        }
      });
    }

    // Sound toggle button: strictly controls ONLY this individual card
    if (soundBtn) {
      soundBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userHasInteracted = true;

        if (video.muted) {
          unmuteCard(card);
          if (video.paused) {
            playVideoWithAudio(true);
          }
        } else {
          video.muted = true;
          if (soundIcon) soundIcon.textContent = '🔇';
        }
      });
    }

    // Click "Xem chi tiết" / "Phóng to xem đầy đủ" button to open Theatre Lightbox
    if (openBtn) {
      openBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userHasInteracted = true;
        const videoSrc = card.getAttribute('data-video');
        const videoTitle = card.getAttribute('data-title') || 'Video Showcase';
        const currentTime = (video && !video.paused) ? video.currentTime : 0;
        openVideoModal(videoSrc, videoTitle, currentTime);
      });
    }
  });

  /* ==========================================================================
     5. VIDEO THEATRE MODAL (Fast Streaming & Audio)
     ========================================================================== */
  const videoModal = document.getElementById('video-modal');
  const modalVideoTitle = document.getElementById('modal-video-title');
  const modalVideoElement = document.getElementById('modal-video-element');
  const modalSpinner = document.getElementById('modal-spinner');
  const closeModalBtn = document.getElementById('close-modal-btn');

  function openVideoModal(src, title, startTime = 0) {
    if (!videoModal || !modalVideoElement) return;
    stopAllOtherVideos(null);
    modalVideoTitle.textContent = title;

    // Show loading spinner while video prepares first frames
    if (modalSpinner) modalSpinner.classList.add('active');

    videoModal.classList.add('open');
    videoModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Only update source if different to prevent re-fetching
    if (modalVideoElement.getAttribute('data-loaded-src') !== src) {
      modalVideoElement.setAttribute('data-loaded-src', src);
      modalVideoElement.src = src;
      modalVideoElement.load();
    }

    if (startTime > 0) {
      modalVideoElement.currentTime = startTime;
    } else {
      modalVideoElement.currentTime = 0;
    }

    modalVideoElement.muted = false;
    modalVideoElement.volume = 1.0;

    const playPromise = modalVideoElement.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          if (modalSpinner) modalSpinner.classList.remove('active');
        })
        .catch(() => {
          modalVideoElement.muted = true;
          modalVideoElement.play().catch(() => {});
          if (modalSpinner) modalSpinner.classList.remove('active');
        });
    }

    modalVideoElement.oncanplay = () => {
      if (modalSpinner) modalSpinner.classList.remove('active');
    };
    modalVideoElement.onplaying = () => {
      if (modalSpinner) modalSpinner.classList.remove('active');
    };
    modalVideoElement.onwaiting = () => {
      if (modalSpinner) modalSpinner.classList.add('active');
    };
  }

  function closeVideoModal() {
    if (!videoModal || !modalVideoElement) return;
    modalVideoElement.pause();
    if (modalSpinner) modalSpinner.classList.remove('active');
    videoModal.classList.remove('open');
    videoModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (closeModalBtn) closeModalBtn.addEventListener('click', closeVideoModal);

  if (videoModal) {
    videoModal.addEventListener('click', (e) => {
      if (e.target === videoModal) closeVideoModal();
    });
  }

  /* ==========================================================================
     6. CANVA SLIDE PRESENTATION ENGINE (7 Slides)
     ========================================================================== */
  const slideModeBtn = document.getElementById('view-mode-btn');
  const mobileSlideBtn = document.getElementById('mobile-slide-btn');
  const slideContainer = document.getElementById('slide-mode-container');
  const exitSlideBtn = document.getElementById('exit-slide-mode');
  const slideCounter = document.getElementById('slide-counter');
  const slidePrevBtn = document.getElementById('slide-prev-btn');
  const slideNextBtn = document.getElementById('slide-next-btn');
  const slideDots = document.querySelectorAll('.dot-btn');
  const slides = document.querySelectorAll('.canva-slide');

  let currentSlide = 1;
  const totalSlides = slides.length;

  function setSlide(n) {
    if (n < 1) n = totalSlides;
    if (n > totalSlides) n = 1;
    currentSlide = n;

    // Update slides visibility
    slides.forEach((s, idx) => {
      const isActive = idx + 1 === currentSlide;
      s.classList.toggle('active', isActive);

      // Play video in current slide if any
      const vids = s.querySelectorAll('.c-slide-video');
      vids.forEach(v => {
        if (isActive) {
          v.play().catch(() => { });
        } else {
          v.pause();
        }
      });
    });

    // Update dots
    slideDots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx + 1 === currentSlide);
    });

    // Update counter
    if (slideCounter) {
      slideCounter.textContent = `Slide ${currentSlide} / ${totalSlides}`;
    }
  }

  function openSlideMode() {
    if (!slideContainer) return;
    slideContainer.classList.add('active');
    slideContainer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setSlide(currentSlide);
    showToast('Đang ở chế độ Slide Canva. Dùng phím mũi tên ← → để chuyển trang');
  }

  function closeSlideMode() {
    if (!slideContainer) return;
    slideContainer.classList.remove('active');
    slideContainer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    // Pause all slide videos
    const allSlideVids = slideContainer.querySelectorAll('video');
    allSlideVids.forEach(v => v.pause());
  }

  if (slideModeBtn) slideModeBtn.addEventListener('click', openSlideMode);
  if (mobileSlideBtn) {
    mobileSlideBtn.addEventListener('click', () => {
      closeDrawer();
      openSlideMode();
    });
  }
  if (exitSlideBtn) exitSlideBtn.addEventListener('click', closeSlideMode);

  if (slidePrevBtn) slidePrevBtn.addEventListener('click', () => setSlide(currentSlide - 1));
  if (slideNextBtn) slideNextBtn.addEventListener('click', () => setSlide(currentSlide + 1));

  slideDots.forEach(dot => {
    dot.addEventListener('click', () => {
      const target = parseInt(dot.getAttribute('data-goto'), 10);
      if (!isNaN(target)) setSlide(target);
    });
  });

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    // If video modal is open, Esc closes modal
    if (videoModal && videoModal.classList.contains('open')) {
      if (e.key === 'Escape') closeVideoModal();
      return;
    }

    // If slide mode is open
    if (slideContainer && slideContainer.classList.contains('active')) {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        setSlide(currentSlide + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setSlide(currentSlide - 1);
      } else if (e.key === 'Escape') {
        closeSlideMode();
      }
    }
  });

  /* ==========================================================================
     7. 1-CLICK COPY TO CLIPBOARD
     ========================================================================== */
  const copyButtons = document.querySelectorAll('.copy-btn');
  copyButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const textToCopy = btn.getAttribute('data-copy');
      if (textToCopy) {
        navigator.clipboard.writeText(textToCopy).then(() => {
          showToast(`Đã sao chép: ${textToCopy}`);
        }).catch(() => {
          showToast('Sao chép thất bại, vui lòng chọn thủ công.');
        });
      }
    });
  });

  /* ==========================================================================
     8. TOAST NOTIFICATION
     ========================================================================== */
  const toast = document.getElementById('toast-notification');
  const toastMessage = document.getElementById('toast-message');
  let toastTimer = null;

  function showToast(msg) {
    if (!toast || !toastMessage) return;
    toastMessage.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  /* ==========================================================================
     9. QUICK CONTACT FORM
     ========================================================================== */
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('form-name')?.value || 'bạn';
      showToast(`Cảm ơn ${name}! Tin nhắn đã được gửi thành công.`);
      contactForm.reset();
    });
  }
});
