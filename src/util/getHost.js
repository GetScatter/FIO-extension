let host = process.env.WEB_HOST;

const setHost = x => host = x;
const getHost = () => host;

module.exports = {
	setHost,
	getHost
}
