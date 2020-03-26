import * as Actions from './constants'
import InternalMessage from '../messages/InternalMessage'
import * as InternalMessageTypes from '../messages/InternalMessageTypes'

import Scatter from '@walletpack/core/models/Scatter'

export const actions = {
    [Actions.IS_UNLOCKED]:() => InternalMessage.signal(InternalMessageTypes.IS_UNLOCKED).send(),
    [InternalMessageTypes.PUB_TO_PRIV]:({commit}, args) => InternalMessage.payload(InternalMessageTypes.PUB_TO_PRIV, args).send(),
    [InternalMessageTypes.SIGN_TRANSACTION_DATA]:({commit}, args) => InternalMessage.payload(InternalMessageTypes.SIGN_TRANSACTION_DATA, args).send(),
    [Actions.LOCK]:({commit}) => {
	    InternalMessage.payload(InternalMessageTypes.SET_SEED, '').send()
	    commit(Actions.SET_SCATTER, null);
    },
    [Actions.DESTROY]:({dispatch, commit}) => {
	    InternalMessage.signal(InternalMessageTypes.DESTROY).send()
	    commit(Actions.SET_SCATTER, null);
    },

    [Actions.SET_SEED]:({commit}, password) => {
        return new Promise(async (resolve, reject) => {
            // let seed, mnemonic;
            // if(password.split(' ').length >= 12) {
            //     seed = await Mnemonic.mnemonicToSeed(password);
            //     mnemonic = password;
            // } else {
            //     const [m, s] = await Mnemonic.generateMnemonic(password);
            //     seed = s;
            //     mnemonic = m;
            // }

            InternalMessage.payload(InternalMessageTypes.SET_SEED, password).send().then(() => {
                resolve(password)
            })
        })
    },

    [Actions.LOAD_SCATTER]:({dispatch, commit}) => {
        return new Promise((resolve, reject) => {
            InternalMessage.signal(InternalMessageTypes.LOAD).send().then(_scatter => {
	            commit(Actions.SET_SCATTER, _scatter ? Scatter.fromJson(_scatter) : null)
                resolve();
            })
        })
    },

    [Actions.SET_SCATTER]:({dispatch, commit}, scatter) => {
        return new Promise((resolve, reject) => {
            InternalMessage.payload(InternalMessageTypes.UPDATE, scatter).send().then(_scatter => {
                _scatter = Scatter.fromJson(_scatter);
	            commit(Actions.SET_SCATTER, _scatter)
                resolve(_scatter)
            })
        })
    },

    [Actions.CREATE_NEW_SCATTER]:({state, commit, dispatch}, password) => {
        return new Promise(async (resolve, reject) => {
	        const scatter = await Scatter.create();
            dispatch(Actions.SET_SEED, password).then(mnemonic => {
	            dispatch(Actions.SET_SCATTER, scatter);
	            resolve();
            })
        })
    },


    [Actions.PUSH_PROMPT]:({state, commit}, prompt) => {
        if(state.prompt) state.prompt.responder(null);
        commit(Actions.PUSH_PROMPT, prompt);
    },
};
