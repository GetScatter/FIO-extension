<template>
	<section>
		<section class="container" v-if="loading">
			<figure class="fa fa-spinner fa-spin"></figure>
		</section>

		<section v-else>
			<section class="container" v-if="noKey">
				<section>
					<h1>Add a key</h1>
					<br>
					<input placeholder="Enter a private key" v-model="privateKey" />
					<button @click="importKey">Import</button>
					<br>
					<br>
					<button @click="generateKey">Generate New Key</button>
				</section>
			</section>

			<section class="container" v-else>
				<section v-if="!changingKey && privateKey && privateKey.length">
					<h1>Here's your key</h1>
					<figure class="public-key">{{privateKey}}</figure>
					<br>
					<button @click="privateKey = ''">Back</button>
				</section>

				<section v-else-if="changingKey">
					<h1>Are you sure?</h1>
					<p>This will remove your key, accounts, and permissions.</p>
					<br>
					<button @click="changingKey = false">Back</button>
					<button @click="removeKey">Remove Key</button>
				</section>

				<section v-else>
					<h1>Ready to go!</h1>
					<figure class="public-key">{{publicKey}}</figure>
					<br>
					<button @click="changingKey = true">Change Key</button>
					<button @click="exportKey">Export Key</button>
					<button @click="lockWallet">Lock</button>
				</section>
			</section>
		</section>
	</section>
</template>

<script>
	import { mapActions, mapGetters, mapState } from 'vuex'
	import * as Actions from '../store/constants';
	import {RouteNames} from '../vue/Routing'

	import Keypair from '@walletpack/core/models/Keypair'
	import Account from '@walletpack/core/models/Account'
	import KeyPairService from '@walletpack/core/services/secure/KeyPairService'
	import AccountService from '@walletpack/core/services/blockchain/AccountService'
	import PluginRepository from '@walletpack/core/plugins/PluginRepository'
	import * as InternalMessageTypes from '../messages/InternalMessageTypes';

	export default {
		data(){ return {
			loading:false,
			privateKey:'',
			changingKey:false,
		}},
		computed: {
			...mapState([
				'scatter',
			]),
			noKey(){
				if(!this.scatter) return null;
				return !this.scatter.keychain.keypairs.length;
			},
			publicKey(){
				if(!this.scatter) return null;
				if(this.noKey) return null;
				return this.scatter.keychain.keypairs[0].publicKeys[0].key;
			},
		},
		mounted(){

		},
		methods: {
			async lockWallet(){
				await this[Actions.LOCK]();
				await this[Actions.LOAD_SCATTER]();
				this.$router.push({name:RouteNames.ENTRY});
			},
			async exportKey(){
				this.privateKey = PluginRepository.plugin('fio').bufferToHexPrivate(await this[InternalMessageTypes.PUB_TO_PRIV]());
			},
			async removeKey(){
				const scatter = this.scatter.clone();
				scatter.keychain.accounts = [];
				scatter.keychain.keypairs = [];
				scatter.keychain.permissions = [];
				this[Actions.SET_SCATTER](scatter);
			},
			async importKey(){
				const plugin = PluginRepository.plugin('fio');
				if(!plugin.validPrivateKey(this.privateKey)) return alert("Invalid private key");
				const bufferPrivate = plugin.hexPrivateToBuffer(this.privateKey);
				this.generateKey(bufferPrivate);
			},
			async generateKey(privateKey = null){
				this.loading = true;
				setTimeout(async () => {
					const keypair = Keypair.placeholder();
					keypair.blockchains = ['fio'];
					await KeyPairService.generateKeyPair(keypair);
					if(privateKey) keypair.privateKey = privateKey;
					await KeyPairService.makePublicKeys(keypair);
					keypair.setName();
					await KeyPairService.saveKeyPair(keypair);

					const publicKey = keypair.publicKeys.find(x => x.blockchain === 'fio').key;

					await Promise.all(this.scatter.settings.networks.map(async network => {
						const account = Account.fromJson({
							keypairUnique: keypair.unique(),
							networkUnique: network.unique(),
							publicKey,
							name:PluginRepository.plugin('fio').accountHash(publicKey),
							authority:'active',
						});
						await AccountService.addAccount(account);
						return true;
					}))


					this.privateKey = '';
					this.loading = false;
				}, 250);
			},
			...mapActions([
				Actions.CREATE_NEW_SCATTER,
				Actions.SET_SCATTER,
				Actions.SET_SEED,
				Actions.IS_UNLOCKED,
				Actions.LOAD_SCATTER,
				Actions.LOCK,
				InternalMessageTypes.PUB_TO_PRIV
			])
		},
	}
</script>

<style lang="scss">

	.fa-spinner {
		font-size: 24px;
		color:rgba(0,0,0,0.1);
	}

	.public-key {
		font-size: 9px;
		font-weight: bold;
		padding: 0 10px;
		margin: 10px 0;
	}
</style>
