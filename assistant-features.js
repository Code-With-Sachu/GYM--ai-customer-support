(() => {
  "use strict";

  const suggestions = [
    ["💳", "Membership Plans", "What membership plans do you offer?"],
    ["🕐", "Opening Hours", "What are your opening hours?"],
    ["📍", "Location", "Where is IRONFORGE FITNESS located?"],
    ["🏋️", "Training Programs", "What training programs are available?"],
    ["👤", "Trainers & Coaching", "Tell me about your trainers and coaching."],
    ["🚀", "Getting Started", "How can a new customer get started?"],
    ["📞", "Contact IRONFORGE", "How can I contact IRONFORGE FITNESS?"],
    ["📋", "Membership Help", "Can you book a membership for me?"]
  ];

  function init() {
    const panel = document.getElementById("aiPanel");
    const messages = document.getElementById("aiMessages");
    const form = document.getElementById("aiInputForm");
    const input = document.getElementById("aiInput");

    if (!panel || !messages || !form || !input) {
      return false;
    }

    if (document.getElementById("ironforge-professional-styles")) {
      return true;
    }

    addStyles();
    createWelcome(messages, form, input);

    return true;
  }

  function createWelcome(messages, form, input) {
    if (document.getElementById("ironforgeProfessionalWelcome")) {
      return;
    }

    /*
     * Preserve the existing assistant messages.
     * They will be shown again when the user starts chatting.
     */
    const existingMessages = Array.from(messages.children);

    existingMessages.forEach((element) => {
      element.dataset.ironforgeInitialMessage = "true";
      element.style.display = "none";
    });

    const welcome = document.createElement("div");
    welcome.id = "ironforgeProfessionalWelcome";
    welcome.className = "ironforge-pro-welcome";

    welcome.innerHTML = `
      <div class="ironforge-pro-orb-wrap">
        <div class="ironforge-pro-orb">
          <span>IF</span>
        </div>
      </div>

      <div class="ironforge-pro-eyebrow">
        IRONFORGE INTELLIGENCE
      </div>

      <h2 class="ironforge-pro-title">
        How can I help you today?
      </h2>

      <p class="ironforge-pro-subtitle">
        Ask me anything about IRONFORGE FITNESS, training,
        nutrition, fitness, or general topics.
      </p>

      <div class="ironforge-pro-section-title">
        Suggested questions
      </div>

      <div class="ironforge-pro-grid">
        ${suggestions.map((item, index) => `
          <button
            type="button"
            class="ironforge-pro-card"
            data-question="${index}"
          >
            <span class="ironforge-pro-icon">
              ${item[0]}
            </span>

            <span class="ironforge-pro-card-text">
              <strong>${item[1]}</strong>
              <small>${item[2]}</small>
            </span>

            <span class="ironforge-pro-arrow">→</span>
          </button>
        `).join("")}
      </div>

      <div class="ironforge-pro-tip">
        <span class="ironforge-pro-tip-icon">💡</span>
        <span>
          <strong>Tip:</strong>
          You can also type any question in the box below.
        </span>
      </div>

      <div class="ironforge-pro-ai-note">
        <span class="ironforge-pro-online-dot"></span>
        <span>
          General questions are supported too — including workouts,
          nutrition, exercise concepts, and more.
        </span>
      </div>
    `;

    messages.prepend(welcome);

    /*
     * Suggested-question buttons use the REAL form already used
     * by script.js. This means the existing sendMessage() function
     * continues to handle Gemini + RAG + chat history.
     */
    welcome.querySelectorAll("[data-question]").forEach((button) => {
      button.addEventListener("click", () => {
        const index = Number(button.dataset.question);
        const question = suggestions[index]?.[2];

        if (!question) return;

        input.value = question;

        input.dispatchEvent(
          new Event("input", {
            bubbles: true
          })
        );

        hideWelcome(messages);

        /*
         * Use the actual existing form instead of guessing
         * a send-button ID.
         */
        if (typeof form.requestSubmit === "function") {
          form.requestSubmit();
        } else {
          form.dispatchEvent(
            new Event("submit", {
              bubbles: true,
              cancelable: true
            })
          );
        }
      });
    });

    /*
     * When the normal input form is submitted manually,
     * switch from Welcome State → Chat State.
     */
    form.addEventListener("submit", () => {
      hideWelcome(messages);
    });

    /*
     * Also support Enter in the real #aiInput.
     */
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        hideWelcome(messages);
      }
    });
  }

  function hideWelcome(messages) {
    const welcome = document.getElementById(
      "ironforgeProfessionalWelcome"
    );

    if (!welcome) return;

    welcome.classList.add("ironforge-pro-hide");

    setTimeout(() => {
      welcome.remove();

      /*
       * Restore any original messages created by script.js.
       */
      messages
        .querySelectorAll("[data-ironforge-initial-message='true']")
        .forEach((element) => {
          element.style.display = "";
        });
    }, 220);
  }

  function addStyles() {
    const style = document.createElement("style");
    style.id = "ironforge-professional-styles";

    style.textContent = `
      /*
       * ============================================
       * IRONFORGE PROFESSIONAL AI WELCOME
       * ============================================
       */

      #aiMessages {
        position: relative !important;
      }

      #ironforgeProfessionalWelcome {
        width: 100%;
        box-sizing: border-box;
        padding: 18px 16px 12px;
        margin: 0;
        animation: ironforgeWelcomeIn 420ms ease both;
      }

      @keyframes ironforgeWelcomeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }

        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .ironforge-pro-orb-wrap {
        display: flex;
        justify-content: center;
        margin: 2px 0 12px;
      }

      .ironforge-pro-orb {
        width: 54px;
        height: 54px;
        border-radius: 17px;

        display: flex;
        align-items: center;
        justify-content: center;

        background:
          linear-gradient(
            135deg,
            #ff6a2a 0%,
            #ff421c 55%,
            #ff9a42 100%
          );

        box-shadow:
          0 10px 28px rgba(255, 78, 29, 0.25),
          inset 0 1px 0 rgba(255,255,255,0.28);

        position: relative;
      }

      .ironforge-pro-orb::before {
        content: "";
        position: absolute;
        inset: -5px;
        border-radius: 21px;
        border: 1px solid rgba(255, 105, 55, 0.16);
      }

      .ironforge-pro-orb span {
        color: #ffffff;
        font-size: 16px;
        font-weight: 900;
        letter-spacing: -0.5px;
      }

      .ironforge-pro-eyebrow {
        text-align: center;
        color: #ffad32;
        font-size: 9px;
        line-height: 1;
        font-weight: 900;
        letter-spacing: 1.7px;
        margin-bottom: 8px;
      }

      .ironforge-pro-title {
        margin: 0;
        text-align: center;
        color: #f7f8fb;
        font-size: 24px;
        line-height: 1.18;
        font-weight: 850;
        letter-spacing: -0.65px;
      }

      .ironforge-pro-subtitle {
        max-width: 500px;
        margin: 9px auto 17px;
        text-align: center;
        color: #8c95a5;
        font-size: 11px;
        line-height: 1.55;
      }

      .ironforge-pro-section-title {
        margin: 0 0 8px;
        color: #dfe4ec;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.1px;
      }

      .ironforge-pro-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 7px;
      }

      .ironforge-pro-card {
        appearance: none;
        width: 100%;
        min-width: 0;
        min-height: 62px;
        box-sizing: border-box;

        padding: 9px;

        border: 1px solid rgba(255,255,255,0.085);
        border-radius: 13px;

        background:
          linear-gradient(
            145deg,
            rgba(255,255,255,0.055),
            rgba(255,255,255,0.022)
          );

        color: #ffffff;

        display: flex;
        align-items: center;
        gap: 8px;

        text-align: left;
        font-family: inherit;

        cursor: pointer;

        transition:
          transform 150ms ease,
          border-color 150ms ease,
          background 150ms ease,
          box-shadow 150ms ease;
      }

      .ironforge-pro-card:hover {
        transform: translateY(-2px);

        border-color: rgba(255, 101, 52, 0.42);

        background:
          linear-gradient(
            145deg,
            rgba(255,91,36,0.11),
            rgba(255,255,255,0.035)
          );

        box-shadow:
          0 7px 20px rgba(0,0,0,0.20);
      }

      .ironforge-pro-card:active {
        transform: translateY(0);
      }

      .ironforge-pro-icon {
        width: 32px;
        height: 32px;
        min-width: 32px;

        display: flex;
        align-items: center;
        justify-content: center;

        border-radius: 10px;

        background: rgba(255,255,255,0.06);

        font-size: 15px;
      }

      .ironforge-pro-card-text {
        min-width: 0;
        flex: 1;

        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .ironforge-pro-card-text strong {
        color: #f1f4f8;
        font-size: 10.5px;
        line-height: 1.25;
        font-weight: 800;
      }

      .ironforge-pro-card-text small {
        color: #7f8999;
        font-size: 8.5px;
        line-height: 1.3;

        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .ironforge-pro-arrow {
        flex: 0 0 auto;

        color: #626d7d;
        font-size: 15px;

        transition:
          color 150ms ease,
          transform 150ms ease;
      }

      .ironforge-pro-card:hover .ironforge-pro-arrow {
        color: #ff7040;
        transform: translateX(2px);
      }

      .ironforge-pro-tip {
        display: flex;
        align-items: center;
        gap: 8px;

        margin-top: 10px;
        padding: 9px 10px;

        border-radius: 11px;
        border: 1px solid rgba(120,151,235,0.14);

        background: rgba(100,130,220,0.075);

        color: #929daf;

        font-size: 9px;
        line-height: 1.4;
      }

      .ironforge-pro-tip strong {
        color: #d7deeb;
      }

      .ironforge-pro-tip-icon {
        font-size: 13px;
        flex: 0 0 auto;
      }

      .ironforge-pro-ai-note {
        display: flex;
        align-items: center;
        justify-content: center;

        gap: 6px;

        margin-top: 9px;

        color: #697484;

        font-size: 8px;
        line-height: 1.4;

        text-align: center;
      }

      .ironforge-pro-online-dot {
        width: 5px;
        height: 5px;
        min-width: 5px;

        border-radius: 50%;

        background: #4ce18a;

        box-shadow:
          0 0 7px rgba(76,225,138,0.45);
      }

      .ironforge-pro-hide {
        opacity: 0 !important;
        transform: translateY(-10px) !important;
        transition:
          opacity 180ms ease,
          transform 180ms ease !important;
        pointer-events: none !important;
      }

      @media (max-width: 420px) {
        #ironforgeProfessionalWelcome {
          padding-left: 10px;
          padding-right: 10px;
        }

        .ironforge-pro-title {
          font-size: 22px;
        }

        .ironforge-pro-subtitle {
          font-size: 10px;
        }

        .ironforge-pro-card {
          min-height: 59px;
          padding: 8px;
        }

        .ironforge-pro-icon {
          width: 29px;
          height: 29px;
          min-width: 29px;
          font-size: 14px;
        }

        .ironforge-pro-card-text strong {
          font-size: 10px;
        }

        .ironforge-pro-card-text small {
          font-size: 8px;
        }

        .ironforge-pro-arrow {
          display: none;
        }
      }

      @media (max-width: 330px) {
        .ironforge-pro-grid {
          grid-template-columns: 1fr;
        }
      }
    `;

    document.head.appendChild(style);
  }

  /*
   * Wait for the existing assistant because script.js
   * initializes the AI panel separately.
   */
  let attempts = 0;

  const timer = setInterval(() => {
    attempts++;

    if (init() || attempts >= 40) {
      clearInterval(timer);
    }
  }, 250);
})();
