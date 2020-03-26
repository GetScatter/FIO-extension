import WalletPack from '@walletpack/core';
import {store} from "../store/store";
import * as Actions from '../store/constants'
import PromptService from "./PromptService";
import {Popup, PopupData, PopupDisplayTypes} from "../models/popups/Popup";
import AppsService from '@walletpack/core/services/apps/AppsService'
import KeyPairService from '@walletpack/core/services/secure/KeyPairService'
import PluginRepository from '@walletpack/core/plugins/PluginRepository'
import * as InternalMessageTypes from '../messages/InternalMessageTypes';
import InternalMessage from "../messages/InternalMessage";

let signer;
const init = () => {
	const eventListener = async (type, data) => {
		switch(type){
			case 'popout':
				const popup =  new Popup(PopupDisplayTypes.POP_OUT, new PopupData(data.type, data));
				popup.data.props.appData = {
					applink:popup.data.props.payload.origin,
					type:'',
					name:popup.data.props.payload.origin,
					description:'',
					logo:'',
					url:'',
				};
				const result = await PromptService.open(popup);
				return Object.assign(popup, {result});
			case 'firewalled': break;
			case 'no_certs': break;
		}
	};
	WalletPack.initialize(
		// --------------------------------------------
		// blockchains & blockchain plugins
		{
			blockchains:{
				FIO:'fio',
			},
			plugins:[
				require('@walletpack/fio').default
			]
		},
		// --------------------------------------------
		// store
		store,
		// --------------------------------------------
		// security
		{
			getSalt:() => '',
			get:() => () => {},
			set:(_seed) => () => '',
			clear:() => () => '',
		},
		// --------------------------------------------
		// framework
		{
			getVersion:() => '1.0.0',
			pushNotification:() => true,
		},
		// --------------------------------------------
		// events
		eventListener,
		// --------------------------------------------
		// optionals
		{
			signer:async (network, publicKey, payload, arbitrary = false, isHash = false) => new Promise(r => signer(r, {network, publicKey, payload, arbitrary, isHash})),
		}
	);
}
export default init;
export const setSigner = (_signer) => signer = _signer;
