(function () {
  "use strict";

  var ENDPOINT = "/.netlify/functions/luna-chat";
  var STORAGE_KEY = "luna-history-v1";

  var widget = document.getElementById("luna-widget");
  if (!widget) return;

  var toggleBtn = document.getElementById("luna-toggle");
  var closeBtn = document.getElementById("luna-close");
  var messagesEl = document.getElementById("luna-messages");
  var chipsEl = document.getElementById("luna-chips");
  var form = document.getElementById("luna-form");
  var input = document.getElementById("luna-input");
  var sendBtn = document.getElementById("luna-send");

  var history = loadHistory();
  var sending = false;

  var QUICK_REPLIES = [
    "Quero conhecer os serviços",
    "Quero descobrir o que minha empresa precisa",
    "Quero falar sobre tráfego pago",
    "Quero solicitar um orçamento",
    "Quero falar com uma pessoa"
  ];

  var GREETING =
    "Oi! 👋 Eu sou a Luna, consultora virtual do Studio Visual MKT.\n\n" +
    "Posso te apresentar nossos serviços, entender o que sua empresa precisa " +
    "e te ajudar a encontrar a estratégia mais adequada.\n\nO que trouxe você até aqui hoje?";

  function loadHistory() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }

  function saveHistory() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (err) {
      /* localStorage indisponível — a conversa segue funcionando sem persistir */
    }
  }

  function addBubble(role, text) {
    var bubble = document.createElement("div");
    bubble.className = "luna-bubble " + role;
    bubble.textContent = text;
    messagesEl.appendChild(bubble);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return bubble;
  }

  function showChips(show) {
    chipsEl.style.display = show ? "flex" : "none";
  }

  function renderChips() {
    chipsEl.innerHTML = "";
    QUICK_REPLIES.forEach(function (label) {
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "luna-chip";
      chip.textContent = label;
      chip.addEventListener("click", function () {
        showChips(false);
        sendMessage(label);
      });
      chipsEl.appendChild(chip);
    });
  }

  function renderHistory() {
    messagesEl.innerHTML = "";
    if (history.length === 0) {
      addBubble("luna", GREETING);
      renderChips();
      showChips(true);
      return;
    }
    history.forEach(function (message) {
      addBubble(message.role === "user" ? "user" : "luna", message.content);
    });
    showChips(false);
  }

  function setTyping(show) {
    var existing = document.getElementById("luna-typing");
    if (show && !existing) {
      var typing = document.createElement("div");
      typing.className = "luna-typing";
      typing.id = "luna-typing";
      typing.innerHTML = "<span></span><span></span><span></span>";
      messagesEl.appendChild(typing);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    } else if (!show && existing) {
      existing.remove();
    }
  }

  function sendMessage(text) {
    if (sending || !text || !text.trim()) return;
    sending = true;
    sendBtn.disabled = true;
    showChips(false);

    var userText = text.trim();
    addBubble("user", userText);
    history.push({ role: "user", content: userText });
    saveHistory();
    setTyping(true);

    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history })
    })
      .then(function (response) {
        return response.json().then(function (data) {
          return { ok: response.ok, data: data };
        });
      })
      .then(function (result) {
        setTyping(false);
        var reply =
          result.ok && result.data && result.data.reply
            ? result.data.reply
            : "Ops, tive um probleminha para responder agora. Você pode tentar de novo em instantes ou falar com a gente pela página de contato.";
        addBubble("luna", reply);
        history.push({ role: "assistant", content: reply });
        saveHistory();
      })
      .catch(function () {
        setTyping(false);
        var reply =
          "Não consegui me conectar agora. Tente novamente em instantes ou fale com a gente pela página de contato.";
        addBubble("luna", reply);
        history.push({ role: "assistant", content: reply });
        saveHistory();
      })
      .finally(function () {
        sending = false;
        sendBtn.disabled = false;
      });
  }

  toggleBtn.addEventListener("click", function () {
    widget.classList.toggle("is-open");
    if (widget.classList.contains("is-open")) {
      input.focus();
    }
  });

  closeBtn.addEventListener("click", function () {
    widget.classList.remove("is-open");
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var text = input.value;
    input.value = "";
    sendMessage(text);
  });

  renderHistory();
})();
