const block = "4443945";
const bytecode = "0x608060405234801561001057600080fd5b50610289806100206000396000f300608060405260043610610062576000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff16806312e92de31461006757806362777662146100985780638c659ab7146100cb578063bd5b383714610122575b600080fd5b34801561007357600080fd5b50610096600480360381019080803560001916906020019092919050505061014d565b005b3480156100a457600080fd5b506100ad610212565b60405180826000191660001916815260200191505060405180910390f35b3480156100d757600080fd5b506100e061021b565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b34801561012e57600080fd5b50610137610245565b6040518082815260200191505060405180910390f35b806000816000191690555033600260006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555042600181905550600154600260009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16600054600019167f8c3f8124db3586b01b1a3687e65ac69ea4815aa8e9479454b8a8963bf1c6c2a860405160405180910390a450565b60008054905090565b6000600260009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b6000603c600154420381151561025757fe5b049050905600a165627a7a72305820c16111204ff7e56ef22bca5f1e2ef0227b8d46c6d651c3bcac6973f5a196ffff0029";
const address = "0x6d0d7e4f6f7780c593894f18e1460a450e7058d5";

let account, accounts, nodeType, contractEvents;

window.addEventListener('load', function () {
    if (typeof web3 != 'undefined') {
        window.web3 = new Web3(web3.currentProvider);
        startApp();
    } else {
        alert("Please install and log in using your chrome extension Metamask and reload this page.");
        let h2 = ".row:first-of-type h2";
        setData(h2, "NOT CONNECTED", true);
    }
});

function startApp() {
    if (web3.isConnected()) {
        init();
    } else {
        console.log("Seems that web3 is not connected");
    }
}

function init() {
    setWeb3Version();
    getAccount();

    document.querySelector("#interact").addEventListener("click", interact);

    document.querySelector("#description").addEventListener("click", function () {
        if (this.innerHTML === "SHOW DESCRIPTION") {
            this.innerHTML = "HIDE DESCRIPTION";
            document.querySelector("#assignment").classList.toggle("hide");
        } else {
            this.innerHTML = "SHOW DESCRIPTION";
            document.querySelector("#assignment").classList.toggle("hide");
        }
    });

    listEvents();
}

function setWeb3Version() {
    web3.version.getNode(function (error, result) {
        let h2 = ".row:first-of-type h2";

        if (error) {
            setData(h2, error, true);
        } else {
            if (result.toLowerCase().includes("metamask")) {
                setData(h2, "Client Wallet: " + result, false);
                nodeType = "metamask";
            } else {
                setData(h2, "undefined", true);
            }
        }
    });
}

function getAccount() {
    web3.eth.getAccounts(function (error, result) {
        let p = ".row:first-of-type p";
        if (error) {
            setData(p, error, true);
        } else {
            accounts = result;
            if (result.length === 0 && nodeType === "metamask") {
                setData(p, "PLEASE LOG IN WITH METAMASK", true);
            } else {
                account = accounts[0];

                if (!web3.eth.defaultAccount) {
                    console.log("web3.eth.defaultAccount was not set");
                    web3.eth.defaultAccount = account;
                }
                web3.eth.getBalance(account, web3.eth.defaultBlock, function (error, result) {
                    let balance = web3.fromWei(result, 'ether').toFixed(2);
                    let html = `Account: ${account}<br>Amount: ${balance} ether`;
                    setData(p, html, false);
                });
            }
        }
    });

}

/**
 * Updates the according dom elements in the index.html
 * @param {*} element String argument for the method querySelector to get the dom element for updating innerHTML
 * @param {*} html String in html format to update the innerHTML of the given dom element
 * @param {*} isError boolean true if an error was encountered updating the css style accordingly
 */
function setData(element, html, isError) {
    let selected = document.querySelector(element);

    selected.innerHTML = html;

    if (isError) {
        selected.classList = "error";
    } else {
        selected.classList = "ready";
    }
}

/**
 * Creates a contract instance to interact with which is hardcoded in this assignment
 * 
 */
function createContractInstance() {
    const abi = '[{"constant":false,"inputs":[{"name":"yourName","type":"bytes32"}],"name":"interact","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"name","type":"bytes32"},{"indexed":true,"name":"addr","type":"address"},{"indexed":true,"name":"timeUpdated","type":"uint256"}],"name":"Interaction","type":"event"},{"constant":true,"inputs":[],"name":"currentName","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name": "fromAddres","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"lastUpdatedMinutes","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}]';

    let contract = web3.eth.contract(JSON.parse(abi));
    return contract.at(address);
}

/**
 * Called to interact with the given contract when clicking the button interact
 */
function interact() {
    let instance = createContractInstance();
    let input = document.querySelector('input');
    let value = input.value;
    input.value = "";

    // console.log("Message equals ", value);
    // console.log("Transform to hexadecimal");
    value = web3.toHex(value);
    // console.log("Value in hex ", value);
    // console.log("Value back to string ", bytesToString(value));
    let estimatedGas = 2100000;

    let txnObject = {
        from: web3.eth.coinbase,
        gas: estimatedGas
    };

    console.log("entered");
    instance.interact.sendTransaction(value, txnObject, function (error, result) {
        if (error) {
            alert(error);

        } else {
            prependElement(value, result);
        }
    });

}

function prependElement(value, txHash) {
    let table = document.querySelector("tbody");
    console.log(table);
    let tr = table.insertRow(0);

    tr.insertCell(0).innerHTML = bytesToString(value);

    tr.insertCell(1).innerHTML = `<span class="waiting"></span>`;

    tr.insertCell(2).innerHTML = `<a href="https://rinkeby.etherscan.io/tx/${txHash}" target="_blank">${txHash}.</a>`;



}

function bytesToString(input) {
    var output = web3.toAscii(input);
    return output = output.replace(/\0/g, "")
}

function listEvents() {

    if (contractEvents) {
        stopWatching();
    }


    contractEvents = createContractEventInstance();

    contractEvents.get(function (error, result) {
        if (error) {
            alert("We encountered an error for listing the elements: ", error);
        } else {
            let table = document.querySelector("tbody");
            for (let i = 0; i < result.length; i++) {
                let txHash = result[i].transactionHash;
                let tr = table.insertRow(0);
                tr.insertCell(0).innerHTML = bytesToString(result[i].args.name);
                tr.insertCell(1).innerHTML = result[i].blockNumber;
                tr.insertCell(2).innerHTML = `<a href="https://rinkeby.etherscan.io/tx/${txHash}" target="_blank">${txHash}.</a>`;
            }
        }
    });
}

function stopWatching() {
    if (contractEvents) {
        contractEvents.stopWatching();
        contractEvents = undefined;
    }
}

/**
 * Utility method for creating an instance of the event
 */
function createContractEventInstance() {

    let contractInstance = createContractInstance(address);

    let indexedEventValues = JSON.parse("{}")
    let fromBlock = `{\n"fromBlock":"${block}"\n}`;
    let additionalFilterOptions = JSON.parse(fromBlock);

    return contractInstance.Interaction(indexedEventValues, additionalFilterOptions);
}