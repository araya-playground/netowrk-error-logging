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

// TODO: replace origin
// NEL doesn't work on localhost
const ORIGIN = ""

const ReportTo = JSON.stringify({
	group: NEL_REPORT_GROUP,
	max_age: ONE_DAY,
	endpoints: [{
		// url: `http://localhost:${PORT}/network-reports`,
		url: `${ORIGIN}/network-reports`
	}],
	include_subdomains: true
})

const NEL = JSON.stringify({
	report_to: NEL_REPORT_GROUP,
	max_age: ONE_DAY,
	include_subdomains: true
})

const ContentSecurityPolicy = `
  default-src 'self';
  style-src 'self' example.com;
  report-uri http://localhost:${PORT}/csp-reports
`.replace(/\s{2,}/g, ' ').trim();

app.get('/', (request, response) => {
	// Note: report_to and not report-to for NEL.
	response.set('NEL', NEL);

	// The Report-To header tells the browser where to send network errors.
	// The default group (first example below) captures interventions and
	// deprecation reports. Other groups, like the network-error group, are referenced by their "group" name.
	response.set(
		'Report-To', ReportTo
	);

	response.set('Content-Security-Policy-Report-Only', ContentSecurityPolicy)

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
	response.set(
		"access-control-allow-origin", "*",
	)
	response.set(
		"access-control-allow-methods", "POST"
	)
	response.set("access-control-allow-headers", "Content-Type")
	console.log(`${request.body.length} Network error reports:`);
	echoReports(request, response);
});

app.post('/csp-reports', (req, res) => {
	console.log('Received CSP reports: ', req.body)

	res.sendStatus(200)
})

app.get('/throw-500-error', (req, res) => {
	res.status(500).end();
})

const listener = app.listen(PORT, () => {
	console.log(`Your app is listening on port ${listener.address().port}`);
});