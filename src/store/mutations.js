import * as Mutations from './constants'

export const mutations = {
    [Mutations.SET_SCATTER]:(state, scatter) => state.scatter = scatter,
    [Mutations.PUSH_PROMPT]:(state, prompt) => state.prompt = prompt,
};
