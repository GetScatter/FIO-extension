import EntryView from '../views/EntryView.vue'
import Dashboard from '../views/Dashboard.vue'
import PopOut from '../views/PopOut.vue'

export const RouteNames = {
    ENTRY:'entry',
    DASHBOARD:'dashboard',
	POP_OUT:'popout',
};

const RouteViews = {
    [RouteNames.ENTRY]:EntryView,
    [RouteNames.DASHBOARD]:Dashboard,

	[RouteNames.POP_OUT]:PopOut,
};

const RoutePaths = {
	[RouteNames.ENTRY]: '/',
};


export class Routing {

	static builder(){
		const routeNames = Object.keys(RouteNames).map(key => RouteNames[key]);

		let routesBuilder = {};
		routeNames.map(routeName => {
			routesBuilder[routeName] = {
				path:RoutePaths.hasOwnProperty(routeName) ? RoutePaths[routeName] : `/${routeName}`,
				name:routeName,
				component: RouteViews[routeName]
			}
		});

		return routesBuilder;
	}

	static routes(){
		return Object.keys(Routing.builder())
			.map(routeName => Routing.builder()[routeName]);
	}

	static isRestricted(routeName) {
		return ![
			RouteNames.ENTRY,
			RouteNames.POP_OUT,
		].includes(routeName)
	}

}
