import VueInitializer from './vue/VueInitializer';
import {Routing} from './vue/Routing';
import * as Actions from './store/constants'
import {RouteNames} from './vue/Routing'


import Button from './components/reusable/Button';
import Input from './components/reusable/Input';
import Switcher from './components/reusable/Switcher';
import Select from './components/reusable/Select';
import ViewBase from './views/ViewBase.vue'
import apis from './util/browserapis';
import {Popup} from "./models/popups/Popup";

class PromptWindow {

    constructor(){
        let prompt = window.data;
	    prompt = Popup.fromJson(prompt);

	    const components = [
		    {tag:'Button', vue:Button},
		    {tag:'Input', vue:Input},
		    {tag:'Switcher', vue:Switcher},
		    {tag:'Select', vue:Select},
		    {tag:'view-base', vue:ViewBase},
	    ];

        const routes = Routing.routes(true);
        const middleware = (to, next, store) => next();

	    require('./services/walletpack').default();
        new VueInitializer(routes, components, middleware, (router, store) => {
            store.dispatch(Actions.LOAD_SCATTER);
            store.dispatch(Actions.PUSH_PROMPT, prompt);
            router.push({name:RouteNames.POP_OUT});
        });
    }

}

const popup = new PromptWindow();









