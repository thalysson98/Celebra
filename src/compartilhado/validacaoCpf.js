export function normalizarCpf(valor) {
  return String(valor || '').replace(/\D/g, '');
}

export function formatarCpf(valor) {
  const cpf = normalizarCpf(valor).slice(0, 11);
  return cpf
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export function validarCpf(valor) {
  const cpf = normalizarCpf(valor);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  for (let digito = 9; digito < 11; digito += 1) {
    let soma = 0;
    for (let indice = 0; indice < digito; indice += 1) {
      soma += Number(cpf[indice]) * (digito + 1 - indice);
    }
    const resto = (soma * 10) % 11;
    const verificador = resto === 10 ? 0 : resto;
    if (verificador !== Number(cpf[digito])) return false;
  }

  return true;
}
