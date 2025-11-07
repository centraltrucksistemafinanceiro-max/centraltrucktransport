<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1HF_-iBu3VDqUqBwYNpHgSW1De8Ms3aLN

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

---

# Sistema de Controle de Viagem — Setup

## Pré-requisitos
- Node.js 18+

## Configuração
- Copie `runtime-config.sample.js` para `runtime-config.js` e preencha com as credenciais do Firebase Web.
- Mantenha `window.__ENABLE_SEED__ = false` (seed desabilitado em produção).
- O arquivo real `runtime-config.js` está listado no `.gitignore` e não deve ser versionado.

Exemplo (runtime-config.js):

```html
<script>
  window.FIREBASE_CONFIG = {
    apiKey: "...",
    authDomain: "...",
    projectId: "...",
    storageBucket: "...",
    messagingSenderId: "...",
    appId: "..."
  };
  window.__ENABLE_SEED__ = false;
</script>
```

## Rodando localmente
- Instalar dependências: `npm install`
- Iniciar: `npm run dev`
- Build: `npm run build` (gera `dist/`)

## Segurança
- As regras atuais sugeridas no Firestore (temporárias para troca de senha de admin):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /admins/{id} {
      allow read: if true;
      allow update: if request.resource.data.diff(resource.data).changedKeys().hasOnly(["passwordHash", "salt"]);
      allow create, delete: if false;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

- Para uso normal do sistema (leitura/escrita), configure regras adequadas (recomendado Firebase Auth). Enquanto isso, mantenha o `runtime-config.js` fora do repositório.

## Publicação no GitHub
- Não commitar `runtime-config.js` (já ignorado no `.gitignore`).
- Versionar `runtime-config.sample.js` com placeholders.
- README contém os passos de setup para quem clonar o projeto.

