import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import ollama from 'ollama/browser'
import { GoogleGenAI } from '@google/genai'


// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		this.addCommand({
			id: 'generate-flashcard',
			name: 'Generate Flashcards',
			callback: async () => {
				const file = this.app.workspace.getActiveFile()
				if (!file) return

				const data = await this.app.vault.read(file)

				const folder = file.parent?.path
				if (!folder) return

				console.log(data)
				await this.query_gemini("Ignore everything of the following that is not explicitly marked as relevant: \n" + data).then (response => {
					const flashcardFilePath = folder + "/flashcards.md"
					if (this.app.vault.getFolderByPath(flashcardFilePath) == null)
						this.app.vault.create(flashcardFilePath, response)
					else this.app.vault.append(<TFile>this.app.vault.getFileByPath(flashcardFilePath), response)
				}).catch(error => {
					new Notice("error")
				})
				ollama.ps().then(console.log)
			}
		})

		console.log(this.app.workspace.getActiveFile()?.name);
	}

	onunload() {
	}

	async query(context_data: string): Promise<string>  {
		new Notice("Generating flashcards...")
		const query = {
			model: "cards",
			prompt: context_data,
			think: false
		}
		new Notice("Flashcards generated!")
		return (await ollama.generate(query)).response
	}

	async query_gemini(context_data: string): Promise<string>  {
		console.log('BRO')

		const ai = new GoogleGenAI({apiKey: 'AIzaSyCYYxKezxXtoMONTsb9GvddFCFvAD0dWE8'})

		console.log('HEY!')

		const response = await ai.models.generateContent({
			model: 'gemini-2.5-flash',
			contents: context_data,
			config: {
				systemInstruction: "You should generate flashcards about all of the topics specified by the user as being relevant." +
					"If there are no relevant topics, meaning, there is no sentence that explicitly asks for a flashcard, return an empty string." +
					"Asking for a flashcard are stated in the following format:" +
					"" +
					"card: < information about which topics are relevant >" +
					"" +
					"When generating a flashcard, do it with the following format:" +
					"```anki" +
					"< Header / Title of flashcard >" +
					"===" +
					"< Content / Body of flashcard >" +
					"```"
			}
		})

		console.log('HI')
		console.log(response.promptFeedback)
		if (!response.text)
			return "error"
		return response.text
	}
}




