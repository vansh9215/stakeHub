//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

//importing contract
import "./Ownable.sol";
import "./ReentrancyGuard.sol";
import "./Initializable.sol";
import "./IERC20.sol";

contract TokenStaking is Ownable, ReentrancyGuard, Initializable {
    // struct to store the user's details
    struct User {
        uint256 stakeAmount; // stake amount
        uint256 rewardAmount; // reward amount
        uint256 lastStakeTime; //last stake timestamp
        uint256 lastRewardCalculationTime; // last reward calculation timestamp
        uint256 rewardsClaimedSoFar; // sum of rewards claimed so far
    }

    uint256 _minimumStakingAmount; // minimum staking amount
    uint256 _maximumStakingAmount; // maximum staking token limit for program
    uint256 _stakeEndDate; //end date for program
    uint256 _stakeStartDate; //start date for program
    uint256 _totalStakedTokens; // total no. of tokens that are stacked
    uint256 _totalUsers; // total no of users
    uint256 _stakeDays; // staking Days
    uint256 _earlyUnStakeFeePercentage; // early unstake fee percentage
    bool _isStakingPaused; // staking status

    //token contract address
    address private _tokenAddress;

    //APY
    uint256 _apyRate;
    uint256 public constant PERCENTAGE_DENOMINATOR = 10000;
    uint256 public constant APY_RATE_CHANGE_THRESHOLD = 10;

    //user address => User
    mapping(address => User) private _users;

    event Stake(address indexed user, uint256 amount);
    event UnStake(address indexed user, uint256 amount);
    event EarlyUnStakeFee(address indexed user, uint256 amount);
    event ClaimReward(address indexed user, uint256 amount);

    modifier whenTreasuryHasBalance(uint256 amount) {
        require (
            IERC20(_tokenAddress).balanceOf(address(this)) >= amount,
            "TokenStaking: Insufficient funds in treasury"
        );
        _;
    }

    function initialize (
        address owner_,
        address tokenAddress_,
        uint256 apyRate_,
        uint256 minimumStakingAmount_,
        uint256 maximumStakingAmount_,
        uint256 stakeStartDate_,
        uint256 stakeEndDate_,
        uint256 stakeDays_,
        uint256 earlyUnStakeFeePercentage_ 
    ) public virtual initializer {
        _TokenStaking_init_unchained (
            owner_,
            tokenAddress_,
            apyRate_,
            minimumStakingAmount_,
            maximumStakingAmount_,
            stakeStartDate_,
            stakeEndDate_,
            stakeDays_,
            earlyUnStakeFeePercentage_ 
        );
    }

    function _TokenStaking_init_unchained (
        address owner_,
        address tokenAddress_,
        uint256 apyRate_,
        uint256 minimumStakingAmount_,
        uint256 maximumStakingAmount_,
        uint256 stakeStartDate_,
        uint256 stakeEndDate_,
        uint256 stakeDays_,
        uint256 earlyUnStakeFeePercentage_  
    ) internal onlyInitializing {
        require(_apyRate <=10000, "TokenStaking: apy rate should be less than 10000");
        require(stakeDays_ > 0 , "TokenStaking: stake days must be non-zero");
        require(tokenAddress_ != address(0), "TokenStaking: token address cannot be zero address");
        require(stakeStartDate_ < stakeEndDate_, "TokenStaking: start date must be less than end date");

        _transferOwnership(owner_);
        _tokenAddress = tokenAddress_;
        _apyRate = apyRate_;
        _minimumStakingAmount = minimumStakingAmount_;
        _maximumStakingAmount = maximumStakingAmount_;
        _stakeStartDate = stakeStartDate_;
        _stakeEndDate = stakeEndDate_;
        _stakeDays = stakeDays_ * 1 days;
        _earlyUnStakeFeePercentage = earlyUnStakeFeePercentage_;
    }

    /* view Methods start */
    
    /**
    * @notice This function is used to get the minimum staking amount
    */
    function getMinimumStakingAmount() external view returns (uint256) {
        return _minimumStakingAmount;
    }

    /**
    * @notice This function is used to get the maximum staking amount
    */
    function getMaximumStakingAmount() external view returns (uint256) {
        return _maximumStakingAmount;
    }

    /**
    * @notice This function is used to get the start date for program
    */
    function getStakeStartDate() external view returns (uint256) {
        return _stakeStartDate;
    }
    /**
    * @notice This function is used to get the end date for program
    */
    function getStakeEndDate() external view returns (uint256) {
        return _stakeEndDate;
    }

    /**
    * @notice This function is used to get the total no. of tokens that are staked
    */
    function getTotalStakedTokens() external view returns (uint256) {
        return _totalStakedTokens;
    }

    /**
    * @notice This function is used to get the total no. of users
    */
    function getTotalUsers() external view returns (uint256) {
        return _totalUsers;
    }
    /**
    * @notice This function is used to get the stake days
    */
    function getStakeDays() external view returns (uint256) {
        return _stakeDays;
    }

    /**
    * @notice This function is used to get early unstake fee percentage
    */
    function getEarlyUnStakeFeePercentage() external view returns (uint256) {
        return _earlyUnStakeFeePercentage;
    }

    /**
    * @notice This function is used to get staking status
    */
    function getStakingStatus() external view returns (bool) {
        return _isStakingPaused;
    }

    /**
    * @notice This function is used to get the current apy rate
    */
    function getAPY() external view returns (uint256) {
        return _apyRate;
    }

    /**
    * @notice This function is used to get the msg.sender's estimated reward amount
    */
    function getUserEstimatedRewards() external view returns (uint256) {
        (uint256 amount, ) = _getUserEstimatedRewards(msg.sender);
        return _users[msg.sender].rewardAmount + amount;
    }

    /**
    * @notice This function is used to get the withdrawable amount from contract
    */
    function getWithdrawableAmount() external view returns (uint256) {
        return IERC20(_tokenAddress).balanceOf(address(this)) - _totalStakedTokens;
    }

    /**
    * @notice This function is used to get user details
    * @param userAddress User's address to get details of
    * @return User Struct
    */
    function getUser(address userAddress) external view returns (User memory) {
        return _users[userAddress];
    }

    //function to check whether it is a stake holder or not.
    function isStakeHolder(address _user) external view returns (bool) {
        return _users[_user].stakeAmount != 0;
    }

    /* view methods end */
    
    /* owner method start */

    /**
    * @notice This function is used to update minimum staking amount
     */
     function updateMinimumStakingAmount(uint256 newAmount) external onlyOwner {
        _minimumStakingAmount = newAmount;
     }

     /**
    * @notice This function is used to update maximum staking amount
    */
    function updateMaximumStakingAmount(uint256 newAmount) external onlyOwner {
        _maximumStakingAmount = newAmount;
    }

    /**
    * @notice This function is used to update staking end date
    */
    function updateStakingEndDate(uint256 newDate) external onlyOwner {
        _stakeEndDate = newDate;
    }

    /**
    * @notice This function is used to update early unstake fee percentage
    */
    function updateEarlyUnStakeFeePercentage(uint256 newPercentage) external onlyOwner {
        _earlyUnStakeFeePercentage = newPercentage;
    }

    /**
    * @notice stake functions for specific user
    * @dev This function can be used to stake tokens for specific user
    * @param amount the amount to stake
    * @param user user's address
    */
    function stakeForUser(uint256 amount, address user) external onlyOwner nonReentrant {
        _stakeTokens(amount, user);
    }

    /**
    @notice enable/disable staking
    * @dev this function can be used to toggle staking status
    */
    function toggleStakingStatus() external onlyOwner {
        _isStakingPaused = !_isStakingPaused;
    }

    /**
    * @notice withdraw the specified amount if possible.
    * @dev this function can be used to withdraw the available tokens
    * with this contract to the caller
    * @param amount the amount to withdraw
    */
    function withdraw(uint256 amount) external onlyOwner nonReentrant {
        require(this.getWithdrawableAmount() >= amount, "TokenStaking: not enough withdrawable tokens");
        IERC20(_tokenAddress).transfer(msg.sender, amount);
    }

    /* owner methods end */ 

    /* user methods start */

    // function to stake amount of tokens to be stacked
    function stake(uint256 _amount) external nonReentrant {
        _stakeTokens(_amount, msg.sender);
    }

    function _stakeTokens(uint256 _amount, address user_) private {
        require(!_isStakingPaused, "TokenStaking: staking is paused");

        uint256 currentTime = getCurrentTime();
        require(currentTime > _stakeStartDate, "TokenStaking: staking not started yet");
        require(currentTime < _stakeEndDate, "TokenStaking: staking ended");
        require(_totalStakedTokens + _amount <= _maximumStakingAmount, "TokenStaking: max staking token limit reached");
        require(_amount > 0, "TokenStaking: stake amount must be non-zero");
        require(
            _amount >= _minimumStakingAmount,
            "TokenStaking: stake amount must greater than minimum amount allowed"
        );

        if (_users[user_].stakeAmount != 0) {
            _calculateRewards(user_);
        }else {
            _users[user_].lastRewardCalculationTime = currentTime;
            _totalUsers += 1;
        }

        _users[user_].stakeAmount += _amount;
        _users[user_].lastStakeTime = currentTime;

        _totalStakedTokens += _amount;
        require(
            IERC20(_tokenAddress).transferFrom(msg.sender, address(this), _amount),
            "TokenStaking: failed  to transfer tokens"
        );
        emit Stake(user_, _amount);
    }

    /**
    * @notice this function is used to unstake tokens
    * @param _amount Amount of tokens to be unstaked
      */
    function unstake(uint256 _amount) external nonReentrant whenTreasuryHasBalance(_amount) {
        address user = msg.sender;
        require(_amount != 0, "TokenStaking: amount should be non-zero");
        require(this.isStakeHolder(user), "TokenStaking: not a stakeholder");
        require(_users[user].stakeAmount >= _amount, "TokenStaking: not enough stake to unstake");

        //cakculate user's rewards until now
        _calculateRewards(user);
        uint256 feeEarlyUnstake;

        if(getCurrentTime() <= _users[user].lastStakeTime + _stakeDays) {
            feeEarlyUnstake = ((_amount * _earlyUnStakeFeePercentage) / PERCENTAGE_DENOMINATOR);
            emit EarlyUnStakeFee(user, feeEarlyUnstake);
        }

        uint256 amountToUnstake = _amount - feeEarlyUnstake;
        _users[user].stakeAmount -= _amount;
        _totalStakedTokens -= _amount;
        if (_users[user].stakeAmount == 0) {
            // delete _user[user];
            _totalUsers -= 1;
        }

        require(IERC20(_tokenAddress).transfer(user, amountToUnstake), "TokenStaking: failed to transfer");
        emit UnStake(user, _amount);
    }

    /**
    * @notice This function is used to claim user's rewards 
    */
    function claimReward() external nonReentrant whenTreasuryHasBalance(_users[msg.sender].rewardAmount) {
        _calculateRewards(msg.sender);
        uint256 rewardAmount = _users[msg.sender].rewardAmount;
        require(rewardAmount > 0, "TOkenStaking: no reward to claim");
        require(IERC20(_tokenAddress).transfer(msg.sender, rewardAmount), "TokenStaking:failed to transfer");
        _users[msg.sender].rewardAmount = 0;
        _users[msg.sender].rewardsClaimedSoFar += rewardAmount;
        emit ClaimReward(msg.sender, rewardAmount);
    }

    /* user method end */

    /* private helper methods start */ 
    /**
    * @notice this function is used to calculate rewards for a user
    *@param _user Address of the user
    */
    function _calculateRewards(address _user) private{
        (uint256 userReward, uint256 currentTime) = _getUserEstimatedRewards(_user);
        _users[_user].rewardAmount += userReward;
        _users[_user].lastRewardCalculationTime = currentTime;
    }

    /**
    * @notice this function is used to get estimated rewards for a year
    * @param _user Address of the user
    * @return estimated rewards for the user
    */
    function _getUserEstimatedRewards(address _user) private view returns (uint256, uint256) {
        uint256 userReward;
        uint256 userTimeStamp = _users[_user].lastRewardCalculationTime;
        uint256 currentTime = getCurrentTime();

        if (currentTime > _users[_user].lastStakeTime + _stakeDays) {
            currentTime = _users[_user].lastStakeTime + _stakeDays;
        }

        uint256 totalStakedTime = currentTime - userTimeStamp;
        userReward += ((totalStakedTime * _users[_user].stakeAmount * _apyRate) / 365 days) / PERCENTAGE_DENOMINATOR;
        return (userReward, currentTime); 
        }

        function getCurrentTime() internal view virtual returns (uint256) {
            return block.timestamp;
        }
} 