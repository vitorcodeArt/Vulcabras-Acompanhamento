/**
 * Mascara o que pode identificar alguém ou um pedido (defesa em profundidade: o backend já mascara
 * antes de gravar). E-mail, link, números longos (CPF, CNPJ, telefone, pedido, CEP) e códigos opacos
 * que misturam letras e números. Não reconhece nomes próprios: só use em texto do sistema.
 */
export function maskText(value) {
  if (typeof value !== 'string') return value
  return value
    .replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, '[e-mail]')
    .replace(/https?:\/\/\S+/gi, '[link]')
    .replace(/\d(?:[\s./()-]?\d){5,}/g, '•••')
    .replace(/\b(?=[A-Za-z0-9_-]*\d)(?=[A-Za-z0-9_-]*[A-Za-z])[A-Za-z0-9_-]{20,}\b/g, '•••')
    .replace(/\s+/g, ' ')
    .trim()
}
