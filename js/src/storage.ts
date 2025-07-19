/**
 * Storage utilities for garde-fou
 */

export class CallSignature {
  constructor(
    public fnName: string | undefined,
    public args: any[],
    public kwargs: Record<string, any>
  ) {}

  toString(): string {
    return JSON.stringify({
      fnName: this.fnName,
      args: this.args,
      kwargs: Object.keys(this.kwargs).sort().reduce((sorted, key) => {
        sorted[key] = this.kwargs[key];
        return sorted;
      }, {} as Record<string, any>)
    });
  }
}
