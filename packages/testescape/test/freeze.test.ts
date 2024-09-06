import { getEnv } from '@l2beat/backend-tools';
import * as helpers from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { expect } from 'earl';
import { ethers, network } from 'hardhat';


const FORK_BLOCK_NUMBER = 17605965
const USDC_CONTRACT = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
const USDC_ASSET_TYPE = '0x02893294412a4c8f915f75892b395ebbf6859ec246ec365c3b1f56f47c3a0a5d'

const env = getEnv()
async function forkNetworkAtBlock(blockNumber: number) {
    const url = env.string('JSON_RPC_URL')
    await helpers.reset(url, blockNumber);
}

// This test triggers a DYDX freeze and funds escape by:
// - forking the mainnet
// - impersonating owner of position #1
// - sending forcedWithdrawalRequest
// - waiting over 14 days (by mining blocks on the fork) to trigger freeze conditions
// - sending freezeRequest()
// - sending verifyEscape()
// - sending escape()
// - sending withdraw()
// - checking that the funds were transfered to the user's account
// and performs some additional checks along the way
describe('freeze functionality', function () {
  it('should trigger freeze and escape successfully', async function () {
    const perpetualAddress = env.string('PERPETUAL_ADDRESS')
    const escapeVerifierAddress = env.string('ESCAPE_VERIFIER_ADDRESS')
    const blockNumber = FORK_BLOCK_NUMBER

    // Fork the mainnet at the block to which explorer is synced
    await forkNetworkAtBlock(blockNumber)

    // Prepare the perpetual contract
    const provider = new ethers.providers.Web3Provider(network.provider as any)
    const abi = [
      'function isFrozen() public view returns (bool)',
      'function forcedWithdrawalRequest(uint256,uint256,uint256,bool) external',
      'function freezeRequest(uint256,uint256,uint256) external',
      'function escape(uint256,uint256,uint256) external',
      'function withdraw(uint256,uint256) external',
      'function FREEZE_GRACE_PERIOD() view returns (uint256)',
      'event LogWithdrawalAllowed(uint256 ownerKey, uint256 assetType, uint256 nonQuantizedAmount, uint256 quantizedAmount)'
    ]
    const perpetualContract = new ethers.Contract(perpetualAddress, abi, provider)

    // The exchange should not be frozen
    expect(await perpetualContract.isFrozen()).toEqual(false)

    // Forced withdrawal data (for user at Position #1)
    const starkKey = '0x027cda895fbaa174bf10c8e0f57561fa9aa6a93cfec32b87f1bdfe55a161e358'
    const ethereumAddress = '0x271bdA3c58B9C1e6016d1256Dad1C8C3Ca0590eF'
    const positionId = 1;
    const quantizedAmount = 10n * (10n ** 6n);
    const premiumCost = false

    // Impersonate the user
    await helpers.impersonateAccount(ethereumAddress)

    // Give them some eth for gas
    await helpers.setBalance(ethereumAddress, 5n * (10n ** 18n))

    // Send forcedWithdrawalRequiest
    const signer = provider.getSigner(ethereumAddress); // Use the correct signer here
    const perpetualContractWithSigner = perpetualContract.connect(signer);
    await perpetualContractWithSigner.forcedWithdrawalRequest(starkKey, positionId, quantizedAmount, premiumCost);

    // Send freeze request (it should fail, it's too soon)
    await expect(perpetualContractWithSigner.freezeRequest(starkKey, positionId, quantizedAmount)).toBeRejected()

    // Make sure the freeze grace period is 14 days
    const freezeGracePeriod = (await perpetualContract.FREEZE_GRACE_PERIOD()).toNumber()
    expect(freezeGracePeriod).toEqual(14 * 24 * 60 * 60)

    // Mine 15 blocks with 1 day interval (14 days is the limit to freeze)
    // (the first block is mined with standard interval, so we mine +1)
    await helpers.mine(15, { interval: 24 * 60 * 60 })

    // Send freeze request (it should work now)
    await perpetualContractWithSigner.freezeRequest(starkKey, positionId, quantizedAmount)
    
    // The exchange should be frozen now!
    expect(await perpetualContract.isFrozen()).toEqual(true)

    // Send a verifyEscape request for position #1
    const escapeVerifierAbi = [
      'function identify() external pure returns (string)',
      'function verifyEscape(uint256[],uint256,uint256[]) external',
      'event LogEscapeVerified(uint256 publicKey, int256 withdrawalAmount, bytes32 sharedStateHash, uint256 positionId)'
    ]
    const escapeVerifierWithSigner = new ethers.Contract(escapeVerifierAddress, escapeVerifierAbi, signer)
    await escapeVerifierWithSigner.verifyEscape(merkleProofForPos1, 0, newStateFromCairoOutput)
    const verifyEscapeBlockNumber = await provider.getBlockNumber()

    // Verify the LogEscapeVerified event was emited:
    const verifyEscapeLogs = await provider.getLogs({
      fromBlock: verifyEscapeBlockNumber,
      toBlock: verifyEscapeBlockNumber,
      address: escapeVerifierAddress,
      topics: [
        ethers.utils.id('LogEscapeVerified(uint256,int256,bytes32,uint256)')
      ]
    })
    expect(verifyEscapeLogs.length).toEqual(1)
    const verifyEscapeLog = verifyEscapeLogs[0]
    const parsedVerifyEscapeLog = escapeVerifierWithSigner.interface.parseLog(verifyEscapeLog!) 
    expect(parsedVerifyEscapeLog.args.publicKey.toHexString()).toEqual(starkKey)
    expect(parsedVerifyEscapeLog.args.positionId.toNumber()).toEqual(positionId)

    const escapeWithdrawalAmount: bigint = parsedVerifyEscapeLog.args.withdrawalAmount.toBigInt()
    expect(escapeWithdrawalAmount).toEqual(21899778005454n) // this is the amount at block number 17605965

    // Just make sure that sending wrong merkle proof fails
    const wrongMerkleProof = [...merkleProofForPos1] // make a copy
    wrongMerkleProof[20] = '0x1234' // change a random element
    await expect(escapeVerifierWithSigner.verifyEscape(wrongMerkleProof, 0, newStateFromCairoOutput)).toBeRejected()

    // Now that verifyEscape() is done, we can call escape()

    // Make sure escape with wrong params (amount) fails
    await expect(perpetualContractWithSigner.escape(starkKey, positionId, escapeWithdrawalAmount-1n)).toBeRejected()

    // Perform the correct escape
    await perpetualContractWithSigner.escape(starkKey, positionId, escapeWithdrawalAmount)
    const escapeBlockNumber = await provider.getBlockNumber()

    // Calling escape above should have emitted this event
    const escapeLogs = await provider.getLogs({
      fromBlock: escapeBlockNumber,
      toBlock: escapeBlockNumber,
      address: perpetualAddress,
      topics: [
        ethers.utils.id('LogWithdrawalAllowed(uint256,uint256,uint256,uint256)')
      ]
    })
    expect(escapeLogs.length).toEqual(1)
    const escapeLog = escapeLogs[0]
    const parsedEscapeLog = perpetualContractWithSigner.interface.parseLog(escapeLog!) 
    expect(parsedEscapeLog.args.ownerKey.toHexString()).toEqual(starkKey)
    expect(parsedEscapeLog.args.quantizedAmount.toBigInt()).toEqual(escapeWithdrawalAmount)
    expect(parsedEscapeLog.args.assetType.toHexString()).toEqual(USDC_ASSET_TYPE)

    // Make sure the same escape can't be repeated
    await expect(perpetualContractWithSigner.escape(starkKey, positionId, escapeWithdrawalAmount)).toBeRejected()

    // Get USDC balance of ethereumAddress
    const usdcContract = new ethers.Contract(USDC_CONTRACT, [
      'function balanceOf(address) external view returns (uint256)'
    ], provider)
    const usdcBalanceBefore = (await usdcContract.balanceOf(ethereumAddress)).toBigInt()
    expect(usdcBalanceBefore).toEqual(0n)

    // Withdraw the funds to the user's account
    await perpetualContractWithSigner.withdraw(starkKey, USDC_ASSET_TYPE)

    // Make sure the funds were transfered
    const usdcBalanceAfter = (await usdcContract.balanceOf(ethereumAddress)).toBigInt()
    expect(usdcBalanceAfter).toEqual(escapeWithdrawalAmount)

    // Try to withdraw again, it should not transfer any funds
    await perpetualContractWithSigner.withdraw(starkKey, USDC_ASSET_TYPE)
    
    // Make sure balance hasn't changed
    const usdcBalanceAfterAgain = (await usdcContract.balanceOf(ethereumAddress)).toBigInt()
    expect(usdcBalanceAfterAgain).toEqual(escapeWithdrawalAmount)
  });
});

// This merkle proof is at block number 17605965
const merkleProofForPos1 = [
'0x0000000000000000000000000000000000000000000000000000000000000002',
'0x7cda895fbaa174bf10c8e0f57561fa9aa6a93cfec32b87f1bdfe55a161e35800',
'0x099d3860a0aa26fcbe8930cd78afa413e3a7a73001a5e313367e58481e554610',
'0x000000000000000000000000000000000000000000800013eaf07d19ce000000',
'0x019aee630ba94a5fba20498a0b1fc8b85cc2dd3334473381c64c9efc41f5f8c0',
'0xf0cc62968310647bada73b1f316282c9e1176ae0bd8b0429cf12e0f427179800',
'0x594852af3ffb24f28b088d3c88a6c12e520b2a9466cfe01bf50bd7cd5a434d61',
'0x69917b1a73c1f2302269b201503514751fdbf1aa9164ee8048ea10ed14bb6700',
'0x55507fb8f3c1d2d317fc0ee2ddfa26beba416d9a9849f0e389ff0b42af6b0e74',
'0x8fb7a1779c645d4e93b847c2602beef0ac76ef3873d9dc12be38e677bbaa7b00',
'0x41fc355324a8d24d8bcf9c754e645083cd52e211bc9e8f432dbb6f629818da54',
'0x8c477cdb37576ddff3c3fe5c1c7559778d6cbade51e5a6c1fe71e6bdb1d4db00',
'0x62c5a9d3c74e18a4be2700d567511a7cc61eed06c2b063341a0b7bcf4ac6ac05',
'0xd7423888986d24cac7716f2ab25e61894c9fea8ae0585cf25d81378c00419300',
'0x542928aed73befb6c7a49f1d0478c8e6878e690fa51036af739f6fda9f8ca803',
'0x9130892dd2d8c3e6b146c9cc291ab8122a575619e1671cfb957f5610c8d57a00',
'0x2581fa86fb4ea452c89d079365c1e52c3b2fe2f99427c66c7fba37c867974e11',
'0xc083ef10c3e688135691e9bfd00c18a897caac940f81c958cc55ca4d35ea2400',
'0x325a57bd4abc848cbceef7c070fdbc13ba7109103d72013aa529a38ab57ceec7',
'0x5fdd987f6fe839d4697d1c0874f2fcfe5a6771631c6eb503e8186fd8244da200',
'0x47b37957286f91b008f497cdc94083d0b7ab9644317a1e5a473fb9f6484943b5',
'0xcf26f3a11862646344b852ff381d3f9b0e4777ce11ae630fd739d439cac6d500',
'0x4be28772f9f16f44261c014c86884e6f893a251769d3e77360e43fac71902d97',
'0x1ba3d197a2cb855326c102bb2b0f00eccb3f1787293a05bb12e1cdeac3704800',
'0x21acf183589c23d6a2563e9dff7156b0d2bd281f90a5997f803f9ffc1fbfbe37',
'0xedce430085618dac0b6b16a4cc1fcdb4be34a7a881da1c8e871cfd0fd02e3300',
'0x078e75615af6e9e0e5bc8962e4571e891d2967b2771e213374a50d7490cf6a00',
'0x9a68c73662611be14e8026d465be53c91a04782e56bb2dcbf01915b4435e9f00',
'0x13a24d882abe6bbe82b6f860c1e453233285910bc7124a0fa8cc7a45865dac81',
'0x9e90a68b7399e113c80bb3b0b16e13651ba58fdc49bcadf27bc1e4ca490d8100',
'0x368d5dcf2022555e745730b1193f745c6ae6f4e8b237d45079ed08b8c98e5043',
'0xa341055b9ce7ae8b134f1f0d3f58363e8cf0a7f0c5cbde60ab9f9e36af161500',
'0x57d44d562a22b5270e24082ff2ffab4d7599cb7cad2617f58eca360c87c3a516',
'0xc1ec995ad254ba149d9362380274526d6c15e7b7dbc5e0e4db807d9794908500',
'0x39db334337575975a904f83d387987bd8e091e7b5f891887810b9074fb1877a0',
'0x7b86eee5b179ba4fb7c01c26878f1fe41334a83f1e5dc230e05c0a7019829b00',
'0x46e9977f8aa6cdd037c4401700501485851689466ca2be58e0f0800f31b49810',
'0x868374495a58c13e37a8bd319779841d9daffbc9182baefc9969de04f88a7e00',
'0x3bae474d6fd4a9b58487a7f9d9f56e0d725386370c9e9f135d31acb3e133f6a3',
'0xb981449523b43eeaabd12c2dee457f4db5b6b2632b3fd13d4790aba685fbde00',
'0x6a2ae535a0467ac5a13a844985f551168456dd09de99db685803cf634a3cdb60',
'0xb2edc2f62d825b1be42c10377fa305d2ad52383e858abc77f3b90ba587316600',
'0x5e9d929e51aaa3604042dd11b96c224ed003d44b767400278dcde2a28bc5c370',
'0xbcb40c9492e348722633e8cb8b057160d78da9eb6a037ebfbd4a6d97cf223100',
'0x77656272a21eedcbb6c072c7f3e1fe0d11e6b1da5f72ab19bc0ab93500e66d45',
'0x9f001d36467e3bd65ca0598408724032084411f9f9c7fafc6da330496c7a4300',
'0x37fa2a76249e50e9b783bb643ae2dfbaf0a7eb9d9f85b8e35171ebf9e780aa97',
'0xc780ec2fd022c6ce1f26e97ff299b18236f30056b24af209156c18dba8a3df00',
'0x52bee4a11bfde321ec43810e98267837ac0b4261e47be06f67cdebf55b2bc0c2',
'0xca0cb4a42c40e372fb1144190530d78831016ae35c239502c2c33309e52d0d00',
'0x341842e160f8100c77b0d1b3216c744208659d6e25efd4a6970ba359b12090c0',
'0x42d0b609ee0fe1a5133235d4b5f989ff2952146ddec42e661e8bead21171e200',
'0x28e0d48beee44e88e86840be656364426074883f79efde9439b4f470117b8fb4',
'0x5fb81fef695ddc5c216479413a687b8a80f3d5d6a5622a7bbbc7eb00a37bff00',
'0x10ac2979a8e8d771c1fb9240cfec8ffda923e9c51f3b95ad1a9a7dbdce6ba672',
'0xf700a4443a872512bc7e57b043f161a18ced0d8c75bdff597d59c9c544daa500',
'0x3ec7d32738ef7303cb2453fcb38bb9978f2dc2fd4b4bc50e334c51782f99ed04',
'0x335f4817c9f2773a8b75744b363f1c447041e4605e8b0f35d96786b810b56e00',
'0x3cb67fdcfd147ca742f296c96c07ec696827cd9a455686088c983d5f5dcc3b10',
'0xadfba3230843967d7d45ea740b7b6314188d23c0147e82284a63c30b8338ca00',
'0x305aedd6cb7693af951a0a53fb1ddd1947a8975d201ea0372016d4abb72e90a3',
'0xde5db505ce0f7c8848c871c653ee6733f90ef7b9abaf660ce122ddc98523de00',
'0x59143b2e09d7556b873ad5f44e55d5614128eec7ab26421c8614f3275e2489c0',
'0xf8eff4f8b0a83a8771555a935b7efdfb09194b3413616ebfb27f6266b513c200',
'0x536feba0c7488b2f8484cc2f67ddc89f6973334d2fc1d75a525f90e290a2d194',
'0x4ff896f6bb7229bb1b899b3300fb73d54306d0949a8ce628514177d5ca564c00',
'0x38d9753c5d5c464dd5e3d1e851e08ee252576d17eddb44371b24a4b527a5f361',
'0x52b0b58fcb21b18c9909c66c48af24a3f740cbf24803545ed66dabfb9ac6c000',
'0x78ac4be878b609ce89b0eb9bcca1fa7ecf136f47d1706a21e91b104dc3207f16',
'0xbf95f5a2de48f1b82a7872dc8a44174c94ffd8f69cc173178735dfd528674600',
'0x2d62eac871d946f0c25625f3d9ff3160c865ed84aae2a911627028372e00c4d5',
'0x6f764d8e223c266dda48db2b8985534f62175bb89aaec02c76435d431afb4800',
'0x312bd740dc0f3a6728e89c474b0d120cd64e161f6978115e67f8947c4b830357',
'0x8689664a9ae1aa408a4616f99dbb07dc0a7364db91d55c9cdbfccf800038b200',
'0x4d50c6dcbe5c43afa9ae6123f636b71465fe6fe5e19e442051660e9ebaa62242',
'0x4d1f42b8edf12345408a970a2eba95443029c766060cced8e5cc6b31c93d4900',
'0x49fb88733c8ee5ba2b8f640e483541388ef735bc53d32da0ef7b6bd056ca93d3',
'0xa58346cdf7225ac07c9555279ce55d3c63d3916992053cb92e7e6b7b24783800',
'0x21365273dcd14a4a1850b4b65d1b0b0bda4c95b3447c427d728483d26a8fb435',
'0x3788d018cf3ac31c72851ff9da99afcbbeb7161a705753735183b0368ab5ef00',
'0x62774087feba4ed7b0ac5cc755b8f01765fabb1c111e18d992d60a6af8ba09f4',
'0xf357121d0a961148d4fd44a9c1db22aa437db924e9bbbf9df554a85e0dace300',
'0x1db3124df19787c8dbc15898a7b75251464c27eb4b796d531ac953ec76a09087',
'0xc36b42ca49d5e03ff741657d8440f48abcce6b1e396e10d09ce765b2c9a8e000',
'0x7a747075fc2b9e0a0883145d833a394b9e11f9119f0cd919e7e2364dfd22eac0',
'0xb47f2b9e54c1928e7f1c5e0c7fb183f2e99e99e9b78bba75f1e22e37b7ff8600',
'0x317183b6a4140a832d3c6d44689c908df78d125b893ea40dc6d8e8e80e5cd221',
'0xa1591888c94f9ee82b9488a1c1a757cf0ed8da70fd27b7f2eab0c5666e465b00',
'0x52ec7f57cec76d14865952a79713c59db7373bcefac72b97f9db0081f10a5d45',
'0xaecc5aa2a96dc2c3c2eb37dc24651428769b5a6db556793cca754aa159774c00',
'0x15a52eb3a06a8e7d4c731f6ce90b8577441fe99df2d3837282df19e7ffc4f503',
'0xa51dab51466aa21b40dbb50d57e28dffd92a2cdc5f2c40acb973223dfc497b00',
'0x404ccb6a659f32845d75434059d387193ea2ed180a68474d97e3d8d12f753d65',
'0x2cdc9263ead70b8a83c93e518b4410580988fd29533a7af63d6f329213f51500',
'0x4fe5051d1bddf2bc59e588676d0532964baab4531560b380c1ecae4b9c1307a4',
'0x0aefdc1ac5262d5655846dbf0fe7e21fb5120e70dc7edd3e89860be105eee100',
'0x5d8b4a6d62076a875cde2143b32e466111a6622358857ea6b2a4b525ddd96e12',
'0xa9636d13a745c5e3483589849c9df5e867273ba1bcfccdae9649582fb09f4600',
'0x18c00d8532ccd7e20e1935236d47369de5d7355e7b2c2be0b8d11e1f42f26693',
'0x5338d42f9b5a333602e6fc1138c530bcab0d048cb20722acb92f191b010bf600',
'0x350f9ffbbeced71a9269b3b5f440890c5f33c042a6eadd16ea1c926be0fd5064',
'0x00d58181ae9043e1051fe8badb0e17e57f117b9166d6a1b2973afa1fbff22f00',
'0x387e5f60124d65376c9b4d9320428f07ec93b075f63fdf883df25d0a5892f5f5',
'0x22db340bc7d19df85a4ab0b199941a4d8a3ba9417da0c6554159621603c50d00',
'0x09702de4ab62d5751e876e7528d433d7e70261f006926d67e5b46b77ac43a234',
'0xf40c2c4bb5ba2ca59d544e5df859b5f14805f1ad9c2409f9764ec5231fb31e00',
'0x778e8405f2299fe144aa6a866b3c0629803a06421362b9d1996e9fa9b59c7134',
'0x6378e74aa853275c03cb0fd281540b64a92051f2ca4f3df192f822c083c48500',
'0x5dbd774acdfe3537b4f7c83825a9b22ed583f44c64e1ccaec1f532778d8092f6',
'0x6269c1d02b93f03e6580565d4ca6541f5e8a23f2563bfe3c29841dc457f7e400',
'0x4fff50bc257554aa9e3e878d3bea8aeb3bf6453c5e093da1fd4fd9c96db43ed7',
'0x7621868a93a0f7887e14a109c1f03db7c6d2a7c2d1f6d985e2d8dcf1fee26000',
'0x3f8b9dbb5180a87ca045114cf612c0c0b71d3626224fbc7e4cee3cab72ade1f6',
'0x7028af1bd72fff2d4b01efb6993e566ab66d8e332c5c73bda3824c60aeeb9300',
'0x27e147fd9c6520e94b960fe834c8ca5342284f7462b4738d18ff89b17a3de8e0',
'0x6d1181de8c0d1d920996a3eb957b2b6cbc13d7a9da09c5187fa4deb118430100',
'0x2c7f420d94fad4321641125c0c5428bdf575890767022ab0457c3ff855b80667',
'0xffea50b76379637012097a78f4441d3a62e2c149d62c85860ce1f401ff03cc00',
'0x5c2f2ba8e33736b2b8e2fd71bdef09644c964d995bbdf6c4d47591f6ba4c4f26',
'0x7e07c8c5ebdbc04e2b0f9115c7dec561edb928ada7c4ebce0a16fc0df23d6800',
'0x2bf41142d847773b93e0d7ba9202a040913c32f8126c5d1b729131cc6997a222',
'0xf55418ff5ae4c4458b111819a7e1435f76bb6e09dd3dd69baf54e2f370223b00',
'0x21b197baddd9ae7b9488deb1e4b92b3b76efa1ac8fbc5cfb294fd556acbc2516',
'0x5b76709b420771b24597f11822ef0e3352c16d9a8361222b56345910bd48b300',
'0x7238df12c309178f3bbb77294e419bea351ec6094f884a59ca971fbc94e900e2',
'0x67d78f9563f074b824a0424363a5c19e2f59464bdcf7a8066cab5160f46a1000',
'0x3b63c5832e0cb7b8b1faba4d031932e3f98430c8a2bf1d4c5473149e52f2fcf3',
'0x2384c168fb8760359d6db857b0d870afdff46cb1021c4c04ee4112923ba45900',
'0x1db2176c0930a240a821b8ceddb0ed82f77f3f4a371ab48cf6c4d2f72becf1a3',
'0xf05bbe6793fb476080766445a3b7c4a62a8e705160041c05fc5ac473bc396100',
'0x1f9af81de91bb0dc6b766beae99bfcc886c4b63597859fb149f9af5fbca6f400',
'0xc5381e45d6196ad642eabd0e5371c2b59b80e5bf61c05072555d0cb1c397d400',
'0x5b1174b751e1620c2e882c376640bc171a9315871997a391b3fe362284503cc0',
'0x0000000000000000000000000000000000000000000000000000000000000400',
]


const newStateFromCairoOutput = [
'0x05b1174b751e1620c2e882c376640bc171a9315871997a391b3fe362284503cc',
'0x0000000000000000000000000000000000000000000000000000000000000040',
'0x03f4f8eb8b86f9574078540dbf1e01c3b1c2a6f8ef019551c7b043797fc1f68d',
'0x0000000000000000000000000000000000000000000000000000000000000040',
'0x0000000000000000000000000000000000000000000000000000000000000026',
'0x000000000000000000000000000000000031494e43482d370000000000000000',
'0x0000000000000000000000000000000000000000000000007ffffffffb5ffb51',
'0x0000000000000000000000000000000000414156452d38000000000000000000',
'0x00000000000000000000000000000000000000000000000080000000a45e3890',
'0x00000000000000000000000000000000004144412d3600000000000000000000',
'0x000000000000000000000000000000000000000000000000800000000a0b4481',
'0x0000000000000000000000000000000000414c474f2d36000000000000000000',
'0x000000000000000000000000000000000000000000000000800000001a10b7ee',
'0x000000000000000000000000000000000041544f4d2d37000000000000000000',
'0x000000000000000000000000000000000000000000000000800000001ee859cf',
'0x0000000000000000000000000000000000415641582d37000000000000000000',
'0x000000000000000000000000000000000000000000000000800000004b1dcb6d',
'0x00000000000000000000000000000000004243482d3800000000000000000000',
'0x000000000000000000000000000000000000000000000000800000001212e614',
'0x00000000000000000000000000000000004254432d3130000000000000000000',
'0x0000000000000000000000000000000000000000000000008000000141fb2d21',
'0x000000000000000000000000000000000043454c4f2d36000000000000000000',
'0x00000000000000000000000000000000000000000000000080000000057084c5',
'0x0000000000000000000000000000000000434f4d502d38000000000000000000',
'0x0000000000000000000000000000000000000000000000008000000058d3e11e',
'0x00000000000000000000000000000000004352562d3600000000000000000000',
'0x0000000000000000000000000000000000000000000000007fffffffcfa99d52',
'0x0000000000000000000000000000000000444f47452d35000000000000000000',
'0x0000000000000000000000000000000000000000000000008000000017d8afa3',
'0x0000000000000000000000000000000000444f542d3700000000000000000000',
'0x0000000000000000000000000000000000000000000000008000000013a6a9d3',
'0x0000000000000000000000000000000000454e4a2d3600000000000000000000',
'0x000000000000000000000000000000000000000000000000800000000cf52b15',
'0x0000000000000000000000000000000000454f532d3600000000000000000000',
'0x0000000000000000000000000000000000000000000000008000000064e38052',
'0x00000000000000000000000000000000004554432d3700000000000000000000',
'0x0000000000000000000000000000000000000000000000007fffffffbb73725d',
'0x00000000000000000000000000000000004554482d3900000000000000000000',
'0x00000000000000000000000000000000000000000000000080000000cdf83842',
'0x000000000000000000000000000000000046494c2d3700000000000000000000',
'0x00000000000000000000000000000000000000000000000080000000537940e4',
'0x00000000000000000000000000000000004943502d3700000000000000000000',
'0x0000000000000000000000000000000000000000000000008000000008384f22',
'0x00000000000000000000000000000000004c494e4b2d37000000000000000000',
'0x00000000000000000000000000000000000000000000000080000000b88726f7',
'0x00000000000000000000000000000000004c54432d3800000000000000000000',
'0x0000000000000000000000000000000000000000000000008000000024a8f145',
'0x00000000000000000000000000000000004c554e412d36000000000000000000',
'0x0000000000000000000000000000000000000000000000007ffffffeff6d291c',
'0x00000000000000000000000000000000004d415449432d360000000000000000',
'0x000000000000000000000000000000000000000000000000800000002d57f6aa',
'0x00000000000000000000000000000000004d4b522d3900000000000000000000',
'0x000000000000000000000000000000000000000000000000800000008da74284',
'0x00000000000000000000000000000000004e4541522d36000000000000000000',
'0x0000000000000000000000000000000000000000000000007ffffffff49a5b28',
'0x000000000000000000000000000000000052554e452d36000000000000000000',
'0x0000000000000000000000000000000000000000000000008000000015692573',
'0x0000000000000000000000000000000000534e582d3700000000000000000000',
'0x0000000000000000000000000000000000000000000000007ffffffff3a56cfc',
'0x0000000000000000000000000000000000534f4c2d3700000000000000000000',
'0x00000000000000000000000000000000000000000000000080000000c68169b4',
'0x000000000000000000000000000000000053555348492d370000000000000000',
'0x000000000000000000000000000000000000000000000000800000002b3caad3',
'0x00000000000000000000000000000000005452582d3400000000000000000000',
'0x0000000000000000000000000000000000000000000000007fffffff0a67472a',
'0x0000000000000000000000000000000000554d412d3700000000000000000000',
'0x0000000000000000000000000000000000000000000000007fffffffde039fae',
'0x0000000000000000000000000000000000554e492d3700000000000000000000',
'0x0000000000000000000000000000000000000000000000008000000066bd893a',
'0x0000000000000000000000000000000000584c4d2d3500000000000000000000',
'0x0000000000000000000000000000000000000000000000008000000012eb0b78',
'0x0000000000000000000000000000000000584d522d3800000000000000000000',
'0x0000000000000000000000000000000000000000000000007ffffffff89613e8',
'0x000000000000000000000000000000000058545a2d3600000000000000000000',
'0x0000000000000000000000000000000000000000000000007ffffffffac9dce5',
'0x00000000000000000000000000000000005946492d3130000000000000000000',
'0x000000000000000000000000000000000000000000000000800000006fcb3538',
'0x00000000000000000000000000000000005a45432d3800000000000000000000',
'0x0000000000000000000000000000000000000000000000008000000019cb5513',
'0x00000000000000000000000000000000005a52582d3600000000000000000000',
'0x0000000000000000000000000000000000000000000000007ffffffff8fd06ac',
'0x0000000000000000000000000000000000000000000000000000000064a11260',
'0x0000000000000000000000000000000000000000000000000000000000000026',
'0x000000000000000000000000000000000031494e43482d370000000000000000',
'0x00000000000000000000000000000000000000000000000000000000083c0f88',
'0x0000000000000000000000000000000000414156452d38000000000000000000',
'0x00000000000000000000000000000000000000000000000000000000ae219653',
'0x00000000000000000000000000000000004144412d3600000000000000000000',
'0x000000000000000000000000000000000000000000000000000000004a2b7e33',
'0x0000000000000000000000000000000000414c474f2d36000000000000000000',
'0x000000000000000000000000000000000000000000000000000000001fadeaf5',
'0x000000000000000000000000000000000041544f4d2d37000000000000000000',
'0x00000000000000000000000000000000000000000000000000000000f1cdf393',
'0x0000000000000000000000000000000000415641582d37000000000000000000',
'0x000000000000000000000000000000000000000000000000000000014934c483',
'0x00000000000000000000000000000000004243482d3800000000000000000000',
'0x00000000000000000000000000000000000000000000000000000002c519c72e',
'0x00000000000000000000000000000000004254432d3130000000000000000000',
'0x000000000000000000000000000000000000000000000000000000030c87e53c',
'0x000000000000000000000000000000000043454c4f2d36000000000000000000',
'0x000000000000000000000000000000000000000000000000000000007b6a99cd',
'0x0000000000000000000000000000000000434f4d502d38000000000000000000',
'0x000000000000000000000000000000000000000000000000000000008868143d',
'0x00000000000000000000000000000000004352562d3600000000000000000000',
'0x00000000000000000000000000000000000000000000000000000000c28cac4b',
'0x0000000000000000000000000000000000444f47452d35000000000000000000',
'0x00000000000000000000000000000000000000000000000000000000abd1d9bf',
'0x0000000000000000000000000000000000444f542d3700000000000000000000',
'0x000000000000000000000000000000000000000000000000000000008710cb29',
'0x0000000000000000000000000000000000454e4a2d3600000000000000000000',
'0x000000000000000000000000000000000000000000000000000000004ea5ee11',
'0x0000000000000000000000000000000000454f532d3600000000000000000000',
'0x00000000000000000000000000000000000000000000000000000000c0e418ef',
'0x00000000000000000000000000000000004554432d3700000000000000000000',
'0x0000000000000000000000000000000000000000000000000000000204914356',
'0x00000000000000000000000000000000004554482d3900000000000000000000',
'0x00000000000000000000000000000000000000000000000000000001ea1f4b1f',
'0x000000000000000000000000000000000046494c2d3700000000000000000000',
'0x0000000000000000000000000000000000000000000000000000000067ad04b0',
'0x00000000000000000000000000000000004943502d3700000000000000000000',
'0x000000000000000000000000000000000000000000000000000000006a6a0126',
'0x00000000000000000000000000000000004c494e4b2d37000000000000000000',
'0x00000000000000000000000000000000000000000000000000000000a56f6f0c',
'0x00000000000000000000000000000000004c54432d3800000000000000000000',
'0x000000000000000000000000000000000000000000000000000000011915bcbf',
'0x00000000000000000000000000000000004c554e412d36000000000000000000',
'0x0000000000000000000000000000000000000000000000000000000000068db9',
'0x00000000000000000000000000000000004d415449432d360000000000000000',
'0x00000000000000000000000000000000000000000000000000000000ab1c3dcc',
'0x00000000000000000000000000000000004d4b522d3900000000000000000000',
'0x00000000000000000000000000000000000000000000000000000000cde38266',
'0x00000000000000000000000000000000004e4541522d36000000000000000000',
'0x0000000000000000000000000000000000000000000000000000000176e3650b',
'0x000000000000000000000000000000000052554e452d36000000000000000000',
'0x000000000000000000000000000000000000000000000000000000010f1a9fbe',
'0x0000000000000000000000000000000000534e582d3700000000000000000000',
'0x000000000000000000000000000000000000000000000000000000003aa9ef02',
'0x0000000000000000000000000000000000534f4c2d3700000000000000000000',
'0x00000000000000000000000000000000000000000000000000000001e52fe3f3',
'0x000000000000000000000000000000000053555348492d370000000000000000',
'0x00000000000000000000000000000000000000000000000000000000112c27a6',
'0x00000000000000000000000000000000005452582d3400000000000000000000',
'0x00000000000000000000000000000000000000000000000000000007903f9aa0',
'0x0000000000000000000000000000000000554d412d3700000000000000000000',
'0x0000000000000000000000000000000000000000000000000000000029096bba',
'0x0000000000000000000000000000000000554e492d3700000000000000000000',
'0x000000000000000000000000000000000000000000000000000000008cb1814a',
'0x0000000000000000000000000000000000584c4d2d3500000000000000000000',
'0x000000000000000000000000000000000000000000000000000000010dd249e4',
'0x0000000000000000000000000000000000584d522d3800000000000000000000',
'0x00000000000000000000000000000000000000000000000000000001a29fb78f',
'0x000000000000000000000000000000000058545a2d3600000000000000000000',
'0x00000000000000000000000000000000000000000000000000000000d128555b',
'0x00000000000000000000000000000000005946492d3130000000000000000000',
'0x00000000000000000000000000000000000000000000000000000000a7ac5ceb',
'0x00000000000000000000000000000000005a45432d3800000000000000000000',
'0x0000000000000000000000000000000000000000000000000000000054d56572',
'0x00000000000000000000000000000000005a52582d3600000000000000000000',
'0x0000000000000000000000000000000000000000000000000000000036f966c5',
'0x0000000000000000000000000000000000000000000000000000000064a11260',
]