import {EncryptedStream, LocalStream} from 'extension-streams';
import IdGenerator from '@walletpack/core/util/IdGenerator'

let stream = new WeakMap();

let isReady = false;
class Content {

	constructor(){
		this.setup();
	}

	async setup(){
		this.setupEncryptedStream();
		this.injectInteractionScript();

	}

	setupEncryptedStream(){
		stream = new EncryptedStream('scatter', IdGenerator.text(256));
		stream.listenWith((msg) => this.contentListener(msg));
		stream.onSync(async () => isReady = true);
	}

	injectInteractionScript(){
		let script = document.createElement('script');
		script.src = chrome.extension.getURL('inject.js');
		(document.head||document.documentElement).appendChild(script);
		script.onload = () => script.remove();
	}

	contentListener(msg){
		if(!isReady || !stream.synced || (msg.hasOwnProperty('type') && msg.type === 'sync')) return this.sync(msg);
		if(msg.key !== 'sendApiRequest') return;

		const data = msg.params[0];
		data.payload.origin = location.hostname;

		LocalStream.send({type:'api', payload:Object.assign({id:msg.id}, data)}).then(result => {
			stream.send(result, 'injected')
		});
	}

	sync(message){
		stream.key = message.handshake.length ? message.handshake : null;
		stream.send({type:'sync'}, 'injected');
		stream.synced = true;
	}

}

new Content();
