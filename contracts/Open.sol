// SPDX-License-Identifier: MIT

pragma solidity 0.8.27;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

/**
 * @title Open Token
 * @dev Implementation of the Open Token with burning capability
 * @custom:security-contact security@Open.example.com
 */
contract Open is ERC20, ERC20Burnable {
    /**
     * @notice ERC20 Name of the token: Open
     * @dev ERC20 function name() public view returns (string)
     * @dev Field is declared public: getter name() is created when compiled,
     *      it returns the name of the token.
     */
    string internal constant NAME = "Open";

    /**
     * @notice ERC20 Symbol of the token: OPEN
     * @dev ERC20 function symbol() public view returns (string)
     * @dev Field is declared public: getter symbol() is created when compiled,
     *      it returns the symbol of the token
     */
    string internal constant SYMBOL = "OPEN";

    /**
     * @notice Creates `amount` tokens and assigns them to `recipient`, increasing the total supply
     * @dev Sets the total supply to 1 billion tokens, all assigned to the deployer
     * @param recipient The address that will receive the minted tokens
     */
    constructor(address recipient) ERC20(NAME, SYMBOL) {
        _mint(recipient, 1_000_000_000 * 10 ** decimals());
    }
}
