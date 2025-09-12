// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;

import "./IdentityRegistry.sol";
import "./Compliance.sol";
import "hardhat/console.sol";

contract Token {
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    uint256 public totalSupply;

    address public owner;
    IdentityRegistry public identityRegistry;
    Compliance public compliance;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
    event Mint(address indexed to, uint256 value);
    event Burn(address indexed from, uint256 value);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        address _identityRegistry,
        address _compliance
    ) {
        name = _name;
        symbol = _symbol;
        owner = msg.sender;
        identityRegistry = IdentityRegistry(_identityRegistry);
        compliance = Compliance(_compliance);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(amount > 0, "Amount must be greater than zero");
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        require(
            compliance.canTransfer(msg.sender, to),
            "Transfer not compliant"
        );

        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;

        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        require(amount > 0, "Amount must be greater than zero");
        require(
            balanceOf[msg.sender] >= amount,
            "Insufficient balance to approve"
        );
        allowance[msg.sender][spender] += amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool) {
        require(amount > 0, "Amount must be greater than zero");
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Allowance exceeded");
        require(compliance.canTransfer(from, to), "Transfer not compliant");

        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;

        emit Transfer(from, to, amount);
        return true;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        require(compliance.canMint(to), "Mint not compliant");
        totalSupply += amount;
        balanceOf[to] += amount;

        emit Mint(to, amount);
        emit Transfer(address(0), to, amount);
    }

    function burn(uint256 amount) external {
        require(
            balanceOf[msg.sender] >= amount,
            "Insufficient balance to burn"
        );

        balanceOf[msg.sender] -= amount;
        totalSupply -= amount;

        emit Burn(msg.sender, amount);
        emit Transfer(msg.sender, address(0), amount);
    }
}
