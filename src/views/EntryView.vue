<template>
   <section class="container">
       <section>
           <h1>Scatter FIO Extension</h1>
           <br>
           <input placeholder="Enter a password" v-model="password" type="password" />
           <br>
           <br>
           <button v-if="!exists" @click="create">Create</button>
           <button v-if="exists" @click="login">Login</button>
           <button v-if="exists" @click="nuke">Nuke</button>
       </section>
   </section>
</template>

<script>
    import { mapActions, mapGetters, mapState } from 'vuex'
    import * as Actions from '../store/constants';
    import {RouteNames} from '../vue/Routing'

    export default {
        data(){ return {
	        password:'',
	        exists:false,
        }},
        computed: {
            ...mapState([
                'scatter',
            ])
        },
        async mounted(){
        	this.exists = !!this.scatter;
        },
        methods: {
            async create(){
	            const created = await this[Actions.CREATE_NEW_SCATTER](this.password);
	            this.$router.push({name:RouteNames.DASHBOARD});
            },
            async login(){
            	await this[Actions.SET_SEED](this.password);
            	const unlocked = await this[Actions.IS_UNLOCKED]();

	            if(unlocked) {
		            await this[Actions.LOAD_SCATTER]();
	            	this.$router.push({name:RouteNames.DASHBOARD});
	            }
            },
            async nuke(){
	            await this[Actions.DESTROY]();
	            this.exists = false;
            },
            ...mapActions([
                Actions.CREATE_NEW_SCATTER,
                Actions.SET_SEED,
                Actions.IS_UNLOCKED,
                Actions.LOAD_SCATTER,
                Actions.DESTROY,
            ])
        },
    }
</script>

<style lang="scss">

</style>
