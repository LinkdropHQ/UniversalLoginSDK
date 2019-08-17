import { Router } from 'express';
import WalletService from '../../integration/ethereum/WalletService';
import MessageHandler from '../../core/services/MessageHandler'
import MessageExecutor from '../../integration/ethereum/MessageExecutor';
import { SignedMessage, DeployArgs } from '@universal-login/commons';
import { asyncHandler, sanitize, responseOf, asString, asObject, asNumber, asOptional } from '@restless/restless';
import { asBigNumberish, asOverrideOptions, asArrayish } from '../utils/sanitizers';

const create = (walletContractService: WalletService) =>
  async (data: { body: { managementKey: string, ensName: string, overrideOptions?: {} } }) => {
    const { managementKey, ensName, overrideOptions } = data.body;
    const transaction = await walletContractService.create(managementKey, ensName, overrideOptions);
    return responseOf({ transaction }, 201);
  };

const execution = (messageHandler: MessageHandler, messageExecutor: MessageExecutor) =>
  async (data: { body: SignedMessage }) => {
    const transaction = await messageExecutor.execute(data.body);
    return responseOf({ status: { messageHash: transaction.hash, totalCollected: 0, required: 1 }}, 201);
  };

const getStatus = (messageHandler: MessageHandler) =>
  async (data: { messageHash: string }) => {
    const status = await messageHandler.getStatus(data.messageHash);
    return responseOf(status);
  };

const deploy = (walletContractService: WalletService) =>
  async (data: { body: DeployArgs }) => {
    console.log({ data })
    const { publicKey, ensName, gasPrice, signature } = data.body;
    console.log({ publicKey, ensName, gasPrice, signature })
    const transaction = await walletContractService.deploy({ publicKey, ensName, gasPrice, signature });
    console.log({ transaction })
    return responseOf(transaction, 201);
  };

export default (walletContractService: WalletService, messageHandler: MessageHandler, messageExecutor: MessageExecutor) => {
  const router = Router();

  router.post('/', asyncHandler(
    sanitize({
      body: asObject({
        managementKey: asString,
        ensName: asString,
        overrideOptions: asOptional(asOverrideOptions)
      })
    }),
    create(walletContractService)
  ));

  router.post('/execution', asyncHandler(
    sanitize({
      body: asObject({
        gasToken: asString,
        operationType: asNumber,
        to: asString,
        from: asString,
        nonce: asString,
        gasLimit: asBigNumberish,
        gasPrice: asBigNumberish,
        data: asArrayish,
        value: asBigNumberish,
        signature: asString
      })
    }),
    execution(messageHandler, messageExecutor)
  ));

  router.get('/execution/:messageHash', asyncHandler(
    sanitize({
      messageHash: asString,
    }),
    getStatus(messageHandler)
  ));

  router.post('/deploy', asyncHandler(
    sanitize({
      body: asObject({
        publicKey: asString,
        ensName: asString,
        gasPrice: asString,
        signature: asString
      })
    }),
    deploy(walletContractService)
  ));

  return router;
};
