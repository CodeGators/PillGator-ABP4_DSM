export const tema = {
  cores: {
    fundo: '#0A0A0A',
    superficie: '#161616',
    superficieAlta: '#202020',
    borda: '#222222',
    bordaForte: '#333333',
    primaria: '#00FF66',
    primariaSuave: 'rgba(0, 255, 102, 0.12)',
    perigo: '#FF4444',
    perigoSuave: 'rgba(255, 68, 68, 0.12)',
    alerta: '#FFB800',
    alertaSuave: 'rgba(255, 184, 0, 0.14)',
    info: '#00A3FF',
    infoSuave: 'rgba(0, 163, 255, 0.14)',
    texto: '#FFFFFF',
    textoSecundario: '#C8C8C8',
    textoFraco: '#8A8A8A',
    preto: '#0A0A0A',
  },
  espacamentos: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 28,
  },
  raios: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  tipografia: {
    titulo: 28,
    subtitulo: 20,
    corpo: 16,
    apoio: 14,
    legenda: 12,
  },
};

export type Tema = typeof tema;
