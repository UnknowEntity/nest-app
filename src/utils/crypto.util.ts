import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

export class Scrypt {
  public static async hash(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');

    const hash = await new Promise<string>((resolve, reject) => {
      scrypt(password, salt, 64, (err, derivedKey) => {
        if (err) reject(err);
        resolve(derivedKey.toString('hex') + ':' + salt);
      });
    });

    return hash;
  }

  public static async verify(password: string, hash: string): Promise<boolean> {
    const [derivedKey, salt] = hash.split(':');

    const hashToCompare = await new Promise<Buffer>((resolve, reject) => {
      scrypt(password, salt, 64, (err, derivedKeyBuffer) => {
        if (err) reject(err);
        resolve(derivedKeyBuffer);
      });
    });

    return timingSafeEqual(Buffer.from(derivedKey, 'hex'), hashToCompare);
  }
}
