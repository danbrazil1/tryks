/* ============================================================
   Tryks — configuração do site (edite AQUI, não no HTML)
   Vire as flags abaixo na hora do lançamento; nenhum outro
   arquivo precisa ser tocado.
   ============================================================ */
window.TRYKS_CONFIG = {
  /* ---- Lojas ------------------------------------------------
     Enquanto a flag estiver false, o selo mostra "Em breve"
     (não clicável). Vire para true quando o app estiver no ar. */
  PLAY_STORE_LIVE: false,
  APP_STORE_LIVE: false,

  // Link público da ficha na Play Store (package com.danbrazil.clips)
  PLAY_STORE_URL: 'https://play.google.com/store/apps/details?id=com.danbrazil.clips',
  // Opt-in do teste fechado — usado no fallback de import enquanto
  // PLAY_STORE_LIVE = false (deixe '' para esconder).
  PLAY_TESTING_URL: 'https://play.google.com/apps/testing/com.danbrazil.clips',
  // COLE AQUI o link da App Store quando existir.
  APP_STORE_URL: '',

  /* ---- Contato ---------------------------------------------- */
  CONTACT_EMAIL: 'contato@tryks.app',

  /* ---- Bases ------------------------------------------------
     Deep link de importação: DEEP_LINK_PREFIX + encodeURIComponent(jsonUrl).
     OBS: o scheme registrado no app hoje é "boardtricks://" — quando o
     scheme "tryks://" for decidido/registrado no app, é só trocar aqui. */
  DEEP_LINK_PREFIX: 'tryks://import?url=',
  // URL base onde os JSONs das bases ficam hospedados (pasta /json/ do site).
  JSON_BASE_URL: 'https://tryks.app/json/',
  // Catálogo das bases da comunidade (relativo à página bases.html).
  CATALOG_URL: './catalogo.json',

  /* ---- Formulário de envio de base (Tally) -------------------
     Crie o formulário em tally.so e cole o ID aqui (ex.: 'w2XyZa').
     Enquanto estiver vazio, a página mostra um aviso de "em breve". */
  TALLY_FORM_ID: '',

  /* ---- Depoimentos -------------------------------------------
     A seção só aparece quando SHOW_TESTIMONIALS = true E houver
     itens no array. Copie reviews REAIS das lojas quando existirem.
     Formato: { text: '…', author: 'Nome', detail: 'Google Play · Brasil' } */
  SHOW_TESTIMONIALS: false,
  TESTIMONIALS: [
    // { text: 'Exemplo de depoimento.', author: 'Fulano', detail: 'Google Play' },
  ],

  /* ---- Idiomas ------------------------------------------------
     Para adicionar um idioma: crie i18n/{código}.json (copie o pt.json
     e traduza os valores) e acrescente o código aqui. O seletor de
     idioma aparece sozinho quando houver 2+. */
  LANGS: ['pt'],
  DEFAULT_LANG: 'pt',
  LANG_NAMES: {
    pt: 'Português',
    en: 'English',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
  },
};
