# Hugo template for Decap CMS with Netlify Identity

This is a small business template built with [Hugo](https://gohugo.io) and [Decap CMS](https://github.com/decaporg/decap-cms), designed and developed by [Darin Dimitroff](https://twitter.com/deezel), [spacefarm.digital](https://www.spacefarm.digital).

## Getting started

Use our deploy button to get your own copy of the repository. 

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/decaporg/one-click-hugo-cms&stack=cms)

This will setup everything needed for running the CMS:

* A new repository in your GitHub account with the code
* Full Continuous Deployment to Netlify's global CDN network
* Control users and access with Netlify Identity
* Manage content with Decap CMS

Once the initial build finishes, you can invite yourself as a user. Go to the Identity tab in your new site, click "Invite" and send yourself an invite.

Now you're all set, and you can start editing content!

## Local Development

Clone this repository, and run `yarn` or `npm install` from the new folder to install all required dependencies.

Then start the development server with `yarn start` or `npm start`.

## Testing

With the development server running, run the tests locally
with `yarn cypress:run` or `npm run cypress:run`.
Or use `yarn cypress:open` or `npm run cypress:open` to run interactively.

Cypress tests also run on deploy with the [Cypress Netlify integration](https://www.netlify.com/integrations/cypress/).

## Layouts

The template is based on small, content-agnostic partials that can be mixed and matched. The pre-built pages showcase just a few of the possible combinations. Refer to the `site/layouts/partials` folder for all available partials.

Use Hugo’s `dict` functionality to feed content into partials and avoid repeating yourself and creating discrepancies.

## CSS

The template uses a custom fork of Tachyons and PostCSS with cssnext and cssnano. To customize the template for your brand, refer to `src/css/imports/_variables.css` where most of the important global variables like colors and spacing are stored.

## Luna — consultora virtual

O site inclui a Luna, a consultora virtual de Marketing Digital do Studio
Visual MKT: um widget de chat (canto inferior direito, em todas as páginas).

**Modo atual: roteiro fixo, sem IA e sem custo.** `site/static/js/luna-widget.js`
implementa a jornada da persona (saudação → apresentação de serviços →
perguntas de qualificação → recomendação → captura de lead) como uma árvore
de decisão por botões, 100% no navegador — não chama nenhuma API paga e não
precisa de chave configurada.

**Como funciona:**

* `site/layouts/partials/luna-widget.html` e `luna-avatar.html` — marcação do
  widget, incluídos em `baseof.html`.
* `site/static/css/luna-widget.css` e `site/static/js/luna-widget.js` —
  estilo e lógica do chat no navegador (sem build step).
* Quando o visitante decide deixar contato, a Luna coleta nome e e-mail/WhatsApp
  e envia direto para o **Netlify Forms** (formulário `luna-lead`, definido
  oculto em `luna-widget.html` só para o Netlify detectar o schema no build).
  Configure uma notificação por e-mail para esse formulário em
  **Site settings → Forms → Form notifications** no painel da Netlify para
  receber os leads — é o único passo de configuração necessário nesse modo.

**Upgrade futuro: modo IA (conversa livre com Claude).** O repositório já
inclui a implementação pronta para isso, só não está em uso agora:

* `netlify/functions/luna-chat.js` — função serverless que chama a API da
  Anthropic com a persona da Luna (`netlify/functions/luna-prompt.js`) como
  system prompt, incluindo a ferramenta `registrar_lead` para registrar leads
  automaticamente.

Para ativar esse modo quando houver uma forma de pagamento configurada na
Anthropic:

1. Em **Site settings → Environment variables** na Netlify, adicione
   `ANTHROPIC_API_KEY` com uma chave gerada em console.anthropic.com.
   Opcional: `LUNA_MODEL` para trocar o modelo (padrão: `claude-opus-5`).
2. Troque a lógica de `site/static/js/luna-widget.js` para chamar
   `/.netlify/functions/luna-chat` em vez do roteiro fixo (a implementação
   anterior fica registrada no histórico do git do PR que criou a Luna).

O avatar atual (`site/layouts/partials/luna-avatar.html`) é um monograma
provisório em preto e dourado. Para usar o retrato oficial da Luna, gere a
imagem a partir do "PROMPT VISUAL DA PERSONAGEM" da especificação da
persona, salve-a como `site/static/img/luna-avatar.png` e troque o SVG do
partial por `<img src="/img/luna-avatar.png" class="{{ .class }}" alt="Luna">`.

## SVG Social Icons

The social media icons are in `site/assets/img`.
Make sure you use consistent icons in terms of viewport and art direction for optimal results.
For an icon named `icons-facebook.svg`, refer to the SVG `social-icon` partial like so:

```
{{ partial "social-icon" (dict "link" "#" "svg" "icons-facebook" "alt" "Kaldi on Facebook") }}
```
