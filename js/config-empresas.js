// ============================================================
// CONFIGURAÇÃO DAS EMPRESAS
// Cada empresa tem: nome, logo, cores e subtítulo
// ============================================================
const EMPRESAS = {
    rigarr1: {
        id: 'rigarr1',
        nome: 'Rigarr1',
        nomeCompleto: 'RIGARR LOGISTICS',
        logo: 'assets/logo-rigarr1.svg',
        cores: {
            primary: '#1B2A4A',
            primaryLight: '#2a3f6b',
            accent: '#C9A84C',
            accentHover: '#b8972f'
        }
    },
    rigarr2: {
        id: 'rigarr2',
        nome: 'Rigarr2',
        nomeCompleto: 'RIGARR CONSTRUCTION',
        logo: 'assets/logo-rigarr2.svg',
        cores: {
            primary: '#1A3C2A',
            primaryLight: '#2a5c3f',
            accent: '#E8872A',
            accentHover: '#d0751e'
        }
    },
    rigarr3: {
        id: 'rigarr3',
        nome: 'Rigarr3',
        nomeCompleto: 'RIGARR ENGINEERING',
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
        nome: 'Rigarr4',
        nomeCompleto: 'RIGARR TRANSPORT',
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
        nome: 'Rigarr5',
        nomeCompleto: 'RIGARR SERVICES',
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
