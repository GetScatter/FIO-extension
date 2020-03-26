import VueInitializer from './vue/VueInitializer';
import {Routing} from './vue/Routing';
import * as Actions from './store/constants'
import {RouteNames} from './vue/Routing'

import Button from './components/reusable/Button';
import Input from './components/reusable/Input';
import Switcher from './components/reusable/Switcher';
import Select from './components/reusable/Select';
import ViewBase from './views/ViewBase.vue'

class Popup {

    constructor(){
        const components = [
	        {tag:'Button', vue:Button},
	        {tag:'Input', vue:Input},
	        {tag:'Switcher', vue:Switcher},
	        {tag:'Select', vue:Select},
            {tag:'view-base', vue:ViewBase},
        ];

        const routes = Routing.routes();

        const middleware = (to, next, store) => {
            if(Routing.isRestricted(to.name))
                store.dispatch(Actions.IS_UNLOCKED)
                    .then(unlocked => (unlocked) ? next() : next({name:RouteNames.ENTRY}));
            else next();
        };


	    require('./services/walletpack').default();
        new VueInitializer(routes, components, middleware, (router, store) => {
	        store.dispatch(Actions.IS_UNLOCKED)
		        .then(unlocked => {
			        if(unlocked) router.push({name:RouteNames.DASHBOARD});
			        // else router.push({name:RouteNames.ENTRY});
		        });
        });
    }

}

const popup = new Popup();
