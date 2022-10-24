require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

/** @type import('hardhat/config').HardhatUserConfig */

const INFURA_GOERLI_ID = process.env.INFURA_GOERLI_ID;
const INFURA_MAINNET_ID = process.env.INFURA_MAINNET_ID;
const GOERLI_PRIVATE_KEY = process.env.GOERLI_PRIVATE_KEY;
const MAINNET_PRIVATE_KEY = process.env.MAINNET_PRIVATE_KEY;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

module.exports = {
  solidity: "0.8.9",
  gasReporter: {
    enabled: true,
    currency: 'USD',
    gasPrice: 100
  },
  networks: {
    mainnet: {
      url: `https://mainnet.infura.io/v3/${INFURA_MAINNET_ID}`,
      accounts: [`${MAINNET_PRIVATE_KEY}`],
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${INFURA_GOERLI_ID}`,
      accounts: [`${GOERLI_PRIVATE_KEY}`],
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  }
};
