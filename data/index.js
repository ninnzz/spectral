import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { writeFileSync } from 'fs';

puppeteer.use(StealthPlugin());

async function getTh(page) {
	return await page.$$eval('.table1 thead th', th => {
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

  return await page.$$eval('.table1 tbody tr', (rows, rideLogLinks) => {
		const rowsInfo = rows.map(row => {
			const cols = Array.from(row.querySelectorAll('td'));
			const link = row.querySelector('a');
			const rowInfo = [];

			cols.forEach((col, idx) => {
				if (col.textContent.trim() != '') {
					rowInfo.push(col.textContent.trim());
				} else {
					const span = col.querySelector('span');
					if (span != null) {
						rowInfo.push(span.title.split("/")[0].trim());
					} else {
						rowInfo.push(span);
					}
				}
			})

			rideLogLinks.push(link.href.trim() + 'ridelogs');
			return rowInfo;
		})

		return {rowsInfo, rideLogLinks}
	}, rideLogLinks);
}


async function getRideLogs(page, url) {
	const rideLogs = [];

  try {
  	const rideLogsTh = await getTh(page);
  	// console.log(rideLogsTh);

  	const rideLogsTr = await getTr(page);
  	// console.log(rideLogsTr);

  	rideLogsTr['rowsInfo'].forEach((rideLog) => {
  		const rowInfo = new Object();
  		rideLog.forEach((rideLogInfo, idx) => {
  			const lbl = rideLogsTh[idx];

  			// km to m
				if (['distance', 'descent', 'climb'].includes(lbl) && rideLogInfo != null) {
					const dist = rideLogInfo.split(' ');
					let val = parseFloat(dist[0]);

					if (dist[1] == 'km') {
						val *= 1000
					}

					rowInfo[lbl] = String(parseInt(val)) + " m";
				} else {
					rowInfo[lbl] = rideLogInfo;
				}

  		})

  		rideLogs.push(rowInfo);
  	})

  } catch (error) {
  	console.error(`ERROR RIDELOGS: ${url} ${error.message}`)
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
				rowInfo[lbl] = String(val) + " m";
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


async function loadTrails(url) {
	const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  let page = await browser.newPage();

  try {
  	await page.goto(url);

  	const trailsTh = await getTh(page);
  	// console.log(trailsTh)

  	const trailsTr = await getTr(page);
  	// console.log(trailsTr)

  	const rideLogs = [];

  	for (const url of trailsTr['rideLogLinks']) {
  		await page.goto(url);
  		const curRideLogs = await getRideLogs(page, url);
  		rideLogs.push(curRideLogs);
  	};

  	const data = getData(trailsTh, trailsTr, rideLogs);

  	saveJsonFile(data);

  	writeFileSync('all_trails.json', JSON.stringify(data));

  	// console.log(data)
  	// console.dir(data, { depth: null });

  } catch (error) {
  	console.error("ERROR: ", error.message);
  } finally {
  	await browser.close();
  }
}


loadTrails('https://www.trailforks.com/region/mill-creek-mountain-bike-trails/trails/');