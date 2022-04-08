const { expect } = require("chai");

describe("Staking contracts", function () {
  let addr1;

  let MyToken;

  let Staking;

  beforeEach(async function () {
    [addr1] = await ethers.getSigners();

    MyToken = await ethers.getContractFactory("MyToken");
    Staking = await ethers.getContractFactory("Staking");

    MyToken = await MyToken.deploy("My Token", "TKN");
    Staking = await Staking.deploy(MyToken.address);
  });

  it("Addr1 should have full supply", async function () {
    const addr1Balance = await MyToken.balanceOf(addr1.address);
    expect(await MyToken.totalSupply()).to.equal(addr1Balance);
  });

  it("S & Total should equal 0", async function () {
    expect(await Staking.Total()).to.equal(0);
    expect(await Staking.S()).to.equal(0);
  });

  it("Should stake tokens", async function () {
    await MyToken.approve(Staking.address, 50);
    await Staking.Stake(addr1.address, 50);

    expect(await Staking.Staked(addr1.address)).to.equal(50);
    expect(await Staking.Total()).to.equal(50);
    expect(await Staking.MaxUnstake(addr1.address)).to.equal(50);
  });

  it("Should distribute rewards", async function () {
    await MyToken.approve(Staking.address, 50);
    await Staking.Stake(addr1.address, 50);

    await MyToken.approve(Staking.address, 50);
    await Staking.Distribute(addr1.address, 50);

    expect(await Staking.Staked(addr1.address)).to.equal(50);
    expect(await Staking.Total()).to.equal(50);
    expect(await Staking.MaxUnstake(addr1.address)).to.equal(100);
  });

  it("Should withdraw original stake + rewards", async function () {
    await MyToken.approve(Staking.address, 50);
    await Staking.Stake(addr1.address, 50);

    await MyToken.approve(Staking.address, 50);
    await Staking.Distribute(addr1.address, 50);

    await Staking.Unstake(addr1.address, addr1.address, 100);

    expect(await Staking.Staked(addr1.address)).to.equal(0);
    expect(await Staking.Total()).to.equal(0);
    expect(await Staking.MaxUnstake(addr1.address)).to.equal(0);

    const addr1Balance = await MyToken.balanceOf(addr1.address);
    expect(await MyToken.totalSupply()).to.equal(addr1Balance);
  });
});
