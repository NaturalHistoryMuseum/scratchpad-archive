import fs from 'fs';
import path from 'path';
import { firefox } from './webdirver.js';
import Scratchpad from './scratchpad.js';
import http from 'http';

const filesDir = new URL('../saved', import.meta.url).pathname;

for await(const browser of firefox({ log: 'warn', headless: false })) {
	const assetList = new Set;
	const linkSet = new Set('/');
	const origin = 'http://localhost:8080';
	const scratchpad = new Scratchpad(browser, origin);

	const linkList = linkSet.values();

	for(const url of linkList) {
		const output = await scratchpad.snapshot(url);

		const { html, assets, links } = output;
		const ext = path.extname(url);
		const basename = ext ? path.basename(url) : 'index.html';
		const dirname = path.join(filesDir, ext ? path.dirname(url) : url);
		fs.mkdirSync(dirname, { recursive: true })
		console.log(path.join(dirname, basename));
		try {
			fs.writeFileSync(path.join(dirname, basename), html);
		} catch(e) {
			if(e.code === 'EISDIR') {
				console.error(e);
			}	else {
				throw e;
			}

		}

		for(const link of links) {
			if(!link.startsWith(origin)) {
				continue;
			}
			linkSet.add(new URL(link).pathname);
		}

		for(const asset of assets) {
			if(!asset.startsWith(origin)) {
				continue;
			}
			const { pathname } = new URL(asset);
			assetList.add(pathname);
			linkSet.delete(pathname);
		}
	}

	console.log('Now do assets')
	console.log(Array.from(assetList))

	for(const asset of assetList) {
		const dirname = path.join(filesDir, path.dirname(asset));
		fs.mkdirSync(dirname, { recursive: true });

		await new Promise((resolve, reject)=>
			http.get(origin + asset, res => res.pipe(
					fs.createWriteStream(path.join(filesDir, asset)
				).on('finish', resolve).on('error', reject)
			).on('error', reject))
		).catch(e => console.log(e, asset));
		console.log(asset)
	}
}

/*

const pending = ['/'];
	const crawled = new Set;

	for(const page of pending) {
		if(crawled.has(page)) {
			continue;
		}
		crawled.add(page);

		const url = origin + page;

		const res = await fetchUrl(url);

		if(!res.ok) {
			console.warn('Not ok', url, res.status, res.statusText);

			continue;
		}

		const contentType = res.headers.get('content-type').split(';')[0];
		console.warn(contentType);

		if(contentType !== 'text/html') {
			await new Promise(r=>setTimeout(r, 3000))
			yield [page, res.body];
			continue;
		}

		const text = await res.text();
		const dom = await getDom(text, url);

		await new Promise(r=>setTimeout(r, 3000))

		yield [page, dom.serialize()];

		for(const el of dom.window.document.querySelectorAll('*[src], *[href]')) {
			const url = new URL(el.src || el.href);
			if(url.origin !== origin) {
				continue;
			}

			pending.push(url.pathname);
		}
	}
*/
