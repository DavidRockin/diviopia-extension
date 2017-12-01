/**
 * An object
 */
var prices         = null;

/**
 * Main currencies to display
 */
var mainCurrencies = ['USD','EUR', 'JPY', 'KRW', 'CAD','AUD','GBP','CNY','RUB'];

/**
 * Currencies
 */
var availableCurrencies = [];

/**
 * JSON data of extension's web data for website selectors
 */
var webdata = null;

/**
 * Fetch BTC prices
 *
 * We'll send an AJAX request to fetch recent Bitcoin
 * prices, it'll respond as a JSON object so we'll
 * have to parse it prior to using it
 */
function fetchPrices() {
	// typical AJAX request
	var xhttp = new XMLHttpRequest();

	// our xhttp handler
	xhttp.onreadystatechange = function() {
		// only deal with valid responses
		if (this.readyState == 4 && this.status == 200) {
			// parse our response
			prices = JSON.parse(this.responseText);
			prices.RUB.symbol = ''; // just to clean up things a tad

			// define currencies available
			availableCurrencies = Object.keys(prices);
		}
	};

	// attempt to open and send the request
	xhttp.open("GET", "https://blockchain.info/ticker?cors=true", true);
	xhttp.send();
}

/**
 * Fetch webdata JSON file
 */
function fetchWebdata() {
	// typical AJAX request
	var xhttp = new XMLHttpRequest();

	// our xhttp handler
	xhttp.onreadystatechange = function() {
		// only deal with valid responses
		if (this.readyState == 4 && this.status == 200) {
			// parse our response
			webdata = JSON.parse(this.responseText);
		}
	};

	// attempt to open and send the request
	xhttp.open("GET", getImage('/resources/web-data.json'), true);
	xhttp.send();
}

/**
 * Fetches a website's selectors based on URL
 *
 * @param {String} url Active page URL
 * @return {null|String|boolean} If no webdata, null is returned.
 * 								 If there is no match, false is returned.
 * 								 If there is a match a string of selectors is returned
 */
function getSelectors(url) {
	// if we have no webdata, return null, have to try again later
	if (null === webdata)
		return null;

	var section;

	// loop through all config file sections
	for (var i = 0; i < webdata.length; ++i) {
		section = webdata[i];

		// go through all URLs
		for (var j = 0; j < section.urls.length; ++j) {
			// test the URL, if it matches return our selectors
			var regexp = new RegExp(section.urls[j], "i");
			if (regexp.test(url))
				return section.selectors.join(', ');
		}
	}

	// no match return false
	return false;
}

/**
 * Check to see if a specific element is being hovered
 *
 * @param  {Element} e
 * @return {boolean} True if the element is being hovered, false otherwise
 */
function isHover(e) {
	return (null !== e && e.parentElement && e.parentElement.querySelector(':hover') === e);
}

/**
 * Gets an extension file URL
 *
 * @param {String} url
 */
function getImage(url) {
	return getBrowser().extension.getURL(url);
}

/**
 * Calculate popup offset x position
 *
 * @param {Number} clientX X position of the cursor or target element
 * @param {Number} width   The width of the tooltip
 */
function calculateOffsetX(clientX, width) {
	// define the client's X position, add a margin
	var x = clientX + 30;

	return (
		// make sure the tooltip will remain on the screen
		x + width > window.innerWidth
		// it will go off, so move it to the left
		? x - width - 60
		// new position is fine as is
		: x

	// add the horizontal scroll distance to keep things proportional
	) + window.scrollX;
}

/**
 * Calculate popup offset y position
 *
 * @param {Number} clientY Y position of the cursor or target element
 * @param {Number} height  The height of the tooltip
 */
function calculateOffsetY(clientY, height) {
	// define the client's Y position
	var y = clientY + 10;

	return (
		// make sure the height of the tooltip does not go off screen
		y +height > window.innerHeight
		// it will go off, so move it upwards
		? y - height - 15
		// new position is fine as is
		: y

	// add the vertical distance scrolled
	) + window.scrollY;
}

/**
 * Get position of selected text
 *
 * @return {DOMRect|Object} Position of the selected text
 */
function getSelect() {
	// get the selected text
	var selection = window.getSelection();

	// ensure we have nothing selected
	if (selection.toString() == "") {
		// if so, return null coordinates, it'll be replaced automagically
		return {
			x : null,
			y : null,
		};
	}

	// return the DOMRect object
	return selection.getRangeAt(0).getBoundingClientRect();
}

/**
 * Get selection X position
 *
 * @return {Number|Null} If there is a selection, a number (in pixels) represent the X cord, null otherwise
 */
function getSelectX() {
	return getSelect().x;
}

/**
 * Get selection Y position
 *
 * @return {Number|Null} If there is a selection, a number (in pixels) represent the Y cord, null otherwise
 */
function getSelectY() {
	return getSelect().y;
}

/**
 * Get browser instance
 */
function getBrowser() {
	return (typeof browser === 'undefined' ? chrome : browser);
}

/**
 * Get extension runtime object
 */
function getRuntime() {
	return getBrowser().runtime;
}

/**
 * Get extension's version
 */
function getAppVersion() {
	return getRuntime().getManifest().version;
}

/**
 * Get extension homepage
 */
function getHomepage() {
	return getRuntime().getManifest().homepage_url;
}

/**
 * Update client currencies
 *
 * We'll send a message to the background services, asking for
 * recent prices and currencies. We'll then have to update them
 * locally so it can be used later on.
 *
 * This will allow the extension to have a central service
 * fetching prices, and providing to all tabs with the
 * extension active within them. We can also update them
 * periodically for live price conversion.
 */
function updateCurrencies() {
	// send message to fetch new prices
	getRuntime().sendMessage({
		action : 'get_prices'
	}, (msg) => {
		// update our local variable to the response
		prices = msg.prices;
	});

	// send message to fetch new currencies
	getRuntime().sendMessage({
		action : 'get_currencies'
	}, (msg) => {
		// update our local available currencies
		availableCurrencies = msg.currencies;
	});
}