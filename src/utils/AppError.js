// Erro com código HTTP, usado para devolver 400/404/409 em vez de 500.
class AppError extends Error {
  constructor(mensagem, status = 400) {
    super(mensagem);
    this.status = status;
  }
}

module.exports = AppError;
