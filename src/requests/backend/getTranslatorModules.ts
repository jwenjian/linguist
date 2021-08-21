import { Translator } from '@translate-tools/core/types/Translator';

import { type } from '../../lib/types';
import { buildBackendRequest } from '../../lib/requestBuilder';

export const [getTranslatorModulesFactory, getTranslatorModules] = buildBackendRequest(
	'getTranslatorModules',
	{
		responseValidator: type.record(type.string, type.string),
		factoryHandler:
			({ translatorModules }) =>
				async () => {
					const modules: Record<string, string> = {};

					// TODO: fix type for `translatorModules`
					for (const key in translatorModules) {
						modules[key] = (
						translatorModules[key] as unknown as typeof Translator
						).moduleName;
					}

					return modules;
				},
	},
);
