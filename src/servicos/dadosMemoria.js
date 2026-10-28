// src/servicos/dadosMemoria.js

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
        email: "ana.costa@email.com",
        telefone: "(11) 99999-0123",
        status: "Cadastro completo"
      },
      locaisDoEvento: [
        {
          idLocal: "1",
          tipoLocal: "Cerimónia",
          nomeEstabelecimento: "Sítio Romagna",
          endereco: "Estrada dos Vinhedos, 450 • Jundiaí, SP",
          complemento: "Jardim principal",
          chegadaEquipa: "Chegada da equipa às 15h",
          horarioInicio: "16h",
          horarioFim: "17h"
        },
        {
          idLocal: "2",
          tipoLocal: "Festa",
          nomeEstabelecimento: "Complexo Let's Drop",
          endereco: "Avenida Luiz Lazzarin, 450 • Criciúma, SC",
          complemento: "Salão de festas",
          chegadaEquipa: "Captação até o encerramento",
          horarioInicio: "18h",
          horarioFim: "23h"
        }
      ],
      equipaDeCampo: [
        { idProfissional: "1", funcao: "Cinegrafista principal", nome: "Ronald Cipriani", status: "Confirmado(a)", enviarConvite: true },
        { idProfissional: "2", funcao: "Cinegrafista de apoio", nome: "Raquel da Boit", status: "Pendente", enviarConvite: true }
      ],
      financeiro: {
        valorTotal: 6000.00,
        valorPago: 2000.00,
        saldoAReceber: 4000.00,
        parcelas: [
          { id: "1", nome: "1ª parcela", valor: 2000.00, metodo: "Pix", dataVencimento: "10 set 2026", status: "Pago" },
          { id: "2", nome: "2ª parcela", valor: 2000.00, metodo: "Pix", dataVencimento: "15 out 2026", status: "Vence em 3 dias" },
          { id: "3", nome: "3ª parcela", valor: 2000.00, metodo: "Pix", dataVencimento: "15 nov 2026", status: "A vencer" }
        ]
      }
    }
  ]
};

export default dadosMemoria;