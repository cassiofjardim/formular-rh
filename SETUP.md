# Guia de Configuração - Formulário Admissional Grupo Rigarr

Este guia mostra como configurar a integração com Google Sheets, Google Drive e o login Google.

Conta do dono: **cassio.felix@rigarr.com.br**

---

## PASSO 1 — Criar a Google Sheet

1. Acesse [Google Sheets](https://sheets.google.com) logado como `cassio.felix@rigarr.com.br`
2. Crie uma nova planilha e nomeie como **"Checklist Admissional - Respostas"**
3. Copie o **ID da planilha** da URL:
   - URL: `https://docs.google.com/spreadsheets/d/ESTE_E_O_ID/edit`
   - Copie a parte `ESTE_E_O_ID`
4. Guarde esse ID para o Passo 4

---

## PASSO 2 — Criar a pasta no Google Drive

1. Acesse [Google Drive](https://drive.google.com) logado como `cassio.felix@rigarr.com.br`
2. Crie uma pasta chamada **"Documentos Admissionais"**
3. Copie o **ID da pasta** da URL:
   - URL: `https://drive.google.com/drive/folders/ESTE_E_O_ID`
   - Copie a parte `ESTE_E_O_ID`
4. Guarde esse ID para o Passo 4

---

## PASSO 3 — Criar o projeto no Google Cloud Console (para login)

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um novo projeto: **"Formulario Admissional Rigarr"**
3. Vá em **APIs e Serviços > Tela de consentimento OAuth**
   - Tipo: **Interno** (apenas usuários @rigarr.com.br)
   - Preencha o nome do app: "Checklist Admissional"
   - Email de suporte: cassio.felix@rigarr.com.br
   - Salve
4. Vá em **APIs e Serviços > Credenciais**
   - Clique em **Criar credenciais > ID do cliente OAuth 2.0**
   - Tipo: **Aplicativo da Web**
   - Nome: "Formulário Admissional"
   - **Origens JavaScript autorizadas**: adicione a URL onde o formulário será hospedado
     - Exemplo: `https://seu-dominio.com` ou `http://localhost` (para testes)
   - Clique em **Criar**
5. Copie o **Client ID** gerado (formato: `xxxxx.apps.googleusercontent.com`)
6. Guarde esse Client ID para o Passo 5

---

## PASSO 4 — Configurar e Deployar o Google Apps Script

1. Acesse [Google Apps Script](https://script.google.com) logado como `cassio.felix@rigarr.com.br`
2. Clique em **Novo projeto**
3. Renomeie o projeto para **"API Formulário Admissional"**
4. Apague o conteúdo padrão e cole o conteúdo do arquivo `google-apps-script/Code.gs`
5. **Substitua as variáveis de configuração** no topo do arquivo:
   ```
   const SPREADSHEET_ID = 'cole_o_id_da_planilha_aqui';
   const DRIVE_FOLDER_ID = 'cole_o_id_da_pasta_aqui';
   ```
6. Clique em **Salvar** (Ctrl+S)
7. Teste a configuração:
   - Selecione a função `testSetup` no dropdown
   - Clique em **Executar**
   - Verifique o Log (Ver > Registros de execução) — deve mostrar "Planilha OK" e "Pasta Drive OK"
8. **Fazer o Deploy:**
   - Clique em **Implantar > Nova implantação**
   - Tipo: **App da Web**
   - Descrição: "v1"
   - Executar como: **Eu** (cassio.felix@rigarr.com.br)
   - Quem tem acesso: **Qualquer pessoa**
   - Clique em **Implantar**
   - **Autorize** o acesso quando solicitado (permissões para Sheets e Drive)
9. Copie a **URL do Web App** (formato: `https://script.google.com/macros/s/xxxxx/exec`)

---

## PASSO 5 — Configurar o formulário HTML

Abra o arquivo `js/script.js` e substitua os valores no topo:

```javascript
const CONFIG = {
    GOOGLE_CLIENT_ID: 'cole_o_client_id_aqui.apps.googleusercontent.com',
    APPS_SCRIPT_URL: 'https://script.google.com/macros/s/cole_o_deployment_id_aqui/exec',
    ALLOWED_DOMAIN: 'rigarr.com.br'
};
```

---

## PASSO 6 — Deploy do formulário

### Opção A: GitHub Pages (gratuito)
1. Crie um repositório no GitHub
2. Faça push de todos os arquivos (exceto `google-apps-script/`)
3. Vá em Settings > Pages > Source: main branch
4. O formulário estará disponível em `https://seuusuario.github.io/formular-rh/`
5. **Importante**: adicione esta URL nas "Origens JavaScript autorizadas" no Google Cloud Console

### Opção B: Netlify (gratuito)
1. Acesse [Netlify](https://netlify.com)
2. Arraste a pasta do projeto para fazer deploy
3. Configure um domínio personalizado se desejar
4. Adicione a URL nas "Origens JavaScript autorizadas"

### Opção C: Vercel (gratuito)
1. Acesse [Vercel](https://vercel.com)
2. Importe do GitHub ou faça upload
3. Adicione a URL nas "Origens JavaScript autorizadas"

---

## Resumo da Arquitetura

```
Usuário (navegador)
    │
    ├── Login Google (OAuth) ── restrição @rigarr.com.br
    │
    ├── Preenche formulário HTML/CSS/JS
    │
    └── Envia dados ──► Google Apps Script (Web App)
                              │
                              ├── Dados de texto ──► Google Sheets
                              │
                              └── Arquivos (base64) ──► Google Drive
                                    └── Pasta por colaborador
```

---

## Notas Importantes

- **Limite de arquivos**: Google Apps Script aceita payloads de até ~50MB. Para arquivos muito grandes, considere compressão ou limitar o tamanho no front-end.
- **Tempo de execução**: O Apps Script tem limite de 6 minutos por execução. Se houver muitos arquivos grandes, pode ser necessário enviar em partes.
- **Segurança**: O login Google garante que apenas pessoas com email @rigarr.com.br acessem o formulário. Os dados ficam na conta Google do cassio.felix@rigarr.com.br.
- **Atualizações**: Para atualizar o Apps Script, edite o código e faça uma **nova implantação** (não edite a existente). Atualize a URL no `script.js` se necessário.
