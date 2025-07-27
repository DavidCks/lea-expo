/**
 * @deprecated This type is deprecated and should not be used in new code.
 * Use `UserWallet` instead.
 *
 * Raw user credits data as returned from Supabase.
 * Numeric fields are returned as strings and must be parsed.
 */
export type UserCreditsData = {
  /**
   * Unique identifier for the record (UUID).
   */
  id: string;

  /**
   * Timestamp when the record was created (ISO 8601 string).
   */
  created_at: string;

  /**
   * Timestamp when the record was last updated (ISO 8601 string).
   */
  updated_at: string;

  /**
   * UUID of the user associated with the record.
   */
  user_uid: string;

  /**
   * Total number of user credits, stored as a stringified number.
   */
  credits: string;

  /**
   * The user's connected wallet address.
   */
  wallet_address: string;

  /**
   * The provider name of the user's wallet (e.g., "Metamask", "Phantom").
   */
  wallet_provider: string;

  /**
   * Current wallet balance as a stringified number.
   */
  wallet_balance: string;

  /**
   * Time limit for sessions (in seconds or ms), stored as a stringified number.
   */
  sessions_time_limit: string;

  /**
   * Maximum number of sessions allowed, stored as a stringified number.
   */
  sessions_limit: string;
};
