// SPDX-License-Identifier: MIT

pragma solidity 0.8.27;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";

/**
 * @title GOPEN Token
 * @dev ERC20 token with deposit and withdrawal functionality, supporting ERC20Permit and ERC20Votes.
 * @custom:security-contact security@openledger.xyz
 */
contract GOPEN is ERC20, ERC20Permit, ERC20Votes {

    /**
     * @notice ERC20 Name of the token: GOpen
     */
    string internal constant NAME = "GOpen";

    /**
     * @notice ERC20 Symbol of the token: GOPEN
     */
    string internal constant SYMBOL = "GOPEN";

    error ZeroValueNotAllowed();

    event Deposit(address indexed sender, uint256 amt);
    event Withdrawal(address indexed sender, uint256 amt);

    /**
     * @notice Initializes the GOPEN token with name and symbol.
     */
    constructor() ERC20(NAME, SYMBOL) ERC20Permit(NAME) {}

    /**
     * @notice Function to receive Ether. msg.data must be empty.
     * @dev Fallbacks are avoided to reduce attack surface and prevent WETH permit-style exploits.
     */
    receive() external payable {
        deposit();
    }

    /**
     * @notice Deposit native currency to mint wrapped tokens.
     * @dev Mints tokens 1:1 with deposited native currency.
     * @custom:security Non-reentrant by design as state changes happen before external calls.
     */
    function deposit() public payable {
        if (msg.value == 0) revert ZeroValueNotAllowed();
        _mint(msg.sender, msg.value);
        emit Deposit(msg.sender, msg.value);
    }

    /**
     * @notice Withdraw native currency by burning wrapped tokens.
     * @dev Burns tokens and sends equivalent native currency.
     * @param amount The amount of tokens to withdraw.
     * @custom:security Non-reentrant by design as state changes happen before external calls.
     */
    function withdraw(uint256 amount) public {
        if (amount == 0) revert ZeroValueNotAllowed();
        _withdraw(msg.sender, amount);
        emit Withdrawal(msg.sender, amount);
    }

    /**
     * @notice Internal function to handle withdrawal logic.
     * @param caller The address initiating the withdrawal.
     * @param amount The amount to withdraw.
     */
    function _withdraw(address caller, uint256 amount) internal {
        _burn(caller, amount);
        (bool success, ) = payable(caller).call{value: amount}("");
        require(success, "Failed to send native currency");
    }

    /**
     * @notice Returns the current block timestamp as a uint48.
     */
    function clock() public view override returns (uint48) {
        return uint48(block.timestamp);
    }

    /**
     * @notice Returns the clock mode as a string.
     */
    // solhint-disable-next-line func-name-mixedcase
    function CLOCK_MODE() public pure override returns (string memory) {
        return "mode=timestamp";
    }

    /**
     * @notice Updates balances during token transfers.
     * @dev Overrides required by Solidity.
     */
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }

    /**
     * @notice Returns the nonce for a given address.
     * @dev Overrides required by Solidity.
     */
    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}
