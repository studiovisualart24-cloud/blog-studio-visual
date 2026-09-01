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

## Luna — consultora virtual de IA

O site inclui a Luna, a consultora virtual de Marketing Digital do Studio
Visual MKT: um widget de chat (canto inferior direito, em todas as páginas)
conectado à API da Anthropic (Claude).

**Como funciona:**

* `site/layouts/partials/luna-widget.html` e `luna-avatar.html` — marcação do
  widget, incluídos em `baseof.html`.
* `site/static/css/luna-widget.css` e `site/static/js/luna-widget.js` —
  estilo e lógica do chat no navegador (sem build step).
* `netlify/functions/luna-chat.js` — função serverless que recebe o
  histórico da conversa e chama a API da Anthropic com a persona da Luna
  (`netlify/functions/luna-prompt.js`) como system prompt.
* Quando a conversa evolui para uma oportunidade comercial real, a Luna usa a
  ferramenta `registrar_lead`, que a função envia para o Netlify Forms
  (formulário `luna-lead`, definido oculto em `luna-widget.html` só para o
  Netlify detectar o schema no build). Configure uma notificação por e-mail
  para esse formulário em **Site settings → Forms → Form notifications** no
  painel da Netlify para receber os leads.

**Configuração necessária (uma vez, no painel da Netlify):**

1. Em **Site settings → Environment variables**, adicione `ANTHROPIC_API_KEY`
   com uma chave de API da Anthropic (console.anthropic.com).
2. Opcional: `LUNA_MODEL` para trocar o modelo (padrão: `claude-opus-5`).
3. Ative a notificação de formulário para `luna-lead` (passo acima).

Sem a `ANTHROPIC_API_KEY`, o widget aparece normalmente, mas a Luna responde
com uma mensagem de erro amigável em vez de travar o site.

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
