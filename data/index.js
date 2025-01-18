import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { writeFileSync } from 'fs';


puppeteer.use(StealthPlugin());


const flags = {
	'https://es.pinkbike.org/sprt/f2/s/13.gif': 'Australia',
	'https://es.pinkbike.org/sprt/f2/s/193.gif': 'United Kingdom',
	'https://es.pinkbike.org/sprt/f2/s/131.gif': 'New Zealand',
	'https://es.pinkbike.org/sprt/f2/s/97.gif': 'South Korea',
	'https://es.pinkbike.org/sprt/f2/s/181.gif': 'Thaliand',
	'https://es.pinkbike.org/sprt/f2/s/35.gif': 'Canada' 
}


async function getTh(page) {
	return await page.$$eval('.table1 thead th:not(#routes_popular thead th)', th => {
  		return th.map(col => {
  			if (col.textContent.trim() != '') {
  				return col.textContent.trim();
  			} else {
  				return col.id
  			}
  		})
  })
}


async function getTr(page) {
	const rideLogLinks = [];

  return await page.$$eval('.table1 tbody tr:not(#routes_popular tbody tr)', (rows, rideLogLinks, flags) => {
  	const rowsInfo = [];

  	for (var row of rows) {
		// const rowsInfo = rows.map(row => {
			const cols = Array.from(row.querySelectorAll('td'));
			const link = row.querySelector('a');
			const rowInfo = [];

			// const time = Array.from(cols.querySelector('.time'));

			const timeCol = cols.find(col => col.querySelector('.time'));

			if (timeCol) {
				const dateString = cols[1].textContent.trim().split(" ")[0];
				const date = new Date(dateString);

				const lowerDate = new Date(2024, 0, 1);
				const UpperDate = new Date(2025, 1, 1);

				if (!(date >= lowerDate && date < UpperDate)) {
					continue;
				}
			}

			cols.forEach((col, idx) => {
				if (col.textContent.trim() != '') {
					rowInfo.push(col.textContent.trim());
				} else {
					const span = col.querySelector('span');

					const stars = col.querySelectorAll('.star');
					const starsFilled = col.querySelectorAll('.filled');
					const starsHalf = col.querySelector('.half');

					const flag = col.querySelector('#main > table > tbody > tr > td:nth-child(3) > img');

					if (span != null) {
						rowInfo.push(span.title.split("/")[0].trim());
					} else if (flag != null) {
						if (Object.keys(flags).includes(flag.src)) {
							rowInfo.push(flags[flag.src]);
						} else {
							rowInfo.push("undefined");
						}
					} else if (stars.length != 0) {
						const rating = (starsFilled.length + (starsHalf ? 0.5 : 0))
						rowInfo.push(`${rating}/5`);
					} else {
						rowInfo.push(span);
					}
				}
			})

			rideLogLinks.push(link.href.trim() + 'ridelogs');
			
			// return rowInfo;
			
			rowsInfo.push(rowInfo);
		}

		return {rowsInfo, rideLogLinks}
	}, rideLogLinks, flags);
}


async function getRideLogs(page) {
	const rideLogs = [];

  try {
  	const rideLogsTh = await getTh(page);
  	// console.log(rideLogsTh);
  	let rideLogsTr = []

  	let isLastPage = false;

  	while (!isLastPage) {
  		const curUrl = page.url();
			console.log(curUrl);

  		const curRideLogsTr = await getTr(page);
  		rideLogsTr = [...rideLogsTr, ...curRideLogsTr['rowsInfo']];

  		const nextBtn = await page.$('#main > div.paging-nav-c3 > ul > li.next-page > a');
	  	
	  	if (nextBtn) {
				await nextBtn.click();
				await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 0 });


				const popup = await page.$('#top > div.ui-widget-overlay.ui-front');

	  		if (popup) {
	  			console.log("POPUP");
	  			const skipBtn = await page.$('#skipFeedWelcome');
	  			await skipBtn.click(); 
	  		}


			} else {
				isLastPage = true;
				console.log("///// last page");
			}
  	}

  	rideLogsTr.forEach((rideLog) => {
  		const rowInfo = new Object();
  		rideLog.forEach((rideLogInfo, idx) => {
  			const lbl = rideLogsTh[idx];

  			// km to m
				if (['dist', 'climb'].includes(lbl) && rideLogInfo != null) {
					const dist = rideLogInfo.split(' ');
					let val = parseFloat(dist[0]);

					if (dist[1] == 'km') {
						val *= 1000
					}

					rowInfo[lbl] = String(parseInt(val)) + " m";
				} else if (lbl == 'created') {
					const createdArr = rideLogInfo.split(" ");

					const dateString = createdArr[0];

					const time = createdArr[1];
					const ampm = createdArr[2].substring(0, 2).toLowerCase();

					let [hr, min] = time.split(":").map(Number);
					const [yr, month, day] = dateString.split("-").map(Number);

					hr %= 12;
					if (ampm == 'pm') {
						hr += 12;
					}

					const dateISO = new Date(yr, month - 1, day, hr, min, 0, 0).toISOString();

					rowInfo[lbl] = dateISO;


					const isSensitiveTrail = (createdArr[createdArr.length - 1] == "s");
					if (isSensitiveTrail) {
						rowInfo["sensitiveTrail"] = isSensitiveTrail;
					}

				} else {
					rowInfo[lbl] = rideLogInfo;
				}

  		})

  		rideLogs.push(rowInfo);
  	})

  } catch (error) {
  	console.error(`ERROR RIDELOGS: ${error.message}`)
  }
	return rideLogs
}


function getData(trailsTh, trailsTr, rideLogs) {
	const keys = [];

	return trailsTr['rowsInfo'].map((trail, idx) => {
		const rowInfo = new Object();
		const row = new Object();

		trail.forEach((trailInfo, idx) => {
			const lbl = trailsTh[idx];

			// km to m
			if (['distance', 'descent', 'climb'].includes(lbl) && trailInfo != null) {
				const dist = trailInfo.split(' ');
				let val = parseFloat(dist[0]);

				if (dist[1] == 'km') {
					val *= 1000
				}
				rowInfo[lbl] = String(parseInt(val)) + " m";
			} else {
				rowInfo[lbl] = trailInfo;
			}
		})

		rowInfo['rideLogs'] = rideLogs[idx];

		var cnt = 1
		var key = trail[1];
		while (keys.includes(key)) {
			key = `${trail[1]}_${cnt}`
			cnt += 1;
		} 

		keys.push(key);
		row[key] = rowInfo;
		return row
	})
}


function saveJsonFile(data) {
	data.forEach(trail => {
		const filename = Object.keys(trail)[0].replaceAll(' ', '_').toLowerCase();
		const trailJSON = JSON.stringify(trail);

		writeFileSync(`${filename}.json`, trailJSON);
	})
}


async function login(page, loginPageBtn) {
	const username = process.env.USERNAME_TRAILFORKS;
	const password = process.env.PASSWORD_TRAILFORKS;

	await loginPageBtn.click();
	await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 0 });

	await page.type('#username', username);
	await page.type('#password', password);

	const loginBtn = await page.$('#loginButton');
	await loginBtn.click();
	await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 0 });
}


async function loadTrails(url) {
	const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  let page = await browser.newPage();

  await page.setDefaultNavigationTimeout(0);

  try {
  	await page.goto(url, { waitUntil: 'networkidle2' });

  	const loginPageBtn = await page.$('#loginLinks > li > span');


  	if (loginPageBtn != null) {
  		await login(page, loginPageBtn);
  	}

  	const trailsTh = await getTh(page);
  	// console.log(trailsTh);

  	const trailsTr = await getTr(page);
  	// console.log(trailsTr);

  	const rideLogs = [];

  	console.log(trailsTr['rideLogLinks']);

  	for (const url of trailsTr['rideLogLinks']) {
  		await page.goto(url, { timeout: 0, waitUntil: 'networkidle2' });

  		const popup = await page.$('#top > div.ui-widget-overlay.ui-front');
  		if (popup) {
  			console.log("POPUP");
  			const skipBtn = await page.$('#skipFeedWelcome');
  			await skipBtn.click(); 
  		}

  		const curRideLogs = await getRideLogs(page, url);
  		rideLogs.push(curRideLogs);
  	};

  	const data = getData(trailsTh, trailsTr, rideLogs);

  	saveJsonFile(data);

  	writeFileSync('all_trails.json', JSON.stringify(data));

  	// console.log(data)
  	console.dir(data, { depth: null });

  } catch (error) {
  	console.error("ERROR: ", error.message);
  } finally {
  	await browser.close();
  }
}


loadTrails('https://www.trailforks.com/region/mill-creek-mountain-bike-trails/trails/');