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
        logo: 'assets/bib_logo.png',
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

    // Backgrounds suaves e temas por empresa
    const temas = {
        rigarr1: { bg: '#f0f2f5', loginBg: 'linear-gradient(135deg, #1B2A4A 0%, #0f1a30 100%)', sectionColor: '#EFC030' },
        rigarr2: { bg: '#f9f0f3', loginBg: 'linear-gradient(135deg, #6B1A3A 0%, #4a1028 100%)', sectionColor: '#D4A574' },
        rigarr3: { bg: '#f5f0f2', loginBg: 'linear-gradient(135deg, #5C1A2A 0%, #3d1019 100%)', sectionColor: '#9A9AA8' },
        rigarr4: { bg: '#f2f0f7', loginBg: 'linear-gradient(135deg, #2A1A4A 0%, #1a1030 100%)', sectionColor: '#3CC0B0' },
        rigarr5: { bg: '#f0f5f6', loginBg: 'linear-gradient(135deg, #0A3D4A 0%, #062830 100%)', sectionColor: '#E85A5A' }
    };

    const tema = temas[empresa.id];
    if (tema) {
        // Login screen com gradiente da empresa
        const loginScreen = document.querySelector('.login-screen');
        if (loginScreen) {
            loginScreen.style.background = tema.loginBg;
            const loginCard = document.querySelector('.login-card');
            if (loginCard) {
                loginCard.style.background = 'rgba(255,255,255,0.95)';
            }
        }

        // Background suave no formulário
        const appForm = document.querySelector('.app-form');
        if (appForm) {
            appForm.style.background = tema.bg;
        }

        // Logo ocupa largura total como banner
        const formLogo = document.querySelector('.form-logo');
        if (formLogo) {
            formLogo.style.width = '100%';
            formLogo.style.maxWidth = '100%';
            formLogo.style.borderRadius = '12px';
        }

        // Barra de seções com cor accent da empresa
        document.querySelectorAll('.section-title').forEach(el => {
            el.style.borderBottomColor = tema.sectionColor;
        });
    }
}
