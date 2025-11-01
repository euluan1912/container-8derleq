const { addonBuilder, serveHTTP } = require('stremio-addon-sdk');
const axios = require('axios');
const cheerio = require('cheerio');

// --- 0. VARIÁVEIS DE CONFIGURAÇÃO E CACHE ---
const streamCache = {}; 
const CACHE_DURATION_MS = 10 * 60 * 1000; 

// ÍNDICE DO ARQUIVO DE VÍDEO PRINCIPAL (Índice 3 é o vídeo)
const VIDEO_FILE_INDEX = 3; 

// --- 1. MANIFESTO ---
const manifest = {
    id: 'org.rede-canais-scraper',
    version: '1.0.12', 
    name: 'Rede Canais Scraper [Cloud]',
    description: 'Addon para buscar streams em um site específico.',
    resources: ['catalog', 'stream'],
    types: ['movie', 'series'],
    catalogs: [{ type: 'movie', id: 'rede-catalogo', name: 'Rede Canais Filmes' }],
    idPrefixes: ['tt']
};

const builder = new addonBuilder(manifest);

// --- 2. HANDLER: CATÁLOGO ---
builder.defineCatalogHandler(args => {
    return Promise.resolve({ metas: [] });
});

// --- 3. HANDLER: STREAM (InfoHash Puro) ---
builder.defineStreamHandler(async (args) => {
    
    // 1. Cache 
    const cachedItem = streamCache[args.id];
    if (cachedItem && Date.now() - cachedItem.timestamp < CACHE_DURATION_MS) {
        return { streams: cachedItem.streams };
    }
    
    const streams = [];
    const URL_ALVO = 'https://redetorrent.com/um-pai-para-minha-filha-torrent-dublado-dual-audio-legendado-download/';
    const SELETOR_DO_LINK = 'a:contains("DOWNLOAD")';

    try {
        const config = { headers: { 'User-Agent': 'Mozilla/5.0 (...)', 'Referer': 'https://redetorrent.com/' } };
        const response = await axios.get(URL_ALVO, config);
        const $ = cheerio.load(response.data);
        const magnetElement = $(SELETOR_DO_LINK).first(); 

        if (magnetElement.length > 0) {
            let magnetLink = magnetElement.attr('href');
            
            if (magnetLink && magnetLink.startsWith('magnet:')) {
                // Limpa o magnetLink, mantendo apenas o InfoHash (xt)
                const infoHashMatch = magnetLink.match(/urn:btih:([a-zA-Z0-9]+)/);
                if (infoHashMatch && infoHashMatch[1]) {
                    magnetLink = `magnet:?xt=urn:btih:${infoHashMatch[1]}`;
                } else {
                    magnetLink = magnetLink.split('&tr=')[0];
                }
                
                streams.push({
                    url: magnetLink, 
                    name: 'Rede Canais Scraper [Cloud]',
                    title: '1080p | Dual Audio | 2.31 GB',
                    fileIdx: VIDEO_FILE_INDEX, 
                });
            }
        } 
    } catch (error) {
        console.error('❌ Erro durante o scraping (URL ou conexão):', error.message);
    }

    streamCache[args.id] = { streams: streams, timestamp: Date.now() };
    return { streams: streams };
});

// Ação: Altere a linha abaixo no seu arquivo src/server.js
serveHTTP(builder.getInterface(), { port: 5000 });
