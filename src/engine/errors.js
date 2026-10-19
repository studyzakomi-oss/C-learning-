// Erreurs de compilation et d'exécution du moteur C.

export class CError extends Error {
  /**
   * @param {string} message message en français
   * @param {{line?:number,col?:number,file?:string,gcc?:string,code?:string,data?:any}} info
   */
  constructor(message, info = {}) {
    super(message);
    this.line = info.line || 0;
    this.col = info.col || 0;
    this.file = info.file || 'main.c';
    this.gcc = info.gcc || '';
    this.code = info.code || 'error';
    this.data = info.data;
  }
}

export class RuntimeError extends Error {
  /**
   * @param {string} message
   * @param {{code?:string,line?:number,detail?:string,signal?:string}} info
   */
  constructor(message, info = {}) {
    super(message);
    this.code = info.code || 'runtime';
    this.line = info.line || 0;
    this.detail = info.detail || '';
    this.signal = info.signal || '';
  }
}

/** Signal interne utilisé par exit() */
export class ExitSignal {
  constructor(status) { this.status = status; }
}
