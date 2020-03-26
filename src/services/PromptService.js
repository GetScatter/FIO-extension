import apis from '../util/browserapis';
import InternalMessage from '../messages/InternalMessage'
import * as InternalMessageTypes from '../messages/InternalMessageTypes'
import {Popup, PopupData, PopupDisplayTypes} from "../models/popups/Popup";

let openWindow = null;

export default class PromptService {

	/***
	 * Opens a prompt window outside of the extension
	 * @param popup
	 */
	static async open(popup){
		return new Promise(async resolve => {
			popup.data.callback = resolve;
			if(openWindow){
				// For now we're just going to close the window to get rid of the error
				// that is caused by already open windows swallowing all further requests
				openWindow.close();
				openWindow = null;

				// Alternatively we could focus the old window, but this would cause
				// urgent 1-time messages to be lost, such as after dying in a game and
				// uploading a high-score. That message will be lost.
				// openWindow.focus();
				// return false;

				// A third option would be to add a queue, but this could cause
				// virus-like behavior as apps overflow the queue causing the user
				// to have to quit the browser to regain control.
			}


			const height = 650;
			const width = 360;
			let middleX = window.screen.availWidth/2 - (width/2);
			let middleY = window.screen.availHeight/2 - (height/2);

			const getPopup = async () => {
				try {
					const url = apis.runtime.getURL('/prompt.html');

					const win = window.open(url, 'ScatterPrompt', `width=${width},height=${height},resizable=0,top=${middleY},left=${middleX},titlebar=0`);
					win.data = popup;
					openWindow = win;
					return win;
				} catch (e) {
					console.error('popup error', e);
					return null;
				}
			}

			await InternalMessage.payload(InternalMessageTypes.SET_PROMPT, JSON.stringify(popup)).send();

			let win = await getPopup();

			// Handles the user closing the popup without taking any action
			win.onbeforeunload = () => {
				popup.data.callback(null);

				// https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onbeforeunload
				// Must return undefined to bypass form protection
				openWindow = null;
				return undefined;
			};
		})

	}

	/***
	 * Always use this method for closing notification popups.
	 * Otherwise you will double send responses and one will always be null.
	 */
	static async close(){
		if(typeof browser !== 'undefined') {
			const {id: windowId,} = (await apis.windows.getCurrent());
			apis.windows.remove(windowId);
		} else {
			window.onbeforeunload = () => {};
			window.close();
		}
	}

}
