export type AVATAR = {
  avatar_id: string;
  name: string;
  display_name: string;
  enabled: boolean;
};

export const AVATARS: AVATAR[] = [
  {
    avatar_id: "3de7ccfa92dd4bc9ac06596c820de7b2",
    name: "3de7ccfa92dd4bc9ac06596c820de7b2",
    display_name: "Lea",
    enabled: true,
  },
  {
    avatar_id: "ad96680ab88642b8bd747eedf1aeb6f8",
    name: "ad96680ab88642b8bd747eedf1aeb6f8",
    display_name: "Lea",
    enabled: true,
  },
] as const;

export type STT_LANGUAGE = {
  label: string;
  value: string;
  key: string;
};
export const STT_LANGUAGE_LIST: STT_LANGUAGE[] = [
  { label: "Bulgarian", value: "bg", key: "bg" },
  { label: "Chinese", value: "zh", key: "zh" },
  { label: "Czech", value: "cs", key: "cs" },
  { label: "Danish", value: "da", key: "da" },
  { label: "Dutch", value: "nl", key: "nl" },
  { label: "English", value: "en", key: "en" },
  { label: "Finnish", value: "fi", key: "fi" },
  { label: "French", value: "fr", key: "fr" },
  { label: "German", value: "de", key: "de" },
  { label: "Greek", value: "el", key: "el" },
  { label: "Hindi", value: "hi", key: "hi" },
  { label: "Hungarian", value: "hu", key: "hu" },
  { label: "Indonesian", value: "id", key: "id" },
  { label: "Italian", value: "it", key: "it" },
  { label: "Japanese", value: "ja", key: "ja" },
  { label: "Korean", value: "ko", key: "ko" },
  { label: "Malay", value: "ms", key: "ms" },
  { label: "Norwegian", value: "no", key: "no" },
  { label: "Polish", value: "pl", key: "pl" },
  { label: "Portuguese", value: "pt", key: "pt" },
  { label: "Romanian", value: "ro", key: "ro" },
  { label: "Russian", value: "ru", key: "ru" },
  { label: "Slovak", value: "sk", key: "sk" },
  { label: "Spanish", value: "es", key: "es" },
  { label: "Swedish", value: "sv", key: "sv" },
  { label: "Turkish", value: "tr", key: "tr" },
  { label: "Ukrainian", value: "uk", key: "uk" },
  { label: "Vietnamese", value: "vi", key: "vi" },
] as const;