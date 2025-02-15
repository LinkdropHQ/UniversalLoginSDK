import React, {useState, useContext} from 'react';
import {TransferService} from '@universal-login/sdk';
import {TransferDetails, ApplicationWallet} from '@universal-login/commons';
import {ModalTransferRecipient, ModalTransferAmount} from '@universal-login/react';
import {WalletModalContext} from '../../../../core/entities/WalletModalContext';
import {useServices} from '../../../hooks';

const ModalTransfer = () => {
  const modalService = useContext(WalletModalContext);
  const [modal, setModal] = useState('transferAmount');

  const {walletService, sdk} = useServices();
  const [transferDetalis, setTransferDetails] = useState({currency: sdk.tokensDetailsStore.tokensDetails[0].symbol} as TransferDetails);

  const applicationWallet = walletService.applicationWallet as ApplicationWallet;

  const transferService = new TransferService(sdk, applicationWallet);
  const onGenerateClick = async () => {
    modalService.hideModal();
    modalService.showModal('waitingForTransfer');
    await transferService.transfer(transferDetalis);
    modalService.hideModal();
  };

  const updateTransferDetailsWith = (args: Partial<TransferDetails>) => {
    setTransferDetails({...transferDetalis, ...args});
  };

  if (modal === 'transferAmount') {
    return (
      <ModalTransferAmount
        sdk={sdk}
        ensName={applicationWallet.name}
        onSelectRecipientClick={() => setModal('transferRecipient')}
        updateTransferDetailsWith={updateTransferDetailsWith}
        currency={transferDetalis.currency}
        transferAmountClassName="jarvis-transfer-amount"
      />
    );
  } else if (modal === 'transferRecipient') {
    return (
      <ModalTransferRecipient
        onRecipientChange={event => updateTransferDetailsWith({to: event.target.value})}
        onSendClick={onGenerateClick}
        onBackClick={() => setModal('transferAmount')}
        transferDetalis={transferDetalis}
        transferRecipientClassName="jarvis-transfer-recipient"
      />
    );
  }
  return null;
};

export default ModalTransfer;
