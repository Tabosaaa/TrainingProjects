// Erros do domínio. O service lança; o controller traduz para HTTP (400/404).

export class ErroValidacao extends Error {}
export class ErroNaoEncontrado extends Error {}
