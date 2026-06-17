import {
  concat,
  getCreate2Address,
  getAddress,
  keccak256,
  pad,
  toHex,
  type Address,
  type Hex,
} from "viem";

const ERC1167_HEADER =
  "0x3d60ad80600a3d3981f3363d3d373d3d3d363d73" as const;
const ERC1167_FOOTER = "0x5af43d82803e903d91602b57fd5bf3" as const;

export const DEFAULT_TBA_SALT =
  "0x0000000000000000000000000000000000000000000000000000000000000000" as const;

export type TbaAddressParams = {
  chainId: bigint | number;
  tokenContract: Address;
  tokenId: bigint;
  registry: Address;
  implementation: Address;
  salt?: Hex;
};

export function getErc6551CreationCode({
  implementation,
  salt = DEFAULT_TBA_SALT,
  chainId,
  tokenContract,
  tokenId,
}: Omit<TbaAddressParams, "registry">): Hex {
  return concat([
    ERC1167_HEADER,
    pad(getAddress(implementation), { size: 20 }),
    ERC1167_FOOTER,
    pad(salt, { size: 32 }),
    pad(toHex(BigInt(chainId)), { size: 32 }),
    pad(getAddress(tokenContract), { size: 32 }),
    pad(toHex(tokenId), { size: 32 }),
  ]);
}

export function getTbaAddress(params: TbaAddressParams): Address {
  const salt = params.salt ?? DEFAULT_TBA_SALT;
  const creationCode = getErc6551CreationCode({ ...params, salt });
  const bytecodeHash = keccak256(creationCode);

  return getCreate2Address({
    from: getAddress(params.registry),
    salt,
    bytecodeHash,
  });
}
