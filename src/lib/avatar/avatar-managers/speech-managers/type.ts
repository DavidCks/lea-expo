export type HeygenRequest = {
  session_id: string;
  text: string;
  task_mode: "sync" | "async";
  task_type: "repeat" | "chat";
};
