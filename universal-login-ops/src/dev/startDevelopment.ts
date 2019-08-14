import {dirname, join} from 'path';
import {getWallets} from 'ethereum-waffle';
import {providers, Wallet, utils} from 'ethers';
import {ContractWhiteList, getContractHash, SupportedToken, ContractJSON, ETHER_NATIVE_TOKEN} from '@universal-login/commons';
import {RelayerClass, Config} from '@universal-login/relayer';
import ProxyContract from '@universal-login/contracts/build/Proxy.json';
import {ensureDatabaseExist} from '../common/ensureDatabaseExist';
import {startDevelopmentRelayer} from './startRelayer';
import {startGanache} from './startGanache.js';
import {deployENS} from './deployEns.js';
import deployWalletMaster from './deployWalletMaster';
import deployToken from './deployToken';
import deployFactory from '../ops/deployFactory';


const ganachePort = 18545;

const databaseConfig = {
  client: 'postgresql',
  connection: {
    database: 'universal_login_relayer_development',
    user:     'postgres',
    password: 'postgres'
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: getMigrationPath()
  }
};

const ensDomains = ['mylogin.eth', 'universal-id.eth', 'popularapp.eth'];

function getRelayerConfig(jsonRpcUrl: string, wallet: Wallet, walletMasterAddress: string, ensAddress: string, ensRegistrars: string[], contractWhiteList: ContractWhiteList, factoryAddress: string, tokenAddress: string) {
  const supportedTokens: SupportedToken[] = [{
    address: tokenAddress,
    minimalAmount: utils.parseEther('0.05').toString()
   },
   {
    address: ETHER_NATIVE_TOKEN.address,
    minimalAmount: utils.parseEther('0.05').toString()
   }];
  return {
    jsonRpcUrl,
    port: '3311',
    privateKey: wallet.privateKey,
    chainSpec: {
      name: 'development',
      ensAddress,
      chainId: 0
    },
    ensRegistrars,
    walletMasterAddress,
    contractWhiteList,
    factoryAddress,
    supportedTokens,
    tokenContractAddress: tokenAddress,
    localization: {
      language: 'en',
      country: 'any'
    },
    onRampProviders: {
      safello: {
        appId: '1234-5678',
        baseAddress: 'https://app.s4f3.io/sdk/quickbuy.html',
        addressHelper: true
      },
      ramp: {
        appName: 'Universal Login',
        logoUrl: 'https://universalloginsdk.readthedocs.io/en/latest/_images/logo.png',
        rampUrl: 'https://ri-widget-staging.firebaseapp.com/'
      }
    },
    database: databaseConfig
  };
}

function getProxyContractHash() {
  const proxyContractHash = getContractHash(ProxyContract as ContractJSON);
  console.log(`ProxyContract hash: ${proxyContractHash}`);
  return proxyContractHash;
}

function getMigrationPath() {
  const packagePath = require.resolve('@universal-login/relayer/package.json');
  return join(dirname(packagePath), 'build', 'lib', 'integration', 'sql', 'migrations');
}

declare interface StartDevelopmentOverrides {
  nodeUrl?: string;
  relayerClass?: RelayerClass;
}

async function startDevelopment({nodeUrl, relayerClass} : StartDevelopmentOverrides = {}) {
  const jsonRpcUrl = nodeUrl ? nodeUrl : await startGanache(ganachePort);
  const provider = new providers.JsonRpcProvider(jsonRpcUrl);
  const [, , , , ensDeployer, deployWallet] = await getWallets(provider);
  const ensAddress = await deployENS(ensDeployer, ensDomains);
  const {address, masterContractHash} = await deployWalletMaster(deployWallet);
  const proxyContractHash = getProxyContractHash();
  const factoryAddress = await deployFactory(deployWallet, address);
  const tokenAddress = await deployToken(deployWallet);
  await ensureDatabaseExist(databaseConfig);
  const contractWhiteList = {
    master:  [masterContractHash],
    proxy: [proxyContractHash]
  };
  const relayerConfig: Config = getRelayerConfig(jsonRpcUrl, deployWallet, address, ensAddress, ensDomains, contractWhiteList, factoryAddress, tokenAddress);
  await startDevelopmentRelayer(relayerConfig, provider, relayerClass);
  return {jsonRpcUrl, deployWallet, walletMasterAddress: address, tokenAddress, ensAddress, ensDomains};
}

export default startDevelopment;
