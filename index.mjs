import express from 'express'
import path from 'path'

const app = express();
app.use(
	express.json({
		type: ['application/json', 'application/reports+json'],
	}),
);
app.use(express.urlencoded());

const PORT = process.env.PORT || 3000

const ONE_DAY = 2592000;

const NEL_REPORT_GROUP = "network-errors"

const ReportTo = JSON.stringify({
	gorup: NEL_REPORT_GROUP,
	max_age: ONE_DAY,
	end_points: [{
		url: `http://localhost:${PORT}/network-reports`
	}]
})

const NEL = JSON.stringify({
	report_to: NEL_REPORT_GROUP,
	max_age: ONE_DAY
})


app.get('/', (request, response) => {
	// Note: report_to and not report-to for NEL.
	response.set('NEL', NEL);

	// The Report-To header tells the browser where to send network errors.
	// The default group (first example below) captures interventions and
	// deprecation reports. Other groups, like the network-error group, are referenced by their "group" name.
	response.set(
		'Report-To', ReportTo
	);

	response.sendFile(path.resolve(process.cwd(), 'index.html'));
});

function echoReports(request, response) {
	// Record report in server logs or otherwise process results.
	for (const report of request.body) {
		console.log(report.body);
	}
	response.send(request.body);
}

app.post('/network-reports', (request, response) => {
	console.log(`${request.body.length} Network error reports:`);
	echoReports(request, response);
});

app.get('/throw-500-error', (req, res) => {
	res.status(500).end();
})

const listener = app.listen(PORT, () => {
	console.log(`Your app is listening on port ${listener.address().port}`);
});