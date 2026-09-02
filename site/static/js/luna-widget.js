(function () {
  "use strict";

  // Modo roteiro fixo: sem chamada a IA/API paga. Toda a lógica roda no
  // navegador, seguindo a jornada ENTENDER → DIAGNOSTICAR → RECOMENDAR →
  // QUALIFICAR → CONVERTER da persona da Luna. Quando o Studio Visual MKT
  // tiver uma ANTHROPIC_API_KEY configurada na Netlify, dá pra evoluir este
  // arquivo para consumir /.netlify/functions/luna-chat (já existe no repo)
  // e ter conversas livres com IA.

  var widget = document.getElementById("luna-widget");
  if (!widget) return;

  var toggleBtn = document.getElementById("luna-toggle");
  var closeBtn = document.getElementById("luna-close");
  var messagesEl = document.getElementById("luna-messages");
  var chipsEl = document.getElementById("luna-chips");
  var form = document.getElementById("luna-form");
  var input = document.getElementById("luna-input");
  var sendBtn = document.getElementById("luna-send");

  var SERVICES = {
    trafego: {
      label: "🚀 Gestão de Tráfego Pago",
      text:
        "Estratégia e gerenciamento de anúncios (Google Ads, Instagram Ads, Facebook Ads) para " +
        "alcançar pessoas com potencial interesse no seu negócio: segmentação, planejamento, " +
        "criação e otimização de campanhas, monitoramento e análise de métricas."
    },
    social: {
      label: "📱 Social Media",
      text:
        "Estratégia e gestão da presença da empresa nas redes sociais: planejamento de conteúdo, " +
        "calendário editorial, criação de conteúdos, textos, criativos e análise de desempenho."
    },
    design: {
      label: "🎨 Design",
      text: "Criação de peças visuais para comunicação digital e comercial da sua marca."
    },
    sites: {
      label: "🌐 Sites e Landing Pages",
      text:
        "Criação de páginas para apresentar produtos, serviços e a empresa, e para captar " +
        "oportunidades de negócio de forma organizada."
    },
    seo: {
      label: "🔎 SEO",
      text: "Estratégias para aumentar a visibilidade orgânica da empresa nos mecanismos de busca."
    },
    analytics: {
      label: "📊 Google Analytics e Métricas",
      text:
        "Análise de dados para compreender o comportamento dos usuários e medir o desempenho " +
        "das ações digitais."
    },
    crm: {
      label: "⚙️ CRM e Automações",
      text: "Organização e automação do relacionamento com leads e clientes."
    }
  };

  var lead = { nome: "", contato: "", servico_interesse: "", resumo: "" };
  var pendingLeadField = null;

  function addBubble(role, text) {
    var bubble = document.createElement("div");
    bubble.className = "luna-bubble " + role;
    bubble.textContent = text;
    messagesEl.appendChild(bubble);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return bubble;
  }

  function say(text) {
    addBubble("luna", text);
  }

  function showChips(options) {
    chipsEl.innerHTML = "";
    if (!options || options.length === 0) {
      chipsEl.style.display = "none";
      return;
    }
    chipsEl.style.display = "flex";
    options.forEach(function (option) {
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "luna-chip";
      chip.textContent = option.label;
      chip.addEventListener("click", function () {
        addBubble("user", option.label);
        chipsEl.style.display = "none";
        option.action();
      });
      chipsEl.appendChild(chip);
    });
  }

  function setTextInputEnabled(enabled, placeholder) {
    input.disabled = !enabled;
    sendBtn.disabled = !enabled;
    input.placeholder = placeholder || (enabled ? "Digite sua resposta…" : "Escolha uma opção acima");
  }

  // --- Fluxo principal -----------------------------------------------

  function goGreeting() {
    say(
      "Oi! 👋 Eu sou a Luna, consultora virtual do Studio Visual MKT.\n\n" +
        "Posso te apresentar nossos serviços, entender o que sua empresa precisa " +
        "e te ajudar a encontrar a estratégia mais adequada.\n\nO que trouxe você até aqui hoje?"
    );
    setTextInputEnabled(false);
    showChips([
      { label: "Conhecer os serviços", action: goServicesMenu },
      { label: "Descobrir o que minha empresa precisa", action: goDiscoveryQ1 },
      { label: "Falar sobre tráfego pago", action: goPaidTrafficIntro },
      { label: "Solicitar um orçamento", action: goPricingInfo },
      { label: "Falar com uma pessoa", action: goHumanHandoff }
    ]);
  }

  function goServicesMenu() {
    say(
      "Marketing Digital pra gente vai além de postar nas redes: envolve estratégia, " +
        "comunicação, tráfego, dados e conversão. 😊 Qual serviço você quer conhecer melhor?"
    );
    var options = Object.keys(SERVICES).map(function (key) {
      return {
        label: SERVICES[key].label,
        action: function () {
          goServiceDetail(key);
        }
      };
    });
    options.push({ label: "Voltar ao início", action: goGreeting });
    setTextInputEnabled(false);
    showChips(options);
  }

  function goServiceDetail(key) {
    var service = SERVICES[key];
    say(service.label + "\n\n" + service.text);
    setTextInputEnabled(false);
    showChips([
      {
        label: "Faz sentido pro meu negócio, quero avaliar",
        action: function () {
          lead.servico_interesse = service.label;
          goDiscoveryQ1();
        }
      },
      { label: "Ver outro serviço", action: goServicesMenu },
      { label: "Falar com uma pessoa", action: goHumanHandoff }
    ]);
  }

  function goPaidTrafficIntro() {
    lead.servico_interesse = SERVICES.trafego.label;
    say(SERVICES.trafego.label + "\n\n" + SERVICES.trafego.text);
    say("Posso te fazer algumas perguntas rápidas pra entender melhor o seu cenário?");
    setTextInputEnabled(false);
    showChips([{ label: "Pode perguntar", action: goDiscoveryQ1 }, { label: "Agora não", action: goClosingDecline }]);
  }

  // --- Diagnóstico (perguntas de qualificação) ------------------------

  var discovery = { hasSite: null, hasAds: null, goal: null };

  function goDiscoveryQ1() {
    say("Vamos lá! Hoje vocês já têm um site ou landing page?");
    setTextInputEnabled(false);
    showChips([
      { label: "Sim, já temos", action: function () { discovery.hasSite = true; goDiscoveryQ2(); } },
      { label: "Não temos ainda", action: function () { discovery.hasSite = false; goDiscoveryQ2(); } }
    ]);
  }

  function goDiscoveryQ2() {
    say("E vocês já investem em anúncios pagos hoje (Google Ads, Instagram ou Facebook Ads)?");
    setTextInputEnabled(false);
    showChips([
      { label: "Sim, já investimos", action: function () { discovery.hasAds = true; goDiscoveryQ3(); } },
      { label: "Não, ainda não", action: function () { discovery.hasAds = false; goDiscoveryQ3(); } },
      { label: "Não tenho certeza", action: function () { discovery.hasAds = null; goDiscoveryQ3(); } }
    ]);
  }

  function goDiscoveryQ3() {
    say("Última pergunta: qual é o principal objetivo de vocês agora?");
    setTextInputEnabled(false);
    showChips([
      { label: "Vender mais / gerar contatos", action: function () { discovery.goal = "vender"; goRecommendation(); } },
      { label: "Aumentar o reconhecimento da marca", action: function () { discovery.goal = "marca"; goRecommendation(); } },
      { label: "Organizar a presença digital", action: function () { discovery.goal = "organizar"; goRecommendation(); } }
    ]);
  }

  function goRecommendation() {
    var picks = [];
    if (discovery.goal === "vender") {
      if (!discovery.hasSite) picks.push(SERVICES.sites.label);
      if (discovery.hasAds !== true) picks.push(SERVICES.trafego.label);
      if (discovery.hasAds === true) picks.push(SERVICES.crm.label);
    } else if (discovery.goal === "marca") {
      picks.push(SERVICES.social.label, SERVICES.design.label);
      if (discovery.hasAds !== true) picks.push(SERVICES.trafego.label);
    } else {
      if (!discovery.hasSite) picks.push(SERVICES.sites.label);
      picks.push(SERVICES.crm.label);
    }
    if (picks.length === 0) picks.push(SERVICES.analytics.label);

    lead.resumo =
      "Objetivo: " +
      discovery.goal +
      "; já tem site: " +
      discovery.hasSite +
      "; já investe em ads: " +
      discovery.hasAds;
    if (!lead.servico_interesse) lead.servico_interesse = picks.join(", ");

    say(
      "Pelo que você me contou, eu começaria avaliando: " +
        picks.join(" + ") +
        ".\n\nMas essa é uma recomendação inicial — a indicação final depende de uma análise mais completa do seu negócio. 😊"
    );
    setTextInputEnabled(false);
    showChips([
      { label: "Quero receber uma proposta", action: goLeadCollectName },
      { label: "Quanto custa?", action: goPricingInfo },
      { label: "Falar com uma pessoa", action: goHumanHandoff }
    ]);
  }

  // --- Preço / objeção -------------------------------------------------

  function goPricingInfo() {
    say(
      "Os valores variam conforme o objetivo e a estrutura necessária para cada projeto. " +
        "Posso coletar algumas informações e encaminhar seu caso pra você receber uma proposta personalizada."
    );
    setTextInputEnabled(false);
    showChips([
      { label: "Quero receber uma proposta", action: goLeadCollectName },
      { label: "Voltar ao início", action: goGreeting }
    ]);
  }

  // --- Transferência para humano ---------------------------------------

  function goHumanHandoff() {
    say(
      "Aqui ainda não tenho como te transferir pra um atendimento humano em tempo real. 😊 " +
        "Mas posso registrar seu contato agora pra alguém do Studio Visual MKT te chamar."
    );
    setTextInputEnabled(false);
    showChips([
      { label: "Pode registrar meu contato", action: goLeadCollectName },
      { label: "Agora não", action: goClosingDecline }
    ]);
  }

  // --- Captura de lead ---------------------------------------------------

  function goLeadCollectName() {
    say("Perfeito! Qual é o seu nome?");
    pendingLeadField = "nome";
    setTextInputEnabled(true, "Seu nome");
    showChips(null);
    input.focus();
  }

  function goLeadCollectContact() {
    say("Prazer, " + lead.nome + "! E qual o melhor e-mail ou WhatsApp pra te retornarmos?");
    pendingLeadField = "contato";
    setTextInputEnabled(true, "E-mail ou WhatsApp");
    showChips(null);
    input.focus();
  }

  function goLeadSubmit() {
    setTextInputEnabled(false);
    say("Só um instante, registrando seus dados… ⏳");

    var params = new URLSearchParams();
    params.set("form-name", "luna-lead");
    params.set("nome", lead.nome);
    params.set("contato", lead.contato);
    params.set("empresa", "");
    params.set("segmento", "");
    params.set("cidade", "");
    params.set("servico_interesse", lead.servico_interesse || "");
    params.set("resumo", lead.resumo || "");

    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString()
    })
      .then(function (response) {
        if (!response.ok) throw new Error("status " + response.status);
        say(
          "Perfeito! 🚀 Já registrei seus dados. Vamos dar o próximo passo e deixar a equipe do " +
            "Studio Visual MKT analisar seu caso — em breve alguém entra em contato."
        );
        goClosingAccept();
      })
      .catch(function () {
        say(
          "Ops, tive uma instabilidade agora e não consegui confirmar o registro. 😕 Pode deixar " +
            "seu contato também pela página de contato do site que garantimos o atendimento."
        );
        goClosingAccept();
      });
  }

  function goClosingAccept() {
    setTextInputEnabled(false);
    showChips([{ label: "Começar uma nova conversa", action: goRestart }]);
  }

  function goClosingDecline() {
    say("Sem problema! 😊 Foi um prazer conversar com você. Quando precisar de ajuda com Marketing Digital, a Luna estará por aqui.");
    setTextInputEnabled(false);
    showChips([{ label: "Começar uma nova conversa", action: goRestart }]);
  }

  function goRestart() {
    lead = { nome: "", contato: "", servico_interesse: "", resumo: "" };
    discovery = { hasSite: null, hasAds: null, goal: null };
    messagesEl.innerHTML = "";
    goGreeting();
  }

  // --- Entrada de texto livre (só usada na captura de lead) -------------

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (input.disabled) return;
    var text = input.value.trim();
    if (!text) return;
    input.value = "";
    addBubble("user", text);

    if (pendingLeadField === "nome") {
      lead.nome = text;
      pendingLeadField = null;
      goLeadCollectContact();
    } else if (pendingLeadField === "contato") {
      lead.contato = text;
      pendingLeadField = null;
      goLeadSubmit();
    }
  });

  toggleBtn.addEventListener("click", function () {
    widget.classList.toggle("is-open");
    if (widget.classList.contains("is-open") && !input.disabled) {
      input.focus();
    }
  });

  closeBtn.addEventListener("click", function () {
    widget.classList.remove("is-open");
  });

  goGreeting();
})();
