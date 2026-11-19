/** `?mock=1` na URL liga o modo demonstração (também vale na janela grande, que herda o parâmetro). */
export function isDemoByUrl(search = window.location.search) {
  return new URLSearchParams(search).get('mock') === '1'
}
