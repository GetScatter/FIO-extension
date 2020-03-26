import InternalMessage from "./messages/InternalMessage";
import * as InternalMessageTypes from './messages/InternalMessageTypes';
import ApiService from '@walletpack/core/services/apis/ApiService'
import StoreService from '@walletpack/core/services/utility/StoreService'
import NetworkService from '@walletpack/core/services/blockchain/NetworkService'
import Network from '@walletpack/core/models/Network'
import apis from './util/browserapis';

import AES from 'aes-oop';
import StorageService from "./services/StorageService";
const {LocalStream} = require('extension-streams');
require('./services/walletpack').default();

const store = {
	state:{
		scatter:null,
	},
	dispatch:(key, val) => {
		if(key === 'setScatter'){
			store.state.scatter = val;
			Background.update(() => {}, val);
		}
	},
	commit:(key, val) => {}
};
StoreService.init(store)

import Scatter from '@walletpack/core/models/Scatter'
import PluginRepository from "@walletpack/core/plugins/PluginRepository";

let seed = '';
let prompt = null;


export default class Background {

	constructor(){
		this.setupInternalMessaging();
	}

	// Watches the internal messaging system ( LocalStream )
	setupInternalMessaging(){
		LocalStream.watch((request, sendResponse) => {
			const message = InternalMessage.fromJson(request);
			this.dispenseMessage(sendResponse, message);
		})

		walletpack.setSigner(Background.signTransactionData)
	}

	/***
	 * Delegates message processing to methods by message type
	 * @param sendResponse - Delegating response handler
	 * @param message - The message to be dispensed
	 */
	async dispenseMessage(sendResponse, message){
		if(message.type === 'api'){
			// Adding any network, doesn't matter.
			if(message.payload.hasOwnProperty('fields') && message.payload.fields.hasOwnProperty('accounts')){
				const networkDefinitions = message.payload.fields.accounts.map(x => Network.fromJson(x));
				await Promise.all(networkDefinitions.map(network => NetworkService.addNetwork(network)));
				await new Promise(r => Background.update(r, store.state.scatter));
			}

			const formatted = Object.assign(message.payload, {plugin:message.payload.origin});
			ApiService.handler(formatted).then(result => sendResponse(result))
		} else switch(message.type){
			case InternalMessageTypes.SET_SEED:                         Background.setSeed(sendResponse, message.payload); break;
			case InternalMessageTypes.GET_SEED:                         Background.getSeed(sendResponse, message.payload); break;
			case InternalMessageTypes.IS_UNLOCKED:                      Background.isUnlocked(sendResponse); break;
			case InternalMessageTypes.LOAD:                             Background.load(sendResponse); break;
			case InternalMessageTypes.UPDATE:                           Background.update(sendResponse, message.payload); break;
			case InternalMessageTypes.PUB_TO_PRIV:                      Background.publicToPrivate(sendResponse, message.payload); break;
			case InternalMessageTypes.DESTROY:                          Background.destroy(sendResponse); break;
			case InternalMessageTypes.SET_PROMPT:                       Background.setPrompt(sendResponse, message.payload); break;
			case InternalMessageTypes.GET_PROMPT:                       Background.getPrompt(sendResponse); break;
			case InternalMessageTypes.SIGN_TRANSACTION_DATA:            Background.signTransactionData(sendResponse, message.payload); break;

			// PROMPTS
			// case InternalMessageTypes.IDENTITY_FROM_PERMISSIONS:        Background.identityFromPermissions(sendResponse, message.payload); break;
			// case InternalMessageTypes.GET_OR_REQUEST_IDENTITY:          Background.getOrRequestIdentity(sendResponse, message.payload); break;
			// case InternalMessageTypes.FORGET_IDENTITY:                  Background.forgetIdentity(sendResponse, message.payload); break;
			// case InternalMessageTypes.REQUEST_SIGNATURE:                Background.requestSignature(sendResponse, message.payload); break;
			// case InternalMessageTypes.REQUEST_ARBITRARY_SIGNATURE:      Background.requestArbitrarySignature(sendResponse, message.payload); break;
			// case InternalMessageTypes.REQUEST_ADD_NETWORK:              Background.requestAddNetwork(sendResponse, message.payload); break;
			// case InternalMessageTypes.REQUEST_GET_VERSION:              Background.requestGetVersion(sendResponse); break;
			// case InternalMessageTypes.REQUEST_VERSION_UPDATE:           Background.requestVersionUpdate(sendResponse, message.payload); break;
			// case InternalMessageTypes.AUTHENTICATE:                     Background.authenticate(sendResponse, message.payload); break;
			// case InternalMessageTypes.ABI_CACHE:                        Background.abiCache(sendResponse, message.payload); break;
		}
	}

	static lockGuard(sendResponse, cb){
		if(!seed.length) sendResponse(null);
		else cb();
	}

	static setPrompt(sendResponse, notification){
		prompt = notification;
		sendResponse(true);
	}

	static getPrompt(sendResponse){
		sendResponse(prompt);
	}

	static setSeed(sendResponse, _seed){
		seed = _seed;
		if(seed === ''){
			store.state.scatter = null;
		}
		sendResponse(true);
	}

	static getSeed(sendResponse){
		sendResponse(seed);
	}

	static isUnlocked(sendResponse){
		// Even if a seed is set, that doesn't mean that the seed is correct.
		if(seed.length) StorageService.get().then(scatter => {
			if(!scatter) return sendResponse(false);
			try {
				scatter.decrypt(seed);
				sendResponse(!scatter.isEncrypted());
			} catch(e) {
				seed = '';
				sendResponse(false);
			}
		});
		// If no seed is set, Scatter is definitely locked
		else sendResponse(false);
	}

	static async load(sendResponse){
		StorageService.get().then(async scatter => {
			if(!scatter) return sendResponse(null);
			if(!seed.length) return sendResponse(scatter);
			try {
				scatter.decrypt(seed);
				store.state.scatter = scatter;
				sendResponse(scatter)
			} catch(e){
				sendResponse(scatter);
			}
		})
	}

	static update(sendResponse, scatter){
		if(scatter && typeof scatter.keychain === 'string') return sendResponse(scatter);
		this.lockGuard(sendResponse, () => {
			scatter = Scatter.fromJson(scatter);

			// Private Keys are always separately encrypted
			scatter.keychain.keypairs.map(keypair => keypair.encrypt(seed));
			scatter.keychain.identities.map(id => id.encrypt(seed));

			// Keychain is always stored encrypted.
			scatter.encrypt(seed);

			StorageService.save(scatter).then(saved => {
				scatter.decrypt(seed);
				store.state.scatter = scatter;
				sendResponse(scatter)
			})
		})
	}

	static async destroy(sendResponse){
		seed = '';
		store.state.scatter = null;
		await StorageService.remove();
		sendResponse(true);
	}

	static async getPrivateKey(){
		const scatter = await StorageService.get();
		scatter.decrypt(seed);
		let keypair = scatter.keychain.keypairs[0];
		return (keypair) ? AES.decrypt(keypair.privateKey, seed) : null;
	}

	static publicToPrivate(sendResponse, publicKey){
		this.lockGuard(sendResponse, async () => {
			sendResponse(await Background.getPrivateKey());
		})
	}

	static signTransactionData(sendResponse, args){
		Background.lockGuard(sendResponse, async () => {
			const {network, publicKey, payload, arbitrary, isHash} = args;
			const privateKey = await Background.getPrivateKey();
			const signature = await PluginRepository.plugin('fio').signer(payload, publicKey, arbitrary, isHash, privateKey.data).catch(err => {
				console.error('signing err', err);
				return null;
			})
			sendResponse(signature);
		})
	}










}
require('./services/walletpack').setSigner(Background.signTransactionData)
const background = new Background();
