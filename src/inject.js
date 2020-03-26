import {EncryptedStream} from 'extension-streams';
import IdGenerator from '@walletpack/core/util/IdGenerator';

let resolvers = {};
class Inject {

	constructor(){
		const stream = new EncryptedStream('injected', IdGenerator.text(64));

		stream.listenWith(data => {
			if(data.type === 'synced' || data.type === 'sync') return;

			const isErrorResponse = typeof data.result === 'object'
				&& data.result !== null
				&& data.result.hasOwnProperty('isError');

			resolvers[data.id][isErrorResponse ? 'reject' : 'resolve'](data.result);
			delete resolvers[data.id];
		});

		stream.sync('scatter', stream.key);


		const proxyApi = (target, key) => {
			if (key === 'then') return target.then.bind(target);
			return (...params) => new Promise(async (resolve, reject) => {
				const id = IdGenerator.text(24);
				resolvers[id] = {key, resolve, reject};
				await stream.send({key, params, id}, 'scatter');
			});
		};

		window.wallet = new Proxy({}, {
			get(target, key) {
				return proxyApi(target, key);
			},
			set(target, key, value) {
				target[key] = value;
				return true;
			}
		});
		document.dispatchEvent(new Event("walletLoaded"));

	}

}

new Inject();




