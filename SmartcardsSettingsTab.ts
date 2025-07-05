import Smartcards from './main'
import { App, PluginSettingTab, Setting } from 'obsidian'

export class SmartcardsSettingsTab extends PluginSettingTab {
	plugin: Smartcards;

	constructor(app: App, plugin: Smartcards) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display() {
		const {containerEl} = this;

		containerEl.empty();
		containerEl.createEl('h2', {text: 'Smartcards Settings'});

		new Setting(containerEl)
			.setName('Gemini API Key')
			.setDesc('Get your API key from https://ai.google.dev/gemini-api/docs?hl=de')
			.addText(text => text
				.setPlaceholder('Enter your Gemini API key')
				.setValue(this.plugin.settings.gemini_api_key)
				.onChange(async (value) => {
					this.plugin.settings.gemini_api_key = value;
					await this.plugin.saveSettings();
				})
			)

		new Setting(containerEl)
			.setName('Filename')
			.setDesc('Enter the filename of the flashcards file')
			.addText(text => text
				.setPlaceholder('Enter the filename of the flashcards file. Use $name for the name of your original file')
				.setValue(this.plugin.settings.filename)
				.onChange(async (value) => {
					this.plugin.settings.filename = value;
					await this.plugin.saveSettings();
				})
			)

		new Setting(containerEl)
			.setName('Hints')
			.setDesc('Keywords that the AI will use to determine what cards to generate')
			.addTextArea(text => text
				.setPlaceholder('Enter the hints that will be used to generate flashcards')
				.setValue(this.plugin.settings.hints)
				.onChange(async (value) => {
					this.plugin.settings.hints = value
					await this.plugin.saveSettings();
				})
			)

		new Setting(containerEl)
			.setName('Format')
			.setDesc('This is the format in which your cards will be generated')
			.addTextArea(text => text
				.setPlaceholder('Enter the format of the flashcards file')
				.setValue(this.plugin.settings.format)
				.onChange(async (value) => {
					this.plugin.settings.format = value;
					await this.plugin.saveSettings();
				})
			)

	}
}
