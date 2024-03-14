import React, { useState, useEffect } from "react";
import {
  Input,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Box,
  Text,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { useDisclosure } from "@chakra-ui/react"; // Import useDisclosure hook
import { useNavigate } from "react-router-dom";

function SearchBar({ placeholder }) {
  const [userData, setUserData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [wordEntered, setWordEntered] = useState("");
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure(); // Initialize useDisclosure

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch("/api/users/allusers");
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      const data = await response.json();
      setUserData(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleFilter = (event) => {
    const searchWord = event.target.value;
    setWordEntered(searchWord);
    const newFilter = userData.filter((user) => {
      return user.name.toLowerCase().includes(searchWord.toLowerCase());
    });

    if (searchWord === "") {
      setFilteredData([]);
    } else {
      setFilteredData(newFilter);
    }
  };

  const clearInput = () => {
    setFilteredData([]);
    setWordEntered("");
  };

  return (
    <div className="search">
     
      <SearchIcon onClick={onOpen} size={20} cursor={"pointer"}/>

      {/* Input Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>search user</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input
              placeholder="john"
              value={wordEntered}
              onChange={handleFilter}
            />
          </ModalBody>
          <ModalBody>
            {/* Display first 15 related usernames */}
            {filteredData.slice(0, 15).map((user, key) => (
              <Text
                key={key}
                cursor={"pointer"}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(`/${user.username}`);
                  onClose();
                }}
                _hover={{ color: "blue.500" }}
              >
                {user.name}
              </Text>
            ))}
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}

export default SearchBar;
