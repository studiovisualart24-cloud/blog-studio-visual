const Anthropic = require("@anthropic-ai/sdk");
const { LUNA_SYSTEM_PROMPT } = require("./luna-prompt");

const MODEL = process.env.LUNA_MODEL || "claude-opus-5";
const MAX_HISTORY_MESSAGES = 30;
const MAX_MESSAGE_LENGTH = 4000;
const MAX_TOOL_ITERATIONS = 3;
const LEAD_FIELDS = [
  "nome",
  "contato",
  "empresa",
  "segmento",
  "cidade",
  "servico_interesse",
  "resumo",
];

const REGISTRAR_LEAD_TOOL = {
  name: "registrar_lead",
  description:
    "Registra no CRM do Studio Visual MKT os dados de um visitante que demonstrou " +
    "intenção comercial real. Só chame depois que o visitante tiver fornecido " +
    "explicitamente nome e uma forma de contato (e-mail ou telefone/WhatsApp), e " +
    "tiver confirmado que pode registrar os dados.",
  input_schema: {
    type: "object",
    properties: {
      nome: { type: "string", description: "Nome da pessoa" },
      contato: { type: "string", description: "E-mail e/ou telefone/WhatsApp informado" },
      empresa: { type: "string", description: "Nome da empresa, se houver" },
      segmento: { type: "string", description: "Segmento/ramo de atuação da empresa" },
      cidade: { type: "string", description: "Cidade ou região" },
      servico_interesse: {
        type: "string",
        description: "Serviço(s) de maior interesse (ex.: tráfego pago, site, SEO)",
      },
      resumo: {
        type: "string",
        description: "Resumo objetivo da necessidade do visitante, para a equipe comercial",
      },
    },
    required: ["nome", "contato", "resumo"],
  },
};

async function registrarLead(input) {
  const siteUrl = process.env.URL || process.env.DEPLOY_PRIME_URL;
  if (!siteUrl) {
    return { ok: false, error: "URL do site não configurada no ambiente." };
  }

  const params = new URLSearchParams();
  params.set("form-name", "luna-lead");
  for (const field of LEAD_FIELDS) {
    params.set(field, typeof input[field] === "string" ? input[field] : "");
  }

  try {
    const response = await fetch(`${siteUrl.replace(/\/$/, "")}/`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    if (!response.ok) {
      return { ok: false, error: `Falha ao registrar (status ${response.status}).` };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: "Falha de rede ao registrar o lead." };
  }
}

function sanitizeHistory(rawMessages) {
  const list = Array.isArray(rawMessages) ? rawMessages : [];
  return list
    .filter(
      (message) =>
        message &&
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string"
    )
    .slice(-MAX_HISTORY_MESSAGES)
    .map((message) => ({
      role: message.role,
      content: message.content.slice(0, MAX_MESSAGE_LENGTH),
    }));
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "ANTHROPIC_API_KEY não está configurada nas variáveis de ambiente do site.",
      }),
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (error) {
    return { statusCode: 400, body: "JSON inválido." };
  }

  const messages = sanitizeHistory(payload.messages);
  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return {
      statusCode: 400,
      body: "É necessário enviar o histórico terminando em uma mensagem do usuário.",
    };
  }

  const client = new Anthropic();

  try {
    let finalText = "";

    for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration += 1) {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        output_config: { effort: "low" },
        system: [
          { type: "text", text: LUNA_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
        ],
        tools: [REGISTRAR_LEAD_TOOL],
        messages,
      });

      const toolUseBlocks = response.content.filter((block) => block.type === "tool_use");

      if (response.stop_reason === "tool_use" && toolUseBlocks.length > 0) {
        messages.push({ role: "assistant", content: response.content });

        const toolResults = [];
        for (const block of toolUseBlocks) {
          if (block.name === "registrar_lead") {
            const result = await registrarLead(block.input || {});
            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: result.ok
                ? "Lead registrado com sucesso no CRM do Studio Visual MKT."
                : `Falha ao registrar o lead: ${result.error}`,
              is_error: !result.ok,
            });
          } else {
            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: "Ferramenta desconhecida.",
              is_error: true,
            });
          }
        }
        messages.push({ role: "user", content: toolResults });
        continue;
      }

      const textBlock = response.content.find((block) => block.type === "text");
      finalText = textBlock ? textBlock.text : "";
      break;
    }

    if (!finalText) {
      finalText = "Desculpe, não consegui formular uma resposta agora. Pode tentar novamente?";
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply: finalText }),
    };
  } catch (error) {
    console.error("luna-chat error", error);
    return {
      statusCode: 502,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Não foi possível falar com a Luna agora." }),
    };
  }
};
