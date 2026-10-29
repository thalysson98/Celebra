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
  adicionarNovoItemSelect: async (tipoEntidade, dadosNovoItem) => {
    const novoId = String(Date.now());
    const itemCriado = {
      id: novoId,
      empresaId: dadosMemoria.empresaId,
      ...dadosNovoItem
    };

    switch (tipoEntidade) {
      case 'tiposEvento':
        dadosMemoria.tiposEvento.push(itemCriado);
        break;
      case 'tiposProfissional':
        dadosMemoria.tiposProfissional.push(itemCriado);
        break;
      case 'tiposLocal':
        dadosMemoria.tiposLocal.push(itemCriado);
        break;
      case 'locaisSalvos':
        dadosMemoria.locaisSalvos.push(itemCriado);
        break;
      case 'clientes':
        dadosMemoria.clientes.push(itemCriado);
        break;
      default:
        throw new Error('Tipo de entidade desconhecido para cadastro rápido.');
    }

    return itemCriado; // Retorna para preencher o select automaticamente no Front-end
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
  },
  criarEvento: async (dadosNovoEvento) => {
    return repositorioEventos.adicionarEvento(dadosNovoEvento);
  }
};