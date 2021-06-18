# Scratchpad Archiver

Uses W3C webdriver to crawl a scratchpad,
executing javascript before taking snapshots of the page.

## How to use

Requires node version >=14.

Install dependencies with `npm install`.

Run with `npm start`.

By default it uses firefox, but can be modified to use chrome
by integrating the chromedriver lib.

## Known restrictions

The tinytax module is not fully interactive,
so users must navigate through taxonomy by following hyperlinks.

Forms obviously can't be submitted.

Assets in stylesheets and scripts are currently not downloaded
