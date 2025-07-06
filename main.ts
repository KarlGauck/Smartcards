import {App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile} from 'obsidian';
import { SmartcardsSettingsTab } from './SmartcardsSettingsTab';
// @ts-ignore
import ollama from 'ollama/browser'
import { GoogleGenAI } from '@google/genai'


// Remember to rename these classes and interfaces!

interface PluginSettings {
	gemini_api_key: string;
	hints: string;
	format: string;
	filename: string;
}

const DEFAULT_SETTINGS: PluginSettings = {
	gemini_api_key: '',
	hints: "!important\n" +
		"!card",
	format: '```anki\n' +
		'< Header / Title of flashcard >\n' +
		'===\n' +
		'< Content / Body of flashcard >\n' +
		'```',
	filename: '$name'
}

export default class Smartcards extends Plugin {settings: PluginSettings;

	async onload() {
		await this.loadSettings();
		this.create_commands()
		this.addSettingTab(new SmartcardsSettingsTab(this.app, this))
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
		const ai = new GoogleGenAI({apiKey: this.settings.gemini_api_key})

		const response = await ai.models.generateContent({
			model: 'gemini-2.5-flash',
			contents: context_data,
			config: {
				systemInstruction: "You should generate flashcards about all of the topics specified by the user as being relevant.\n" +
					"If there are no relevant topics, meaning, there is no sentence that explicitly asks for a flashcard, return an empty string.\n" +
					"Asking for a flashcard are stated in the following format:\n" +
					"\n" +
					this.settings.hints +
					"\n" +
					"Those hints might be followed by a simple description of the requested card (Topic, scale etc)\n" +
					"When generating a flashcard, do it with the following format:\n" +
					"\n" +
					this.settings.format + "\n" +
					"\n" +
					"As the input, you will get the content, the user wants to convert into flashcards as well as the already existing notes.\n" +
					"You should only generate a flashcard if there is no other flashcard with the same content already in the file.\n" +
					"If not specified otherwiese after a hint, you should use the language, used in the file, to generate the flashcard.\n" +
					"\n" +
					"For example, if there is a mathematical note that includes a definition, a theorem, an annotation and a proof of the theorem and the user specified " +
					"the hint \"!important: all definitions and theorems\", the definition and the theorem should become flashcards, the annotation and the proof should be ignored." +
					"Also, the title of the flashcards should be meaningful. For example, if the theorem is named \"Paragraph 1.16.4: Chinese remainder theorem\", the title of the flashcard should be  \"Chinese remainder theorem\" instead of \"Paragraph 1.16.4\""
			}
		})

		if (!response.text)
			return ""
		return response.text
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
	}

	async saveSettings() {
		await this.saveData(this.settings)
	}

	create_commands() {
		this.addCommand({
			id: 'generate-flashcard',
			name: 'Generate Flashcards',
			callback: () => { this.generate_flashcards() }
		})
	}

	async generate_flashcards() {
		console.log(this)
		const file = this.app.workspace.getActiveFile()
		if (!file) {
			new Notice("No active file found")
			return
		}

		const file_content = await this.app.vault.read(file)
		const folder = file.parent?.path
		if (!folder) {
			new Notice("No parent folder found")
			return
		}

		const filename = this.settings.filename.replace("$name", file.basename)
		const target_file_path = folder + filename + ".md"
		const target_file = this.app.vault.getFileByPath(target_file_path)

		const existing_flashcards = target_file == null ? "" : await this.app.vault.read(target_file)

		new Notice("Generating flashcards...")

		await this.query_gemini(
			"** The following is the file, the flashcards should be generated from.\n" +
			"Ignore everything of the following that is not explicitly marked as relevant using the hints: \n" + file_content + "\n\n" +
			"** The following are the already existing flashcards. Only generate flashcards that don't already exist:\n" +
			existing_flashcards
		)
		.then (response => {

			if (target_file == null)
				this.app.vault.create(target_file_path, "\n" + response + "\n")
			else
				this.app.vault.append(<TFile> target_file, "\n" + response + "\n")

			new Notice("Flashcards generated!")

		}).catch(error => {
			new Notice("error while requesting gemini")
		})
	}
}




