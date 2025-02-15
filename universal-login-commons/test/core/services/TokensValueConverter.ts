import {expect} from 'chai';
import {utils} from 'ethers';
import {TokenDetailsWithBalance} from '../../../lib/core/models/TokenData';
import {TokensValueConverter} from '../../../lib/core/services/TokensValueConverter';
import {ETHER_NATIVE_TOKEN} from '../../../lib/core/constants/constants';
import {TEST_CONTRACT_ADDRESS} from '../../../lib/core/constants/test';

describe('UNIT: TokensValueConverter', () => {
  const tokensValueConverter = new TokensValueConverter(['USD', 'EUR', 'BTC']);

  context('safeMultiply', () => {
    it('111.11 USD/ETH * 2 ETH = 222.22 USD', () => {
      const actualEthTotalWorth = tokensValueConverter.safeMultiply(utils.parseEther('2'), 111.11);

      expect(actualEthTotalWorth).to.be.equal(222.22);
    });

    it('111.11 USD/ETH * 0 ETH = 0 USD', () => {
      const actualEthTotalWorth = tokensValueConverter.safeMultiply(utils.parseEther('0'), 111.11);

      expect(actualEthTotalWorth).to.be.equal(0);
    });

    it('0 USD/ETH * 2 ETH = 0 USD', () => {
      const actualEthTotalWorth = tokensValueConverter.safeMultiply(utils.parseEther('2'), 0);

      expect(actualEthTotalWorth).to.be.equal(0);
    });
  });

  context('getTokenTotalWorth', () => {
    it('0 ETH', () => {
      const tokenPrices = {USD: 2000, EUR: 1600, BTC: 1};

      const actualEthTotalWorth = tokensValueConverter.getTokenTotalWorth(utils.parseEther('0'), tokenPrices);

      expect(actualEthTotalWorth).to.be.deep.equal({USD: 0, EUR: 0, BTC: 0});
    });

    it('2 ETH', () => {
      const tokenPrices = {USD: 2000, EUR: 1600, BTC: 1};

      const actualEthTotalWorth = tokensValueConverter.getTokenTotalWorth(utils.parseEther('2'), tokenPrices);

      expect(actualEthTotalWorth).to.be.deep.equal({USD: 2 * 2000, EUR: 2 * 1600, BTC: 2 * 1});
    });
  });

  context('addBalances', () => {
    it('{USD, EUR, BTC} + {USD, EUR, BTC}', () => {
      const token1TotalWorth = {USD: 2000, EUR: 1600, BTC: 1};
      const token2TotalWorth = {USD: 2 * 2000, EUR: 2 * 1600, BTC: 2 * 1};

      const tokensTotalWorth = tokensValueConverter.addBalances(token1TotalWorth, token2TotalWorth);

      expect(tokensTotalWorth).to.deep.equal({USD: 3 * 2000, EUR: 3 * 1600, BTC: 3 * 1});
    });
  });

  context('getTotal', () => {
    const tokenDetailsWithBalance: TokenDetailsWithBalance[] = [
      {...ETHER_NATIVE_TOKEN, balance: utils.parseEther('1')},
      {address: TEST_CONTRACT_ADDRESS, symbol: 'Mock', name: 'MockToken', balance: utils.parseEther('2')}
    ];

    const tokenPrices = {
      ETH: {USD: 1000, EUR: 800, BTC: 0.1},
      Mock: {USD: 200, EUR: 160, BTC: 0.02}
    };

    it('[]', async () => {
      const actualTotalWorth = tokensValueConverter.getTotal([], tokenPrices);

      expect(actualTotalWorth).to.be.deep.equal({USD: 0, EUR: 0, BTC: 0});
    });

    it('[ETH , DAI]', async () => {
      const expectedTotalWorth = {
        USD: 1 * 1000 + 2 * 200,
        EUR: 1 * 800 + 2 * 160,
        BTC: 1 * 0.1 + 2 * 0.02
      };

      const actualTotalWorth = tokensValueConverter.getTotal(tokenDetailsWithBalance, tokenPrices);

      expect(actualTotalWorth).to.be.deep.equal(expectedTotalWorth);
    });
  });
});
