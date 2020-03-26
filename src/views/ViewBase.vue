<template>
    <section class="view-base">
        <section class="router-base">
            <router-view></router-view>
        </section>

    </section>
</template>

<script>
	import { mapActions, mapGetters, mapState } from 'vuex'
	import * as Actions from '../store/constants';
	import {RouteNames, RouteDepth} from '../vue/Routing'

	export default {
		data(){ return {

		}},
		computed: {
			...mapState([

			])
		},
		methods: {
			...mapActions([

			])
		},

	}
</script>

<style lang="scss">

</style>
