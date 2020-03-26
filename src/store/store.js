import Vue from 'vue'
import Vuex from 'vuex';

import {mutations} from './mutations';
import {actions} from './actions';

Vue.use(Vuex);

const state = {
    scatter:null,
    prompt:null,
};

const getters = {
    messages:state => state.prompt.data.messages || [],
};

export const store = new Vuex.Store({
    state,
    getters,
    mutations,
    actions
})
