// Armazenamento em memória (Simula o banco do Firebase)
export const bancoMemoria = {
  eventos: [
    {
      id: '1',
      titulo: 'Aniversário Exemplo',
      descricao: 'Festa de teste em memória',
      data: '2026-12-10',
      local: 'Criciúma - SC',
      fornecedores: [
        { id: 'forn_1', nome: 'Buffet Delícia', categoria: 'Alimentação', custo: 1500 }
      ],
      atracoes: [
        { id: 'atr_1', titulo: 'Recepção dos convidados', horario: '19:00' }
      ]
    }
  ]
};