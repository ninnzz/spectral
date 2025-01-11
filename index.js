import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

async function getData(page) {

	const tblTitles = await page.$$eval('.table1 thead th', tHeaders => {
		return tHeaders.map(th => {
			// const firstChild = th.firstChild;
			return th.textContent.trim();
		})
	})

	const data = await page.$$eval('.table1 tbody tr', (rows, tblTitles) => {
		const rowData = [];


		rows.forEach(row => {
			const cols = Array.from(row.querySelectorAll('td'));

			const dateString = cols[1].textContent.trim().split(" ")[0];
			const date = new Date(dateString);

			const lowerDate = new Date(2024, 0, 1);
			const UpperDate = new Date(2025, 1, 1);

			if (date >= lowerDate && date < UpperDate) {
				const rowInfo = {}

				cols.forEach((col, idx) => {
					const colText = col.textContent.trim();

					// dist nd climb
					if ((tblTitles[idx] === 'dist' 
						|| tblTitles[idx] === 'climb') 
						&& col.textContent.trim().includes("km")) {

							// km to m
							const km = colText.split(" ")[0];
							const m = parseFloat(km) * 1000;
							rowData[tblTitles[idx]] = String(m) + " m";

					} else if (tblTitles[idx] === 'created') {
						const createdArr = colText.split(" ");

						const time = createdArr[1];
						const ampm = createdArr[2].substring(0, 2).toLowerCase();

						let [hr, min] = time.split(":").map(Number);
						const [yr, month, day] = dateString.split("-").map(Number);

						hr %= 12;
						if (ampm == 'pm') {
							hr += 12;
						}

						const dateISO = new Date(yr, month - 1, day, hr, min, 0, 0).toISOString();

						rowInfo[tblTitles[idx]] = dateISO;


						const isSensitiveTrail = (createdArr[createdArr.length - 1] == "s");
						if (isSensitiveTrail) {
							rowInfo["sensitiveTrail"] = isSensitiveTrail;
						}
					} else if (rowInfo[tblTitles[idx]] !== "" && colText !== "") {
						rowInfo[tblTitles[idx]] = colText;
					}
				})
				rowData.push(rowInfo);
			}
		})

		return rowData;

	}, tblTitles)

	return data
}

async function loadPage(url) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  let data = []

  try {
    await page.goto(url);

    let isLastPage = false;

    while (!isLastPage) {
		const curUrl = page.url();
		console.log(curUrl);


		const curData = await getData(page);
		data = [...data, ...curData];

		const nextBtn = await page.$('#main > div.paging-nav-c3 > ul > li.next-page > a');
		if (nextBtn) {
			await nextBtn.click();
			await page.waitForNavigation();
		} else {
			isLastPage = true;
			console.log("///// last page");
		}
    }
  } catch (error) {
    console.error('Error occurred:', error.message);
  } finally {
    await browser.close();
  	console.log(data)

  	const jsonData = JSON.stringify(data);
  	return jsonData
  }
}

loadPage('https://www.trailforks.com/ridelog/all/');
