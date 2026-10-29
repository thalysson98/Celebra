// src/servicos/repositorioEventos.js
import dadosMemoria from './dadosMemoria';

export const repositorioEventos = {

  // Listar todos os eventos da empresa
  listarEventos: async () => {
    return dadosMemoria.eventos;
  },

  // Obter opções para alimentar os selects dinâmicos das telas de cadastro
  obterOpcoesSelect: async (tipoEntidade) => {
    switch (tipoEntidade) {
      case 'tiposEvento':
        return dadosMemoria.tiposEvento;
      case 'tiposProfissional':
        return dadosMemoria.tiposProfissional;
      case 'tiposLocal':
        return dadosMemoria.tiposLocal;
      case 'locaisSalvos':
        return dadosMemoria.locaisSalvos;
      case 'clientes':
        return dadosMemoria.clientes;
      default:
        return [];
    }
  },

  // Select Inteligente: Adiciona um novo tipo/cadastro na hora (via modal) e retorna o item criado
  // Adicione ou ajuste esta parte dentro de repositorioEventos.js
adicionarNovoItemSelect: async (tipoAtivo, novoItem) => {
  const itemFormatado = { id: String(Date.now()), nome: novoItem.nome };
  if (tipoAtivo === 'tiposEvento') {
    dadosMemoria.tiposEvento.push(itemFormatado);
  } else if (tipoAtivo === 'clientes') {
    dadosMemoria.clientes.push(itemFormatado);
  } else if (tipoAtivo === 'locais') {
    if (!dadosMemoria.locais) dadosMemoria.locais = [];
    dadosMemoria.locais.push(itemFormatado);
  } else {
    throw new Error("Tipo de entidade desconhecido para cadastro rápido.");
  }
  return itemFormatado;
},
obterOpcoesSelect: async (tipo) => {
  if (tipo === 'tiposEvento') return dadosMemoria.tiposEvento || [];
  if (tipo === 'clientes') return dadosMemoria.clientes || [];
  if (tipo === 'locais') return dadosMemoria.locais || [{ id: '1', nome: 'Sítio Romagna' }, { id: '2', nome: 'Complexo Let\'s Drop' }];
  return [];
},

  // Criar um novo evento completo
  adicionarEvento: async (dadosNovoEvento) => {
    const eventoCompleto = {
      id: String(Date.now()),
      empresaId: dadosMemoria.empresaId,
      ...dadosNovoEvento
    };
    
    dadosMemoria.eventos.push(eventoCompleto);
    return eventoCompleto;
  }
};