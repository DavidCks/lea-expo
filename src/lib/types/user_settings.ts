/**
 * Raw user settings data as returned directly from Supabase.
 *
 * This type reflects the structure of the `user_settings` table,
 * and should be used for data received directly from the database.
 */
export type UserSettingsData = {
  /**
   * Unique identifier for this settings record (UUID).
   */
  id: string;

  /**
   * UUID of the user to whom these settings belong.
   */
  user_uid: string;

  /**
   * Timestamp of when the settings record was created (ISO 8601 string).
   */
  created_at: string;

  /**
   * The user's preferred interface language (e.g. "en", "es", "fr").
   */
  language: string;

  /**
   * The desired output language for generated or returned content.
   */
  output_language: string;
};
