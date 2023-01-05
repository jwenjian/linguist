import { defaultConfig } from '../../config';

import { AppConfigType } from '../../types/runtime';
import { isBackgroundContext } from '../../lib/browser';
import { AppThemeControl } from '../../lib/browser/AppThemeControl';
import { toggleTranslateItemInContextMenu } from '../../lib/browser/toggleTranslateItemInContextMenu';
import { migrateAll } from '../../migrations/migrationsList';
import { clearCache } from '../../requests/backend/clearCache';

import { TextTranslatorStorage } from '../../layouts/TextTranslator/TextTranslator.utils/TextTranslatorStorage';

import { ConfigStorage, ObservableAsyncStorage } from '../ConfigStorage/ConfigStorage';
import { Background, translatorModules } from '../Background';
import { sendConfigUpdateEvent } from '../ContentScript';
import { requestHandlers } from './messages';

/**
 * Class that contains app context and manage global states
 */
export class App {
	/**
	 * Run application
	 */
	public static async main() {
		// Migrate data
		await migrateAll();

		const app = new App();
		await app.start();
	}

	private readonly background: Background;
	private readonly config: ObservableAsyncStorage<AppConfigType>;
	constructor() {
		const config = new ConfigStorage(defaultConfig);
		const observableConfig = new ObservableAsyncStorage(config);

		this.config = observableConfig;
		this.background = new Background(observableConfig);
	}

	private isStarted = false;
	public async start() {
		if (this.isStarted) {
			throw new Error('Application already started');
		}

		this.isStarted = true;

		await this.background.start();

		await this.handleConfigUpdates();
		await this.setupRequestHandlers();
	}

	private async setupRequestHandlers() {
		// Prevent run it again on other pages, such as options page
		if (isBackgroundContext()) {
			requestHandlers.forEach((factory) => {
				factory({
					config: this.config,
					bg: this.background,
					// TODO: review usages, maybe add custom translators
					translatorModules: translatorModules as any,
				});
			});
		}
	}

	private async handleConfigUpdates() {
		const $appConfig = await this.config.getObservableStore();

		// Send update event
		$appConfig.watch(() => {
			sendConfigUpdateEvent();
		});

		// Update icon
		const appThemeControl = new AppThemeControl();
		$appConfig
			.map((config) => config.appIcon)
			.watch((appIcon) => {
				appThemeControl.setAppIconPreferences(appIcon);
			});

		// Clear cache while disable
		$appConfig
			.map((config) => config.scheduler.useCache)
			.watch((useCache) => {
				if (!useCache) {
					clearCache();
				}
			});

		// Clear TextTranslator state
		const textTranslatorStorage = new TextTranslatorStorage();
		$appConfig
			.map((config) => config.textTranslator.rememberText)
			.watch((rememberText) => {
				if (!rememberText) {
					textTranslatorStorage.forgetText();
				}
			});

		// Configure context menu
		$appConfig
			.map((config) => config.selectTranslator)
			.watch((selectTranslator) => {
				const { enabled, mode } = selectTranslator;
				const isEnabled = enabled && mode === 'contextMenu';
				toggleTranslateItemInContextMenu(isEnabled);
			});
	}
}
