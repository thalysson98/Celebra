export async function marcarTodasNotificacoesComoLidas(listaNotificacoes = []) {
  const naoLidas = listaNotificacoes.filter((item) => !item.lida);
  if (naoLidas.length === 0) return;

  await Promise.all(
    naoLidas.map((item) =>
      updateDoc(doc(bancoDados, 'notificacoes', item.id), {
        lida: true,
      })
    )
  );
}