import gecko from 'geckodriver';
import { remote } from 'webdriverio';

export function* geckodriver(options={}, args){
	if(!args && Array.isArray(options)) {
		args = options;
		options = {};
	}
	if(!args) {
		args = [];
	}
	const { host, port, log } = options;
	const connection = {
		hostname: host,
		port,
		logLevel: log,
		capabilities: {
			browserName: 'firefox'
		}
	};

	const ffOptions = {
		// prefs: {
		// 	'browser.download.dir': new URL('saved', import.meta.url).pathname,
		// 	'browser.helperApps.neverAsk.saveToDisk': 'application/rss+xml'
		// }
	}

	if(options.headless) {
		ffOptions.args = [
			'-headless'
		]
	}

	connection.capabilities['moz:firefoxOptions'] = ffOptions;

	delete options.headless;

	args.push(...Object.entries(options).map(([k, v]) => `--${k}=${v}`));

	const process = gecko.start(args);

	try {
		yield connection
	} finally {
		process.kill();
	}
}

export async function* Browser(webdriver){
	for(const connection of webdriver) {
		const browser = await remote(connection);

		try {
			yield browser;
			break;
		} finally {
			await browser.deleteSession();
		}
	}
}

export function firefox(options){
	return Browser(geckodriver(options));
}
