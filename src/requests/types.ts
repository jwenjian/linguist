import { Store } from 'effector';

// NOTE: probably should make factory builder which control update props and rebuild factories which require changed props

import { Background } from '../app/Background';
import { ObservableAsyncStorage } from '../app/ConfigStorage/ConfigStorage';

import { AppConfigType } from '../types/runtime';

import { PageTranslationContext } from '../app/ContentScript/PageTranslationContext';

export type RequestHandlerFactoryProps = {
	config: ObservableAsyncStorage<AppConfigType>;
	backgroundContext: Background;
};

export type RequestHandlerFactory = (props: RequestHandlerFactoryProps) => () => void;

export type ClientRequestHandlerFactoryProps = {
	$config: Store<AppConfigType>;
	pageTranslationContext: PageTranslationContext;
};

export type ClientRequestHandlerFactory = (
	props: ClientRequestHandlerFactoryProps,
) => () => void;
