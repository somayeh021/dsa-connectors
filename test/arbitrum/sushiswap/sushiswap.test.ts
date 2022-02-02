import { expect } from "chai";
import hre from "hardhat";
const { waffle, ethers } = hre;
const { provider } = waffle;

import { deployAndEnableConnector } from "../../../scripts/tests/deployAndEnableConnector";
import { buildDSAv2 } from "../../../scripts/tests/buildDSAv2";
import { encodeSpells } from "../../../scripts/tests/encodeSpells";
import { getMasterSigner } from "../../../scripts/tests/getMasterSigner";
import { addLiquidity } from "../../../scripts/tests/addLiquidity";

import { constants } from "../../../scripts/constant/constant";
import { addresses } from "../../../scripts/tests/arbitrum/addresses";
import { abis } from "../../../scripts/constant/abis";
import { ConnectV2SushiswapArbitrum__factory } from "../../../typechain";
import type { Signer, Contract } from "ethers";

const DAI_ADDR = "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1";

describe("Sushiswap", function () {
  const connectorName = "Sushiswap-v1";

  let dsaWallet0: Contract;
  let masterSigner: Signer;
  let instaConnectorsV2: Contract;
  let connector: Contract;

  const wallets = provider.getWallets();
  const [wallet0, wallet1, wallet2, wallet3] = wallets;
  before(async () => {
    await hre.network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            // @ts-ignore
            jsonRpcUrl: hre.config.networks.hardhat.forking.url,
            blockNumber: 13005785
          }
        }
      ]
    });

    masterSigner = await getMasterSigner();
    instaConnectorsV2 = await ethers.getContractAt(abis.core.connectorsV2, addresses.core.connectorsV2);
    connector = await deployAndEnableConnector({
      connectorName,
      contractArtifact: ConnectV2SushiswapArbitrum__factory,
      signer: masterSigner,
      connectors: instaConnectorsV2
    });
    console.log("Connector address", connector.address);
  });

  it("Should have contracts deployed.", async function () {
    expect(!!instaConnectorsV2.address).to.be.true;
    expect(!!connector.address).to.be.true;
    expect(!!(await masterSigner.getAddress())).to.be.true;
  });

  describe("DSA wallet setup", function () {
    it("Should build DSA v2", async function () {
      dsaWallet0 = await buildDSAv2(wallet0.address);
      expect(!!dsaWallet0.address).to.be.true;
    });

    it("Deposit aeth & DAI into DSA wallet", async function () {
      await wallet0.sendTransaction({
        to: dsaWallet0.address,
        value: ethers.utils.parseEther("10")
      });
      expect(await ethers.provider.getBalance(dsaWallet0.address)).to.be.gte(ethers.utils.parseEther("10"));

      await addLiquidity("dai", dsaWallet0.address, ethers.utils.parseEther("10000"));
    });

    it("Deposit aeth & USDT into DSA wallet", async function () {
      await wallet0.sendTransaction({
        to: dsaWallet0.address,
        value: ethers.utils.parseEther("10")
      });
      expect(await ethers.provider.getBalance(dsaWallet0.address)).to.be.gte(ethers.utils.parseEther("10"));

      await addLiquidity("usdt", dsaWallet0.address, ethers.utils.parseEther("10000"));
    });
  });

  describe("Main", function () {
    it("Should deposit successfully", async function () {
      const aethAmount = ethers.utils.parseEther("0.1"); 
      const daiUnitAmount = ethers.utils.parseEther("4000"); 
      const aethAddress = constants.native_address;

      const getId = "0";
      const setId = "0";

      const spells = [
        {
          connector: connectorName,
          method: "deposit",
          args: [aethAddress, DAI_ADDR, aethAmount, daiUnitAmount, "500000000000000000", getId, setId]
        }
      ];

      const tx = await dsaWallet0.connect(wallet0).cast(...encodeSpells(spells), wallet1.address);
      let receipt = await tx.wait();
    }).timeout(10000000000);

    it("Should withdraw successfully", async function () {
      const aethAmount = ethers.utils.parseEther("0.1"); 
      const aethAddress = constants.native_address;

      const getId = "0";
      const setIds = ["0", "0"];

      const spells = [
        {
          connector: connectorName,
          method: "withdraw",
          args: [aethAddress, DAI_ADDR, aethAmount, 0, 0, getId, setIds]
        }
      ];

      const tx = await dsaWallet0.connect(wallet0).cast(...encodeSpells(spells), wallet1.address);
      let receipt = await tx.wait();
    });

    it("Should buy successfully", async function () {
      const aethAmount = ethers.utils.parseEther("0.1"); 
      const daiUnitAmount = ethers.utils.parseEther("4000"); 
      const aethAddress = constants.native_address;

      const getId = "0";
      const setId = "0";

      const spells = [
        {
          connector: connectorName,
          method: "buy",
          args: [aethAddress, DAI_ADDR, aethAmount, daiUnitAmount, getId, setId]
        }
      ];

      const tx = await dsaWallet0.connect(wallet0).cast(...encodeSpells(spells), wallet1.address);
      let receipt = await tx.wait();
    });
  });
});
