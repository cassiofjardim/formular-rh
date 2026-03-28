// ============================================================
// CONFIGURAÇÃO DAS EMPRESAS
// Cada empresa tem: nome, logo, cores e subtítulo
// ============================================================
const EMPRESAS = {
    rigarr1: {
        id: 'rigarr1',
        nome: 'Rigarr',
        nomeCompleto: 'GRUPO RIGARR',
        subtitulo: 'Logistics & Construction',
        logo: 'assets/logo-grupo-rigarr.png',
        cores: {
            primary: '#1B2A4A',
            primaryLight: '#2a3f6b',
            accent: '#EFC030',
            accentHover: '#d4a820'
        }
    },
    rigarr2: {
        id: 'rigarr2',
        nome: 'BIB',
        nomeCompleto: 'BIB - BEBIDA IN BOX',
        subtitulo: 'Bebida in Box',
        logo: 'assets/logo-bib.svg',
        cores: {
            primary: '#6B1A3A',
            primaryLight: '#8a2550',
            accent: '#D4A574',
            accentHover: '#c49060'
        }
    },
    rigarr3: {
        id: 'rigarr3',
        nome: 'Rigarr SPON',
        nomeCompleto: 'RIGARR SPON',
        subtitulo: 'SPON',
        logo: 'assets/logo-rigarr3.svg',
        cores: {
            primary: '#5C1A2A',
            primaryLight: '#7d2a3d',
            accent: '#9A9AA8',
            accentHover: '#808090'
        }
    },
    rigarr4: {
        id: 'rigarr4',
        nome: 'Rigarr MGON',
        nomeCompleto: 'RIGARR MGON',
        subtitulo: 'MGON',
        logo: 'assets/logo-rigarr4.svg',
        cores: {
            primary: '#2A1A4A',
            primaryLight: '#3d2a6b',
            accent: '#3CC0B0',
            accentHover: '#2da89a'
        }
    },
    rigarr5: {
        id: 'rigarr5',
        nome: 'Rigarr 5',
        nomeCompleto: 'RIGARR 5',
        subtitulo: 'Rigarr 5',
        logo: 'assets/logo-rigarr5.svg',
        cores: {
            primary: '#0A3D4A',
            primaryLight: '#155a6b',
            accent: '#E85A5A',
            accentHover: '#d04545'
        }
    }
};

// Empresa padrão
const EMPRESA_PADRAO = 'rigarr1';

// Detectar empresa pela URL (?empresa=rigarr2)
function detectarEmpresa() {
    const params = new URLSearchParams(window.location.search);
    const empresaParam = (params.get('empresa') || '').toLowerCase();
    return EMPRESAS[empresaParam] || EMPRESAS[EMPRESA_PADRAO];
}

// Aplicar tema da empresa (cores CSS + logos)
function aplicarTemaEmpresa(empresa) {
    const root = document.documentElement;
    root.style.setProperty('--primary', empresa.cores.primary);
    root.style.setProperty('--primary-light', empresa.cores.primaryLight);
    root.style.setProperty('--accent', empresa.cores.accent);
    root.style.setProperty('--accent-hover', empresa.cores.accentHover);

    // Atualizar logos
    document.querySelectorAll('.login-logo, .form-logo, .sidebar-logo').forEach(img => {
        img.src = empresa.logo;
    });

    // Atualizar título da página
    document.title = 'Checklist Admissional - ' + empresa.nome;
}
