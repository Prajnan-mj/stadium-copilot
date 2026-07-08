export const SAMPLE_CHIPS = [
  { lang: 'en', flag: 'EN', text: 'How do I get from Gate C to Section 232?' },
  { lang: 'es', flag: 'ES', text: '¿Qué bolsos están permitidos en el estadio?' },
  { lang: 'pt', flag: 'PT', text: 'Onde fica o banheiro acessível mais próximo?' },
  { lang: 'hi', flag: 'HI', text: 'मैनहट्टन वापस जाने का सबसे अच्छा तरीका क्या है?' },
  { lang: 'no', flag: 'NO', text: 'Hvor er nærmeste hydreringsstasjon?' },
]

export const UI_STRINGS: Record<string, Record<string, string>> = {
  en: {
    placeholder: 'Ask anything about the venue...',
    offlineBanner: 'Offline mode — cached venue info only',
    cached: 'cached',
    accessibility: 'Step-free routing',
    ticketSnap: 'Snap your ticket',
    sendBtn: 'Send',
  },
  es: {
    placeholder: 'Pregunta lo que quieras sobre el estadio...',
    offlineBanner: 'Modo sin conexión — solo información en caché',
    cached: 'caché',
    accessibility: 'Ruta sin escalones',
    ticketSnap: 'Escanear entrada',
    sendBtn: 'Enviar',
  },
  pt: {
    placeholder: 'Pergunte qualquer coisa sobre o local...',
    offlineBanner: 'Modo offline — apenas informações em cache',
    cached: 'cache',
    accessibility: 'Rota acessível',
    ticketSnap: 'Escanear ingresso',
    sendBtn: 'Enviar',
  },
  hi: {
    placeholder: 'स्टेडियम के बारे में कुछ भी पूछें...',
    offlineBanner: 'ऑफलाइन मोड — केवल कैश्ड जानकारी',
    cached: 'कैश',
    accessibility: 'सीढ़ी-मुक्त मार्ग',
    ticketSnap: 'टिकट स्कैन करें',
    sendBtn: 'भेजें',
  },
  no: {
    placeholder: 'Spør om hva som helst om arenaen...',
    offlineBanner: 'Frakoblet modus — bare hurtigbufret info',
    cached: 'bufret',
    accessibility: 'Trinnfri rute',
    ticketSnap: 'Skann billett',
    sendBtn: 'Send',
  },
}

export function getUIString(lang: string, key: string): string {
  return UI_STRINGS[lang]?.[key] ?? UI_STRINGS['en'][key] ?? key
}
