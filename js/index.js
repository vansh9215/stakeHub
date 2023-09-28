//FUNCTION CALL
loadInitialData("sevenDays");
connectMe("metamask_wallet");
function connectWallte() {}

function openTab(event, name) {
    console.log(name);
    contarctCall = name;
    getSelectedTab(name);
    loadInitialData(name);
}

async function loadInitialData(sClass) {
    console.log(sClass);
    try {
        clearInterval(countDownGlobal);

        let cObj = new web3Main.eth.Contract (
            SELECT_CONTRACT[_NETWORK_ID].STACKING.abi,
            SELECT_CONTRACT[_NETWORK_ID].STACKING[sClass].address
        );

        //ID ELEMENT DATA
        let totalUsers = await cObj.methods.getTotalUsers().call();
        let cAPY = await cObj.methods.getAPY().call();
        //GET USER
        let userDetail = await cObj.methods.getUser(currentAddress).call();

        const user = {
            lastRewardCalculationTime: userDetail.lastRewardCalculationTime,
            lastStakeTime: userDetail.lastStakeTime,
            rewardAmount: userDetail.rewardAmount,
            rewardClaimedSoFar: userDetail.rewardClaimedSoFar,
            stakeAmount: userDetail.stakeAmount,
            address: currentAddress,
        };
        localStorage.setItem("User", JSON.stringify(user));

        let userDetailBal = userDetail.stakeAmount / 10 ** 18;

        document.getElementById(
            "num-of-stackers-value"
        ).innerHTML= `${totalUsers}`;
        document.getElementById("apy-value-feature").innerHTML = `${cAPY} %`;

        // class element data
        let totalLockedTokens = await cObj.methods.getTotalStakedTokens().call();
        let earlyunstskeFee = await cObj.methods
        .getEarlyUnstakeFeePercentage()
        .call();

        //ELEMENTS --CLASS
        document.getElementById("total-locked-tokens-value").innerHTML = `${
            totalLockedTokens / 10 ** 18
        } ${SELECT_CONTRACT[_NETWORK_ID].TOKEN.symbol}`;

        document 
            .querySelectorAll(".early-unstake-fee-value")
            .forEach(function (element) {
                element.innerHTML = `${earlyUnstakeFee / 100}%`;
            });

            let minStakeAmount = await cObj.methods.getMinimumStakingAmount().call();
            minStakeAmount  = Number(minStakeAmount);
            let minA;

            if (minStakeAmount) {
                minA = `${(minStakeAmount / 10 ** 18).toLocaleString()} ${
                    SELECT_CONTRACT[_NETWORK_ID].TOKEN.symbol
                }`;
            } else {
                minA = "N/A";
            }

            document
            .querySelectorAll(".Minimum-Staking-Amount")
            .forEach(function (element) {
                element.innerHTML = `${minA}`;
            });
            document 
            .querySelectorAll(".maximum-Staking-Amount")
            .forEach(function (element) {
                element.innerHTML = `${(10000000).toLocaleString()} ${
                    SELECT_CONTRACT[_NETWORK_ID].TOKEN.symbol
                }`;
            });

            let isStakingPaused = await cObj.methods.getStakingStatus().call();
            let isStakingPausedText;

            let StartDate = await cObj.methods.getStakeStartDate().call();
            startDate = Number(startDate) * 1000;

            let endDate = await cObj.methods.getStakeEndDate().call();
            endDate = Number(endDate) * 1000;

            let stakeDays = await cObj.methods.getStakeDays().call();

            let days = Math.floor(Number(stakeDays) / (3600 * 24));

            let dayDisplay = days > 0 ? days + (days == 1 ? "day, ": "days, ") : "";
            document.querySelectorAll(".Lock-period-value").forEach(function (element) {
                element.innerHTML = `${daysDisplay}`;
            });

            let rewardBal = await cObj.methods
            .getUserEstimatedRewards()
            .call({from: currentAddress});

            document.getElementById("user-reward-balance-value").value = `Reward: ${
                rewardBal / 10 ** 18
            } ${SELECT_CONTRACT[_NETWORK_ID].TOKEN.symbol}` ;

            // user token balance
            let balMainUser = currentAddress
            ? await oContractToken.methods.balanceOf(currentAddress).call()
            : "";

            balMainUser = Number(balMainUser) / 10 ** 18;

            document.getElementById("user-token-balance").innerHTML = `Balance: ${balMainUser}`;
            let currentDate = new Date().getTime();

            if (isStakingPaused) {
                isStakingpausedText = "paused";
            } else if (currentDate < startDate) {
                isStakingPausedText = "Locked";
            } else if (currentDate > enddate) {
                isStakingPausedText = "Ended";
            } else {
                isStakingPausedText = "Active";
            }

            document 
            .querySelectorAll(".active-status-stacking")
            .forEach(function (element) {
                element.innerHTML = `${isStakingPausedText}`;
            });

            if (currentDate > startDate && currentDate < endDate) {
                const ele = document.getElementById("countdown-time-value");
                generateCountDown(ele, endDate);

                document.getElementById("countdown-title-value").innerHTML = `Staking Ends In`;
            }

            if (currentDate < startDate) {
                const ele = document.getElementById("countdown-time-value");
                generateCountDown(ele, endDate);

                document.getElementById("countdown-title-value").innerHTML = `Staking Starts In`;
            }

            document.querySelectorAll(".apy-value").forEach(function (element) {
                element.innerHTML = `${cAPY}%`;
            });
    } catch (error) {
        console.log(error);
        notyf.error(
            `unable to fetch data from ${SELECT_CONTRACT[_NETWORK_ID].network_name}!\n Please refresh this Page.`
        );
    }
}

function generateCountDown(ele, claimDate) {
    clearInterval(countDownGLobal);
    // set the date we are counting down to
    var countDowndate = new Date(claimDate).getTime();

    //update the count down every 1 second
    countDownGlobal = setInterval(function() {
        // get today's date and time
        var now = new Date().getTime();

        //find distance between now and the count down date
        var distance = countDownDate - now;

        // time clacylations for days, hours, minutes and seconds
        var days = Math.floor(distance/(1000*60*60*24));
        var hours = Math.floor(
            (distance % (1000 * 60 * 60 *24)) / (1000 * 60 * 60)
        );
        var minutes = Math.floor((distance % (1000 * 60 * 60))/ (1000 * 60));
        var seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // display the result in the element with id = "demo"
        ele.innerHTML =
        days + "d" + hours + "h" + minutes + "m" + seconds + "s";
        //ele.html(days+"d"+hours+"h"+minutes+"m"+seconds+"s");
        
        // if the count down is finished, write some text
        if(distance < 0) {
            clearInterval(countDownGlobal);
            ele.html("Refresh Page");
        }
    }, 1000);
} 

async function connectMe(_provider) {
    try {
        let _comn_res = await commonProviderDetector(_provider);
        console.log(_comn_res);
            if(!_comn_res) {
                console.log("Please Connect");
            } else {
                let sClass= getSelectedTab();
                console.log(sClass);
            } 
        }   catch (error) {
                notyf.error(error.message);
            }
        }

async function stackTokens() {
            try {
                let nTokens = document.getElementById("amount-to-stack-value-new").value;

                if(!nTokens) {
                    return;
                }

                if(isNaN(nTokens) || nTokens == 0 || Number(nTokens) < 0) {
                    console.log(`Invalid Token amount`);
                    return;
                }

                nTokens = Number(nTokens);

                let tokenToTransfer = addDecimal(nTokens, 18);
                console.log("tokenToTransfer", tokenToTransfer);

                let balMainUser = await oContractToken.methods
                .balanceOf(currentAddress)
                .call();

                balMainUser = Number(balMainUser) / 10**18;
                console.log("balMainUser", balMainUser);

                if(balMainUser < nTokens) {
                    notyf.error (
                        `Insufficient tokens on ${SELECT_CONTRACT[_NETWORK_ID].network_name}.\nPlease buy some tokens first!`
                    );
                    return;
                }

                let sClass = getSelectedTab(contarctCall);
                console.log(sClass);
                let balMainAllowance = await oContractToken.methods
                .allowance(
                    currentAddress,
                    SELECT_CONTRACT[_NETWORK_ID].STACKING[sClass].address
                )
                .call();

                if (Number[balMainAllowance] < Number(tokenToTransfer)) {
                    approveTokenSpend(tokenToTransfer, sClass);
                } else {
                    stackTokenMain(tokenToTransfer, sClass);
                }
            }   catch (error) {
                console.log(error);
                notyf.dismiss(notification);
                notyf.error(formatEthErrorMsg(error));
            }
        }

async function approveTokenSpend(_mint_fee_wel, sClass) {
    let gasEstimation;

    try {
        gasEstimation = await oContractToken.methods
        .approve(
            SELECT_CONTRACT[_NETWORK_ID].STACKING[sClass].address,
            _mint_fee_wel
        )
        .estimateGas({
            from: currentAddress,
        });
    }   catch (error) {
        console.log(error);
        notyf.error(formatEthErrorMsg(error));
        return;
    }   
    
    oContractToken.methods
    .approve(
        SELECT_CONTRACT[_NETWORK_ID].STACKING[sClass].address,
        _mint_fee_wel
    )
    .send({
        from: currentAddress,
        gas: gasEstimation,
    })
    .on("transactionHash", (hash) => {
        console.log("Transaction Hash: ", hash);
    })
    .on("receipt", (receipt) => {
        console.log(receipt);
        stackTokenMain(_mint_fee_wel);
    })
    .catch((error) => {
        console.log(error);
        notyf.error(formatEthErrorMsg(error));
        return;
    });
}

async function stackTokenMain(_amount_wel, sClass) {
    let gasEstimation;

    let oContractStacking = getContractObj(sClass);

    try {
        gasEstimation = await oContractStacking.methods
        .stake(_amount_wel)
        .estimateGas({
            from: currentAddress,
        });
    }   catch (error) {
        console.log(error);
        notyf.error(formatEthErrorMsg(error));
        return;
    }

    oContractStacking.methods
    .stake(_amount_wel)
    .send({
        from: currentAddress,
        gas: gasEstimation, 
    })
    .on("receipt", (receipt) => {
        console.log(receipt);
        const receiptObj = {
            token: _amount_wel,
            from: receipt.from,
            to: receipt.to,
            blockHash: receipt.blockHash,
            blockNumber: receipt.blockNumber,
            cumulativeGasUsed: receipt.cumulativeGasUsed,
            effectiveGasPrice: receipt.effectiveGasPrice,
            gasUsed: receipt.gasUsed,
            status: receipt.status,
            transactionHash: receipt.transactionHash,
            type: receipt.type,
        };

        let transactionHistory = [];
        const allUserTransaction = localStorage.getItem("transactions");
        if(allUserTransaction) {
            transactionHistory = JSON.parse(localStorage.getItem("transactions"));
            transactionHistory.push(receiptObj);
            localStorage.setItem(
                "transactions",
                JSON.stringify(transactionHistory)
            );
        }   else {
            transactionHistory.push(receiptObj);
            localStorage.setItem(
                "transactions",
                JSON.stringify(transactionHistory)
            );
        }

        console.log(allUserTransaction);
        window.location.href = "https://127.0.0.1:5500/analytic.html";
    })

    .catch((error) => {
        console.log(error);
        notyf.error(formatEthErrorMsg(error));
    });
}

async function unStackTokens() {
    try{
        let nTokens = document.getElementById("amount-to-unstack-value").value;

        if(!nTokens) {
            return;
        }

        if(isNaN(nTokens) || nTokens == 0 || Number(nTokens) < 0) {
            notyf.error(`Invalid token amount!`);
            return;
        }

        nTokens = Number(nTokens);

        let tokenToTransfer = addDecimal(nTokens, 18);

        let sClass = getSelectedTab(contarctCall);
        let oContractStacking = getContractObj(sClass);

        let balMainUser = await oContractStacking.methods
        .getUser(currentAddress)
        .call();

        balMainUser = Number(balMainUser.stakeAmount) / 10 **18 ;

        if(balMainUser < nTokens) {
            notyf.error(
                `Insufficient staked tokens on ${SELECT_CONTRACT[_NETWORK_ID].network_name}!`
            );
            return;
        }

        unstackTokenMain(tokenToTransfer, oContractStacking, sClass);
    }   catch(error) {
        console.log(error);
        notyf.dismiss(notification);
        notyf.error(formatEthErrorMsg(error));
    }
}

async function unstackTokenMain(_amount_wel, oContractStacking, sClass) {
    let gasEstimation;
    try {
        gasEstimation = await oContractStacking.methods
        .unstake(_amount_wel)
        .estimateGas({
            from: currentAddress,
        });
    }   catch (error) {
        console.log(error);
        notyf.error(formatEthErrorMsg(error));
        return;
    }

    oContractStacking.methods
    .unstake(_amount_wel)
    .send({
        from: currentAddress,
        gas: gasEstimation,
    })
    .on("receipt", (receipt) => {
        console.log(receipt);
        const receiptObj = {
            token: _amount_wel,
            from: receipt.from,
            to: receipt.to,
            blockHash: receipt.blockHash,
            blockNumber: receipt.blockNumber,
            cumulativeGasUsed: receipt.cumulativeGasUsed,
            effectiveGasPrice: receipt.effectiveGasPrice,
            gasUsed: receipt.gasUsed,
            status: receipt.status,
            transactionHash: receipt.transactionHash,
            type: receipt.type,
        };

        let transactionHistory = [];
        const allUserTransaction = localStorage.getItem("transaction");
        if(allUserTransaction) {
            transactionHistory = JSON.parse(localStorage.getItem("transactions"));
            transactionHistory.push(receiptObj);
            localStorage.setItem(
                "transactions",
                JSON.stringify(transactionHistory)
            );
        }   else {
            transactionHistory.push(receiptObj);
            localStorage.setItem(
                "transactions",
                JSON.stringify(transactionHistory)
            );
        } 

        window.location.href= "https://127.0.0.1.5500/analytic.html";
    })
    .on("transactionHash", (hash) => {
        console.log("transactionHash", hash);
    })
    .catch((error) => {
        console.log(error);
        notyf.error(formatEthErrorMsg(error));
        return;
    });
}

async function claimTokens() {
    try {
        let sClass = getSelectedTab(contarctCall);
        let oContractStacking = getContractObj(sClass);

        let rewaedBal = await oContractStacking.methods
        .getUserEstimatedRewards()
        .call({from: currentAddress});
        rewardsBal = Number(rewaedBal);

        console.log("rewardsBal", rewardBal);

        if(!rewaedBal) {
            notyf.dismiss(notification);
            notyf.error(`Insufficient reward tokens to claim`);
            return;
        }

        claimTokenMain(oContractStacking , sClass);
    }   catch (error) {
        console.log(error);
        notyf.dismiss(notification);
        notyf.error(formatEthErrorMsg(error));
    }
}

async function claimTokenMain(oContractStacking, sClass) {
    let gasEstimation;

    try {
        gasEstimation = await oContractStacking.methods.claimReward().estimateGas({
            from: currentAddress,
        });
        console.log("gasEstimation", gasEstimation);
    }   catch (error) {
        console.log(error);
        notyf.error(formatEthErrorMsg(error));
        return;
        }

        oContractStacking.methods
        .claimReward()
        .send({
            from: currentAddress,
            gas: gasEstimation,
        })
        .on("receipt", (receipt) => {
            console.log(receipt);
            const receiptObj = {
                from: receipt.from,
                to: receipt.to,
                blockHash: receipt.blockHash,
                blockNumber: receipt.blockNumber,
                cumulativeGasUsed: receipt.cumulativeGasUsed,
                effectiveGasPrice: receipt.effectiveGasPrice,
                gasUsed: receipt.gasUsed,
                status: receipt.status,
                transactionHash: receipt.transactionHash,
                type: receipt.type,
            };

            let tramsactionHistory = [];

            const allUserTransaction = localStorage.getItem("transactions");
            if(allUserTransaction) {
                transactionHistory = JSON.parse(localStorage.getItem("transactions"));
                tramsactionHistory.push(receiptObj);
                localStorage.setItem(
                    "transactions",
                    JSON.stringify(transactionHistory)
                );
            }   else {
                transactionHistory.push(receiptObj);
                localStorage.setItem(
                    "transactions",
                    JSON.stringify(tramsactionHistory)
                );
            }

            window.location.href= "https://127.0.0.1.5500/analytic.html";
    })
    .on("transactionHash", (hash) => {
        console.log("transactionHash", hash);
    })
    .catch((error) => {
        console.log(error);
        notyf.error(formatEthErrorMsg(error));
        return;
    });
}