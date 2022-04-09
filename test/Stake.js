const { expect } = require("chai");

describe("Staking contracts", function () {
  let addr1;
  let addr2;

  let MyToken;

  let Staking;

  beforeEach(async function () {
    [addr1, addr2] = await ethers.getSigners();

    MyToken = await ethers.getContractFactory("MyToken");
    Staking = await ethers.getContractFactory("Staking");

    MyToken = await MyToken.deploy("My Token", "TKN");
    Staking = await Staking.deploy(MyToken.address);
  });

  describe("Deployment", function () {
    it("Addr1 should have full supply", async function () {
      let addr1Balance = await MyToken.balanceOf(addr1.address);
      expect(await MyToken.totalSupply()).to.equal(addr1Balance);
    });

    it("S & Total should equal 0", async function () {
      expect(await Staking.totalAssets()).to.equal(0);
      expect(await Staking.s_num()).to.equal(0);
      expect(await Staking.s_den()).to.equal(1);
    });
  });

  describe("Misc", function () {
    it("GCF should return the correct answer", async function () {
      expect(await Staking.gcf(7216, 5430)).to.equal(2);
      expect(await Staking.gcf(280602, 1806)).to.equal(42);
      expect(await Staking.gcf(5, 10)).to.equal(5);
    });
  });

  describe("Single user staking", function () {
    it("Should stake 50 tokens", async function () {
      // Stakes 50 tokens from addr1
      await MyToken.approve(Staking.address, 50);
      await Staking.stake(50, addr1.address);

      expect(await Staking.staked(addr1.address)).to.equal(50);
      expect(await Staking.totalAssets()).to.equal(50);
      expect(await Staking.maxUnstake(addr1.address)).to.equal(50);
    });

    it("Should distribute 50 tokens as reward", async function () {
      // Stakes 50 tokens from addr1
      await MyToken.approve(Staking.address, 50);
      await Staking.stake(50, addr1.address);

      expect(await Staking.staked(addr1.address)).to.equal(50);
      expect(await Staking.totalAssets()).to.equal(50);
      expect(await Staking.maxUnstake(addr1.address)).to.equal(50);

      // Distributes 50 tokens from addr1
      await MyToken.approve(Staking.address, 50);
      await Staking.distribute(50, addr1.address);

      expect(await Staking.staked(addr1.address)).to.equal(50);
      expect(await Staking.totalAssets()).to.equal(50);
      expect(await Staking.maxUnstake(addr1.address)).to.equal(100);

      expect(await Staking.s_0_num(addr1.address)).to.equal(0);
      expect(await Staking.s_0_den(addr1.address)).to.equal(1);
      expect(await Staking.s_num()).to.equal(1);
      expect(await Staking.s_den()).to.equal(1);
    });

    it("Should withdraw 50 token stake + 50 token reward", async function () {
      // Stakes 50 tokens from addr1
      await MyToken.approve(Staking.address, 50);
      await Staking.stake(50, addr1.address);

      expect(await Staking.staked(addr1.address)).to.equal(50);
      expect(await Staking.totalAssets()).to.equal(50);
      expect(await Staking.maxUnstake(addr1.address)).to.equal(50);

      // Distributes 50 tokens from addr1
      await MyToken.approve(Staking.address, 50);
      await Staking.distribute(50, addr1.address);

      expect(await Staking.staked(addr1.address)).to.equal(50);
      expect(await Staking.totalAssets()).to.equal(50);
      expect(await Staking.maxUnstake(addr1.address)).to.equal(100);

      // Unstakes 50 tokens from addr1
      await Staking.unstake(100, addr1.address, addr1.address);

      expect(await Staking.staked(addr1.address)).to.equal(0);
      expect(await Staking.totalAssets()).to.equal(0);
      expect(await Staking.maxUnstake(addr1.address)).to.equal(0);

      let addr1Balance = await MyToken.balanceOf(addr1.address);
      expect(await MyToken.totalSupply()).to.equal(addr1Balance);
    });

    it("Should recalculate stake when staking more", async function () {
      // Stakes 50 tokens from addr1
      await MyToken.approve(Staking.address, 50);
      await Staking.stake(50, addr1.address);

      expect(await Staking.staked(addr1.address)).to.equal(50);
      expect(await Staking.totalAssets()).to.equal(50);
      expect(await Staking.maxUnstake(addr1.address)).to.equal(50);

      // Distributes 50 tokens from addr1
      await MyToken.approve(Staking.address, 50);
      await Staking.distribute(50, addr1.address);

      expect(await Staking.staked(addr1.address)).to.equal(50);
      expect(await Staking.totalAssets()).to.equal(50);
      expect(await Staking.maxUnstake(addr1.address)).to.equal(100);

      // Stakes 50 tokens from addr1
      await MyToken.approve(Staking.address, 50);
      await Staking.stake(50, addr1.address);

      expect(await Staking.staked(addr1.address)).to.equal(150);
      expect(await Staking.totalAssets()).to.equal(150);
      expect(await Staking.maxUnstake(addr1.address)).to.equal(150);
    });

    it("Should correctly calculate and reduce S_t", async function () {
      // Stakes 50 tokens from addr1
      await MyToken.approve(Staking.address, 50);
      await Staking.stake(50, addr1.address);

      expect(await Staking.staked(addr1.address)).to.equal(50);
      expect(await Staking.totalAssets()).to.equal(50);
      expect(await Staking.s_0_num(addr1.address)).to.equal(0);
      expect(await Staking.s_0_den(addr1.address)).to.equal(1);
      expect(await Staking.s_num()).to.equal(0);
      expect(await Staking.s_den()).to.equal(1);

      // Distributes 50 tokens from addr1
      await MyToken.approve(Staking.address, 50);
      await Staking.distribute(50, addr1.address);

      expect(await Staking.staked(addr1.address)).to.equal(50);
      expect(await Staking.totalAssets()).to.equal(50);
      expect(await Staking.s_0_num(addr1.address)).to.equal(0);
      expect(await Staking.s_0_den(addr1.address)).to.equal(1);
      expect(await Staking.s_num()).to.equal(1);
      expect(await Staking.s_den()).to.equal(1);

      // Stakes 50 tokens from addr1
      await MyToken.approve(Staking.address, 50);
      await Staking.stake(50, addr1.address);

      expect(await Staking.staked(addr1.address)).to.equal(150);
      expect(await Staking.totalAssets()).to.equal(150);
      expect(await Staking.s_0_num(addr1.address)).to.equal(1);
      expect(await Staking.s_0_den(addr1.address)).to.equal(1);
      expect(await Staking.s_num()).to.equal(1);
      expect(await Staking.s_den()).to.equal(1);

      // Distributes 50 tokens from addr1
      await MyToken.approve(Staking.address, 50);
      await Staking.distribute(50, addr1.address);

      expect(await Staking.staked(addr1.address)).to.equal(150);
      expect(await Staking.totalAssets()).to.equal(150);
      expect(await Staking.s_0_num(addr1.address)).to.equal(1);
      expect(await Staking.s_0_den(addr1.address)).to.equal(1);
      expect(await Staking.s_num()).to.equal(4);
      expect(await Staking.s_den()).to.equal(3);
    });
  });

  describe("Multiple user staking", function () {
    it("Should handle remainder of 3 token distribution", async function () {
      // Gives addr1 100 tokens & addr2 50 token
      await MyToken.transfer(addr1.address, 50);
      await MyToken.transfer(addr2.address, 50);

      // Stakes 50 tokens from addr1
      await MyToken.approve(Staking.address, 50);
      await Staking.stake(50, addr1.address);

      // Stakes 50 tokens from addr2
      await MyToken.connect(addr2).approve(Staking.address, 50);
      await Staking.connect(addr2).stake(50, addr2.address);

      // Distributes 3 tokens to stakers
      await MyToken.approve(Staking.address, 3);
      await Staking.distribute(3, addr1.address);

      expect(await Staking.staked(addr1.address)).to.equal(50);
      expect(await Staking.staked(addr2.address)).to.equal(50);
      expect(await Staking.totalAssets()).to.equal(100);
      expect(await Staking.maxUnstake(addr1.address)).to.equal(51);
      expect(await Staking.maxUnstake(addr2.address)).to.equal(51);

      // Withdraws all tokens from contract
      await Staking.connect(addr1).unstake(51, addr1.address, addr1.address);
      await Staking.connect(addr2).unstake(51, addr1.address, addr2.address);

      expect(await MyToken.balanceOf(Staking.address)).to.equal(1);
    });

    it("Should handle multiple stakes, unstakes, and distributions", async function () {
      // Gives addr1 100 tokens & addr2 50 token
      await MyToken.transfer(addr1.address, 100);
      await MyToken.transfer(addr2.address, 50);

      // Stakes 50 tokens from addr1
      await MyToken.approve(Staking.address, 50);
      await Staking.stake(50, addr1.address);

      expect(await Staking.staked(addr1.address)).to.equal(50);
      expect(await Staking.staked(addr2.address)).to.equal(0);
      expect(await Staking.totalAssets()).to.equal(50);
      expect(await Staking.maxUnstake(addr1.address)).to.equal(50);
      expect(await Staking.maxUnstake(addr2.address)).to.equal(0);

      // Distributes 50 tokens to stakers
      await MyToken.approve(Staking.address, 50);
      await Staking.distribute(50, addr1.address);

      expect(await Staking.staked(addr1.address)).to.equal(50);
      expect(await Staking.staked(addr2.address)).to.equal(0);
      expect(await Staking.totalAssets()).to.equal(50);
      expect(await Staking.maxUnstake(addr1.address)).to.equal(100);
      expect(await Staking.maxUnstake(addr2.address)).to.equal(0);

      // Stakes 50 tokens from addr2
      await MyToken.connect(addr2).approve(Staking.address, 50);
      await Staking.connect(addr2).stake(50, addr2.address);

      expect(await Staking.staked(addr1.address)).to.equal(50);
      expect(await Staking.staked(addr2.address)).to.equal(50);
      expect(await Staking.totalAssets()).to.equal(100);
      expect(await Staking.maxUnstake(addr1.address)).to.equal(100);
      expect(await Staking.maxUnstake(addr2.address)).to.equal(50);

      // Distributes 50 tokens to stakers
      await MyToken.approve(Staking.address, 50);
      await Staking.distribute(50, addr1.address);

      expect(await Staking.staked(addr1.address)).to.equal(50);
      expect(await Staking.staked(addr2.address)).to.equal(50);
      expect(await Staking.totalAssets()).to.equal(100);
      expect(await Staking.maxUnstake(addr1.address)).to.equal(125);
      expect(await Staking.maxUnstake(addr2.address)).to.equal(75);

      // Stakes 50 tokens from addr1
      await MyToken.approve(Staking.address, 50);
      await Staking.stake(50, addr1.address);

      expect(await Staking.staked(addr1.address)).to.equal(175);
      expect(await Staking.staked(addr2.address)).to.equal(50);
      expect(await Staking.totalAssets()).to.equal(225);
      expect(await Staking.maxUnstake(addr1.address)).to.equal(175);
      expect(await Staking.maxUnstake(addr2.address)).to.equal(75);

      // Distributes 50 tokens to stakers
      await MyToken.approve(Staking.address, 50);
      await Staking.distribute(50, addr1.address);

      expect(await Staking.staked(addr1.address)).to.equal(175);
      expect(await Staking.staked(addr2.address)).to.equal(50);
      expect(await Staking.s_num()).to.equal(31);
      expect(await Staking.s_den()).to.equal(18);
      expect(await Staking.totalAssets()).to.equal(225);
      expect(await Staking.maxUnstake(addr1.address)).to.equal(214);
      expect(await Staking.maxUnstake(addr2.address)).to.equal(86);

      // Withdraws all tokens from contract
      await Staking.connect(addr1).unstake(214, addr1.address, addr1.address);
      await Staking.connect(addr2).unstake(86, addr1.address, addr2.address);

      expect(await Staking.staked(addr1.address)).to.equal(0);
      expect(await Staking.staked(addr2.address)).to.equal(0);
      expect(await Staking.totalAssets()).to.equal(0);
      expect(await Staking.maxUnstake(addr1.address)).to.equal(0);
      expect(await Staking.maxUnstake(addr2.address)).to.equal(0);

      let addr1Balance = await MyToken.balanceOf(addr1.address);
      expect(await MyToken.totalSupply()).to.equal(addr1Balance);
    });
  });

  describe("Reverts", function () {
    it("Should revert when no allowance", async function () {
      await expect(Staking.stake(50, addr1.address)).to.be.revertedWith(
        "ERC20: insufficient allowance"
      );
    });

    it("Should revert when staking 0 tokens", async function () {
      await expect(Staking.stake(0, addr1.address)).to.be.revertedWith(
        "Number of tokens must be > 0"
      );
    });

    it("Should revert when non-owner unstakes", async function () {
      await MyToken.approve(Staking.address, 50);
      await Staking.stake(50, addr1.address);

      await expect(
        Staking.connect(addr2).unstake(50, addr2.address, addr1.address)
      ).to.be.revertedWith("Only owner can withdraw");
    });

    it("Should revert when unstaking more than allowed", async function () {
      await MyToken.approve(Staking.address, 50);
      await Staking.stake(50, addr1.address);

      await MyToken.approve(Staking.address, 50);
      await Staking.distribute(50, addr1.address);

      await MyToken.transfer(addr2.address, 50);
      await MyToken.connect(addr2).approve(Staking.address, 50);
      await Staking.connect(addr2).stake(50, addr2.address);

      await expect(
        Staking.unstake(101, addr1.address, addr1.address)
      ).to.be.revertedWith("Can't withdraw more than MaxUnstake");
    });
  });
});
