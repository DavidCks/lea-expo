/**
 * @deprecated This type is deprecated and should not be used in new code.
 * Use `UserWallet` instead.
 *
 * Raw session data as returned directly from Supabase.
 *
 * Numeric fields like `sessions_started` and `sessions_time_elapsed` may
 * come back as strings (if stored as `numeric`) and must be parsed.
 * Use this type when handling raw Supabase responses.
 */
export type SessionData = {
  /**
   * Unique identifier for the session record (UUID).
   */
  session_uid: string;

  /**
   * UUID of the user associated with this session.
   */
  user_uid: string;

  /**
   * Timestamp of when the session record was created (ISO 8601 string).
   */
  created_at: string;

  /**
   * Total number of sessions the user has started.
   * May be a string if stored as `numeric` in the DB.
   */
  sessions_started: number | string;

  /**
   * Total session time elapsed (in seconds or milliseconds, depending on implementation).
   * May be a string if stored as `numeric` in the DB.
   */
  sessions_time_elapsed: number | string;

  /**
   * Timestamp of the last update to this session record (ISO 8601 string).
   */
  updated_at: string;

  /**
   * Optional token associated with the session, e.g., for authentication.
   */
  token?: string;
};
