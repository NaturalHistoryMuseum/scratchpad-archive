export default class Scratchpad {
	#browser
	#base

	/**
	 *
	 * @param {Browser} browser Instance of a webdriver browser
	 * @param {String} base Base url of a Scratchpad site, optional
	 */
	constructor(browser, base) {
		this.#browser = browser;
		this.#base = base;
	}

	/**
	 * Navigate to a page
	 * @param {string} path URL to navigate to
	 * @returns {Promise}
	 */
	async go(path){
		const t = setTimeout(()=>console.log(path), 2000);
		await this.#browser.navigateTo(new URL(path, this.#base).href);
		clearTimeout(t);
	}

	/**
	 * Wait for ajaxblocks on the page to load
	 * @param  {...any} classes Ajax block names to wait for
	 * @returns {Promise}
	 */
	async ajaxBlocks(...classes){
		const browser = this.#browser;
		if(classes.length > 1) {
			return Promise.all(classes.map(c=>this.ajaxBlocks(c)));
		}
		const [clsName] = classes;
		const selector = `.block-${clsName}`;
		const blocks = await browser.$$(selector);

		return Promise.all(blocks.map(
			block=>block.$(`.content  > :first-child:not(${selector}-default-ajax-content)`)
		))
	}

	/**
	 * Expand one level of the tinytax taxonomy tree
	 */
	async expandTinytax(){
		for(const plus of await this.#browser.$$('.tinytax img.plus')) {
			await plus.waitForClickable();
			await new Promise(r=>setTimeout(r, 500))
			await plus.click();
			const li = await plus.parentElement();
			const ul = await li.$('ul');
			await ul.waitForDisplayed({ timeout: 15000 });
		}
	}

	/**
	 * Get the page HTML (after javascript modifications),
	 * as well as locations of hyperlinks and assets.
	 */
	async getPageData() {
		return this.#browser.execute(function() {
			const assets = Array.from(document.querySelectorAll('*[src], link[rel="shortcut icon"], link[rel=stylesheet], *[href][download]')).map(el => el.src || el.href);
			const links = Array.from(document.querySelectorAll('a[href]:not(a[download]), area[href]:not(area[download])')).map(el => el.href).filter(link => {
				const m = new URL(link).pathname.match(/\.[a-z0-9]+$|^\/biblio\/export\/|^\/blog\/([0-9]+\/)?feed$|^\/taxonomy\/term\/[0-9]+\/feed$/);
				if(m) {
					assets.push(link);
					return false;
				}
				return !link.match(/\/event\/(day|week|month)\/.*$/);
			});

			return {
				html: (document.doctype ? new XMLSerializer().serializeToString(document.doctype) : '') + document.documentElement.outerHTML,
				assets,
				links
			}
		});
	}

	/**
	 * Execute any javascript and take a snapshot of the page,
	 * so that it can be served on a static site.
	 * @param {string} page The page to navigate to (optional)
	 * @returns {Object} The html, assets and links of the page
	 */
	async snapshot(page) {
		if(page) {
			await this.go(page);
		}

		await this.ajaxBlocks(
			'tinytax',
			'refindit',
			'bhl',
			'ncbi',
			'iucn'
		);

		await this.expandTinytax();

		return this.getPageData();
	}
}
