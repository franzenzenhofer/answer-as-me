// Simple Brief & Draft Pro — Two-Step Solid Build
// Step 1: Collect exactly 30 Sent threads → collapse whitespace → save flat string + preview doc.
// Step 2: Generate Briefing (one call) with gemini-2.5-flash-lite.
// No triggers, no batching. Minimal buttons. DRY + KISS.

// =================== Constants & Properties ===================
const PROP_API_KEY = 'GEMINI_API_KEY';
const PROP_BRIEF_DOC_ID = 'BRIEF_DOC_ID';
const PROP_BRIEF_CREATED = 'BRIEF_CREATED';
const PROP_BRIEF_LAST_UPDATED = 'BRIEF_LAST_UPDATED';

const PROP_MODEL = 'GEMINI_MODEL'; // used for drafting replies only
const PROP_SIGNATURE_NAME = 'SIGNATURE_NAME';
const PROP_SIGNATURE_DISCLOSURE = 'SIGNATURE_DISCLOSURE';

const PROP_COLLECT_DOC_ID = 'COLLECT_DOC_ID';     // Preview doc for samples
const PROP_COLLECT_FLAT = 'COLLECT_FLAT_STRING';  // One flat string for AI
const PROP_USER_LOG = 'USER_LOG';

const MAX_THREADS = 30; // fixed per request
const SUBJECT_TRIM = 140;
const BODY_TRIM = 1100;      // slightly less to keep prompt compact
const BRIEF_TRIM = 16000;    // read back from Doc for drafting
const EMAIL_TRIM = 4000;     // original email body trim for drafting

const DEFAULT_MODEL = 'auto'; // for drafting only
const MODEL_FAST = 'gemini-2.5-flash-lite';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/';
const TEMP_BRIEF = 0.20;
const TEMP_DRAFT = 0.20;

// =================== Homepage ===================
function onHomepage() {
  const apiKeyOk = !!getApiKey();
  const briefId = getBriefDocId();

  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle('Simple Brief & Draft Pro')
      .setSubtitle('Collect 30 → Generate (fast)'));

  // Briefing overview
  const secBrief = CardService.newCardSection().setHeader('Briefing');
  secBrief.addWidget(CardService.newKeyValue()
    .setTopLabel('State')
    .setContent(briefId ? 'Ready' : 'Not created'));
  if (briefId) {
    const tz = Session.getScriptTimeZone();
    const created = getBriefCreated();
    const updated = getBriefLastUpdated();
    secBrief.addWidget(
      CardService.newTextParagraph().setText(
        'Created: ' + (created ? formatLocal(created, tz) : '—') +
        ' • Updated: ' + (updated ? formatLocal(updated, tz) : '—')
      )
    );
    secBrief.addWidget(
      CardService.newTextButton()
        .setText('Open Briefing Doc')
        .setOpenLink(CardService.newOpenLink().setUrl(docUrl(briefId)).setOpenAs(CardService.OpenAs.FULL_SIZE))
    );
  }
  card.addSection(secBrief);

  // Builder — two buttons
  const collectDoc = getCollectDocId();
  const secBuild = CardService.newCardSection().setHeader('Two-Step Builder');
  secBuild.addWidget(CardService.newKeyValue().setTopLabel('Collected').setContent(getCollectedFlatSummary()));
  const row = CardService.newButtonSet();
  row.addButton(CardService.newTextButton()
    .setText('Collect 30 from Sent')
    .setOnClickAction(CardService.newAction().setFunctionName('actionCollect'))
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED));
  row.addButton(CardService.newTextButton()
    .setText('Generate Briefing (Fast)')
    .setOnClickAction(CardService.newAction().setFunctionName('actionGenerate'))
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED));
  secBuild.addWidget(row);
  if (collectDoc) {
    secBuild.addWidget(
      CardService.newTextButton()
        .setText('Preview Samples')
        .setOpenLink(CardService.newOpenLink().setUrl(docUrl(collectDoc)).setOpenAs(CardService.OpenAs.FULL_SIZE))
    );
  }
  card.addSection(secBuild);

  // Drafting model and Settings
  card.addSection(buildModelSection(getModel(), 'modelSelectHome'));
  card.addSection(buildSettingsShortcut(apiKeyOk, getSignatureName(), getSignatureDisclosure()));

  return card.build();
}

// =================== Step 1: Collect 30 Sent threads ===================
function actionCollect() {
  try {
    const start = Date.now();

    const threads = GmailApp.search('in:sent newer_than:2y').slice(0, MAX_THREADS);
    const lines = [];
    const samples = [];

    for (let i = 0; i < threads.length; i++) {
      const th = threads[i];
      const last = getLastMessageSafe(th);
      if (!last) continue;

      const subj = truncate(cleanAllWhitespace(th.getFirstMessageSubject() || ''), SUBJECT_TRIM);
      const body = truncate(cleanAllWhitespace(last.getPlainBody() || ''), BODY_TRIM);

      if (subj || body) {
        lines.push('Subject: ' + (subj || '—'));
        lines.push(body || '—');
        lines.push('');
        samples.push({ subject: subj, body });
      }

      // Gentle pacing to avoid short-term quotas, still fast for 30 threads
      if (i > 0 && i % 25 === 0) Utilities.sleep(60);

      // Guard ~5.5 minutes — but we should finish far earlier for 30
      if (Date.now() - start > 5.5 * 60 * 1000) break;
    }

    const flat = lines.join('\n').replace(/\s+/g, ' ').trim(); // collapse to single spaces
    PropertiesService.getUserProperties().setProperty(PROP_COLLECT_FLAT, flat);

    const docId = ensureCollectDoc();
    writeCollectPreview(docId, samples);

    logUser('Collected ' + samples.length + ' samples; flat length=' + flat.length);

    return toastUpdate(onHomepage(), 'Collected ' + samples.length + ' samples');
  } catch (err) {
    logErr('actionCollect', err);
    return notify('Collect failed: ' + shortErr(err));
  }
}

function getCollectedFlat() {
  return PropertiesService.getUserProperties().getProperty(PROP_COLLECT_FLAT) || '';
}
function getCollectedFlatSummary() {
  const flat = getCollectedFlat();
  if (!flat) return 'None';
  const chars = flat.length;
  const approxTokens = Math.ceil(chars / 4);
  return chars + ' chars (~' + approxTokens + ' tokens)';
}

function ensureCollectDoc() {
  const existing = getCollectDocId();
  if (existing) return existing;
  const doc = DocumentApp.create('Briefing Builder — Samples Preview');
  const id = doc.getId();
  setCollectDocId(id);
  return id;
}

function writeCollectPreview(docId, samples) {
  try {
    const doc = DocumentApp.openById(docId);
    const body = doc.getBody();
    body.clear();
    body.appendParagraph('Samples Preview').setHeading(DocumentApp.ParagraphHeading.TITLE);
    body.appendParagraph('Count: ' + samples.length + ' • Updated: ' + formatLocal(new Date().toISOString(), Session.getScriptTimeZone()));
    body.appendParagraph('');
    samples.forEach((s, i) => {
      body.appendParagraph('Sample ' + (i + 1)).setHeading(DocumentApp.ParagraphHeading.HEADING3);
      body.appendParagraph('Subject: ' + (s.subject || '—'));
      body.appendParagraph(s.body || '—');
      body.appendParagraph('');
      body.appendHorizontalRule();
    });
    doc.saveAndClose();
  } catch (err) {
    logErr('writeCollectPreview', err);
  }
}

// =================== Step 2: Generate Briefing ===================
function actionGenerate() {
  try {
    const apiKey = getApiKey();
    if (!apiKey) return notify('Set API key in Settings.');
    const flat = getCollectedFlat();
    if (!flat) return notify('Collect first (30 from Sent).');

    const seed = seedBriefingHeader(getSignatureName(), getSignatureDisclosure());
    const prompt = buildBriefingPromptFromFlat(seed, flat);

    const ai = callGeminiWithRetry(apiKey, prompt, TEMP_BRIEF, MODEL_FAST);
    if (!ai.success) return notify(ai.errorHint || ('AI error: ' + ai.error));

    const finalId = createBriefingDoc(ai.data);
    PropertiesService.getUserProperties().setProperty(PROP_BRIEF_DOC_ID, finalId);
    if (!getBriefCreated()) PropertiesService.getUserProperties().setProperty(PROP_BRIEF_CREATED, new Date().toISOString());
    PropertiesService.getUserProperties().setProperty(PROP_BRIEF_LAST_UPDATED, new Date().toISOString());
    logUser('Briefing generated. Doc: ' + finalId);

    const card = CardService.newCardBuilder()
      .setHeader(CardService.newCardHeader().setTitle('Briefing Ready'))
      .addSection(CardService.newCardSection().addWidget(CardService.newTextParagraph().setText('Generated with gemini-2.5-flash-lite.')))
      .addSection(CardService.newCardSection()
        .addWidget(CardService.newTextButton().setText('Open Briefing').setOpenLink(CardService.newOpenLink().setUrl(docUrl(finalId)).setOpenAs(CardService.OpenAs.FULL_SIZE)))
        .addWidget(CardService.newTextButton().setText('Back').setOnClickAction(CardService.newAction().setFunctionName('goHome'))))
      .build();

    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('Briefing generated'))
      .setNavigation(CardService.newNavigation().updateCard(card))
      .build();
  } catch (err) {
    logErr('actionGenerate', err);
    return notify('Generate failed: ' + shortErr(err));
  }
}

function buildBriefingPromptFromFlat(seedBriefing, flat) {
  return [
    'ROLE: Communications analyst/writer.',
    'GOAL: Return a complete, plain-text "Email Briefing — My Voice".',
    '',
    'CURRENT BRIEFING (seed):',
    seedBriefing,
    '',
    'COMBINED SAMPLES (whitespace-collapsed; generalize; no PII):',
    flat,
    '',
    'INSTRUCTIONS:',
    '- Merge consistent patterns and FAQs.',
    '- Keep sections with clear headings.',
    '- Plain text only. No PII. No email quotes.',
    '- Short, clear, reusable entries.',
    '',
    'RETURN ONLY THE FULL UPDATED BRIEFING (plain text).'
  ].join('\n');
}

// =================== Gmail message context: Drafting ===================
function onGmailMessage(e) {
  const accessToken = e?.gmail?.accessToken || '';
  const messageId = e?.gmail?.messageId || '';
  const docId = getBriefDocId();

  let subjectPreview = '';
  try {
    if (accessToken && messageId) {
      GmailApp.setCurrentMessageAccessToken(accessToken);
      subjectPreview = truncate(GmailApp.getMessageById(messageId)?.getSubject() || '', 70);
    }
  } catch (_) {}

  const builder = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle('Draft').setSubtitle(truncate(subjectPreview, 40)));

  if (!getApiKey()) {
    builder.addSection(CardService.newCardSection()
      .addWidget(CardService.newTextParagraph().setText('Set API key to draft.'))
      .addWidget(CardService.newTextButton().setText('Settings').setOnClickAction(CardService.newAction().setFunctionName('showSettings')).setTextButtonStyle(CardService.TextButtonStyle.FILLED)));
    return builder.build();
  }
  if (!docId) {
    builder.addSection(CardService.newCardSection()
      .addWidget(CardService.newTextParagraph().setText('No briefing yet. Use Collect → Generate on the homepage.'))
      .addWidget(CardService.newTextButton().setText('Open Builder').setOnClickAction(CardService.newAction().setFunctionName('goHome')).setTextButtonStyle(CardService.TextButtonStyle.FILLED)));
    return builder.build();
  }

  const primary = CardService.newCardSection();
  primary.addWidget(CardService.newTextButton().setText('Create Draft')
    .setOnClickAction(CardService.newAction().setFunctionName('createDraftFromBriefing').setParameters({ accessToken, messageId }))
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED));
  primary.addWidget(CardService.newTextButton().setText('Open Briefing').setOpenLink(CardService.newOpenLink().setUrl(docUrl(docId)).setOpenAs(CardService.OpenAs.FULL_SIZE)));
  builder.addSection(primary);

  builder.addSection(buildModelSection(getModel(), 'modelSelectMsg')); // drafting model selector
  return builder.build();
}

function createDraftFromBriefing(e) {
  try {
    const apiKey = getApiKey();
    if (!apiKey) return notify('Set API key in Settings.');
    const accessToken = e?.parameters?.accessToken || '';
    const messageId = e?.parameters?.messageId || '';
    if (!accessToken || !messageId) return notify('Open an email.');

    GmailApp.setCurrentMessageAccessToken(accessToken);
    const message = GmailApp.getMessageById(messageId);
    const thread = message.getThread();
    const subject = message.getSubject() || '';
    const body = message.getPlainBody() || '';

    const docId = getBriefDocId();
    if (!docId) return notify('Create a briefing first.');

    const briefing = truncate(DocumentApp.openById(docId).getBody().getText(), BRIEF_TRIM);
    const emailBody = truncate(cleanAllWhitespace(body), EMAIL_TRIM);

    const now = formatLocal(new Date().toISOString(), Session.getScriptTimeZone());
    const prompt = buildDraftPrompt(briefing, subject, emailBody, now);
    const chosenModel = resolveModel(prompt); // FIX: ensure defined
    const ai = callGeminiWithRetry(apiKey, prompt, TEMP_DRAFT, chosenModel);
    if (!ai.success) return notify(ai.errorHint || ('AI error: ' + ai.error));

    const reply = ai.data.trim();
    const draftMessage = thread.createDraftReply(reply, { htmlBody: toHtml(reply) });
    const draftId = draftMessage.getId();
    const draftUrl = 'https://mail.google.com/mail/u/0/#drafts/' + encodeURIComponent(draftId);

    const card = CardService.newCardBuilder()
      .setHeader(CardService.newCardHeader().setTitle('Draft Preview'))
      .addSection(CardService.newCardSection().addWidget(CardService.newTextParagraph().setText(toHtml(reply))))
      .addSection(CardService.newCardSection()
        .addWidget(CardService.newTextButton().setText('Send').setOnClickAction(CardService.newAction().setFunctionName('sendDraftNow').setParameters({ draftId, accessToken, messageId })).setTextButtonStyle(CardService.TextButtonStyle.FILLED))
        .addWidget(CardService.newTextButton().setText('Open in Gmail').setOpenLink(CardService.newOpenLink().setUrl(draftUrl).setOpenAs(CardService.OpenAs.FULL_SIZE))))
      .build();

    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('Draft created'))
      .setNavigation(CardService.newNavigation().updateCard(card))
      .build();
  } catch (err) {
    logErr('createDraftFromBriefing', err);
    return notify('Draft failed: ' + shortErr(err));
  }
}

function sendDraftNow(e) {
  try {
    const draftId = e?.parameters?.draftId;
    const accessToken = e?.parameters?.accessToken || '';
    const messageId = e?.parameters?.messageId || '';
    if (!draftId) return notify('Missing draft ID');
    Gmail.Users.Drafts.send({ id: draftId }, 'me');
    const card = onGmailMessage({ gmail: { accessToken, messageId } });
    return CardService.newActionResponseBuilder().setNotification(CardService.newNotification().setText('Sent')).setNavigation(CardService.newNavigation().updateCard(card)).build();
  } catch (err) {
    logErr('sendDraftNow', err);
    return notify('Send failed. Enable Gmail API in Services.');
  }
}

function buildDraftPrompt(briefing, subject, body, nowLocal) {
  return [
    'ROLE: Write in MY VOICE using the briefing.',
    'Now: ' + nowLocal,
    '',
    'GOAL: Ready-to-send reply.',
    '',
    'CONSTRAINTS',
    '- 90–180 words; 1–3 short paragraphs.',
    '- No quotes of original email.',
    '- Follow tone, sign-offs, and signature policy.',
    '',
    'BRIEFING:',
    briefing,
    '',
    'EMAIL:',
    'Subject: ' + subject,
    'Body:',
    body,
    '',
    'RETURN ONLY THE REPLY (plain text).'
  ].join('\n');
}

// =================== Settings & Diagnostics ===================
function buildModelSection(currentModel, fieldName) {
  const sec = CardService.newCardSection().setHeader('Drafting Model (for replies)');
  const select = CardService.newSelectionInput()
    .setType(CardService.SelectionInputType.DROPDOWN)
    .setFieldName(fieldName)
    .setTitle('Choose model for Reply Drafts');
  [
    { id: 'auto', label: 'Auto (recommended)' },
    { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite' },
    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' }
  ].forEach(m => select.addItem(m.label, m.id, (currentModel || DEFAULT_MODEL) === m.id));
  sec.addWidget(select);
  sec.addWidget(CardService.newTextButton().setText('Apply').setOnClickAction(CardService.newAction().setFunctionName('actionApplyModel').setParameters({ source: fieldName })));
  return sec;
}

function buildSettingsShortcut(hasKey, signature, disclosure) {
  const sec = CardService.newCardSection().setHeader('Settings');
  if (signature) sec.addWidget(CardService.newKeyValue().setTopLabel('Signature').setContent(signature));
  if (disclosure) sec.addWidget(CardService.newKeyValue().setTopLabel('Disclosure').setContent(disclosure));
  sec.addWidget(CardService.newTextButton()
    .setText(hasKey ? 'Edit Settings' : 'Set API Key')
    .setOnClickAction(CardService.newAction().setFunctionName('showSettings'))
    .setTextButtonStyle(hasKey ? CardService.TextButtonStyle.TEXT : CardService.TextButtonStyle.FILLED));
  sec.addWidget(CardService.newTextButton().setText('Validate Key').setOnClickAction(CardService.newAction().setFunctionName('actionValidateKey')));
  sec.addWidget(CardService.newTextButton().setText('Diagnostics').setOnClickAction(CardService.newAction().setFunctionName('showDiagnostics')));
  return sec;
}

function showSettings() {
  const savedKey = getApiKey();
  const signature = getSignatureName();
  const disclosure = getSignatureDisclosure();
  const model = getModel();

  const sec = CardService.newCardSection();
  sec.addWidget(CardService.newKeyValue().setTopLabel('API Key').setContent(savedKey ? 'Stored' : 'Missing'));
  sec.addWidget(CardService.newTextInput().setFieldName('apiKey').setTitle('Gemini API Key').setHint('Starts with AIza…').setValue(savedKey));
  sec.addWidget(CardService.newTextInput().setFieldName('signatureName').setTitle('Signature').setHint('AI Support — Your Org').setValue(signature));
  sec.addWidget(CardService.newTextInput().setFieldName('signatureDisclosure').setTitle('Disclosure').setHint('Optional').setValue(disclosure));

  const selModel = CardService.newSelectionInput().setType(CardService.SelectionInputType.DROPDOWN).setFieldName('modelSelectSettings').setTitle('Default drafting model');
  [
    {id:'auto',label:'Auto (recommended)'},
    {id:'gemini-2.5-flash-lite',label:'Gemini 2.5 Flash-Lite'},
    {id:'gemini-2.5-flash',label:'Gemini 2.5 Flash'},
    {id:'gemini-2.5-pro',label:'Gemini 2.5 Pro'}
  ].forEach(m => selModel.addItem(m.label, m.id, (model || DEFAULT_MODEL) === m.id));
  sec.addWidget(selModel);

  const row = CardService.newButtonSet();
  row.addButton(CardService.newTextButton().setText('Save').setOnClickAction(CardService.newAction().setFunctionName('saveSettings')).setTextButtonStyle(CardService.TextButtonStyle.FILLED));
  row.addButton(CardService.newTextButton().setText('Back').setOnClickAction(CardService.newAction().setFunctionName('goHome')));
  const card = CardService.newCardBuilder().setHeader(CardService.newCardHeader().setTitle('Settings')).addSection(sec).addSection(CardService.newCardSection().addWidget(row)).build();
  return CardService.newActionResponseBuilder().setNavigation(CardService.newNavigation().pushCard(card)).build();
}
function showSettingsUniversal() {
  return CardService.newUniversalActionResponseBuilder().displayAddOnCards([
    CardService.newCardBuilder().setHeader(CardService.newCardHeader().setTitle('Settings'))
      .addSection(CardService.newCardSection().addWidget(CardService.newTextParagraph().setText('Open from Gmail add-on sidebar to edit settings.')))
      .build()
  ]).build();
}

function saveSettings(e) {
  try {
    const key = str(e?.formInput?.apiKey).trim();
    const sig = str(e?.formInput?.signatureName).trim();
    const disc = str(e?.formInput?.signatureDisclosure).trim();
    const modelSel = str(e?.formInput?.modelSelectSettings).trim();

    if (modelSel) setModel(modelSel);
    if (key) {
      if (!/^AIza[0-9A-Za-z_\-]{20,100}$/.test(key)) return notify('Invalid API key format.');
      PropertiesService.getUserProperties().setProperty(PROP_API_KEY, key);
    }
    PropertiesService.getUserProperties().setProperty(PROP_SIGNATURE_NAME, sig || 'AI Support — Your Organization');
    PropertiesService.getUserProperties().setProperty(PROP_SIGNATURE_DISCLOSURE, disc || '');
    return toastUpdate(onHomepage(), 'Saved');
  } catch (err) {
    logErr('saveSettings', err);
    return notify('Save failed: ' + shortErr(err));
  }
}

function actionValidateKey() {
  const key = getApiKey();
  if (!key) return notify('No API key set.');
  const test = callGeminiWithRetry(key, 'ping', 0.0, MODEL_FAST);
  return notify(test.success ? 'Key OK ✅' : (test.errorHint || ('Key invalid: ' + test.error)));
}

function actionApplyModel(e) {
  const source = e?.parameters?.source || '';
  let selected = '';
  if (source === 'modelSelectHome') selected = e?.formInput?.modelSelectHome;
  if (!selected) return notify('Select a model.');
  setModel(selected);
  return toastUpdate(onHomepage(), 'Model: ' + selected);
}

// =================== Diagnostics ===================
function showDiagnostics() {
  const log = getUserLogLines();
  const sec = CardService.newCardSection().setHeader('Diagnostics');
  sec.addWidget(CardService.newTextParagraph().setText('<b>Recent</b><br>' + (log.length ? log.join('<br>') : '—')));
  const btn = CardService.newCardSection();
  btn.addWidget(CardService.newTextButton().setText('Back').setOnClickAction(CardService.newAction().setFunctionName('goHome')));
  const card = CardService.newCardBuilder().setHeader(CardService.newCardHeader().setTitle('Diagnostics')).addSection(sec).addSection(btn).build();
  return CardService.newActionResponseBuilder().setNavigation(CardService.newNavigation().pushCard(card)).build();
}

// =================== Gemini (with retries for transient errors) ===================
const RETRIES_MS = [0, 800, 1800];
function callGeminiWithRetry(apiKey, prompt, temperature, overrideModel) {
  let lastErr = '';
  for (let i = 0; i < RETRIES_MS.length; i++) {
    if (i > 0) Utilities.sleep(RETRIES_MS[i]);
    const res = callGemini(apiKey, prompt, temperature, overrideModel);
    if (res.success) return res;
    lastErr = String(res.error || '');
    if (!shouldRetry(lastErr)) return { success: false, error: lastErr, errorHint: mapErrorHint(lastErr) };
  }
  return { success: false, error: lastErr, errorHint: mapErrorHint(lastErr) };
}

function callGemini(apiKey, prompt, temperature, overrideModel) {
  try {
    const model = overrideModel || MODEL_FAST;
    const url = GEMINI_BASE + model + ':generateContent?key=' + encodeURIComponent(apiKey);
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: (typeof temperature === 'number' ? temperature : 0.3) }
    };
    const res = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
      followRedirects: true,
      escaping: false,
      validateHttpsCertificates: true
    });
    const code = res.getResponseCode();
    const txt = res.getContentText();
    if (code !== 200) return { success: false, error: 'HTTP ' + code + ': ' + txt };
    let out = '';
    try {
      const data = JSON.parse(txt);
      if (data?.candidates?.[0]?.content?.parts?.[0]?.text) out = data.candidates[0].content.parts[0].text;
    } catch (e) { return { success: false, error: 'Invalid JSON: ' + String(e) }; }
    if (!out) return { success: false, error: 'Empty AI response' };
    return { success: true, data: out };
  } catch (err) {
    logErr('callGemini', err);
    return { success: false, error: String(err) };
  }
}

function shouldRetry(errText) {
  const t = (errText || '').toLowerCase();
  return t.includes('429') || t.includes('rate') || t.includes('quota') ||
         t.includes('timeout') || t.includes('deadline') ||
         t.includes('unavailable') || t.includes('internal');
}
function mapErrorHint(errText) {
  const t = (errText || '').toLowerCase();
  if (t.includes('401') || t.includes('permission') || t.includes('unauthorized')) return 'Check API key.';
  if (t.includes('404') || t.includes('not found') || t.includes('model')) return 'Model not available.';
  if (t.includes('429') || t.includes('quota') || t.includes('rate')) return 'Busy. Try later.';
  if (t.includes('timeout') || t.includes('deadline')) return 'Network timeout.';
  return null;
}

// =================== Briefing scaffolding & Docs ===================
function seedBriefingHeader(signatureName, disclosure) {
  const orgName = (signatureName || 'AI Support — Your Organization').replace(/^AI Support —\s*/, '') || 'Your Organization';
  return [
    'EMAIL BRIEFING — MY VOICE',
    'ORGANIZATION: ' + orgName,
    'DISCLOSURE: Replies may be AI-assisted and reviewed.' + (disclosure ? ' ' + disclosure : ''),
    '',
    'KEY THEMES & FAQS',
    '',
    'REUSABLE RESPONSES & SNIPPETS',
    '',
    'TONE & STYLE — MARKETING',
    '- Benefit-first, clear, warm',
    '- Short sentences, no jargon',
    '',
    'TONE & STYLE — SUPPORT',
    '- Empathetic, calm, solution-first',
    '- 90–180 words; actionable next step',
    '',
    'WHO WE ARE',
    '- Role: ' + (signatureName || 'AI Support — ' + orgName),
    '',
    'SIGN-OFFS & STRUCTURE',
    '- Friendly opening → 1–2 answers → next step → signature',
    '',
    'BOUNDARIES',
    '- No PII; no internal links',
    '',
    'SIGNATURE POLICY',
    '- Use exactly: ' + (signatureName || 'AI Support — ' + orgName),
    (disclosure ? '- Optional: ' + disclosure : '').trim(),
    '',
    'DYNAMIC INSIGHTS',
    '- Derived from recent Sent emails',
    ''
  ].join('\n');
}

function createBriefingDoc(text) {
  const doc = DocumentApp.create('Email Briefing — My Voice');
  writeBriefingTextOnly(doc.getId(), text || seedBriefingHeader(getSignatureName(), getSignatureDisclosure()));
  return doc.getId();
}

function writeBriefingTextOnly(docId, text) {
  try {
    const tz = Session.getScriptTimeZone();
    const created = getBriefCreated() ? formatLocal(getBriefCreated(), tz) : formatLocal(new Date().toISOString(), tz);
    const updated = formatLocal(new Date().toISOString(), tz);
    const doc = DocumentApp.openById(docId);
    const body = doc.getBody();
    body.clear();
    body.appendParagraph('Email Briefing — My Voice').setHeading(DocumentApp.ParagraphHeading.TITLE);
    body.appendParagraph('Created: ' + created + ' • Updated: ' + updated + ' • TZ: ' + tz);
    body.appendParagraph('');
    body.appendParagraph(text);
    doc.saveAndClose();
  } catch (err) { logErr('writeBriefingTextOnly', err); }
}

// =================== State ===================
function getApiKey() { return PropertiesService.getUserProperties().getProperty(PROP_API_KEY) || ''; }
function getBriefDocId() { return PropertiesService.getUserProperties().getProperty(PROP_BRIEF_DOC_ID) || ''; }
function getBriefCreated() { return PropertiesService.getUserProperties().getProperty(PROP_BRIEF_CREATED) || ''; }
function getBriefLastUpdated() { return PropertiesService.getUserProperties().getProperty(PROP_BRIEF_LAST_UPDATED) || ''; }
function getModel() { return PropertiesService.getUserProperties().getProperty(PROP_MODEL) || DEFAULT_MODEL; }
function setModel(m) { PropertiesService.getUserProperties().setProperty(PROP_MODEL, m || DEFAULT_MODEL); }
function getSignatureName() { return PropertiesService.getUserProperties().getProperty(PROP_SIGNATURE_NAME) || 'AI Support — Your Organization'; }
function getSignatureDisclosure() { return PropertiesService.getUserProperties().getProperty(PROP_SIGNATURE_DISCLOSURE) || ''; }
function setCollectDocId(id) { PropertiesService.getUserProperties().setProperty(PROP_COLLECT_DOC_ID, id || ''); }
function getCollectDocId() { return PropertiesService.getUserProperties().getProperty(PROP_COLLECT_DOC_ID) || ''; }

// =================== Utilities ===================
function toastUpdate(card, text) {
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText(text))
    .setNavigation(CardService.newNavigation().updateCard(card))
    .build();
}
function goHome() {
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().updateCard(onHomepage()))
    .build();
}
function cleanAllWhitespace(t) {
  // Normalize whitespace aggressively: collapse spaces, tabs, newlines; remove NBSP; trim.
  return String(t || '')
    .replace(/\r/g, '\n')
    .replace(/\u00A0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim();
}
function truncate(s, n) { const t = str(s); return t.length > n ? t.substring(0, n) + '…' : t; }
function str(x) { return x == null ? '' : String(x); }
function getLastMessageSafe(thread) { try { const msgs = thread.getMessages(); return (msgs && msgs.length) ? msgs[msgs.length - 1] : null; } catch (_) { return null; } }
function toHtml(text) { return str(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>'); }
function docUrl(id) { return 'https://docs.google.com/document/d/' + id + '/edit'; }
function notify(text) { return CardService.newActionResponseBuilder().setNotification(CardService.newNotification().setText(text)).build(); }
function logUser(msg) {
  const tz = Session.getScriptTimeZone();
  const line = '[' + formatLocal(new Date().toISOString(), tz) + '] ' + msg;
  const props = PropertiesService.getUserProperties();
  let arr = []; try { arr = JSON.parse(props.getProperty(PROP_USER_LOG) || '[]'); } catch (_) { arr = []; }
  arr.push(line); if (arr.length > 20) arr = arr.slice(arr.length - 20);
  props.setProperty(PROP_USER_LOG, JSON.stringify(arr));
}
function getUserLogLines() { try { return JSON.parse(PropertiesService.getUserProperties().getProperty(PROP_USER_LOG) || '[]'); } catch (_) { return []; } }
function logErr(where, err) { try { console.error(where + ': ' + (err && err.stack ? err.stack : String(err))); } catch (_) { Logger.log(where + ': ' + String(err)); } }
function shortErr(err) { const s = String(err || ''); return s.length > 160 ? s.slice(0, 160) + '…' : s; }
function formatLocal(iso, tz) { try { return Utilities.formatDate(new Date(iso), tz || Session.getScriptTimeZone(), 'MMM d, yyyy HH:mm'); } catch (_) { return iso || ''; } }

// =================== Drafting model resolution ===================
function resolveModel(prompt) {
  const choice = getModel() || DEFAULT_MODEL;
  if (choice !== 'auto') return choice;
  const approxTokens = Math.ceil((prompt || '').length / 4);
  if (approxTokens > 9000) return 'gemini-2.5-pro';
  if (approxTokens > 3000) return 'gemini-2.5-flash';
  return 'gemini-2.5-flash-lite';
}