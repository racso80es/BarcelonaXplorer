export interface AiGeneratorPort {
  generateText(prompt: string): Promise<string>;
}
