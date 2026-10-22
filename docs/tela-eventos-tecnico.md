# Tela de Eventos do técnico

## Objetivo

Registrar a implementação da aba **Eventos** do perfil de técnico e explicar como ela foi organizada, o que já funciona na interface e quais dados ainda dependem de uma evolução do produto. A implementação segue o protótipo do Figma enviado na conversa e mantém a arquitetura atual do aplicativo.

## O que foi implementado

- O cabeçalho passa a mostrar o nome da aba selecionada (`Eventos`, `Agenda` ou `Perfil`); na aba inicial continua exibindo a saudação do técnico.
- A área de eventos tem campo de busca por título do evento, protagonista/cliente, tipo, função profissional e endereço.
- A busca ignora diferenças entre letras maiúsculas/minúsculas e acentos. Por exemplo, `aniversario` encontra `Aniversário`.
- Os três filtros da referência foram incluídos: **Seus eventos**, **Pendentes** e **Disponíveis**. O filtro selecionado tem destaque visual e estado acessível.
- Os cartões exibem tipo do evento, título, cliente, data, horário, local, função do técnico e estado da convocação.
- A lista é ordenada por data. O mês e o ano do primeiro evento visível são exibidos acima dos cartões.
- Ao tocar em um cartão, a navegação abre a aba Agenda e seleciona o dia do evento.
- Os estados sem resultados e de carregamento/erro também são tratados.
- O ícone da aba Eventos foi aproximado do símbolo de ingresso do Figma usando o ícone `tag` disponível no conjunto Feather já instalado.

## Arquivos envolvidos

### `src/screens/TechnicianDashboardScreen.js`

É a tela que já controlava as abas do técnico. A implementação adiciona somente estados locais para o filtro e o texto de busca, além da renderização dos cartões de evento. A navegação inferior existente foi preservada. O método existente de aceitar/recusar convocações permanece inalterado e não foi ligado a novos botões nesta tela.

### `src/styles/technicianDashboardStyles.js`

Recebe os estilos da busca, dos filtros, dos cartões, da área ilustrativa, dos metadados, dos estados e da mensagem vazia. As cores seguem a paleta já usada no dashboard. As capas são ilustrações feitas com Views e ícones locais; não são fotografias de eventos.

### `docs/tela-eventos-tecnico.md`

Este arquivo registra o escopo, as decisões de interface, as limitações dos dados e os próximos passos sugeridos.

## De onde vêm os dados

No modo autenticado, a tela continua recebendo os dados pelo `subscribeToTechnicianAssignments` de `src/services/assignmentService.js`. Essa consulta lê a coleção `eventAssignments` filtrando `technicianUid` pelo usuário conectado. O filtro **Seus eventos** mostra registros com `status: accepted`; **Pendentes** mostra registros com `status: pending`. Registros recusados não aparecem nessas listas.

O modo local de demonstração (`?preview=technician`) usa os registros de exemplo definidos em `App.js`. As mudanças de resposta nesse modo são apenas locais, em memória. A tela Events não adiciona ou altera documentos do Firestore.

### Limite do filtro “Disponíveis”

O serviço atual consulta somente convocações que já estão associadas ao técnico autenticado. Portanto, não existe nele uma consulta de eventos ainda sem técnico ou liberados para candidatura. A aba mostra uma mensagem vazia apropriada, sem inventar dados. Para preenchê-la em produção, será necessário definir o fluxo de publicação de oportunidades, o modelo de dados e as regras de acesso no Firestore; isso está fora do escopo de front-end desta entrega.

## Diferenças em relação ao protótipo

- O protótipo usa fotografias e mostra informações como quantidade de locais, convidados e equipe completa. O modelo consumido nesta tela atualmente não fornece imagem do evento, número de convidados, locais estruturados nem ocupação da equipe. A interface usa uma capa ilustrativa por categoria e exibe somente dados disponíveis.
- A data é formatada dinamicamente com o locale `pt-BR`; o agrupamento mensal também acompanha as datas dos eventos em vez de fixar “Outubro de 2026”.
- Tocar em um cartão abre a Agenda e seleciona a data correspondente; ainda não há uma tela individual de detalhes do evento neste fluxo.
- **Disponíveis** permanece vazio até existir uma fonte de oportunidades autorizada para o técnico.

## Como visualizar

1. Inicie o app web com `npm run web`.
2. Abra `http://localhost:8081/?preview=technician`.
3. Toque em **Eventos** na navegação inferior.
4. Alterne os filtros, digite parte do título ou cliente e abra um cartão para ir à Agenda.

## Próximas etapas sugeridas

1. Validar com a equipe quais dados do cartão são obrigatórios e adicionar ao modelo os campos aprovados (por exemplo, imagem, quantidade de convidados, locais e escala da equipe).
2. Desenhar a tela de detalhes do evento e decidir quais ações pertencem ao técnico.
3. Especificar como oportunidades ficam disponíveis e como um técnico demonstra interesse; depois implementar a consulta e as regras no backend.
4. Revisar a tela em dispositivos móveis com as variações de conteúdo e estados vazios.

## Escopo e validação

Esta entrega trata da apresentação, busca e filtragem de dados já fornecidos à tela. Não altera o esquema do banco, consultas, regras de segurança, autenticação nem navegação estrutural. A validação deve ser feita pela visualização web indicada acima; dados de demonstração não representam registros persistidos.
