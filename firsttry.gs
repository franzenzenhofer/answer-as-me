



>>>>

{
  "timeZone": "Europe/Vienna",
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "oauthScopes": [
    "https://www.googleapis.com/auth/userinfo.email",

    "https://www.googleapis.com/auth/gmail.addons.execute",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.compose",
    "https://www.googleapis.com/auth/gmail.modify",

    "https://www.googleapis.com/auth/documents",
    "https://www.googleapis.com/auth/script.external_request"
  ],
  "dependencies": {
    "enabledAdvancedServices": [
      {
        "userSymbol": "Gmail",
        "serviceId": "gmail",
        "version": "v1"
      }
    ]
  },
  "urlFetchWhitelist": [
    "https://generativelanguage.googleapis.com/"
  ],
  "addOns": {
    "common": {
      "name": "Simple Brief & Draft Pro",
      "logoUrl": "https://www.gstatic.com/images/icons/material/system/2x/description_black_48dp.png",
      "layoutProperties": {
        "primaryColor": "#202124",
        "secondaryColor": "#1a73e8"
      },
      "homepageTrigger": {
        "enabled": true,
        "runFunction": "onHomepage"
      },
      "universalActions": [
        { "label": "Settings", "runFunction": "showSettingsUniversal" },
        { "label": "Diagnostics", "runFunction": "showDiagnostics" }
      ]
    },
    "gmail": {
      "homepageTrigger": {
        "enabled": true,
        "runFunction": "onHomepage"
      },
      "contextualTriggers": [
        { "unconditional": {}, "onTriggerFunction": "onGmailMessage" }
      ],
      "authorizationCheckFunction": "onHomepage"
    }
  }
}


>>>

// Simple Brief & Draft Pro — Two-Step Builder (Collect → Generate)
// Gmail add-on card-safe (no unsupported CardService methods), no triggers.

// =================== Properties ===================
const PROP_API_KEY = 'GEMINI_API_KEY';
const PROP_BRIEF_DOC_ID = 'BRIEF_DOC_ID';
const PROP_BRIEF_CREATED = 'BRIEF_CREATED';
const PROP_BRIEF_LAST_UPDATED = 'BRIEF_LAST_UPDATED';
const PROP_MODEL = 'GEMINI_MODEL'; // drafting only
const PROP_SIGNATURE_NAME = 'SIGNATURE_NAME';
const PROP_SIGNATURE_DISCLOSURE = 'SIGNATURE_DISCLOSURE';
const PROP_SCAN_COUNT = 'SCAN_COUNT'; // 100 | 200 | 500

// Collect phase
const PROP_COLLECT_IDS = 'COLLECT_THREAD_IDS';     // JSON array of Gmail thread IDs
const PROP_COLLECT_INDEX = 'COLLECT_INDEX';        // next index to process
const PROP_COLLECT_SAMPLES = 'COLLECT_SAMPLES';    // JSON array of {subject, body}
const PROP_COLLECT_DOC_ID = 'COLLECT_DOC_ID';      // temp doc to preview samples
const PROP_COLLECT_UPDATED = 'COLLECT_UPDATED_AT'; // ISO

// UI log
const PROP_USER_LOG = 'USER_LOG';

// =================== Models ===================
const MODEL_AUTO = 'auto';
const MODELS = [
  { id: MODEL_AUTO,               label: 'Auto (recommended)' },
  { id: 'gemini-2.5-flash-lite',  label: 'Gemini 2.5 Flash-Lite' },
  { id: 'gemini-2.5-flash',       label: 'Gemini 2.5 Flash' },
  { id: 'gemini-2.5-pro',         label: 'Gemini 2.5 Pro' }
];
const DEFAULT_MODEL = MODEL_AUTO;

// =================== Gemini ===================
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/';
const MODEL_FAST = 'gemini-2.5-flash-lite'; // for Generate step only
const TEMP_BRIEF = 0.20;
const TEMP_DRAFT = 0.20;

// =================== Limits ===================
const SUBJECT_TRIM = 140;
const BODY_TRIM = 1200;
const BRIEF_TRIM = 16000;
const EMAIL_TRIM = 4000;
const COLLECT_BATCH = 50; // run-now chunk size

// =================== Homepage ===================
function onHomepage() {
  const apiKey = getApiKey();
  const docId = getBriefDocId();
  const created = getBriefCreated();
  const updated = getBriefLastUpdated();

  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle('Email Briefing')
      .setSubtitle('2-step: Collect → Generate'));

  // Briefing overview
  const overview = CardService.newCardSection().setHeader('Briefing');
  overview.addWidget(CardService.newKeyValue()
    .setTopLabel('State')
    .setContent(docId ? 'Ready' : 'Not created'));
  if (docId) {
    const tz = Session.getScriptTimeZone();
    overview.addWidget(CardService.newTextParagraph().setText('Created: ' + (created ? formatLocal(created, tz) : '—') + ' • Updated: ' + (updated ? formatLocal(updated, tz) : '—')));
    overview.addWidget(CardService.newTextButton().setText('Open Briefing Doc')
      .setOpenLink(CardService.newOpenLink().setUrl(docUrl(docId)).setOpenAs(CardService.OpenAs.FULL_SIZE)));
  }
  card.addSection(overview);

  // Two-step builder sections
  card.addSection(buildCollectSection());
  card.addSection(buildGenerateSection());

  // Drafting model (for replies)
  card.addSection(buildModelSection(getModel(), 'modelSelectHome'));

  // Settings
  card.addSection(buildSettingsShortcut(!!apiKey, getSignatureName(), getSignatureDisclosure()));

  return card.build();
}

// =================== Collect / Generate UI ===================
function buildCollectSection() {
  const scanCount = getScanCount();
  const samples = getCollectedSamples();
  const collectDoc = getCollectDocId();

  const totalIds = getCollectIds().length;
  const nextIdx = getCollectIndex();
  const done = Math.min(totalIds, nextIdx);
  const pct = totalIds ? Math.round((done / totalIds) * 100) : 0;
  const statusText = totalIds ? ('Collected ' + samples.length + ' samples • Progress ' + done + ' / ' + totalIds + ' (' + pct + '%)') : 'Not started';

  const sec = CardService.newCardSection().setHeader('Step 1 — Collect');
  const select = CardService.newSelectionInput()
    .setType(CardService.SelectionInputType.DROPDOWN)
    .setFieldName('scanCountSelect')
    .setTitle('Scan last N Sent');
  [100, 200, 500].forEach(n => select.addItem(String(n), String(n), String(scanCount) === String(n)));
  sec.addWidget(select);

  sec.addWidget(CardService.newKeyValue().setTopLabel('Status').setContent(statusText));

  const row1 = CardService.newButtonSet();
  row1.addButton(CardService.newTextButton().setText('Start/Reset Collect').setOnClickAction(CardService.newAction().setFunctionName('collectStart')).setTextButtonStyle(CardService.TextButtonStyle.FILLED));
  row1.addButton(CardService.newTextButton().setText('Run Now (Collect)').setOnClickAction(CardService.newAction().setFunctionName('collectRunNow')));
  sec.addWidget(row1);

  const row2 = CardService.newButtonSet();
  if (collectDoc) row2.addButton(CardService.newTextButton().setText('Preview Samples').setOpenLink(CardService.newOpenLink().setUrl(docUrl(collectDoc)).setOpenAs(CardService.OpenAs.FULL_SIZE)));
  row2.addButton(CardService.newTextButton().setText('Clear Collected').setOnClickAction(CardService.newAction().setFunctionName('collectClear')));
  sec.addWidget(row2);

  return sec;
}

function buildGenerateSection() {
  const samples = getCollectedSamples();
  const canGenerate = samples.length > 0;
  const sec = CardService.newCardSection().setHeader('Step 2 — Generate');
  sec.addWidget(CardService.newKeyValue().setTopLabel('Ready?').setContent(canGenerate ? ('Yes — ' + samples.length + ' samples') : 'Collect first'));
  const row = CardService.newButtonSet();
  row.addButton(CardService.newTextButton().setText('Generate Briefing (Fast)').setOnClickAction(CardService.newAction().setFunctionName('generateBriefing')).setTextButtonStyle(canGenerate ? CardService.TextButtonStyle.FILLED : CardService.TextButtonStyle.TEXT));
  sec.addWidget(row);
  return sec;
}

function buildModelSection(currentModel, fieldName) {
  const sec = CardService.newCardSection().setHeader('Drafting Model (for replies)');
  const select = CardService.newSelectionInput()
    .setType(CardService.SelectionInputType.DROPDOWN)
    .setFieldName(fieldName)
    .setTitle('Choose model for Reply Drafts');
  MODELS.forEach(m => select.addItem(m.label, m.id, (currentModel || DEFAULT_MODEL) === m.id));
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
  return sec;
}

// =================== Step 1 — Collect ===================
function collectStart(e) {
  const sel = str(e?.formInput?.scanCountSelect).trim();
  if (sel && /^[0-9]+$/.test(sel) && [100,200,500].includes(Number(sel))) setScanCount(Number(sel));

  const threads = GmailApp.search('in:sent').slice(0, getScanCount());
  const ids = threads.map(t => t.getId());
  setCollectIds(ids);
  setCollectIndex(0);
  setCollectedSamples([]);
  const docId = ensureCollectDoc();
  writeCollectPreview(docId, []);
  setCollectUpdated(new Date().toISOString());
  logUser('Collect started: total threads=' + ids.length);

  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText('Collect session reset.'))
    .setNavigation(CardService.newNavigation().updateCard(onHomepage()))
    .build();
}

function collectRunNow() {
  const ids = getCollectIds();
  if (!ids.length) return notify('Start collect first.');
  const start = getCollectIndex();
  if (start >= ids.length) return notify('Collect done already.');

  const end = Math.min(start + COLLECT_BATCH, ids.length);
  const samples = getCollectedSamples();
  for (let i = start; i < end; i++) {
    const th = GmailApp.getThreadById(ids[i]);
    if (!th) continue;
    const last = lastMessage(th);
    if (!last) continue;
    const s = th.getFirstMessageSubject() || '';
    const body = last.getPlainBody() || '';
    if (s || body) samples.push({ subject: truncate(s, SUBJECT_TRIM), body: truncate(body, BODY_TRIM) });
    if ((i % 20) === 0 && i > 0) Utilities.sleep(50);
  }
  setCollectedSamples(samples);
  setCollectIndex(end);
  setCollectUpdated(new Date().toISOString());
  writeCollectPreview(ensureCollectDoc(), samples);
  logUser('Collected chunk: ' + (end - start) + ' → total samples=' + samples.length);

  const done = end >= ids.length;
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText(done ? 'Collect complete.' : 'Collected ' + end + ' / ' + ids.length))
    .setNavigation(CardService.newNavigation().updateCard(onHomepage()))
    .build();
}

function collectClear() {
  setCollectIds([]);
  setCollectIndex(0);
  setCollectedSamples([]);
  setCollectUpdated('');
  const docId = getCollectDocId();
  if (docId) {
    try {
      const doc = DocumentApp.openById(docId);
      doc.setName('Deprecated — ' + formatLocal(new Date().toISOString(), Session.getScriptTimeZone()) + ' — ' + doc.getName());
      doc.saveAndClose();
    } catch (_) {}
  }
  setCollectDocId('');
  logUser('Collect cleared.');
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText('Cleared.'))
    .setNavigation(CardService.newNavigation().updateCard(onHomepage()))
    .build();
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
      body.appendParagraph(''); body.appendHorizontalRule();
    });
    doc.saveAndClose();
  } catch (err) { logErr('writeCollectPreview', err); }
}

// =================== Step 2 — Generate ===================
function generateBriefing() {
  const apiKey = getApiKey();
  if (!apiKey) return notify('Set API key in Settings.');

  const samples = getCollectedSamples();
  if (!samples.length) return notify('Collect first.');

  const initial = seedBriefingHeader(getSignatureName(), getSignatureDisclosure());
  const prompt = buildBriefingPrompt(initial, samples);

  const ai = callGeminiWithRetry(apiKey, prompt, TEMP_BRIEF, MODEL_FAST);
  if (!ai.success) return notify(ai.errorHint || ('AI error: ' + ai.error));

  // Write final doc
  const finalId = createBriefingDoc(ai.data);
  PropertiesService.getUserProperties().setProperty(PROP_BRIEF_DOC_ID, finalId);
  if (!getBriefCreated()) PropertiesService.getUserProperties().setProperty(PROP_BRIEF_CREATED, new Date().toISOString());
  PropertiesService.getUserProperties().setProperty(PROP_BRIEF_LAST_UPDATED, new Date().toISOString());

  logUser('Briefing generated. Doc ID=' + finalId);

  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle('Briefing Ready'))
    .addSection(CardService.newCardSection().addWidget(CardService.newTextParagraph().setText('Your briefing has been generated using the fast model.')))
    .addSection(CardService.newCardSection()
      .addWidget(CardService.newTextButton().setText('Open Briefing').setOpenLink(CardService.newOpenLink().setUrl(docUrl(finalId)).setOpenAs(CardService.OpenAs.FULL_SIZE)))
      .addWidget(CardService.newTextButton().setText('Back').setOnClickAction(CardService.newAction().setFunctionName('goHome'))))
    .build();

  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText('Briefing generated'))
    .setNavigation(CardService.newNavigation().updateCard(card))
    .build();
}

function goHome() {
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().updateCard(onHomepage()))
    .build();
}

function buildBriefingPrompt(initialBriefing, samples) {
  const lines = [];
  lines.push('ROLE: Communications analyst/writer.');
  lines.push('GOAL: Return a complete, plain-text "Email Briefing — My Voice".');
  lines.push('');
  lines.push('CURRENT BRIEFING (seed):');
  lines.push(initialBriefing);
  lines.push('');
  lines.push('SAMPLES (trimmed; generalize; no PII):');
  samples.slice(0, 500).forEach((s, i) => {
    lines.push('--- Sample ' + (i + 1) + ' ---');
    lines.push('Subject: ' + (s.subject || '—'));
    lines.push(s.body || '—');
  });
  lines.push('');
  lines.push('INSTRUCTIONS:');
  lines.push('- Merge consistent patterns and FAQs.');
  lines.push('- Keep sections and clear headings.');
  lines.push('- Plain text only. No PII. No email quotes.');
  lines.push('- Short, clear, reusable items.');
  lines.push('');
  lines.push('RETURN ONLY THE FULL UPDATED BRIEFING (plain text).');
  return lines.join('\n');
}

// =================== Drafting (from briefing) ===================
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
    .setHeader(CardService.newCardHeader()
      .setTitle('Draft')
      .setSubtitle(truncate(subjectPreview, 40)));

  if (!getApiKey()) {
    builder.addSection(CardService.newCardSection()
      .addWidget(CardService.newTextParagraph().setText('Set API key to draft.'))
      .addWidget(CardService.newTextButton().setText('Settings').setOnClickAction(CardService.newAction().setFunctionName('showSettings')).setTextButtonStyle(CardService.TextButtonStyle.FILLED)));
    return builder.build();
  }
  if (!docId) {
    builder.addSection(CardService.newCardSection()
      .addWidget(CardService.newTextParagraph().setText('No briefing yet. Use the Builder (Collect → Generate).'))
      .addWidget(CardService.newTextButton().setText('Open Builder').setOnClickAction(CardService.newAction().setFunctionName('goHome')).setTextButtonStyle(CardService.TextButtonStyle.FILLED)));
    return builder.build();
  }

  const primary = CardService.newCardSection();
  primary.addWidget(CardService.newTextButton().setText('Create Draft')
    .setOnClickAction(CardService.newAction().setFunctionName('createDraftFromBriefing').setParameters({ accessToken, messageId }))
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED));
  primary.addWidget(CardService.newTextButton().setText('Open Briefing').setOpenLink(CardService.newOpenLink().setUrl(docUrl(docId)).setOpenAs(CardService.OpenAs.FULL_SIZE)));
  builder.addSection(primary);

  builder.addSection(buildModelSection(getModel(), 'modelSelectMsg')); // drafting model
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
    const emailBody = truncate(body, EMAIL_TRIM);

    const now = formatLocal(new Date().toISOString(), Session.getScriptTimeZone());
    const prompt = buildDraftPrompt(briefing, subject, emailBody, now);
    const ai = callGeminiWithRetry(getApiKey(), prompt, TEMP_DRAFT, resolveDraftModel());
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

    return CardService.newActionResponseBuilder().setNotification(CardService.newNotification().setText('Draft created')).setNavigation(CardService.newNavigation().updateCard(card)).build();
  } catch (err) {
    logErr('createDraftFromBriefing', err);
    return notify('Draft failed.');
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
function buildSettingsCard() {
  const savedKey = getApiKey();
  const signature = getSignatureName();
  const disclosure = getSignatureDisclosure();
  const scanCount = getScanCount();
  const model = getModel();

  const sec = CardService.newCardSection();
  sec.addWidget(CardService.newKeyValue().setTopLabel('API Key').setContent(savedKey ? 'Stored' : 'Missing'));
  sec.addWidget(CardService.newTextInput().setFieldName('apiKey').setTitle('Gemini API Key').setHint('Starts with AIza…').setValue(savedKey));
  sec.addWidget(CardService.newTextInput().setFieldName('signatureName').setTitle('Signature').setHint('AI Support — Your Org').setValue(signature));
  sec.addWidget(CardService.newTextInput().setFieldName('signatureDisclosure').setTitle('Disclosure').setHint('Optional').setValue(disclosure));

  const selScan = CardService.newSelectionInput().setType(CardService.SelectionInputType.DROPDOWN).setFieldName('scanCountSelectSettings').setTitle('Default scan N');
  [100, 200, 500].forEach(n => selScan.addItem(String(n), String(n), String(scanCount) === String(n)));
  sec.addWidget(selScan);

  const selModel = CardService.newSelectionInput().setType(CardService.SelectionInputType.DROPDOWN).setFieldName('modelSelectSettings').setTitle('Default drafting model');
  MODELS.forEach(m => selModel.addItem(m.label, m.id, (model || DEFAULT_MODEL) === m.id));
  sec.addWidget(selModel);

  const row = CardService.newButtonSet();
  row.addButton(CardService.newTextButton().setText('Save').setOnClickAction(CardService.newAction().setFunctionName('saveSettings')).setTextButtonStyle(CardService.TextButtonStyle.FILLED));
  row.addButton(CardService.newTextButton().setText('Validate').setOnClickAction(CardService.newAction().setFunctionName('actionValidateKey')));
  row.addButton(CardService.newTextButton().setText('Back').setOnClickAction(CardService.newAction().setFunctionName('showHomeFromSettings')));
  row.addButton(CardService.newTextButton().setText('Factory Reset').setOnClickAction(CardService.newAction().setFunctionName('actionFactoryReset')));
  sec.addWidget(row);

  return CardService.newCardBuilder().setHeader(CardService.newCardHeader().setTitle('Settings')).addSection(sec).build();
}

function showSettings() {
  return CardService.newActionResponseBuilder().setNavigation(CardService.newNavigation().pushCard(buildSettingsCard())).build();
}
function showSettingsUniversal() {
  return CardService.newUniversalActionResponseBuilder().displayAddOnCards([buildSettingsCard()]).build();
}
function showHomeFromSettings() {
  return CardService.newActionResponseBuilder().setNavigation(CardService.newNavigation().updateCard(onHomepage())).build();
}

function saveSettings(e) {
  try {
    const key = str(e?.formInput?.apiKey).trim();
    const sig = str(e?.formInput?.signatureName).trim();
    const disc = str(e?.formInput?.signatureDisclosure).trim();
    const scanSel = str(e?.formInput?.scanCountSelectSettings).trim();
    const modelSel = str(e?.formInput?.modelSelectSettings).trim();

    if (scanSel && /^[0-9]+$/.test(scanSel) && [100, 200, 500].includes(Number(scanSel))) setScanCount(Number(scanSel));
    if (modelSel && MODELS.some(m => m.id === modelSel)) setModel(modelSel);

    if (key) {
      if (!/^AIza[0-9A-Za-z_\-]{20,100}$/.test(key)) return toastCardUpdate(buildSettingsCard(), 'Invalid key.');
      PropertiesService.getUserProperties().setProperty(PROP_API_KEY, key);
    }
    PropertiesService.getUserProperties().setProperty(PROP_SIGNATURE_NAME, sig || 'AI Support — Your Organization');
    PropertiesService.getUserProperties().setProperty(PROP_SIGNATURE_DISCLOSURE, disc || '');
    return toastCardUpdate(buildSettingsCard(), 'Saved.');
  } catch (err) {
    logErr('saveSettings', err);
    return notify('Save failed.');
  }
}

function actionValidateKey() {
  const key = getApiKey();
  if (!key) return notify('No API key set.');
  const test = callGeminiWithRetry(key, 'ping', 0.0, MODEL_FAST);
  return notify(test.success ? 'Key OK ✅' : (test.errorHint || ('Key invalid: ' + test.error)));
}

function showDiagnostics() {
  const log = getUserLogLines();
  const sec = CardService.newCardSection().setHeader('Diagnostics');
  sec.addWidget(CardService.newTextParagraph().setText('<b>Recent</b><br>' + (log.length ? log.join('<br>') : '—')));
  const btns = CardService.newCardSection();
  btns.addWidget(CardService.newTextButton().setText('Back').setOnClickAction(CardService.newAction().setFunctionName('goHome')));
  const card = CardService.newCardBuilder().setHeader(CardService.newCardHeader().setTitle('Diagnostics')).addSection(sec).addSection(btns).build();
  return CardService.newActionResponseBuilder().setNavigation(CardService.newNavigation().pushCard(card)).build();
}

// =================== Gemini ===================
const RETRIES_MS = [0, 800, 2000];
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
    const payload = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: (typeof temperature === 'number' ? temperature : 0.3) } };
    const res = UrlFetchApp.fetch(url, {
      method: 'post', contentType: 'application/json', payload: JSON.stringify(payload),
      muteHttpExceptions: true, followRedirects: true, escaping: false, validateHttpsCertificates: true, timeout: 300
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
  return t.includes('429') || t.includes('rate') || t.includes('quota') || t.includes('timeout') || t.includes('deadline') || t.includes('unavailable') || t.includes('internal');
}
function mapErrorHint(errText) {
  const t = (errText || '').toLowerCase();
  if (t.includes('401') || t.includes('permission') || t.includes('unauthorized')) return 'Check API key.';
  if (t.includes('404') || t.includes('not found') || t.includes('model')) return 'Model not available.';
  if (t.includes('429') || t.includes('quota') || t.includes('rate')) return 'Busy. Try later.';
  if (t.includes('timeout') || t.includes('deadline')) return 'Network timeout.';
  return null;
}

// =================== Briefing scaffolding ===================
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

// =================== Collect state ===================
function setCollectIds(ids) { PropertiesService.getUserProperties().setProperty(PROP_COLLECT_IDS, JSON.stringify(ids || [])); }
function getCollectIds() { try { return JSON.parse(PropertiesService.getUserProperties().getProperty(PROP_COLLECT_IDS) || '[]'); } catch (_) { return []; } }
function setCollectIndex(i) { PropertiesService.getUserProperties().setProperty(PROP_COLLECT_INDEX, String(i || 0)); }
function getCollectIndex() { return Number(PropertiesService.getUserProperties().getProperty(PROP_COLLECT_INDEX) || '0'); }
function setCollectedSamples(a) { PropertiesService.getUserProperties().setProperty(PROP_COLLECT_SAMPLES, JSON.stringify(a || [])); }
function getCollectedSamples() { try { return JSON.parse(PropertiesService.getUserProperties().getProperty(PROP_COLLECT_SAMPLES) || '[]'); } catch (_) { return []; } }
function setCollectDocId(id) { PropertiesService.getUserProperties().setProperty(PROP_COLLECT_DOC_ID, id || ''); }
function getCollectDocId() { return PropertiesService.getUserProperties().getProperty(PROP_COLLECT_DOC_ID) || ''; }
function setCollectUpdated(iso) { PropertiesService.getUserProperties().setProperty(PROP_COLLECT_UPDATED, iso || ''); }

// =================== Generic helpers ===================
function getApiKey() { return PropertiesService.getUserProperties().getProperty(PROP_API_KEY) || ''; }
function getBriefDocId() { return PropertiesService.getUserProperties().getProperty(PROP_BRIEF_DOC_ID) || ''; }
function getBriefCreated() { return PropertiesService.getUserProperties().getProperty(PROP_BRIEF_CREATED) || ''; }
function getBriefLastUpdated() { return PropertiesService.getUserProperties().getProperty(PROP_BRIEF_LAST_UPDATED) || ''; }
function getModel() { return PropertiesService.getUserProperties().getProperty(PROP_MODEL) || DEFAULT_MODEL; }
function setModel(m) { PropertiesService.getUserProperties().setProperty(PROP_MODEL, m || DEFAULT_MODEL); }
function getSignatureName() { return PropertiesService.getUserProperties().getProperty(PROP_SIGNATURE_NAME) || 'AI Support — Your Organization'; }
function getSignatureDisclosure() { return PropertiesService.getUserProperties().getProperty(PROP_SIGNATURE_DISCLOSURE) || ''; }
function getScanCount() {
  const raw = PropertiesService.getUserProperties().getProperty(PROP_SCAN_COUNT);
  const n = Number(raw || 200);
  return [100, 200, 500].includes(n) ? n : 200;
}
function setScanCount(n) { if ([100, 200, 500].includes(Number(n))) PropertiesService.getUserProperties().setProperty(PROP_SCAN_COUNT, String(n)); }

function docUrl(id) { return 'https://docs.google.com/document/d/' + id + '/edit'; }
function notify(text) { return CardService.newActionResponseBuilder().setNotification(CardService.newNotification().setText(text)).build(); }
function toastCardUpdate(card, text) { return CardService.newActionResponseBuilder().setNotification(CardService.newNotification().setText(text)).setNavigation(CardService.newNavigation().updateCard(card)).build(); }

function truncate(s, n) { const t = str(s); return t.length > n ? t.substring(0, n) + '…' : t; }
function str(x) { return x == null ? '' : String(x); }

function lastMessage(thread) { const msgs = thread.getMessages(); return (msgs && msgs.length) ? msgs[msgs.length - 1] : null; }
function toHtml(text) { return str(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>'); }

function logUser(msg) {
  const tz = Session.getScriptTimeZone();
  const line = '[' + formatLocal(new Date().toISOString(), tz) + '] ' + msg;
  const props = PropertiesService.getUserProperties();
  const prev = props.getProperty(PROP_USER_LOG) || '[]';
  let arr = [];
  try { arr = JSON.parse(prev); } catch (_) { arr = []; }
  arr.push(line); if (arr.length > 15) arr = arr.slice(arr.length - 15);
  props.setProperty(PROP_USER_LOG, JSON.stringify(arr));
}
function getUserLogLines() {
  try { return JSON.parse(PropertiesService.getUserProperties().getProperty(PROP_USER_LOG) || '[]'); } catch (_) { return []; }
}

function logErr(where, err) { try { console.error(where + ': ' + (err && err.stack ? err.stack : String(err))); } catch (_) { Logger.log(where + ': ' + String(err)); } }
function formatLocal(iso, tz) { try { return Utilities.formatDate(new Date(iso), tz || Session.getScriptTimeZone(), 'MMM d, yyyy HH:mm'); } catch (_) { return iso || ''; } }

// =================== Apply model, Factory Reset ===================
function actionApplyModel(e) {
  const source = e?.parameters?.source || '';
  let selected = '';
  if (source === 'modelSelectHome') selected = e?.formInput?.modelSelectHome;
  if (source === 'modelSelectMsg')  selected = e?.formInput?.modelSelectMsg;
  if (!selected) return notify('Select a model.');
  setModel(selected);
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText('Model: ' + selected))
    .setNavigation(CardService.newNavigation().updateCard(onHomepage()))
    .build();
}

function actionFactoryReset() {
  PropertiesService.getUserProperties().deleteAllProperties();
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText('Reset done'))
    .setNavigation(CardService.newNavigation().updateCard(onHomepage()))
    .build();
}


>>>

the collection process is pretty fast, we collect the 200 last emails as default, not configurabgle!!! and we collect them all at once.!!

and then we trim double whitespaces out of it and other unnecessary whtiespaves and make just one string file and int he next step we communciate it all at once to the gemini api!!!! all in one go! no configuraiton or anything else! we go with a 200 response emails in a 2 step process!!!! all the previous fetch and Ai in different batches is now unnexaaary! also QA the whole code again and return WORKING DRY BUG FREE COMPLATE CODE