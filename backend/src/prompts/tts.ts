export function getTTSChunkingPrompt(text: string): string {
	return `You are an assistant specializing in preparing text for text-to-speech (TTS).
Please divide the following text into short, coherent chunks suitable for TTS processing.
Ensure the chunks break at natural points like sentence or clause endings where possible.

Text to chunk:
${text}`;
}
