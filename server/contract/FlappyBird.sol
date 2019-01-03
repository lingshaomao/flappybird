pragma solidity ^0.4.24;


contract FlappyBird {
    struct Buy {
        string id;
        address buyer;
        uint humanAmount;
        uint humanPrice;
        uint robotAmount;
        uint robotPrice;
        uint coinAmount;
    }

    event BirdsBought(string id, address buyer, uint humanamount, uint humanPrice, uint robotamount, uint robotPrice, 
    uint value);

    event Log(byte e);

    mapping(string => Buy) private buys;
    
    uint public humanPrice;
    uint public robotPrice;
    address public owner;

    constructor() public {
        owner = msg.sender;
        humanPrice = 1000000 * 10;
        robotPrice = 1000000 * 1;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    function buybirds(string id, uint humanamount, uint robotamount) public payable
    {
        require(msg.value >= ((humanamount * humanPrice) + (robotamount * robotPrice)));
        buys[id] = Buy(
        {
            id:id,
            buyer:msg.sender,
            humanAmount:humanamount,
            humanPrice:humanPrice,
            robotAmount:robotamount,
            robotPrice:robotPrice,
            coinAmount:msg.value
        });
        emit BirdsBought(id, msg.sender, humanamount, humanPrice, robotamount, robotPrice, msg.value);

       
    }

    function withdraw(uint amount) public onlyOwner {
        owner.transfer(amount);
    }

    function changeOwner(address _owner) public onlyOwner 
    {
        owner = _owner;
    }

    function changeHumanPrice(uint price) public onlyOwner 
    {
        humanPrice = price;
    }

    function changeRobotPrice(uint price) public onlyOwner 
    {
        robotPrice = price;
    }

    function getToken(bytes sid) public view returns (bytes32 token)
    {
      
        bytes memory sidBytes = sid;
        bytes24  senderBytes = bytes24(msg.sender);

        bytes memory senderBytes20 = new bytes(20);

        for (uint n = 4; n < 24; n++) {
            senderBytes20[n - 4] = senderBytes[n];
        }

        uint sidBytesLen = sidBytes.length;

        bytes memory array = new bytes(sidBytesLen + 20);

        for (uint j = 0; j < 20; j++) {
            array[j] = senderBytes20[j];
        }
        
        for (uint k =  20; k < sidBytesLen + 20; k++) {
            array[k] = sidBytes[k - 20];
        }
        token = sha256(array);
    }

    function getBuy(string id) public view returns (address buyer, uint humanAmount, uint hp, 
    uint robotAmount, uint rp, uint coinAmount)
    {
        buyer = buys[id].buyer;
        humanAmount = buys[id].humanAmount;
        hp = buys[id].humanPrice;
        robotAmount = buys[id].robotAmount;
        rp = buys[id].robotPrice;
        coinAmount = buys[id].coinAmount;
       
    }
}
