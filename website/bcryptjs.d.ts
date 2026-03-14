declare module "bcryptjs" {
  function hash(s: string, salt: number): Promise<string>;
  function compare(s: string, hash: string): Promise<boolean>;
}
