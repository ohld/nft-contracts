const assert = require("assert");
const BigNumber = require("bignumber.js");

const TemplateNFTv2 = artifacts.require("TemplateNFTv2");

const MintPassExtension = artifacts.require("MintPassExtension");


const ether = new BigNumber(1e18);

contract("MintPass – Extension", (accounts) => {
    let nft, extension;
    const [owner, user1, user2] = accounts;

    beforeEach(async () => {
        nft = await TemplateNFTv2.new();
        extension = await MintPassExtension.new(
            nft.address,
            nft.address,
            1e14.toString(), // price
            1, // max per address
            100, // max per extension
            {from: owner}
        );
    });

    // it should deploy successfully
    it("should deploy successfully", async () => {
        assert.ok(nft.address);
    });

    // it should deploy extension successfully
    it("should deploy extension successfully", async () => {
        assert.ok(extension.address);
    });

    // it should connect extension
    it("should connect extension", async () => {

        await nft.addExtension(extension.address);

        assert.equal(
            await nft.isExtensionAllowed(extension.address),
            true,
        )
    });

    // should be possible to update price
    it("should be possible to update price", async() => {
        await extension.updatePrice(1e18.toString(), {from: owner});
        let price = await extension.price.call().then(callback => {
            return callback.toString();
        })  
        assert.equal(price, 1e18.toString());
    }) 

    // should be possible to update maxPerToken
    it("should be possible to update maxPerToken", async() => {
        await extension.updateMaxPerToken('10');
        let maxPerToken = await extension.maxPerToken.call().then(callback => {
            return callback.toString();
        })  
        assert.equal(maxPerToken, '10');     
    }) 
    
    // should be possible to update mintPassAddress
    it("should be possible to update mintPassAddress", async() => {
        await extension.updateMintPassAddress(user1, {from: owner});
        let mintPassAddress = await extension.mintPassAddress.call().then(callback => {
            return callback.toString();
        });

        assert.equal(mintPassAddress, user1);
    }) 

    // should be possible to update nRemainingTokens
    it("should be possible to update nRemainingTokens", async () => {
        await extension.updateRemainingTokens('200', {from: owner});

        let nRemainingTokens = await extension.nRemainingTokens.call().then(callback => {
            return callback.toString();
        });

        assert.equal(nRemainingTokens, '200');
    })

    // should be possible to increase nRemainingTokens
    it("should be possible to increase nRemainingTokens", async () => {
        await extension.increaseRemainingTokens('200', {from: owner});

        let nRemainingTokens = await extension.nRemainingTokens.call().then(callback => {
            return callback.toString();
        });

        assert.equal(nRemainingTokens, '300');
    })


    // should be possible to mint
    it("should be possible to mint", async () => {
        await nft.setBeneficiary(owner);
        
        await nft.flipSaleStarted({from: owner});
        
        await nft.mint(10, {from: user1, value: (ether.toString() + '0')});
        
        let balance = await nft.balanceOf(user1).then( balance => {
            return balance.toString();
        })
        
        // should mint 10 token
        assert.equal(balance, '10');

        // start sale
        await extension.startSale();

        await nft.addExtension(extension.address);

        await extension.mint('1', '0', {from: user1, value: ether.toString()});

        // totalSupply should be equal 11 (10 previous + 1)
        await nft.totalSupply().then(callback => {
            assert.equal(callback.toString(), '11');
        });

         // nRemainingTokens should be equal 9 (100 - 1 minted)
         await extension.nRemainingTokens.call().then(callback => {
            assert.equal(callback.toString(), '99');
        });

        try {
            await extension.mint('1', '1', {from: user2, value: ether.toString()});
        } 
        catch {}

        // should not be possible to mint without nft
        await nft.totalSupply().then(callback => {
            assert.equal(callback.toString(), '11');
        });
    })



});