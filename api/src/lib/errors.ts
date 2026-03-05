export class SourceNotSupportedError extends Error {
  constructor(message = "Source not supported yet") {
    super(message);
    this.name = "SourceNotSupportedError";
  }
}
