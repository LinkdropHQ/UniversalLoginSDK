import {Wallet, providers, utils} from 'ethers';
import {ContractWhiteList, SignedMessage, ensure} from '@universal-login/commons';
import {ensureEnoughGas, ensureEnoughToken} from '../../../integration/ethereum/validations';
import {InvalidProxy} from '../../utils/errors';

export class MessageValidator {
  constructor(private wallet: Wallet, private contractWhiteList: ContractWhiteList) {
    console.log('MessageValidator inited with whitelist: ', contractWhiteList)
  }

  async validate(signedMessage: SignedMessage, transactionReq: providers.TransactionRequest) : Promise<void> {
    await this.ensureCorrectProxy(signedMessage.from);
    await ensureEnoughToken(this.wallet.provider, signedMessage);
    await ensureEnoughGas(this.wallet.provider, this.wallet.address, transactionReq, signedMessage);
  }

  private async ensureCorrectProxy(from: string) {
    const proxyByteCode = await this.wallet.provider.getCode(from);
    const proxyContractHash = utils.keccak256(proxyByteCode);
    console.log("ensureCorrectProxy whitelist: ", this.contractWhiteList.proxy)
    ensure(
      this.contractWhiteList.proxy.includes(proxyContractHash),
      InvalidProxy,
      from,
      proxyContractHash,
      this.contractWhiteList.proxy);
  }
}

export default MessageValidator;
