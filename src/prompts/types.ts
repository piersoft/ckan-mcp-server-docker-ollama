export type PromptResult = {
  messages: Array<{
    role: "user" | "assistant";
    content: {
      type: "text";
      text: string;
    };
  }>;
};

export const createTextPrompt = (text: string): PromptResult => ({
  messages: [
    {
      role: "user",
      content: {
        type: "text",
        text
      }
    }
  ]
});
