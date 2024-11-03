"use client";
import { useEffect, useState } from "react";
import Web3 from "web3";

const contractAddress = "0xD6083E5226CCC74E730D9175286DA7E2025F83Cf";
const contractABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "option",
        type: "string",
      },
    ],
    name: "vote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "option",
        type: "string",
      },
    ],
    name: "getVoteCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAvailableOptions",
    outputs: [
      {
        internalType: "string[]",
        name: "",
        type: "string[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "option",
        type: "string",
      },
    ],
    name: "validOption",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export default function Home() {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [options, setOptions] = useState([]);
  const [voteCounts, setVoteCounts] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        try {
          await window.ethereum.request({ method: "eth_requestAccounts" });
          const accounts = await web3Instance.eth.getAccounts();
          if (accounts.length > 0) {
            const contractInstance = new web3Instance.eth.Contract(
              contractABI,
              contractAddress
            );
            setAccount(accounts[0]);
            setContract(contractInstance);
            try {
              const optionsFromContract = await contractInstance.methods
                .getAvailableOptions()
                .call();
              setOptions(optionsFromContract);
              const counts = {};
              for (const option of optionsFromContract) {
                const count = await contractInstance.methods
                  .getVoteCount(option)
                  .call();
                counts[option] = count;
              }
              setVoteCounts(counts);
            } catch (err) {
              setErrorMessage("Error fetching options from contract.");
            }
          } else {
            setErrorMessage("No accounts found. Please connect your wallet.");
          }
        } catch (error) {
          setErrorMessage(
            `Please allow access to your wallet: ${error.message}`
          );
        }
      } else {
        setErrorMessage("Please install MetaMask!");
      }
    };

    init();
  }, []);

  const handleVote = async () => {
    const optionInput = document.getElementById("voteOption");
    const option = optionInput.value;
    if (!contract || !option) {
      setErrorMessage("Contract is not initialized or option is empty");
      return;
    }
    try {
      setLoading(true);
      const isValidOption = await contract.methods.validOption(option).call();
      if (!isValidOption) {
        setErrorMessage("Invalid option for voting.");
        setLoading(false);
        return;
      }
      await contract.methods.vote(option).send({ from: account });
      alert(`You voted for ${option}`);
      setErrorMessage("");
      optionInput.value = ""; // Clear the input field
      setVoteCounts((prevCounts) => ({
        ...prevCounts,
        [option]: (parseInt(prevCounts[option]) || 0) + 1,
      }));
    } catch (error) {
      setErrorMessage("Error voting, please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGetVotes = async () => {
    const option = document.getElementById("getVotesOption").value;
    if (!option) {
      setErrorMessage("Please enter an option to get votes.");
      return;
    }
    try {
      const votes = await contract.methods.getVoteCount(option).call();
      alert(`Vote count for ${option}: ${votes}`);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage("Failed to retrieve vote count.");
    }
  };

  return (
    <div className="container">
      <h1>Voting DApp</h1>
      <input type="text" id="voteOption" placeholder="Enter option to vote" />
      <button onClick={handleVote} disabled={loading}>
        {loading ? <span className="loader"></span> : "Vote"}
      </button>
      <input
        type="text"
        id="getVotesOption"
        placeholder="Enter option to get votes"
      />
      <button onClick={handleGetVotes}>Get Votes</button>
      {errorMessage && <div className="error">{errorMessage}</div>}
      <div className="options-list">
        <h3>Available Options</h3>
        <ul>
          {options.map((option, index) => (
            <li key={index}>
              <span>{option}</span>
              <span className="float-end">{voteCounts[option] || 0} Votes</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
