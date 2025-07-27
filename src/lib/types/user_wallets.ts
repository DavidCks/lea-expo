/**
 * Represents a user's wallet data, credits, and associated metadata.
 *
 * This type corresponds to the `user_wallets` table in the Supabase database.
 * It stores wallet-related information for each user, including credit balances,
 * wallet linkage, and timestamps for creation and updates.
 *
 * Properties:
 * - `id` — A unique UUID that identifies this wallet record. Automatically generated.
 * - `created_at` — A timestamp (ISO 8601 string) marking when the wallet entry was created.
 * - `updated_at` — A timestamp (ISO 8601 string) marking the last update to the wallet entry.
 *                  Automatically updated on any modification via a trigger.
 * - `user_uid` — The UUID of the associated user. This is a foreign key referencing `auth.users.id`.
 * - `credits` — The total number of credits the user currently holds.
 *               Should be a non-negative number and defaults to 0.
 * - `daily_minimum_credits` — The minimum number of credits a user receives daily,
 *                              often used for quotas, stipends, or gamification logic.
 * - `wallet_address` — A text field representing the linked wallet address (e.g., crypto wallet).
 *                      This field is nullable, meaning a user may not have linked a wallet yet.
 * - `wallet_balance` — The current balance of the linked external wallet.
 *                      This numeric field reflects external data and is expected to be non-negative.
 */
export type UserWalletsData = {
  /**
   * UUID of the wallet record (primary key).
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
   * UUID of the associated user (foreign key to auth.users.id).
   */
  user_uid: string;

  /**
   * Total credits assigned to the user, as a stringified number.
   */
  credits: string;

  /**
   * Daily minimum credits granted to the user, as a stringified number.
   */
  daily_minimum_credits: string;

  /**
   * Linked wallet address (nullable).
   */
  wallet_address: string | null;

  /**
   * Wallet balance as a stringified number.
   */
  wallet_balance: string;

  /**
   * Heygen session token
   */
  heygen_token: string | null;
};
