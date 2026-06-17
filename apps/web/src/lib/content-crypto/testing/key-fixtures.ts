import { PrivateKey } from "eciesjs";

export type TbaKeyFixture = {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
};

export function createTbaKeyFixture(): TbaKeyFixture {
  const privateKey = new PrivateKey();

  return {
    privateKey: toUint8Array(privateKey.secret),
    publicKey: toUint8Array(privateKey.publicKey.toBytes()),
  };
}

function toUint8Array(bytes: Uint8Array | Buffer): Uint8Array {
  return bytes instanceof Uint8Array && bytes.constructor === Uint8Array
    ? bytes
    : new Uint8Array(bytes);
}

export function createDeterministicTbaKeyFixture(seed = 42): TbaKeyFixture {
  const secret = new Uint8Array(32);
  secret[31] = seed;
  const privateKey = new PrivateKey(secret);

  return {
    privateKey: toUint8Array(privateKey.secret),
    publicKey: toUint8Array(privateKey.publicKey.toBytes()),
  };
}
