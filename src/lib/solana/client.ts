import { Connection, PublicKey } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  getAccount,
  TokenAccountNotFoundError,
} from "@solana/spl-token";
import { SolanaSignInInput } from "@solana/wallet-standard-features";

export class SOL {
  static readonly RPC_URL = "https://api.mainnet-beta.solana.com"; // You can override this
  static readonly LEA_MINT_ADDRESS =
    "8SpPaFLycx897D6sowPZkEkcNdDahzRZb5itr6D8pump";
  static readonly connection = new Connection(SOL.RPC_URL);

  /**
   * Get the balance of a specific SPL token in a Solana wallet.
   * @param walletAddress The Solana wallet address.
   * @param tokenMintAddress The SPL token mint address (e.g., $LEA).
   * @returns Token balance (in smallest units, e.g., if 9 decimals, 1 token = 1_000_000_000).
   */
  static async getLEABalance(walletAddress: string): Promise<number> {
    try {
      const walletPublicKey = new PublicKey(walletAddress);
      const tokenMintPublicKey = new PublicKey(SOL.LEA_MINT_ADDRESS);

      const ata = await getAssociatedTokenAddress(
        tokenMintPublicKey,
        walletPublicKey,
      );

      const tokenAccount = await getAccount(SOL.connection, ata);

      return Number(tokenAccount.amount); // Balance in raw base units
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error instanceof TokenAccountNotFoundError) {
        return 0; // Token not found in wallet
      }
      console.error("Error fetching token balance:", error);
      throw error;
    }
  }

  static async createSignInData(requestUrl: string, walletAddress: string) {
    const now = new Date();
    let uri = requestUrl;
    uri = requestUrl.replace("127.0.0.1", "localhost");
    if (uri.includes("192.168")) {
      uri = uri.replace(/192\.168\.\d+\.\d+/, "localhost");
    }
    const currentUrl = new URL(uri);
    const domain = currentUrl.host
      .replace("127.0.0.1", "localhost")
      .replace(/192\.168\.\d+\.\d+/, "localhost");

    const signInData: SolanaSignInInput = {
      domain, // e.g., "lealabs.io"
      address: walletAddress, // to be filled on frontend when calling signIn(input)
      statement:
        "Clicking Sign or Approve only means you have proved this wallet is owned by you. This request will not trigger any blockchain transaction or cost any gas fee.",
      uri, // e.g., "https://lealabs.io/login"
      version: "1",
      nonce: Math.random().toString(36).substring(2, 14), // at least 8 alphanumeric chars
      issuedAt: now.toISOString(), // must be ISO 8601
      resources: ["https://lealabs.io", "https://phantom.app"],
    };

    return {
      value: signInData,
      error: null,
    };
  }
}
