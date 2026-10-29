// Repositório de dados em memória para testes e prototipação
const dadosMemoria = {
  empresaId: "empresa_123",

  // 1. Cadastros customizados (Aba Administrando)
  tiposEvento: [
    { id: "1", empresaId: "empresa_123", nome: "Casamento" },
    { id: "2", empresaId: "empresa_123", nome: "15 Anos" },
    { id: "3", empresaId: "empresa_123", nome: "Formatura" }
  ],

  tiposProfissional: [
    { id: "1", empresaId: "empresa_123", nome: "Cinegrafista" },
    { id: "2", empresaId: "empresa_123", nome: "Operador de Drone" },
    { id: "3", empresaId: "empresa_123", nome: "Fotógrafo" }
  ],

  tiposLocal: [
    { id: "1", empresaId: "empresa_123", nome: "Cerimónia" },
    { id: "2", empresaId: "empresa_123", nome: "Festa" },
    { id: "3", empresaId: "empresa_123", nome: "Making Off" }
  ],

  locaisSalvos: [
    { id: "1", empresaId: "empresa_123", nomeDoLocal: "Sítio Romagna", rua: "Estrada dos Vinhedos", bairro: "Jardim", numero: "450", cidade: "Jundiaí", estado: "SP" },
    { id: "2", empresaId: "empresa_123", nomeDoLocal: "Complexo Let's Drop", rua: "Avenida Luiz Lazzarin", bairro: "Presidente Vargas", numero: "450", cidade: "Criciúma", estado: "SC" }
  ],

  clientes: [
    { id: "1", empresaId: "empresa_123", nome: "Ana Costa & Pedro Almeida", cpf: "123.456.789-00", instagram: "@anapedro", telefone: "(11) 99999-0123", statusCadastro: "Cadastro completo" },
    { id: "2", empresaId: "empresa_123", nome: "Marina Melo", cpf: "222.333.444-55", instagram: "@marinamelo", telefone: "(48) 9952-0412", statusCadastro: "Cadastro completo" }
  ],

  // 2. Eventos cadastrados
  eventos: [
    {
      id: "1",
      empresaId: "empresa_123",
      titulo: "Ana & Pedro",
      tipoEvento: "Casamento",
      dataInicio: "17 out 2026",
      horaInicio: "16h",
      numConvidados: 180,
      imagemUrl: "https://images.unsplash.com/photo-1519741497674-611481863552",
      statusTempo: "futuros",
      statusEquipa: "Equipa Pendente",
      notasProducao: "Priorizar votos e entrada dos noivos. Drone antes da cerimónia, conforme clima e autorização do local.",
      cliente: {
        nome: "Ana Costa & Pedro Almeida",
        cpf: "123.456.789-00",
        instagram: "@anapedro",
        telefone: "(11) 99999-0123",
        statusCadastro: "Cadastro completo"
      },
      locais: [
        {
          id: "loc_1",
          tipoLocal: "Cerimónia e Festa",
          nomeDoLocal: "Sítio Romagna",
          endereco: "Estrada dos Vinhedos, 450 - Jardim",
          cidadeEstado: "Jundiaí - SP",
          horaPrevista: "16:00"
        }
      ],
      equipa: [
        {
          id: "eq_1",
          nomeProfissional: "Carlos Silva",
          funcao: "Cinegrafista",
          statusConfirmacao: "Confirmado"
        },
        {
          id: "eq_2",
          nomeProfissional: "Mariana Souza",
          funcao: "Operadora de Drone",
          statusConfirmacao: "Pendente"
        }
      ],
      financeiro: {
        valorContrato: "R$ 4.500,00",
        custoEquipaPrevisto: "R$ 1.200,00",
        lucroPrevisto: "R$ 3.300,00"
      }
    },
    {
      id: "2",
      empresaId: "empresa_123",
      titulo: "15 Anos - Marina",
      tipoEvento: "15 Anos",
      dataInicio: "24 out 2026",
      horaInicio: "19h",
      numConvidados: 120,
      imagemUrl: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622",
      statusTempo: "futuros",
      statusEquipa: "Equipa Completa",
      notasProducao: "Festa temática neon. Vídeo de retrospectiva pontualmente às 21h.",
      cliente: {
        nome: "Marina Melo",
        cpf: "222.333.444-55",
        instagram: "@marinamelo",
        telefone: "(48) 9952-0412",
        statusCadastro: "Cadastro completo"
      },
      locais: [],
      equipa: [],
      financeiro: {
        valorContrato: "R$ 3.200,00",
        custoEquipaPrevisto: "R$ 800,00",
        lucroPrevisto: "R$ 2.400,00"
      }
    }
  ]
};

export default dadosMemoria;
