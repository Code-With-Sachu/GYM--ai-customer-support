/* =========================================================
   IRONFORGE FITNESS — script.js
   Table of Contents:
   1. Preloader
   2. Sticky Navbar + Active Link
   3. Mobile Menu
   4. Smooth Scroll (anchor links)
   5. Scroll Reveal (IntersectionObserver)
   6. Animated Counters
   7. Cursor Glow
   8. Testimonial Slider
   9. Feature Video Play Button
   10. Contact Form Validation
   11. Newsletter Form
   12. Back To Top
   13. Footer Year
   14. AI Customer Support Agent
   ========================================================= */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    initPreloader();
    initNavbar();
    initMobileMenu();
    initSmoothScroll();
    initScrollReveal();
    initCounters();
    initCursorGlow();
    initTestimonialSlider();
    initFeatureVideo();
    initContactForm();
    initNewsletterForm();
    initBackToTop();
    initFooterYear();
    initAIAssistant();
  }

  /* ============ 1. Preloader ============ */
  function initPreloader() {
    var preloader = document.getElementById('preloader');
    var pctEl = document.getElementById('preloaderPct');
    if (!preloader) return;

    var hidden = false;
    function hide() {
      if (hidden) return;
      hidden = true;
      if (pctEl) pctEl.textContent = '100%';
      preloader.classList.add('loaded');
      document.body.classList.remove('no-scroll');
    }

    document.body.classList.add('no-scroll');

    // Animate the percentage readout in step with the CSS progress bar
    // (loadBar keyframe runs 1.6s — see style.css). Purely cosmetic;
    // actual hide timing is driven by window 'load' + fallback below.
    if (pctEl) {
      var start = null;
      var duration = 1600;
      function stepPct(ts) {
        if (hidden) return;
        if (!start) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        pctEl.textContent = Math.floor(progress * 100) + '%';
        if (progress < 1) requestAnimationFrame(stepPct);
      }
      requestAnimationFrame(stepPct);
    }

    window.addEventListener('load', function () {
      setTimeout(hide, 400);
    });

    // Fallback in case 'load' takes too long or already fired
    setTimeout(hide, 2500);
  }

  /* ============ 2. Sticky Navbar + Active Link ============ */
  function initNavbar() {
    var navbar = document.getElementById('navbar');
    if (!navbar) return;

    function onScroll() {
      if (window.scrollY > 40) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    var sections = Array.prototype.slice.call(document.querySelectorAll('main section[id], .hero[id]'));
    var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-link'));

    if (!sections.length || !navLinks.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.getAttribute('id');
          navLinks.forEach(function (link) {
            var match = link.getAttribute('href') === '#' + id;
            link.classList.toggle('active', match);
          });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  /* ============ 3. Mobile Menu ============ */
  function initMobileMenu() {
    var hamburger = document.getElementById('hamburger');
    var mobileMenu = document.getElementById('mobileMenu');
    if (!hamburger || !mobileMenu) return;

    function closeMenu() {
      hamburger.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
      mobileMenu.classList.remove('open');
      document.body.classList.remove('no-scroll');
    }

    function toggleMenu() {
      var isOpen = mobileMenu.classList.toggle('open');
      hamburger.classList.toggle('active', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
      document.body.classList.toggle('no-scroll', isOpen);
    }

    hamburger.addEventListener('click', toggleMenu);

    var mobileLinks = mobileMenu.querySelectorAll('.mobile-link, .mobile-menu-footer a');
    mobileLinks.forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
  }

  /* ============ 4. Smooth Scroll ============ */
  function initSmoothScroll() {
    var links = document.querySelectorAll('a[href^="#"]');
    links.forEach(function (link) {
      link.addEventListener('click', function (e) {
        var targetId = link.getAttribute('href');
        if (!targetId || targetId === '#') return;
        var target = document.querySelector(targetId);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  /* ============ 5. Scroll Reveal ============ */
  function initScrollReveal() {
    var revealEls = document.querySelectorAll('[data-reveal]');
    if (!revealEls.length) return;

    if (!('IntersectionObserver' in window)) {
      revealEls.forEach(function (el) { el.classList.add('in-view'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    revealEls.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ============ 6. Animated Counters ============ */
  function initCounters() {
    var counters = document.querySelectorAll('[data-counter]');
    if (!counters.length) return;

    function animateCounter(el) {
      var target = parseInt(el.getAttribute('data-target'), 10) || 0;
      var duration = 1800;
      var startTime = null;

      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        var progress = Math.min((timestamp - startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var value = Math.floor(eased * target);
        el.textContent = value.toLocaleString();

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = target.toLocaleString();
        }
      }
      requestAnimationFrame(step);
    }

    if (!('IntersectionObserver' in window)) {
      counters.forEach(animateCounter);
      return;
    }

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ============ 7. Cursor Glow ============ */
  function initCursorGlow() {
    var glow = document.getElementById('cursorGlow');
    if (!glow) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    var mouseX = window.innerWidth / 2;
    var mouseY = window.innerHeight / 2;
    var currentX = mouseX;
    var currentY = mouseY;

    window.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function animate() {
      currentX += (mouseX - currentX) * 0.12;
      currentY += (mouseY - currentY) * 0.12;
      glow.style.transform = 'translate(' + currentX + 'px,' + currentY + 'px) translate(-50%,-50%)';
      requestAnimationFrame(animate);
    }
    animate();
  }

  /* ============ 8. Testimonial Slider ============ */
  function initTestimonialSlider() {
    var slidesWrap = document.getElementById('testimonialSlides');
    var dotsWrap = document.getElementById('testimonialDots');
    var prevBtn = document.getElementById('testimonialPrev');
    var nextBtn = document.getElementById('testimonialNext');
    if (!slidesWrap || !dotsWrap || !prevBtn || !nextBtn) return;

    var slides = Array.prototype.slice.call(slidesWrap.querySelectorAll('.testimonial-card'));
    if (!slides.length) return;

    var current = 0;
    var intervalId = null;

    slides.forEach(function (_, i) {
      var dot = document.createElement('button');
      dot.className = 'testimonial-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'Go to testimonial ' + (i + 1));
      dot.addEventListener('click', function () {
        goTo(i);
        restartAutoplay();
      });
      dotsWrap.appendChild(dot);
    });

    var dots = Array.prototype.slice.call(dotsWrap.querySelectorAll('.testimonial-dot'));

    function goTo(index) {
      slides[current].classList.remove('active');
      dots[current].classList.remove('active');
      current = (index + slides.length) % slides.length;
      slides[current].classList.add('active');
      dots[current].classList.add('active');
    }

    prevBtn.addEventListener('click', function () {
      goTo(current - 1);
      restartAutoplay();
    });

    nextBtn.addEventListener('click', function () {
      goTo(current + 1);
      restartAutoplay();
    });

    function startAutoplay() {
      intervalId = setInterval(function () {
        goTo(current + 1);
      }, 6000);
    }

    function restartAutoplay() {
      clearInterval(intervalId);
      startAutoplay();
    }

    startAutoplay();
  }

  /* ============ 9. Feature Video Play Button ============ */
  function initFeatureVideo() {
    var playBtn = document.getElementById('playBtn');
    var video = document.getElementById('featureVideo');
    if (!playBtn || !video) return;

    playBtn.addEventListener('click', function () {
      if (video.paused) {
        video.play().catch(function () {
          /* Autoplay/play blocked or source missing — no-op placeholder video */
        });
        video.muted = false;
        playBtn.classList.add('is-playing');
        playBtn.querySelector('.play-btn-icon').innerHTML = '&#10074;&#10074;';
      } else {
        video.pause();
        playBtn.classList.remove('is-playing');
        playBtn.querySelector('.play-btn-icon').innerHTML = '&#9658;';
      }
    });
  }

  /* ============ 10. Contact Form Validation ============ */
  function initContactForm() {
    var form = document.getElementById('contactForm');
    var successMsg = document.getElementById('formSuccess');
    if (!form || !successMsg) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      successMsg.classList.remove('show');

      var isValid = true;
      var requiredFields = form.querySelectorAll('[required]');

      requiredFields.forEach(function (field) {
        var group = field.closest('.form-group');
        if (!group) return;

        var valid = field.checkValidity() && field.value.trim() !== '';
        group.classList.toggle('invalid', !valid);
        if (!valid) isValid = false;
      });

      if (!isValid) {
        var firstInvalid = form.querySelector('.invalid input, .invalid textarea');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      successMsg.classList.add('show');
      form.reset();

      setTimeout(function () {
        successMsg.classList.remove('show');
      }, 6000);
    });

    var fields = form.querySelectorAll('input, textarea, select');
    fields.forEach(function (field) {
      field.addEventListener('input', function () {
        var group = field.closest('.form-group');
        if (group && group.classList.contains('invalid') && field.checkValidity() && field.value.trim() !== '') {
          group.classList.remove('invalid');
        }
      });
    });
  }

  /* ============ 11. Newsletter Form ============ */
  function initNewsletterForm() {
    var form = document.getElementById('newsletterForm');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = form.querySelector('input[type="email"]');
      if (!input || !input.value.trim()) return;

      var button = form.querySelector('button');
      var originalHTML = button.innerHTML;
      button.innerHTML = '&#10003;';
      input.value = '';

      setTimeout(function () {
        button.innerHTML = originalHTML;
      }, 2000);
    });
  }

  /* ============ 12. Back To Top ============ */
  function initBackToTop() {
    var btn = document.getElementById('backToTop');
    if (!btn) return;

    function onScroll() {
      btn.classList.toggle('show', window.scrollY > 600);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ============ 13. Footer Year ============ */
  function initFooterYear() {
    var yearEl = document.getElementById('year');
    if (!yearEl) return;
    yearEl.textContent = new Date().getFullYear();
  }


  /* ============ 14. AI Customer Support Agent ============ */
  function initAIAssistant() {
    var root = document.getElementById('aiAssistant');
    var launcher = document.getElementById('aiLauncher');
    var panel = document.getElementById('aiPanel');
    var closeBtn = document.getElementById('aiClose');
    var messages = document.getElementById('aiMessages');
    var form = document.getElementById('aiInputForm');
    var input = document.getElementById('aiInput');
    var speakBtn = document.getElementById('aiSpeakButton');
    var statusText = document.getElementById('aiVoiceStatusText');
    if (!root || !launcher || !panel || !messages || !form || !input || !speakBtn) return;

    var conversation = [];
    var recognition = null;
    var isListening = false;
    var speakMode = false;
    var isBusy = false;
    var speechSupported = 'speechSynthesis' in window;
    var recognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;

    var knowledge = [
      { keywords: ['company', 'about', 'ironforge', 'who are you'], answer: 'IRONFORGE FITNESS is a premium strength and performance gym founded in 2014. The site describes a coaching-led environment focused on strength, performance, equipment, and measurable progress.' },
      { keywords: ['program', 'programs', 'training', 'workout'], answer: 'IRONFORGE offers Strength Training, Weight Loss, Muscle Building, Personal Training, and Functional Fitness. Each program is designed around a different training goal.' },
      { keywords: ['strength'], answer: 'Strength Training focuses on progressive overload programming and expert form coaching to build raw power.' },
      { keywords: ['weight loss', 'weightloss', 'fat loss', 'lose weight'], answer: 'The Weight Loss program combines high-intensity conditioning with nutrition guidance to support fat loss and improve conditioning.' },
      { keywords: ['muscle', 'hypertrophy', 'build muscle'], answer: 'Muscle Building uses hypertrophy-focused training blocks designed to support lean muscle growth.' },
      { keywords: ['personal training', 'one on one', 'one-on-one', 'pt'], answer: 'Personal Training is one-on-one coaching tailored to your goals, schedule, and pace.' },
      { keywords: ['functional'], answer: 'Functional Fitness uses full-body movement training to develop real-world strength, mobility, and balance.' },
      { keywords: ['membership', 'plan', 'pricing', 'price', 'cost', 'fee'], answer: 'The website lists three monthly memberships: Basic at $29/month, Pro at $59/month, and Elite at $99/month. Basic includes gym access and one group class per week; Pro adds premium equipment, unlimited group classes and two personal-training sessions; Elite includes 24/7 facility access, unlimited personal training and one-on-one nutrition coaching.' },
      { keywords: ['basic'], answer: 'Basic is $29/month and includes full gym-floor access, standard equipment, locker room and showers, and one group class per week.' },
      { keywords: ['pro', 'popular'], answer: 'Pro is $59/month. It includes full gym access, premium equipment, unlimited group classes, and two personal-training sessions. The website marks it as the most popular plan.' },
      { keywords: ['elite'], answer: 'Elite is $99/month and includes 24/7 facility access, premium equipment, private locker and towel service, unlimited group classes, unlimited personal training, and one-on-one nutrition coaching.' },
      { keywords: ['trainer', 'coach', 'coaches', 'team'], answer: 'The site lists Marcus Reed (Head Strength Coach), Elena Cruz (Nutrition & Weight Loss), Jordan Blake (Personal Training Director), and Sofia Marchetti (Functional Fitness Coach).' },
      { keywords: ['hour', 'hours', 'open', 'opening', 'close', 'closing'], answer: 'Opening hours are Monday–Friday 05:00–23:00, Saturday 07:00–21:00, Sunday 08:00–18:00, and public holidays 09:00–15:00.' },
      { keywords: ['location', 'address', 'where', 'located'], answer: 'The website lists the location as 228 Iron District Avenue, Downtown Metro City, MC 10245.' },
      { keywords: ['phone', 'call', 'telephone'], answer: 'You can call IRONFORGE FITNESS at (555) 812-4470.' },
      { keywords: ['email', 'mail', 'contact'], answer: 'The listed email is hello@ironforgefitness.com. You can also use the enquiry form in the Contact section.' },
      { keywords: ['join', 'start', 'signup', 'sign up', 'consultation', 'free plan'], answer: 'You can start by choosing a membership, exploring a program, or using the Contact section to request a free consultation and plan.' },
      { keywords: ['medical', 'injury', 'pain', 'diagnosis'], answer: 'I can explain the training options listed on this website, but I cannot provide medical diagnosis or treatment advice. Please speak with a qualified healthcare professional for an injury or medical concern.' }
    ];

    function setOpen(open) {
      panel.classList.toggle('open', open);
      panel.setAttribute('aria-hidden', String(!open));
      launcher.setAttribute('aria-expanded', String(open));
      if (open) setTimeout(function () { input.focus(); scrollMessages(); }, 120);
    }

    launcher.addEventListener('click', function () {
      setOpen(!panel.classList.contains('open'));
    });
    if (closeBtn) closeBtn.addEventListener('click', function () { setOpen(false); });

    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-ai-prompt]');
      if (!btn) return;
      var prompt = btn.getAttribute('data-ai-prompt');
      if (!prompt) return;
      setOpen(true);
      sendMessage(prompt, true);
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var value = input.value.trim();
      if (!value || isBusy) return;
      input.value = '';
      sendMessage(value, false);
    });

    speakBtn.addEventListener('click', function () {
      if (!recognitionCtor) {
        setVoiceStatus('Your browser does not support microphone speech recognition. Try Chrome or Edge, or use the text box.', false);
        return;
      }
      speakMode = !speakMode;
      speakBtn.classList.toggle('active', speakMode);
      speakBtn.setAttribute('aria-pressed', String(speakMode));
      speakBtn.querySelector('.ai-speak-label').textContent = speakMode ? 'Speak Mode On' : 'Speak Mode';
      if (speakMode) {
        setVoiceStatus('Speak Mode is active — tap again to turn it off.', false);
        startListening();
      } else {
        stopListening();
        stopSpeaking();
        setVoiceStatus('Speak Mode is off', false);
      }
    });

    function buildRecognition() {
      if (!recognitionCtor || recognition) return;
      recognition = new recognitionCtor();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = function () {
        isListening = true;
        root.classList.add('listening');
        setVoiceStatus('Listening… speak your question.', true);
      };

      recognition.onresult = function (event) {
        var transcript = '';
        for (var i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        input.value = transcript.trim();
        if (event.results[event.results.length - 1].isFinal) {
          var finalText = transcript.trim();
          if (finalText && !isBusy) {
            input.value = '';
            sendMessage(finalText, true);
          }
        }
      };

      recognition.onerror = function (event) {
        isListening = false;
        root.classList.remove('listening');
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setVoiceStatus('Microphone permission was blocked. Allow microphone access and try again.', false);
          speakMode = false;
          speakBtn.classList.remove('active');
          speakBtn.setAttribute('aria-pressed', 'false');
          speakBtn.querySelector('.ai-speak-label').textContent = 'Speak Mode';
        } else if (event.error !== 'aborted' && speakMode) {
          setVoiceStatus('I could not hear that. Tap Speak Mode and try again.', false);
        }
      };

      recognition.onend = function () {
        isListening = false;
        root.classList.remove('listening');
        if (speakMode && !isBusy) {
          setVoiceStatus('Speak Mode is ready. Tap the microphone to speak again.', false);
        }
      };
    }

    function startListening() {
      if (!speakMode || isListening || isBusy) return;
      buildRecognition();
      if (!recognition) return;
      stopSpeaking();
      try { recognition.start(); } catch (err) { /* already starting */ }
    }

    function stopListening() {
      if (!recognition || !isListening) return;
      try { recognition.stop(); } catch (err) { /* no-op */ }
      isListening = false;
      root.classList.remove('listening');
    }

    function stopSpeaking() {
      if (speechSupported) window.speechSynthesis.cancel();
      root.classList.remove('speaking');
    }

    function setVoiceStatus(text, active) {
      if (statusText) statusText.textContent = text;
      root.classList.toggle('listening', !!active && isListening);
    }

    function addMessage(text, role) {
      var row = document.createElement('div');
      row.className = 'ai-message ' + (role === 'user' ? 'ai-message-user' : 'ai-message-bot');
      if (role !== 'user') {
        var avatar = document.createElement('div');
        avatar.className = 'ai-message-avatar';
        avatar.textContent = 'IF';
        row.appendChild(avatar);
      }
      var bubble = document.createElement('div');
      bubble.className = 'ai-bubble';
      var p = document.createElement('p');
      p.textContent = text;
      bubble.appendChild(p);
      row.appendChild(bubble);
      messages.appendChild(row);
      scrollMessages();
      return row;
    }

    function addTyping() {
      var row = document.createElement('div');
      row.className = 'ai-message ai-message-bot';
      row.id = 'aiTypingRow';
      var avatar = document.createElement('div');
      avatar.className = 'ai-message-avatar';
      avatar.textContent = 'IF';
      var bubble = document.createElement('div');
      bubble.className = 'ai-bubble';
      bubble.innerHTML = '<div class="ai-typing"><span></span><span></span><span></span></div>';
      row.appendChild(avatar);
      row.appendChild(bubble);
      messages.appendChild(row);
      scrollMessages();
      return row;
    }

    function scrollMessages() {
      messages.scrollTop = messages.scrollHeight;
    }

    function sendMessage(text, fromVoice) {
      if (!text || isBusy) return;
      if (!panel.classList.contains('open')) setOpen(true);
      stopListening();
      addMessage(text, 'user');
      conversation.push({ role: 'user', content: text });
      isBusy = true;
      var typing = addTyping();
      setVoiceStatus(fromVoice ? 'Processing your voice question…' : 'Thinking…', false);

      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: conversation.slice(0, -1).slice(-8) })
      }).then(function (res) {
        if (!res.ok) throw new Error('API unavailable');
        return res.json();
      }).then(function (data) {
        return finishResponse(data && data.answer ? data.answer : localAnswer(text), fromVoice);
      }).catch(function () {
        return finishResponse(localAnswer(text), fromVoice);
      }).finally(function () {
        isBusy = false;
        if (typing && typing.parentNode) typing.parentNode.removeChild(typing);
        if (speakMode) setVoiceStatus('Speak Mode is ready. Tap the microphone to speak again.', false);
      });
    }

    function finishResponse(answer, fromVoice) {
      conversation.push({ role: 'assistant', content: answer });
      addMessage(answer, 'assistant');
      if (speakMode || fromVoice) speakAnswer(answer);
      return answer;
    }

    function localAnswer(question) {
      var q = question.toLowerCase();
      var best = null;
      var bestScore = 0;
      knowledge.forEach(function (item) {
        var score = 0;
        item.keywords.forEach(function (keyword) {
          if (q.indexOf(keyword) !== -1) score += keyword.length > 4 ? 2 : 1;
        });
        if (score > bestScore) { bestScore = score; best = item; }
      });
      if (best) return best.answer;
      return 'I can help with IRONFORGE FITNESS information such as programs, membership plans, trainers, opening hours, location, contact details, and getting started. I do not have enough website information to answer that accurately yet.';
    }

    function speakAnswer(text) {
      if (!speechSupported) {
        setVoiceStatus('Voice reply is unavailable in this browser, but the answer is shown above.', false);
        return;
      }
      stopSpeaking();
      var utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.98;
      utterance.pitch = 1;
      utterance.onstart = function () {
        root.classList.add('speaking');
        setVoiceStatus('Assistant is speaking…', false);
      };
      utterance.onend = function () {
        root.classList.remove('speaking');
        if (speakMode) setVoiceStatus('Speak Mode is ready. Tap the microphone to continue.', false);
      };
      utterance.onerror = function () {
        root.classList.remove('speaking');
      };
      window.speechSynthesis.speak(utterance);
    }

    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) {
        stopListening();
        stopSpeaking();
        setOpen(false);
      }
    });
  }

})();
